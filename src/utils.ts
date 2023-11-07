import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'

hljs.configure({ ignoreUnescapedHTML: true, throwUnescapedHTML: false })

export function createMd(): MarkdownIt {
	window.copy_code = function(target: HTMLButtonElement) {
		try {
			copy(target.parentNode.parentNode.querySelector('code').innerText).then(r => {
				if (!r) return
				target.innerText = '已复制至剪切板'
				setTimeout(function() {
					target.innerText = '复制代码'
				}, 2000)
			})
		} catch {
		}
	}
	const md = new MarkdownIt({
		breaks: false, html: true, linkify: true, typographer: true, strip: true,
		highlight: function(str: string, lang: string) {
			let code = ''
			if (lang && hljs.getLanguage(lang)) {
				try {
					code = hljs.highlight(str, { language: lang }).value
				} catch {
				}
			}
			if (!code) {
				code = md.utils.escapeHtml(str)
			}
			return `<pre class='hljs'>
				<div class='hljs-header'>
					<div class='title-lang'>${ lang || 'plaintext' }</div>
					<button class='code-copy-btn opacity-70 hover:opacity-100' onclick='window.copy_code(this)'>复制代码</button>
				</div>
				<code class='code hljs ${ lang ? ' ' + lang : '' }'>${ code }</code>
			</pre>`
		},
	} as any)
	md.normalizeLink = u => u
	md.normalizeLinkText = u => u
	md.use(superscriptPlugin).use(markdownitLinkAttributes, { attrs: { target: '_blank' } })
	return md
}

export function highlightAll() {
	hljs.highlightAll()
}

export function formatTime(st: number): string {
	const misec = Date.now() - st
	const min = Math.floor(misec / 1000 / 60)
	const sec = Math.floor((misec - min * 60 * 1000) / 1000) + (misec % 1000) / 1000
	return `${ min > 0 ? min + 'm' : '' }${ sec.toFixed(3) }s`
}

function superscriptPlugin(md: MarkdownIt) {
	md.inline.ruler.after('emphasis', 'superscript', (state, silent) => {
		if (silent) return false
		const regex = /^\[\^(\d+)\^]/
		const match = state.src.slice(state.pos).match(regex)
		if (!match) return false
		const parsed = parseInt(match[1])
		if (isNaN(parsed)) return false
		state.pos += match[0].length
		const token = state.push('sup_open', 'sup', 1)
		token.attrs = [['class', 'superscript']]
		token.level = state.level++
		const contentToken = state.push('text', '', 0)
		contentToken.content = '[' + parsed.toString() + ']'
		state.push('sup_close', 'sup', -1)
		return true
	})
}

function markdownitLinkAttributes(md: MarkdownIt, configs = []) {
	configs = Array.isArray(configs) ? configs : [configs]
	Object.freeze(configs)
	const defaultRender = md.renderer.rules.link_open || function(tokens, idx, options, env, self) {
		return self.renderToken(tokens, idx, options)
	}
	md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
		let config:any
		const link = tokens[idx]
		const href = link.attrs[link.attrIndex('href')][1]
		for (const c of configs) {
			if (typeof c.matcher === 'function' && c.matcher(href, c)) {
				config = c
				break
			}
		}
		const attributes = config && config.attrs
		if (attributes) {
			for (const [attr, value] of Object.entries(attributes) as [string, string][]) {
				const realAttr = attr === 'className' ? 'class' : attr
				const attrIndex = tokens[idx].attrIndex(realAttr)
				if (attrIndex < 0) {
					tokens[idx].attrPush([realAttr, value])
				} else {
					tokens[idx].attrs[attrIndex][1] = value
				}
			}
		}
		return defaultRender(tokens, idx, options, env, self)
	}
}

export async function copy(text: string) {
	try {
		await navigator.clipboard.writeText(text)
		return true
	} catch {}
	return false
}

export function UUID() {
	let S4 = () => (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1)
	return S4() + S4() + S4() + S4() + S4() + S4() + S4() + S4()
}
