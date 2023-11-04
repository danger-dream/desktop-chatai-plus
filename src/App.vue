<script setup lang="ts">
import 'highlight.js/styles/github-dark.css'
import { BasePlatform, HitPrompt, IConversation, ILLMResult, IMessage, IMessageParams, IPromptFunction, ISystemConfig, Message, SearchPrompt } from '../types'
import { ref, computed, reactive, onMounted, watch, nextTick } from 'vue'
import {
	IconPlus, IconPinned, IconPinnedOff, IconSend, IconClipboard, IconMoon, IconSun, IconRobotFace, IconUserSquareRounded,
	IconArrowBarToUp, IconArrowBarToDown, IconReload, IconTrash, IconMessage, IconSettings
} from '@tabler/icons-vue'
import fs from 'node:fs'
import { join } from 'node:path'
import { ipcRenderer } from 'electron'
import { app, dialog } from '@electron/remote'
import Setting from './Setting.vue'
import generate_prompt from './prompt_functions'
import { createMd, formatTime, copy, highlightAll } from './utils'
import Platform from './platform'
import Popover from '@/components/popover/Popover.vue'

const default_title = 'Desktop ChatAI Plus'
const config_path = join(process.cwd(), './config.json')
const conversation_dir = join(process.cwd(), './conversations')
const conversation_file = join(conversation_dir, './conversations.json')
const platformMap: Record<string, BasePlatform> = {}

const md = createMd()
const currentEl = ref<HTMLElement>(null)
const scroll = ref<HTMLElement>(null)
const inputBox = ref<HTMLInputElement>(null)
const textareaRef = ref<HTMLTextAreaElement>(null)
const templatePromptRef = ref<HTMLElement>(null)
const messages = ref<IMessage[]>([])
const selectedConversationRef = ref<InstanceType<typeof Popover> | null>(null)

const state = reactive({
	pin: false,
	is_stteing: false,
	is_dark: false,
	conversations: [] as IConversation[],
	conversationIndex: -1,
	is_created: false,
	platform_default_config: { platform: 'openai', model: 'gpt-4', embedding: 'openai', max_related_message_num: 15 } as ISystemConfig,
	config: { platform: 'openai', embedding: 'openai', model: 'gpt-4', temperature: 0.95, penalty_score: 1.0 } as IMessageParams,
	prompt: '',
	is_wait_answer: false,
	is_stop_stream: false,
	hits: [] as HitPrompt[],
	isTop: true,
	isBottom: true,
	inputBoxHeight: 0,
	scrollHeight: '100%',
	height: 38,
	input_box_h: 0,
	show_template: false,
	template_prompt_h: 0,
	show_top_bottom_btn: false
})
let prompts: IPromptFunction[]
let searchPrompt: SearchPrompt
let scrollTop = -1
let isLockScroll = true

const conversation = computed(() => state.conversationIndex >= 0 ? state.conversations[state.conversationIndex] : undefined)

const cur_all_tokens = computed(() => {
	let tokens = 0
	for (const message of messages.value) {
		if (message.total_tokens) {
			tokens += message.total_tokens
		}
	}
	return tokens
})

watch(() => state.prompt, (v) => {
	const res = searchPrompt(v)
	if (!res) {
		state.hits = []
		state.show_template = false
		return
	}
	state.hits = res.hits
	state.show_template = true
	nextTick().then(() => state.template_prompt_h = templatePromptRef.value?.scrollHeight)
})

function inputFocus() {
	nextTick().then(() => {
		textareaRef.value?.focus()
		try {
			autoResize()
		} catch {
		}
	})
}

window.inputFocus = inputFocus

function exit(title: string, content: string) {
	try {
		dialog.showErrorBox(title, content)
		app.exit(0)
	} catch {
	}
}

function saveConfig() {
	try {
		fs.writeFileSync(config_path, JSON.stringify(state.platform_default_config, undefined, '\t'))
		reloadConfig()
		dialog.showMessageBoxSync({ title: '提示', message: '配置保存成功' })
	} catch {}
}

function toggleTheme() {
	state.is_dark = !state.is_dark
	if (state.is_dark) {
		document.body.classList.add('dark')
	} else {
		document.body.classList.remove('dark')
	}
}

onMounted(() => {
	toggleTheme()
	
	try {
		if (fs.existsSync(config_path)) {
			Object.assign(state.platform_default_config, JSON.parse(fs.readFileSync(config_path, 'utf-8')) as ISystemConfig)
		}
	} catch {
		state.is_stteing = true
		return
	}
	reloadConfig()
})

