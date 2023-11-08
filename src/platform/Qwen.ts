import { IPlatformConfig, ILLMOptions, Message, BasePlatform, IEmbeddingResult, ChunkFunction, ILLMResult, PlatformKeys } from '../../types'

const BaseURL = 'https://dashscope.aliyuncs.com/api/v1/services'

export default class Qwen implements BasePlatform {
	public static readonly label = '通义千问(灵积)'
	public static readonly platformName: PlatformKeys = 'qwen'
	public static readonly models = [ 'qwen-plus', 'qwen-turbo', 'qwen-14b-chat', 'qwen-7b-chat' ]
	
	private readonly apiKey: string
	
	constructor(config: IPlatformConfig) {
		this.apiKey = config.apiKey
		if (!this.apiKey) {
			throw new Error('Qwen apiKey is required')
		}
	}
	
	public getModels(): string[]{
		return Qwen.models
	}
	
	async embedTexts(texts: string[] = []): Promise<IEmbeddingResult> {
		if (!texts || texts.length < 1) {
			throw new Error('text is required')
		}
		const url = BaseURL + '/embeddings/text-embedding/text-embedding'
		let embeddings = []
		let total_tokens = 0
		for (let i = 0; i < texts.length; i += 25) {
			const temp = texts.slice(i, i + 25)
			for (let n = 0; n < 5; n++) {
				try {
					const resp = await fetch(url, {
						headers: { Authorization: 'Bearer ' + this.apiKey, 'Content-Type': 'application/json' },
						method: 'POST', body: JSON.stringify({ model: 'text-embedding-v1', input: {texts: temp}, parameters: {text_type: 'document'} })
					})
					if (resp.status === 200) {
						const result = await resp.json()
						if (result?.output?.embeddings?.length > 0) {
							embeddings.push(...result.output.embeddings.map((x: { embedding: number[][] }) => x.embedding))
							total_tokens += result.usage.total_tokens
							break
						}
					}
				} catch {
				}
			}
		}
		return {embeddings, total_tokens}
	}
	
	async completion(messages: Message[] | Message | string, options?: ILLMOptions, chunk_callback?: ChunkFunction): Promise<ILLMResult> {
		if (!messages || (Array.isArray(messages) && messages.length < 1)) {
			throw new Error('message is required')
		}
		if (typeof messages === 'string') {
			messages = [ {role: 'user', content: messages} ]
		}
		messages = Array.isArray(messages) ? messages : [ messages ]
		if (messages[messages.length - 1].role !== 'user') {
			throw new Error('last message role not user')
		}
		while (true) {
			if (['user', 'system'].includes(messages[0].role)) {
				break
			}
			messages.shift()
		}
		let model = options?.model
		if (!model || !Qwen.models.includes(model)) {
			model = Qwen.models[0]
		}
		let content = ''
		let total_tokens = 0
		try {
			const resp = await fetch(BaseURL + '/aigc/text-generation/generation', {
				headers: {
					Authorization: 'Bearer ' + this.apiKey,
					'Content-Type': 'application/json',
					'X-DashScope-SSE': 'enable'
				},
				method: 'POST', body: JSON.stringify({
					model,
					input: {messages},
					parameters: {
						seed: Math.floor(Math.random() * 65535) + 1,
						temperature: options?.temperature ?? 0.95,
						enable_search: options?.enable_search ?? true,
						incremental_output: true
					}
				})
			})
			
			const res = chunksToLines(await resp.text())
			for (const chunk of res) {
				try {
					content += chunk.content
					total_tokens = chunk.token
					if (chunk_callback) {
						if (!chunk_callback(chunk.content)) {
							return undefined
						}
					}
				} catch {
				}
			}
		} catch {
		}
		return {content, total_tokens}
	}
	
	count_tokens(text: string): number {
		let tokens = []
		let regex = /([a-zA-Z]+)|([\u4e00-\u9fa5])|(\d)|(.)/g
		let match: string[]
		while ((match = regex.exec(text)) !== null) {
			if (match[1]) {  // 英文单词
				tokens.push(match[1])
			} else if (match[2]) {  // 中文字符
				tokens.push(match[2])
			} else if (match[3]) {  // 数字
				tokens.push(match[3])
			} else if (match[4]) {  // 其他字符
				tokens.push(match[4])
			}
		}
		return tokens.filter(x => x.trim()).length
	}
	
	speech(text: string, opts?: Record<string, any>): Promise<ArrayBuffer> {
		throw new Error('Method not implemented.')
	}
	
	getSystemPrompt(): string {
		return ''
	}
}

const data_header_length = 'data:'.length

function chunksToLines(chunksAsync: string) {
	let result = []
	for (const line of chunksAsync.split('\n')) {
		if (line.startsWith('data:')) {
			try {
				const msg = JSON.parse(line.substring(data_header_length)) as { code?: string, message?: string, output?: { text: string, finish_reason?: string }, usage?: { output_tokens: number, input_tokens: number }}
				if (msg?.code && msg?.message) {
					return result
				}
				if (!msg?.output) {
					break
				}
				result.push({
					content: msg?.output?.text,
					token: (msg?.usage?.output_tokens || 0) + (msg?.usage?.input_tokens || 0)
				})
				if (!msg?.output?.finish_reason) {
					break
				}
			} catch {
			}
		}
	}
	return result.filter(x => x.content)
}
