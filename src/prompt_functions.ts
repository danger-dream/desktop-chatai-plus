import {Ref} from 'vue'
import { BasePlatform, HitPrompt, IPromptFunction, SelectionHitResult, SearchPrompt, IMessage } from '../types';

export default function generate_prompt(state: Record<string, any>, opts: Record<string, any>): { prompts: IPromptFunction[], search: SearchPrompt } {
	const messages: Ref<IMessage[]> = opts.messages
	const platforms: Record<string, BasePlatform> = opts.platforms
	const prompts: IPromptFunction[] = [
		{
			id: 'clear', keywords: ['clear', 'cls'], label: '清空消息', remarks: '清空当前对话的所有消息: /cls [提问...]',
			callback(text: string) {
				messages.value = []
				return text.trim() ? text.trim() : false
			}
		},
		{
			id: 'split', keywords: ['split', 'seg'], label: '分割对话', remarks: '从最后一条消息之前的所有消息都不在关联: /split [提问...]',
			callback(text: string) {
				if (messages.value.length > 0) {
					messages.value[messages.value.length - 1].split = true
				}
				return text.trim() ? text.trim() : false
			}
		},
		{
			id: 'system_prompt', keywords: ['sp', 'systemprompty'], label: '修改系统提示', remarks: '修改当前平台的系统提示: /sp 请你扮演.....',
			callback(text: string) {
				if (text.trim()) {
					const def = platforms[state.config.platform].getSystemPrompt()
					state.platform_default_config[state.config.platform].system_prompt = def + '\n\n' + text.trim()
				}
				opts.save_config(false)
				return false
			}
		}
		
	]
	
	//  切换模型
	for (const platform of Object.keys(platforms)) {
		for (const model of platforms[platform].getModels()) {
			prompts.push({
				id: model, keywords: [model], label: model, remarks: `切换至${ model }模型: /${ model } 这是一段测试内容`,
				callback: (function (platform: string, model: string, text: string) {
					state.config.platform = platform
					state.config.model = model
					return text
				}).bind(undefined, platform, model)
			})
		}
	}
	//  回答指定编程语言问题
	for (const key of [
		['nodejs', 'js', 'javascript'],
		['python', 'py'],
		['golang', 'go'],
		['c'],
		['c++', 'cpp'],
		['dotnet', 'csharp', 'c#'],
		['rust'],
		['java', 'jdk', 'jvm'],
		['php']
	]) {
		const lang = key[0]
		prompts.push({
			id: lang, keywords: key, label: lang, remarks: `扮演${ lang }编程语言专家，回答有关语言的问题: /${ lang } 请编写一段递归函数`,
			callback: (function (lang: string, text: string) {
				return `你是${ lang }编程语言专家，请你回答下面有关${ lang }语言的问题，你必须如实回答，绝不允许出现编造内容，若回答中存在代码，请使用Markdown格式回答\n问题：${ text }\n回答：`
			}).bind(undefined, lang)
		})
	}
	//  翻译
	prompts.push({
		id: 'trans', keywords: ['fy', 'trans'], label: '翻译', remarks: '将文本翻译为其他语言: /[trans|fy] [英语|en] 这是一段测试内容',
		callback(text: string) {
			let lang = '英文'
			const texts = text.split(' ')
			if (texts.length > 1) {
				lang = texts.shift()
				text = texts.join(' ')
			}
			return `我希望你能担任${ lang }翻译、拼写校对和修辞改进的角色。我会用任何语言和你交流，请将其翻译并用更为优美和精炼的${ lang }回答我，请确保意思不变，使其更自然、流畅和地道。仅回答翻译后的内容，不要写解释。\n原文：\n${ text }\n翻译后：`
		}
	})
	//  搜索
	/*for (const key of ['web', 'google', 'bing', 'baidu', 'dockdockgo']) {
		prompts.push({
			id: key, keywords: [key], label: key, remarks: `使用搜索引擎${ key === 'web' ? '' : key }回答问题: /${ key } 明天的天气怎么样`,
			callback: (function (fun: string, text: string) {
				return async function () {
				
				}
			}).bind(undefined, key)
		} as IPromptFunction)
	}*/
	//  统一关键词为小写，方便查询
	for (const item of prompts) {
		item.keywords = item.keywords.map(x => x.toLowerCase())
	}
	return {
		prompts,
		/**
		 * 选择提示
		 * 第一个字符为"/"时激活
		 * 可模糊搜索，比如：/oai 会匹配到 openai
		 * 可指定序号，比如：/oai.2 会匹配到 [openai, openai-gpt3, openai-gpt4] 中的openai-gpt3
		 * @param prompt {string} 提示
		 * @param limit {number} 仅存在命中消息时有效：限制返回的提示数量，默认为10
		 */
		search(prompt: string, limit: number = 10): SelectionHitResult {
			if (!prompt) {
				return undefined
			}
			let text = prompt.trim()
			if (text === '/') {
				return {
					hits: prompts.map((x, i) => {
						return { id: x.id, sort: i, label: x.label, remarks: x.remarks, hit: false }
					}),
					prompt: ''
				}
			}
			if (!text.startsWith('/')) {
				return undefined
			}
			const split = text.split(' ')
			text = split.shift().substring(1).toLowerCase()
			prompt = split.join(' ').trim()
			const text_arr = text.split('.')
			let hit_index = 1
			if (text_arr.length > 1) {
				let num = parseInt(text_arr.slice(1).join(''))
				if (!isNaN(num) && num >= 0 && num <= prompts.length) {
					text = text_arr[0]
					hit_index = num
				}
			}
			let hits: HitPrompt[] = []
			for (const p of prompts) {
				if (p.keywords.includes(text)) {
					hits.push({ id: p.id, sort: 999, label: p.label, remarks: p.remarks, hit: false })
					continue
				}
				for (const k of p.keywords) {
					let len = 0
					let index = 0
					for (let char of text) {
						const cur = k.indexOf(char, index)
						if (cur >= 0) {
							len++
							index = cur
						} else {
							break
						}
					}
					if (len > 0) {
						hits.push({ id: p.id, sort: len, label: p.label, remarks: p.remarks, hit: false })
						break
					}
				}
				
			}
			hits = hits.filter(x => x.sort > 0).sort((a, b) => b.sort - a.sort)
			if (hit_index >= 0 && hit_index <= hits.length) {
				hits[hit_index - 1].hit = true
			}
			return { hits: hits.slice(0, limit), prompt }
		}
	}
}