function reloadConfig() {
	state.prompt = ''
	state.hits = []
	state.is_stteing = false
	state.is_stop_stream = false
	state.is_wait_answer = false
	for (let platform of Platform) {
		try {
			const k = platform.platformName
			const cur_conf = state.platform_default_config[k]
			if (cur_conf) {
				platformMap[k] = new platform(cur_conf)
			}
		} catch {
		}
	}
	if (Object.keys(platformMap).length < 1) {
		dialog.showMessageBoxSync({ title: '提示', message: '请先进行平台配置' })
		state.is_stteing = true
		return
	}
	const res = generate_prompt(state, messages, platformMap)
	prompts = res.prompts
	searchPrompt = res.search
	state.config.platform = state.platform_default_config.platform
	state.config.model = state.platform_default_config.model
	state.config.embedding = state.platform_default_config.embedding
	if (!fs.existsSync(conversation_dir)) {
		fs.mkdirSync(conversation_dir)
	}
	try {
		if (fs.existsSync(conversation_file)) {
			state.conversations = JSON.parse(fs.readFileSync(conversation_file, 'utf-8'))
		}
		if (state.conversations.length > 0) {
			state.conversationIndex = 0
			reloadMessages().catch()
		} else {
			createConversation()
		}
	} catch {
		state.conversations = []
	}
}

async function onPin() {
	state.pin = !state.pin
	try {
		ipcRenderer.send('onPin', state.pin)
	} catch {
	}
}

function createConversation() {
	state.is_created = true
	state.conversationIndex = -1
	messages.value = []
	state.is_stteing = false
	state.is_stop_stream = true
	state.hits = []
	state.show_template = false
	nextTick().then(() => {
		inputFocus()
		if (scroll.value) {
			scroll.value.scrollTop = scroll.value.scrollHeight
		}
		handleScroll()
	})
}

function saveConversations() {
	try {
		fs.writeFileSync(conversation_file, JSON.stringify(state.conversations))
	} catch {
	}
}

function toggleConversations(index: number) {
	if (state.conversationIndex === index) return
	state.is_stop_stream = true
	nextTick().then(() => {
		state.hits = []
		state.is_wait_answer = false
		state.conversationIndex = index
		selectedConversationRef.value?.hide()
		reloadMessages().catch()
	})
}

function deleteConversations(index: number) {
	if (index < 0 || index >= state.conversations.length) {
		return
	}
	dialog.showMessageBox({
		title: '警告', type: 'warning', message: '是否确认删除该对话？删除后将无法恢复，是否继续?', buttons: ['取消', '继续']
	}).then(({ response }) => {
		if (response === 1) {
			const conversationId = state.conversations[index].id
			state.conversations.splice(index, 1)
			saveConversations()
			selectedConversationRef.value?.hide()
			const conversation_file = join(conversation_dir, conversationId + '.json')
			if (fs.existsSync(conversation_file)) {
				fs.unlinkSync(conversation_file)
			}
			if (index === state.conversationIndex) {
				if (state.conversationIndex === 0) {
					state.conversationIndex = -1
				}
				if (state.conversations.length < 1) {
					createConversation()
				} else {
					toggleConversations(0)
				}
			}
		}
	})
}

async function reloadMessages() {
	if (!conversation.value) return
	try {
		const chat_id = conversation.value.id
		messages.value = JSON.parse(fs.readFileSync(join(conversation_dir, chat_id + '.json'), 'utf-8'))
		for (const item of messages.value) {
			//  合并配置
			if (item.params) {
				Object.assign(state.config, item.params)
			}
		}
	} catch {
		messages.value = []
	}
	if (messages.value.length) {
		state.is_created = false
	}
	await nextTick()
	highlightAll()
	inputFocus()
	handleScroll()
	await nextTick()
	if (scroll.value) {
		scroll.value.scrollTop = scroll.value.scrollHeight
	}
}

function autoResize() {
	const max_line = 8
	textareaRef.value.style.height = '20px'
	const overflow = textareaRef.value.scrollHeight > 20 * max_line
	textareaRef.value.style.height = `${ overflow ? 20 * max_line : textareaRef.value.scrollHeight }px`
	state.height = textareaRef.value.scrollHeight
	state.input_box_h = inputBox.value ? inputBox.value.scrollHeight : 0
	state.scrollHeight = inputBox.value ? `calc(100% - ${ inputBox.value.scrollHeight + 37 }px)` : '100%'
}

