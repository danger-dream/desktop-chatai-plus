<script setup lang="ts">
import { reactive, computed, PropType, watch } from 'vue'
import Platform from './platform'
import { ISystemConfig } from '../types'

const default_config: any = {
	openai: { apiKey: '', basePath: 'https://api.openai.com/v1', round_max_tokens: 4000, splitter_chunk_size: 250, splitter_chunk_overlap: 0, dimension: 1536 },
	wenxin: { client_id: '', client_secret: '', round_max_tokens: 3000, splitter_chunk_size: 300, splitter_chunk_overlap: 20, dimension: 384 },
	qwen: { apiKey: '', round_max_tokens: 3000, splitter_chunk_size: 500, splitter_chunk_overlap: 20, dimension: 1536 },
	platform: 'openai', model: 'gpt-4', embedding: 'openai', max_related_message_num: 15, topK: 3
}

const props = defineProps({
	config: { type: Object as PropType<ISystemConfig>, required: true }
})

const state = reactive({
	settings: [
		...Platform.map(x => {
			return { label: x.label, value: x.platformName, model: true, models: x.models }
		}),
		{ label: '系统设置', value: 'setting' }
	] as { label: string, value: any, model: boolean, models: string[] }[],
	index: 0,
	active: Platform[0].platformName,
	config: {} as ISystemConfig
})
const emit = defineEmits([ 'update:config', 'save', 'cancel' ])

watch(() => props.config, (val) => {
	if (!val) return
	Object.assign(state.config, default_config, JSON.parse(JSON.stringify(val)))
}, { immediate: true })

watch(() => state.config.platform, (value) => {
	state.config.model = state.settings.find(x => x.value === value)?.models[0]
}, { immediate: true })

const platforms = computed(() => {
	return state.settings.filter(x => x.model)
})

const models = computed(() => {
	return state.settings.find(x => x.value === state.config.platform)?.models || []
})

function recover() {
	Object.assign(state.config, JSON.parse(JSON.stringify(props.config)))
}

function onSave() {
	if (!state.config['openai'].basePath) {
		state.config['openai'].basePath = 'https://api.openai.com/v1'
	}
	emit('update:config', state.config)
	emit('save')
}

</script>

