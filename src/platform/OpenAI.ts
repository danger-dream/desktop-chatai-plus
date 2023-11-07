import { IPlatformConfig, ILLMOptions, Message, BasePlatform, IEmbeddingResult, ChunkFunction, ILLMResult, PlatformKeys } from '../../types'
import { getEncoding } from 'js-tiktoken'
const enc = getEncoding('cl100k_base')

export default class OpenAI implements BasePlatform {
	public static readonly label = 'OpenAI'
	public static readonly platformName: PlatformKeys = 'openai'
	public static readonly models = [ 'gpt-4-1106-preview', 'gpt-4-vision-preview', 'gpt-4', 'gpt-4-32k', 'gpt-3.5-turbo', 'gpt-3.5-turbo-1106', 'gpt-3.5-turbo-16k' ]
	private readonly apiKey: string
	private readonly basePath: string
	
	constructor(config: IPlatformConfig) {
		const {apiKey, basePath} = config
		if (!apiKey) {
			throw new Error('OpenAI API key is required')
		}
		this.apiKey = apiKey
		this.basePath = basePath || 'https://api.openai.com/v1'
	}
	
	public getModels(): string[]{
		return OpenAI.models
	}
	
	async embedTexts(texts: string[] = []): Promise<IEmbeddingResult> {
		if (texts.length < 1) {
			throw new Error('text is required');
		}
		try {
			const inputs = texts.map(x => x.replaceAll('\n', ''));
			const response = await fetch(`${ this.basePath }/embeddings`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${ this.apiKey }`
				},
				body: JSON.stringify({input: inputs, model: 'text-embedding-ada-002'})
			});
			if (!response.ok) {
				return {embeddings: [], total_tokens: 0}
			}
			const result = await response.json();
			return {
				embeddings: result.data.map((x: { embedding: number[][] }) => x.embedding),
				total_tokens: result.usage.total_tokens
			};
		} catch {
			return {embeddings: [], total_tokens: 0};
		}
	}
	
	
	async completion(messages: Message[] | Message | string, options?: ILLMOptions, chunk_callback?: ChunkFunction): Promise<ILLMResult> {
		if (!messages || (Array.isArray(messages) && messages.length < 1)) {
			throw new Error('message is required')
		}
		if (typeof messages === 'string') {
			messages = [ {role: 'user', content: messages} ]
		}
		messages = Array.isArray(messages) ? messages : [ messages ]
		const body = {
			stream: true,
			model: options.model,
			temperature: options.temperature ?? 0.95,
			frequency_penalty: options.penalty_score ?? 0,
			messages
		}
		if (!body.model || !OpenAI.models.includes(body.model.toLowerCase())) {
			body.model = OpenAI.models[0]
		}
		let content = ''
		let total_tokens = 0
		try {
			const resp = await fetch(this.basePath + '/chat/completions', {
				headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer ' + this.apiKey},
				method: 'POST', body: JSON.stringify(body)
			})
			const reader = resp.body.pipeThrough(new TextDecoderStream()).getReader()
			let errStr = ''
			let is_stop = false
			while(!is_stop) {
				const res = await reader.read()
				if(res.done) break
				const chunk = res.value.replace(/data: /g, '').split('\n').map(x => x.trim()).filter(Boolean)
				for (let item of chunk) {
					if (is_stop) break
					if (item == '[DONE]') {
						is_stop = true
						break
					}
					try {
						if(errStr) {
							item = errStr + item
							errStr = ''
						}
						const chunk = JSON.parse(item) as { choices?: { delta?: { content?: string } }[] }
						const text = chunk.choices[0]?.delta?.content
						if (!text) continue
						content += text
						total_tokens++
						if (chunk_callback && !chunk_callback(text)) {
							try {
								await reader.cancel()
							} catch {}
							is_stop = true
							break
						}
						
					}catch {
						errStr = item
					}
				}
			}
		} catch {
		}
		return {content, total_tokens}
	}
	
	count_tokens(text: string): number {
		try {
			return enc.encode(text, 'all').length + 6
		} catch {
			return text.length
		}
	}
	
	async speech(text: string, opts?: Record<string, any>): Promise<ArrayBuffer> {
		const model = opts?.model || 'tts-1'
		const voice = opts?.voice || 'alloy'
		const speed = opts?.speed ?? 1
		const resp = await fetch(this.basePath + '/audio/speech', {
			headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer ' + this.apiKey},
			method: 'POST', body: JSON.stringify({input: text, model, voice, speed})
		})
		if (resp.status === 200) {
			return await resp.arrayBuffer()
		}
		throw new Error('speech failed')
	}
}