let tb_btn_interval = undefined

function handleScroll() {
	clearTimeout(tb_btn_interval)
	state.show_top_bottom_btn = true
	state.inputBoxHeight = inputBox.value?.scrollHeight ?? 0
	if (scroll.value) {
		state.isTop = scroll.value.scrollTop < 100
		state.isBottom = scroll.value.scrollHeight - scroll.value.scrollTop - scroll.value.clientHeight < 100
		if (scrollTop === -1) {
			scrollTop = scroll.value.scrollTop
			isLockScroll = true
		} else {
			if (scroll.value.scrollTop < scrollTop) {
				isLockScroll = false
			} else {
				if (state.isBottom) {
					isLockScroll = true
				}
			}
		}
		scrollTop = scroll.value.scrollTop
	}
	tb_btn_interval = setTimeout(function () {
		state.show_top_bottom_btn = false
	}, 1000 * 3)
}

async function onChat() {
	if (!state.prompt.trim() || state.is_wait_answer) return
	state.is_wait_answer = true
	currentEl.value = null
	//  获取是否有选中的模板
	const select = searchPrompt(state.prompt)
	const old_prompt = state.prompt.trim()
	let hits = []
	let prompt = old_prompt
	if (select) {
		hits = select.hits
		prompt = select.prompt
	}
	//  使用模板时，不再进行消息关联
	let skip_relation = false
	let handler: Function = undefined
	//  有命中模板时，才会执行回调
	if (hits?.find(h => h.hit)) {
		try {
			const hit = prompts.find(x => x.id === hits.find(h => h.hit).id)
			const result = hit.callback(prompt)
			if (typeof result === 'string') {
				prompt = result
				skip_relation = true
			} else if (typeof result === 'function') {
				handler = result
				skip_relation = true
			} else {
				state.prompt = ''
				state.is_wait_answer = false
				inputFocus()
				return
			}
		} catch {
		}
	}
	if (!prompt) {
		prompt = state.prompt
	}
	// 从配置中获取当前使用平台最大token数
	const max_token = state.platform_default_config[state.config.platform].round_max_tokens
	const platform = platformMap[state.config.platform]
	let total_tokens = platform.count_tokens(prompt)
	if (total_tokens > max_token) {
		dialog.showErrorBox('错误', '输入文本长度超出允许的最大值')
		inputFocus()
		return
	}
	state.prompt = ''
	state.is_stop_stream = false
	nextTick().then(() => autoResize())
	// 生成对话id
	const conversation_id = conversation.value?.id || Date.now() + ''
	const relations: Message[] = []
	// 从最近的历史消息中关联消息
	if (messages.value.length > 0 && !skip_relation) {
		let n = 0
		for (let i = messages.value.length - 1; i >= 0; i--) {
			const message = messages.value[i]
			// 空消息、回复失败的消息不进行关联
			if (!message.content || message.is_delete) {
				continue
			}
			// 消息被标记为跳过时，不在进行关联
			if (message.skip_relation) {
				if (relations.length > 0 && relations[0].role === 'assistant') {
					relations.shift()
				}
				continue
			}
			// 计算tokens是否超出允许的最大值
			const tokens = platform.count_tokens(message.content)
			if (tokens + total_tokens > max_token) break
			total_tokens += tokens
			relations.splice(0, 0, { role: message.role, content: message.content })
			// 限制最大关联消息数
			if (++n >= state.platform_default_config.max_related_message_num) break
		}
	}
	//  添加当前用户输入的消息
	relations.push({ role: 'user', content: prompt })
	
	let cur_conversation: IConversation
	//  新建对话时，添加到对话列表
	if (state.is_created) {
		cur_conversation = { id: conversation_id, created: Date.now(), new_create: true, title: '新建对话' }
		state.conversations.splice(0, 0, cur_conversation)
		state.conversationIndex = 0
	} else if (conversation.value.title === '新建对话' || messages.value.length < 1) {
		cur_conversation = conversation.value
	}
	messages.value.push(
		{ role: 'user', content: prompt, created: Date.now(), params: JSON.parse(JSON.stringify(state.config)), skip_relation },
		{ created: Date.now(), content: '', role: 'assistant', ended: false, is_end: false, is_truncated: false, total_tokens: 0 }
	)
	await nextTick()
	const m: IMessage = messages.value[messages.value.length - 1]
	scroll.value.scrollTop = scroll.value.scrollHeight
	m.content = '正在分析，请稍后...'
	let isOutput = false
	
	const updateTime = () => {
		if (isOutput || !state.is_wait_answer) return
		m.content = `正在分析...已等待: ${ formatTime(m.created) }`
		requestAnimationFrame(updateTime)
	}
	
	updateTime()
	try {
		function onChunk(text: string) {
			if (!isOutput) {
				isOutput = true
				m.content = ''
			}
			m.content += text
			nextTick().then(() => {
				autoResize()
				if (isLockScroll) {
					scroll.value.scrollTop = scroll.value.scrollHeight
				}
			})
			return !state.is_stop_stream
		}
		
		let result: ILLMResult
		if (handler) {
			result = await handler(prompt, relations, onChunk)
		} else {
			result = await platform.completion(relations, {
				model: state.config.model,
				temperature: state.config.temperature,
				penalty_score: state.config.penalty_score
			}, onChunk)
		}
		
		async function save() {
			m.ended = true
			m.total_tokens = result.total_tokens
			try {
				fs.writeFileSync(join(conversation_dir, conversation_id + '.json'), JSON.stringify(messages.value.filter(x => !x.is_delete), undefined, '\t'))
			} catch {
			}
			if (cur_conversation) {
				const r = await platform.completion('请帮我把下面的问答提取为简短的标题，该标题用于在html的200px的div中显示，绝不允许添加任何不相关的内容:\n\n' + prompt + '\n\n' + m.content + '\n\n标题:', {
					model: state.config.model,
					temperature: state.config.temperature,
					penalty_score: state.config.penalty_score
				})
				cur_conversation.title = r.content.replaceAll('"', '').replaceAll('\'', '')
				if (result?.total_tokens > 0) {
					result.total_tokens += r.total_tokens
				}
			}
			if (state.is_created || cur_conversation) {
				saveConversations()
			}
		}
		
		function reChat() {
			messages.value.pop()
			messages.value.pop()
			state.prompt = old_prompt
		}
		
		if (state.is_stop_stream) {
			if (result.content.length > 0) {
				await save()
			} else {
				reChat()
			}
		} else {
			if (result.content) {
				await save()
			} else {
				reChat()
			}
		}
	} catch (e) {
		m.content += '\n\n对话失败:' + e.message + '\n(当前消息下次刷新后将删除)'
		messages.value[messages.value.length - 2].is_delete = true
		m.is_delete = true
	}
	state.is_stop_stream = true
	state.is_created = false
	state.is_wait_answer = false
	await nextTick()
	autoResize()
	if (isLockScroll) {
		scroll.value.scrollTop = scroll.value.scrollHeight
		handleScroll()
	}
}

