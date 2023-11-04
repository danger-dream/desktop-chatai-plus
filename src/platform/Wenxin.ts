import { IPlatformConfig, ILLMOptions, Message, BasePlatform, ChunkFunction, ILLMResult, IEmbeddingResult, PlatformKeys } from '../../types'

const BaseURL = 'https://aip.baidubce.com'
const ShopURL = BaseURL + '/rpc/2.0/ai_custom/v1/wenxinworkshop'
const ModelURL: Record<string, string> = {
	'ERNIE-Bot-4': ShopURL + '/chat/completions_pro',
	'ERNIE-Bot-turbo': ShopURL + '/chat/completions',
	'ERNIE-Bot': ShopURL + '/chat/eb-instant'
}
let token = ''

export default class Wenxin implements BasePlatform {
	public static readonly label = '文心一言(千帆)'
	public static readonly platformName:PlatformKeys = 'wenxin'
	public static readonly models = ['ERNIE-Bot-4', 'ERNIE-Bot-turbo', 'ERNIE-Bot']
	private readonly client_id: string
	private readonly client_secret: string
	
	constructor(config: IPlatformConfig) {
		this.client_id = config.client_id
		this.client_secret = config.client_secret
		if (!this.client_id || !this.client_secret) {
			throw new Error('Wenxin client_id or client_secret is required')
		}
	}
	
	public getModels(): string[]{
		return Wenxin.models
	}
	
	async get_token() {
		if (token) return token
		try {
			const resp = await fetch(BaseURL + '/oauth/2.0/token?grant_type=client_credentials&client_id=' + this.client_id + '&client_secret=' + this.client_secret)
			if (resp.status === 200) {
				const result: { access_token?: string } = await resp.json()
				token = result?.access_token
				return token
			}
			
		} catch {
		}
		return ''
	}
	
	async embedTexts(texts: string[] = []): Promise<IEmbeddingResult> {
		if (texts.length < 1) {
			throw new Error('text is required')
		}
		if (!token) {
			if (!await this.get_token()) {
				throw new Error('get token failed')
			}
		}
		const sleep = (t = 500) => new Promise(resolve => setTimeout(resolve, t))
		const url = ShopURL + '/embeddings/embedding-v1?access_token=' + token
		let embeddings: number[][] = []
		let total_tokens = 0
		for(let i = 0; i < texts.length; i += 16) {
			const temp = texts.slice(i, i + 16)
			let ok = false
			let error_msg = ''
			for (let n = 0; n < 5; n++) {
				try {
					const resp = await fetch(url, { headers: {'Content-Type': 'application/json'}, method: 'POST', body: JSON.stringify({input: temp}) })
					const result: Record<string, any> = await resp.json()
					if (resp.status === 200 && result?.usage?.total_tokens > 0 && result?.data?.length > 0) {
						embeddings.push(...result.data.map((x: any) => x.embedding))
						total_tokens = result.usage.total_tokens
						ok = true
						break
					}
					if (result?.error_msg) {
						error_msg = result?.error_msg
					}
					await sleep((n + 1) * 500)
				} catch (e){
					error_msg = e.message
				}
			}
			if (!ok) {
				throw new Error('create qianfan ernie embedding error: ' + error_msg)
			}
		}
		return {embeddings, total_tokens}
	}
	
	async completion(messages: Message[] | Message, options?: ILLMOptions, chunk_callback?: ChunkFunction): Promise<ILLMResult> {
		if (!messages || (Array.isArray(messages) && messages.length < 1)) {
			throw new Error('message is required')
		}
		if (typeof messages === 'string') {
			messages = [ {role: 'user', content: messages} ]
		}
		messages = Array.isArray(messages) ? messages : [ messages ]
		let oldMessages: Message[] = JSON.parse(JSON.stringify(messages))
		let newMessages: Message[] = []
		let last_system_message: Message
		for (const item of oldMessages) {
			if (item.role === 'system') {
				last_system_message = item
			} else {
				newMessages.push(item)
			}
		}
		if (newMessages[newMessages.length - 1].role !== 'user') {
			throw new Error('last message role not user')
		}
		oldMessages = newMessages
		newMessages = []
		let isUserRole = true
		for (let i = oldMessages.length - 1; i >= 0; i--) {
			if (isUserRole) {
				if (oldMessages[i].role === 'user') {
					isUserRole = false
					newMessages.splice(0, 0, oldMessages[i])
				}
			} else {
				if (oldMessages[i].role !== 'user') {
					isUserRole = true
					newMessages.splice(0, 0, oldMessages[i])
				}
			}
		}
		if (newMessages[0].role !== 'user') {
			newMessages.shift()
		}
		if (newMessages.length < 1 || newMessages.length % 2 !== 1) {
			throw new Error('messages length not odd')
		}
		if (newMessages[newMessages.length - 1].role !== 'user') {
			throw new Error('last message role not user')
		}
		const body: Record<string, any> = {
			model: '',
			messages: newMessages,
			temperature: options?.temperature,
			penalty_score: options?.penalty_score,
			stream: true
		}
		if (last_system_message?.content) {
			body.system = last_system_message.content
		}
		let model = options?.model
		if (!model || !Wenxin.models.includes(model)) {
			model = Wenxin.models[0]
		}
		let url = ModelURL[model]
		if (!url) {
			throw new Error('model not found')
		}
		if (!token) {
			if (!await this.get_token()) {
				throw new Error('get token failed')
			}
		}
		url += '?access_token=' + token
		let content = ''
		let total_tokens = 0
		try {
			const resp = await fetch(url, { headers: {'Content-Type': 'application/json'}, method: 'POST', body: JSON.stringify(body) })
			if (resp.status !== 200) return { content, total_tokens }
			
			const reader = resp.body.pipeThrough(new TextDecoderStream()).getReader()
			let errStr = ''
			let is_stop = false
			while(!is_stop) {
				const res = await reader.read()
				if(res.done) break
				const chunk = res.value.replace(/data: /g, '').split('\n').map(x => x.trim()).filter(Boolean)
				for (let item of chunk) {
					if (is_stop) break
					try {
						if(errStr != '') {
							item = errStr + item
							errStr = ''
						}
						let chunk = JSON.parse(item)
						if (!chunk.result) continue
						content += chunk.result
						total_tokens += chunk.usage.total_tokens
						if (chunk_callback && !chunk_callback(chunk.result)) {
							try {
								await reader.cancel()
							} catch {}
							is_stop = true
							break
						}
						if (chunk?.is_end === true) {
							is_stop = true
						}
					}catch {
						errStr = item
					}
				}
			}
		} catch {}
		return { content, total_tokens }
	}
	
	count_tokens(text: string): number {
		try {
			const singleByte = text.match(/[\u0000-\u4dff\u9fa6-\uffff]/g) || []
			const chinese = text.match(/[\u4e00-\u9fa5]/g) || []
			return singleByte.length * 1.3 + chinese.length
		} catch {
			return 0
		}
	}
}
