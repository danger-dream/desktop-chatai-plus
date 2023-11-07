export interface ILLMOptions extends Record<string, any> {
	model: string
	temperature?: number
	penalty_score?: number
}

export interface IFunction_call {
	name: string
	arguments: string
	thoughts?: string
}

export interface Message {
	role: 'user' | 'assistant' | 'function' | 'system'
	content?: string
	name?: string
	function_call?: IFunction_call
}

export interface ChunkFunction {
	(text: string): boolean
}

export interface IEmbeddingResult {
	embeddings: number[][]
	total_tokens: number
}

export interface ILLMResult {
	content: string
	total_tokens: number
}

export declare class BasePlatform {
	getModels(): string[]
	
	embedTexts(texts: string[]): Promise<IEmbeddingResult>
	
	completion(messages: Message[] | Message | string, options?: ILLMOptions, chunk_callback?: ChunkFunction): Promise<ILLMResult>
	
	count_tokens(text: string): number
	
	speech(text: string, opts?: Record<string, any>): Promise<ArrayBuffer>
}

export interface IPlatformConfig extends Record<string, any> {
	apiKey?: string
	basePath?: string
	client_id?: string
	client_secret?: string
	
	round_max_tokens: number
	splitter_chunk_size: number
	splitter_chunk_overlap: number
	dimension: number
	tts_model?: string
	tts_voice?: string
	tts_speed?: number
}

type PlatformKeys = 'openai' | 'wenxin' | 'qwen'

export interface ISystemConfig {
	[key in PlatformKeys]: IPlatformConfig
	platform: PlatformKeys
	model: string
	embedding: PlatformKeys
	max_related_message_num: number
	topK: number
	auto_play_audio: boolean
}

export interface IMessageParams {
	platform?: PlatformKeys
	model?: string
	embedding?: PlatformKeys
	temperature?: number
	penalty_score?: number
}

export interface IPromptFunction {
	id: string
	keywords: string[]
	label: string
	remarks: string
	
	callback(...args: any[]): string | Function | boolean
}

type SelectionHitResult = { hits: HitPrompt[], prompt: string } | undefined
type SearchPrompt = (prompt: string) => SelectionHitResult

export interface IConversation {
	id: string
	title: string
	created: number
	system_id?: string
	new_create?: boolean
}

export interface IMessage {
	id: string
	role: 'user' | 'assistant' | 'system'
	created: number
	content: string
	
	params?: IMessageParams
	is_delete?: boolean
	
	ended?: boolean
	is_end?: boolean
	total_tokens?: number
	skip_relation?: boolean
	split?: boolean
	autio_path?: string
}

export interface HitPrompt {
	id: string
	label: string
	sort: number
	remarks: string
	hit: boolean
}