function stop_chat() {
	try {
		state.is_stop_stream = true
	} catch {
	}
}

function getDifferenceParams(m: IMessage): { k: string, v: string }[] {
	if (!(m.role === 'user' && m.params && Object.keys(m.params).length)) return []
	return Object.keys(state.config).filter(x => x !== 'platform' && m.params[x] !== state.config[x]).map(k => {
		return { k: k.substring(0, 1).toUpperCase() + k.substring(1), v: (m.params[k] + '').toUpperCase() }
	})
}
</script>

<template>
	
	<div class="flex flex-col h-screen w-screen text-white dark:text-white text-sm rounded-t-lg">
		<!-- header -->
		<div class="w-full fixed top-0 dark:bg-[#2f2f2f] bg-[#343541]">
			<nav class="flex justify-between items-center border-b border-white/10 bg-[#343541] py-3 px-4 w-full rounded-t-lg opacity-70 h-[48px]"
				style="-webkit-app-region: drag;">
				<div class="flex mr-12" style="-webkit-app-region: no-drag;" v-tooltip="'新建对话'">
					<icon-plus @click="createConversation()" class="cursor-pointer hover:text-neutral-400" />
				</div>
				<div class="max-w-[300px] whitespace-nowrap overflow-hidden text-sm text-ellipsis cursor-pointer hover:underline active:underline relative"
					v-popover:selectedConversation style="-webkit-app-region: no-drag;">
					{{ conversation?.title || default_title }}
				</div>
				<div class="flex" style="-webkit-app-region: no-drag;">
					<div v-tooltip="state.is_dark ? '浅色模式' : '深色模式'">
						<icon-moon v-if="state.is_dark" @click="toggleTheme" class="cursor-pointer hover:text-neutral-400" />
						<icon-sun v-else @click="toggleTheme" class="cursor-pointer hover:text-neutral-400" />
					</div>
					<div v-tooltip="state.pin ? '固定窗口' : '未固定窗口'">
						<icon-pinned v-if="state.pin" @click="onPin" class="cursor-pointer hover:text-neutral-400 ml-2" />
						<icon-pinned-off v-else @click="onPin" class="cursor-pointer hover:text-neutral-400 ml-2" />
					</div>
					<div v-tooltip="'设置'">
						<icon-settings @click="state.is_stteing = !state.is_stteing" class="cursor-pointer hover:text-neutral-400 ml-2" />
					</div>
				</div>
			</nav>
		</div>
		<!-- body -->
		<article v-if="!state.is_stteing" class="flex h-full w-full pt-[48px]">
			<div class="relative flex-1 overflow-hidden dark:bg-[#343541] bg-white w-full">
				<!--当前模型-->
				<div class="text-xs dark:opacity-70 flex items-center justify-between gap-1 border-b border-black/10 bg-gray-50 p-1 px-3 text-gray-800 dark:border-gray-900/50 dark:bg-gray-700 dark:text-gray-300 cursor-default" onselectstart="return false">
					<div class="p-1 rounded-md hover:bg-gray-500 hover:text-white cursor-pointer"
						v-tooltip="'平台: ' + state.config.platform + '\n模型: ' + state.config.model + '\n可使用\'/\'命令进行动态切换'">
						Model: {{ state.config.model }}
					</div>
					<div class="p-1 rounded-md hover:bg-gray-500 hover:text-white cursor-pointer" v-tooltip="'使用的向量模型'">
						Embed: {{ state.config.embedding }}
					</div>
					<div v-popover:temperature class="p-1 rounded-md hover:bg-gray-500 hover:text-white cursor-pointer" v-tooltip="'较高的数值会使输出更加随机，而较低的数值会使其更加集中和确定'">
						Temp: {{ state.config.temperature }}
					</div>
					<div v-popover:penalty_score class="p-1 rounded-md hover:bg-gray-500 hover:text-white cursor-pointer" v-tooltip="'通过对已生成的token增加惩罚，减少重复生成的现象，值越大表示惩罚越大'">
						PS: {{ state.config.penalty_score }}
					</div>
				</div>
				<div class="overflow-scroll relative top-0 w-full overflow-x-hidden" ref="scroll" @scroll="handleScroll"
					:style="{ height: state.scrollHeight }">
					<!-- 无消息时的背景 -->
					<div v-if="messages.length < 1" class="relative w-full flex flex-col cursor-default h-full">
						<h1 class="text-4xl font-semibold text-center text-gray-200 dark:text-gray-600 ml-auto mr-auto mb-10 flex gap-2 items-center justify-center flex-grow">
							Desktop ChatAI<span class="bg-yellow-200 text-yellow-900 py-0.5 px-1.5 text-xs rounded-md uppercase">Plus</span>
						</h1>
					</div>
					<!-- 消息列表 -->
					<div v-for="(m, index) in messages" :key="index" :class="m.role === 'user' ? 'bg-white dark:bg-[#343541]' : 'bg-[#F7F7F8] dark:bg-[#444654]'"
						class="group w-full text-gray-800 dark:text-gray-100 border-b border-black/10 dark:border-gray-900/50 relative">
						<!-- 显示与当前配置有差异的参数 -->
						<div v-if="getDifferenceParams(m).length > 0" class="text-xs dark:opacity-50 flex items-center justify-between gap-1 p-1 px-3 text-gray-800 dark:text-gray-300 cursor-default">
							<div v-for="item in getDifferenceParams(m)" :key="item.k" class="p-1 rounded-md hover:bg-gray-500 hover:text-white cursor-pointer" v-tooltip="'点击切换'">
								{{ item.k }}: {{ item.v }}
							</div>
						</div>
						<div class="gap-4 w-full p-4 flex text-base m-auto">
							<!-- 头像 -->
							<div class="flex-shrink-0 flex flex-col relative items-end dark:opacity-70">
								<icon-user-square-rounded v-if="m.role === 'user'" />
								<icon-robot-face v-else />
							</div>
							<!-- 内容 -->
							<div class="w-[calc(100%-30px)] dark:opacity-70 min-h-[20px] flex flex-col items-start break-words">
								<template v-if="m.role === 'user'">{{ m.content }}</template>
								<div v-else v-html="md.render(m.content)" class="markdown prose w-full break-words dark:prose-invert"></div>
							</div>
						</div>
						<!-- 复制按钮 -->
						<div v-if="m.role === 'user' || m.ended" class="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100" v-tooltip="'拷贝至剪切板'">
							<icon-clipboard @click="copy(m.content)" class="cursor-pointer opacity-40 hover:opacity-70 active:opacity-100" :size="18" />
						</div>
					</div>
				</div>
				<!-- 提示模板列表 -->
				<div v-show="state.show_template && state.hits.length" class="absolute left-0 w-full max-h-[200px] pl-2 dark:shadow-[0px_0px_20px_0px_#1e293b] shadow-[0px_0px_20px_0px_#f3f4f6] overflow-hidden bg-gray-100 text-gray-500 dark:border-gray-900/50 dark:bg-[#1e293b] dark:text-gray-300"
					:style="{ bottom: (state.input_box_h - 8) + 'px', height: state.template_prompt_h > 150  ? '150px' : 'auto' }">
					<div class="overflow-y-auto h-full">
						<div ref="templatePromptRef" class="grid grid-cols-1 divide-y dark:divide-slate-700">
							<div v-for="item in state.hits" :key="item.label" class="flex gap-x-3 py-2 items-center">
								<div :title="item.label" class="w-[120px] flex items-center flex-shrink-0 text-sm font-semibold text-gray-900 dark:text-gray-400 whitespace-nowrap overflow-hidden text-ellipsis">
									<span :class="item.hit ? 'bg-lime-500' : 'bg-gray-400'" class="h-1.5 w-1.5 mr-1.5 rounded-full" />
									{{ item.label }}
								</div>
								<div :title="item.remarks" class="flex-grow text-xs text-gray-900 dark:text-gray-400 line-clamp-2">
									{{ item.remarks }}
								</div>
							</div>
						</div>
					</div>
				</div>
				<!-- 停止生成按钮 -->
				<button v-if="state.is_wait_answer" :style="{ bottom: (state.input_box_h + 8) + 'px' }" @click="stop_chat"
					class="absolute right-4 border border-gray-300 rounded-md text-gray-900 bg-white opacity-80 hover:opacity-100 dark:text-[#d9d9e3] dark:bg-[#343541] dark:border-[#565869] p-2">
					停止生成
				</button>
				<!-- 输入框 -->
				<div ref="inputBox" class="absolute bottom-0 left-0 w-full pt-0 dark:border-white/20 border-transparent dark:bg-[#444654] dark:bg-gradient-to-t from-[#343541] via-[#343541] to-[#343541]/0 bg-white dark:!bg-transparent">
					<div class="stretch mx-4 mt-2 flex flex-row gap-3 last:mb-2">
						<div class="flex flex-col w-full py-2 flex-grow relative border border-black/10 bg-white dark:border-gray-900/50 dark:text-white dark:bg-[#40414F] rounded-md shadow-[0_0_10px_rgba(0,0,0,0.10)] dark:shadow-[0_0_15px_rgba(0,0,0,0.10)]">
							<textarea ref="textareaRef" class="max-h-[176px] text-black dark:text-white m-0 w-full resize-none outline-none border-0 bg-transparent p-0 pr-9 focus:ring-0 focus-visible:ring-0 dark:bg-transparent pl-2"
								:style="{ bottom: state.height + 'px', overflow: state.height > 176 ? 'auto' : 'hidden' }"
								placeholder="请输入您的问题，使用[Ctrl / Alt] + Enter快速提问"
								v-model="state.prompt" @input="autoResize"
								@keyup.shift.enter.stop.prevent="onChat"
								@keyup.ctrl.enter.stop.prevent="onChat"
								@keyup.alt.enter.stop.prevent="onChat"
								@keyup.meta.enter.stop.prevent="onChat"
								:disabled="state.is_wait_answer" :rows="1">
							</textarea>
							<button @click="onChat" class="absolute focus:outline-none text-neutral-800 hover:text-neutral-900 dark:text-neutral-100 dark:hover:text-neutral-200 dark:bg-opacity-50 hover:bg-neutral-200 bg-transparent p-1 rounded-sm right-[.55rem] top-[6px]">
								<icon-reload v-if="state.is_wait_answer" :size="16" class="animate-spin opacity-60" />
								<icon-send v-else :size="16" class="opacity-60" />
							</button>
						</div>
					</div>
					<div class="p-2 pb-3 text-center text-sm text-black/50 dark:text-white/50 dark:opacity-70 cursor-default" onselectstart="return false">
						Tokens: {{ cur_all_tokens }} 仅自动关联前 {{ state.platform_default_config.max_related_message_num }} 条对话，输入"/"查看所有命令
					</div>
				</div>
				<!-- 快速定位按钮 -->
				<template v-if="state.show_top_bottom_btn">
					<div v-if="!state.isTop" class="group backtop opacity-40 hover:opacity-100 dark:border-white border-[#409EFF] hover:bg-[#409EFF] hover:border-none top-[70px]" @click="scroll && (scroll.scrollTop = 0)">
						<div title="向上至顶" class="dark:text-white text-[#409EFF] group-hover:text-white group-hover:border-none block">
							<icon-arrow-bar-to-up />
						</div>
					</div>
					<div v-if="!state.isBottom" class="group backtop opacity-40 hover:opacity-100 dark:border-white border-[#409EFF] hover:bg-[#409EFF] hover:border-none"
						:style="{ bottom: (state.inputBoxHeight + state.height) + 'px' }" @click="scroll && (scroll.scrollTop = scroll.scrollHeight)">
						<div title="向下置底" class="dark:text-white text-[#409EFF] group-hover:text-white group-hover:border-none block">
							<icon-arrow-bar-to-down />
						</div>
					</div>
				</template>
			</div>
		</article>
		<!-- 设置按钮 -->
		<div v-else class="bg-white dark:bg-[#444654] p-4 h-full pt-[48px] pr-0 pb-0">
			<setting v-model:config="state.platform_default_config" @save="saveConfig" @cancel="state.is_stteing = false"/>
		</div>
		<popover v-if="!state.is_wait_answer" ref="selectedConversationRef" name="selectedConversation" :width="320" class="dark:bg-gray-950 bg-white h-[300px] outline-none rounded-lg" :offset="{ top: 5 }">
			<div class="flex-grow overflow-auto h-full">
				<div v-if="state.conversations.length > 0" class="h-full p-2">
					<div v-for="(item, index) in state.conversations" :key="item.id" @click="toggleConversations(index)" class="flex flex-col-reverse gap-1 w-full pb-2">
						<div class="flex w-full gap-3 items-center p-3 text-sm rounded-lg hover:bg-[#343541]/90 transition-colors duration-200 cursor-pointer opacity-80"
							:class="conversation && conversation.id === item.id ? 'bg-[#343541]' : ''">
							<icon-message style="width: 1rem; height: 1rem;" />
							<div class="overflow-hidden whitespace-nowrap overflow-ellipsis pr-1 flex-1 text-left">
								{{ item?.title || '新建对话' }}
							</div>
							<div class="flex gap-1 -ml-2">
								<icon-trash @click="deleteConversations(index)" :size="16" class="min-w-[20px] text-neutral-400 hover:text-neutral-100" />
							</div>
						</div>
					</div>
				</div>
				<div v-else class="mt-4 text-white text-center">
					<div>No conversations.</div>
				</div>
			</div>
		</popover>
		<popover name="temperature" :width="200" class="dark:bg-gray-800 bg-white p-4 h-[20px] rounded-lg" :pointer="false" style="--pointer-color: rgb(31,41,55)">
			<div class="w-[180px] mx-auto">
				<input v-model.number="state.config.temperature" type="range" min="0.01" max="1" step="0.01"
					class="w-full h-1 bg-[#0075ff] rounded-lg appearance-none cursor-pointer" />
			</div>
		</popover>
		<popover name="penalty_score" :width="200" class="dark:bg-gray-800 bg-white p-4 h-[20px] rounded-lg" :pointer="false" style="--pointer-color: rgb(31,41,55)">
			<div class="w-[180px] mx-auto">
				<input v-model.number="state.config.penalty_score" type="range" min="1.0" max="2.0" step="0.01"
					class="w-full h-1 bg-[#0075ff] rounded-lg appearance-none cursor-pointer" />
			</div>
		</popover>
	</div>
</template>
