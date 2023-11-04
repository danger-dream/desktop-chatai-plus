declare module 'markdown-it-abbr';
declare module 'markdown-it-deflist';
declare module 'markdown-it-emoji';
declare module 'markdown-it-footnote';
declare module 'markdown-it-ins';
declare module 'markdown-it-mark';
declare module 'markdown-it-sub';
declare module 'markdown-it-sup';
declare module 'markdown-it-task-lists';
declare module 'markdown-it-link-attributes';


declare module '*.vue' {
	import { DefineComponent } from 'vue'
	const component: DefineComponent<{}, {}, any>
	export default component
}


interface Window {
	copy_code(target: HTMLButtonElement): void;
	
	inputFocus(): void;
}
