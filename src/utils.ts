import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'
import MarkAbbr from 'markdown-it-abbr'
import MarkDeflist from 'markdown-it-deflist'
import MarkEmoji from 'markdown-it-emoji'
import MarkFootnote from 'markdown-it-footnote'
import MarkIns from 'markdown-it-ins'
import MarkMark from 'markdown-it-mark'
import MarkSub from 'markdown-it-sub'
import MarkSup from 'markdown-it-sup'
import MarkTaskLists from 'markdown-it-task-lists'
import MarkLinkAttributes from 'markdown-it-link-attributes'

hljs.configure({ignoreUnescapedHTML: true, throwUnescapedHTML: false})

export function createMd(): MarkdownIt {
	window.copy_code = function (target: HTMLButtonElement) {
		try {
			copy(target.parentNode.parentNode.querySelector('code').innerText).then(r => {
				if (!r) return
				target.innerText = '已复制至剪切板'
				setTimeout(function () {
					target.innerText = '复制代码'
				}, 2000)
			})
		} catch {
		}
	}
	const md = new MarkdownIt({
		breaks: false, html: true, linkify: true, typographer: true, strip: true,
		highlight: function (str: string, lang: string) {
			let code = ''
			if (lang && hljs.getLanguage(lang)) {
				try {
					code = hljs.highlight(str, {language: lang}).value
				} catch {
				}
			}
			if (!code) {
				code = md.utils.escapeHtml(str)
			}
			return `<pre class="hljs">
				<div class="hljs-header">
					<div class="title-lang">${ lang || 'plaintext' }</div>
					<button class="code-copy-btn opacity-70 hover:opacity-100" onclick="window.copy_code(this)">复制代码</button>
				</div>
				<code class="code hljs ${ lang ? ' ' + lang : '' }">${ code }</code>
			</pre>`
		}
	} as any)
	md.normalizeLink = u => u
	md.normalizeLinkText = u => u
	md.use(superscriptPlugin).
	use(MarkAbbr).
	use(MarkDeflist).
	use(MarkEmoji).
	use(MarkFootnote).
	use(MarkIns).
	use(MarkMark).
	use(MarkSub).
	use(MarkSup).
	use(MarkTaskLists).
	use(MarkLinkAttributes, {attrs: {target: '_blank'}})
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
		token.attrs = [ [ 'class', 'superscript' ] ]
		token.level = state.level++
		const contentToken = state.push('text', '', 0)
		contentToken.content = '[' + parsed.toString() + ']'
		state.push('sup_close', 'sup', -1)
		return true
	})
}

export async function copy(text: string) {
	try {
		await navigator.clipboard.writeText(text)
		return true
	} catch {}
	return false
}