<template>
	<div class="overflow-scroll overflow-x-hidden h-full pr-4 md:pr-8 w-full">
		<!-- Tabs -->
		<div class="flex justify-around">
			<div class="my-4 rounded-md shadow-sm">
				<template v-for="(menu, index) in state.settings" :key="menu.value">
					<a href="#" @click="state.active = menu.value"
						:class="[
					   state.active === menu.value ? 'text-blue-700 dark:bg-gray-500': 'text-gray-900 bg-white dark:bg-gray-700',
					   index === 0 ? 'rounded-l-lg': '',
					   index === state.settings.length - 1 ? 'rounded-r-md' : '', index > 0 ? 'border-t border-b border-r': 'border'
				   ]"
						class="px-4 py-2 text-sm font-medium border-gray-200 hover:bg-gray-100 dark:border-gray-600 dark:text-white dark:hover:text-white dark:hover:bg-gray-600">
						{{ menu.label }}
					</a>
				</template>
			</div>
		</div>
		<div class="flex justify-around">
			<div class="mb-4 border dark:border-slate-600 rounded-lg p-4 bg-white dark:bg-[#343541] max-w-[500px]">
				<template v-if="state.active === 'openai'">
					<div class="mb-4">
						<label class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Api Key</label>
						<input v-model="state.config['openai'].apiKey" type="text"
							class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" required placeholder="sk-....."/>
					</div>
					<div class="mb-4">
						<label class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Base Path 默认为: https://api.openai.com/v1</label>
						<input v-model="state.config['openai'].basePath" type="text"
							class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" required placeholder="https://api.openai.com/v1"/>
					</div>
				</template>
				<template v-else-if="state.active === 'wenxin'">
					<div class="mb-4">
						<label class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Client Id</label>
						<input v-model="state.config['wenxin'].client_id" type="text" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" required placeholder="Please enter ClienId"/>
					</div>
					<div class="mb-4">
						<label class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Client Secret</label>
						<input v-model="state.config['wenxin'].client_secret" type="text" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" required placeholder="Please enter ClienSecret"/>
					</div>
				</template>
				<template v-else-if="state.active === 'qwen'">
					<div class="mb-4">
						<label class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Api Key</label>
						<input v-model="state.config['qwen'].apiKey" type="text" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" required placeholder="sk-....."/>
					</div>
				</template>
				
				<template v-if="state.active === 'setting'">
					<!-- 默认使用的平台 -->
					<div class="mb-4">
						<label class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">默认使用的平台: </label>
						<div class="flex">
							<div v-for="item in platforms" :key="item.value" class="flex items-center mr-4" @click="state.config.platform = item.value">
								<input :checked="state.config.platform === item.value" :id="'platform-' + item.value" type="radio" name="platform-group" class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 dark:ring-offset-gray-800 dark:bg-gray-700 dark:border-gray-600">
								<label :for="'platform-' + item.value" class="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300">{{ item.label }}</label>
							</div>
						</div>
					</div>
					<!-- 默认模型 -->
					<div class="mb-4">
						<label class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">默认模型: </label>
						<div class="flex flex-wrap">
							<div v-for="item in models" :key="item" class="flex items-center mr-4" @click="state.config.model = item">
								<input :checked="state.config.model === item" :id="'model-' + item" type="radio" name="model-group" class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 dark:ring-offset-gray-800 dark:bg-gray-700 dark:border-gray-600">
								<label :for="'model-' + item" class="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300">{{ item }}</label>
							</div>
						</div>
					
					</div>
					<!-- 默认向量引擎 -->
					<div class="mb-4">
						<label class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">默认向量引擎: : </label>
						<div class="flex">
							<div v-for="item in platforms" :key="item.value" class="flex items-center mr-4" @click="state.config.embedding = item.value">
								<input :checked="state.config.embedding === item.value" :id="'embed-' + item.value" type="radio" name="embed-group" class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 dark:ring-offset-gray-800 dark:bg-gray-700 dark:border-gray-600">
								<label :for="'embed-' + item.value" class="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300">{{ item.label }}</label>
							</div>
						</div>
					</div>
					<!-- 最大关联消息数 -->
					<div class="mb-2">
						<label class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
							最大关联消息数: {{ state.config.max_related_message_num }}
						</label>
						<input v-model.number="state.config.max_related_message_num" type="range" min="0" max="50" step="2" class="w-full h-1 mb-6 bg-gray-200 rounded-lg appearance-none cursor-pointer range-sm dark:bg-gray-700"/>
					</div>
					<!-- top-k -->
					<div class="mb-2">
						<label class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
							Top-K: {{ state.config.topK }}
						</label>
						<input v-model.number="state.config.topK" type="range" min="1" max="20" step="1" class="w-full h-1 mb-6 bg-gray-200 rounded-lg appearance-none cursor-pointer range-sm dark:bg-gray-700"/>
					</div>
				</template>
				<template v-else>
					<div class="mb-4">
						<label class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
							Round Max Tokens: {{ state.config[state.active].round_max_tokens }} (单次对话允许的最大token数)
						</label>
						<input v-model.number="state.config[state.active].round_max_tokens" type="range" min="100" max="6000"
							class="w-full h-1 mb-6 bg-gray-200 rounded-lg appearance-none cursor-pointer range-sm dark:bg-gray-700"/>
					</div>
					<div class="mb-4">
						<div class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
							<p>Chunk Size: {{ state.config[state.active].splitter_chunk_size }} (向量模型：文本切分最大长度)</p>
							<p class="text-slate-500">该值过大时，请调整"系统设置"中的Top-K</p>
						</div>
						<input v-model.number="state.config[state.active].splitter_chunk_size" type="range" min="100" max="2000" step="10"
							class="w-full h-1 mb-6 bg-gray-200 rounded-lg appearance-none cursor-pointer range-sm dark:bg-gray-700"/>
					</div>
					<div class="mb-2">
						<label class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
							Chunk Overlap: {{ state.config[state.active].splitter_chunk_overlap }} (向量模型：相邻chunk之间的重叠token数量)
						</label>
						<input v-model.number="state.config[state.active].splitter_chunk_overlap" type="range" min="0" max="500" step="10"
							class="w-full h-1 mb-6 bg-gray-200 rounded-lg appearance-none cursor-pointer range-sm dark:bg-gray-700"/>
					</div>
				</template>
				<div class="flex justify-between items-center">
					<div>
						<button @click="emit('cancel')" type="button" class="py-2.5 px-5 mr-2 mb-2 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded-lg border border-gray-200 hover:bg-gray-100 hover:text-blue-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700">
							取消
						</button>
						<button @click="recover" type="button" class="text-green-700 hover:text-white border border-green-700 hover:bg-green-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center mr-2 mb-2 dark:border-green-500 dark:text-green-500 dark:hover:text-white dark:hover:bg-green-600">
							还原
						</button>
					</div>
					<button @click="onSave" class="text-blue-700 hover:text-white border border-blue-700 hover:bg-blue-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center mr-2 mb-2 dark:border-blue-500 dark:text-blue-500 dark:hover:text-white dark:hover:bg-blue-500">
						保存
					</button>
				</div>
			</div>
		</div>
		
	</div>
</template>