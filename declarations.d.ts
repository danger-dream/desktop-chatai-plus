declare module '*.vue' {
	import { DefineComponent } from 'vue'
	const component: DefineComponent<{}, {}, any>
	export default component
}


interface Window {
	copy_code(target: HTMLButtonElement): void;
	
	inputFocus(): void;
}
