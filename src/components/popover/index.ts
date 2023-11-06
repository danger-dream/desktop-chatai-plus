// noinspection JSUnusedGlobalSymbols

import { App } from 'vue'
import { events } from './event'
import Popover from './Popover.vue'

interface PopoverHTMLElement extends HTMLElement {
	$popoverRemoveClickHandlers(): void;
	
	$popoverRemoveHoverHandlers(): void;
}

const addClickEventListener = (target: PopoverHTMLElement, name: string) => {
	const event = 'click'
	const showEventName = `show:${ name }:${ event }`
	const hideEventName = `hide:${ name }:${ event }`
	
	const onClick = (srcEvent: MouseEvent) => {
		events.eventNames.filter(x => x !== showEventName && x.startsWith('show:')).forEach(x => {
			events.emit(`hide:${ x.split(':')[1] }:${ event }`)
		})
		events.emit(showEventName, target)
		const onDocumentClick = () => {
			events.emit(hideEventName)
			document.removeEventListener(event, onDocumentClick)
		}
		document.addEventListener(event, onDocumentClick)
		srcEvent.stopPropagation()
	}
	
	target.addEventListener(event, onClick)
	target.$popoverRemoveClickHandlers = () => {
		target.removeEventListener(event, onClick)
	}
}

const addHoverEventListener = (target: PopoverHTMLElement, name: string) => {
	const event = 'hover'
	const showEventName = `show:${ name }:${ event }`
	const hideEventName = `hide:${ name }:${ event }`
	const onMouseEnter = () => {
		events.eventNames.filter(x => x !== showEventName && x.startsWith('show:')).forEach(x => {
			events.emit(`hide:${ x.split(':')[1] }:${ event }`)
		})
		events.emit(showEventName, target)
	}
	const onMouseLeave = () => events.emit(hideEventName)
	target.addEventListener('mouseenter', onMouseEnter)
	target.addEventListener('mouseleave', onMouseLeave)
	target.$popoverRemoveHoverHandlers = () => {
		target.removeEventListener('mouseenter', onMouseEnter)
		target.removeEventListener('mouseleave', onMouseLeave)
	}
}
export default {
	install(Vue: App) {
		document.addEventListener('resize', () => {
			events.eventNames.filter(x => x.startsWith('hide:')).forEach(k => events.emit(k))
		})
		Vue.component('Popover', Popover)
		Vue.directive('popover', () => {
			return {
				mounted(el: any, binding: any) {
					addClickEventListener(el, binding.arg || '')
					addHoverEventListener(el, binding.arg || '')
				},
				unmounted(el: any) {
					el.$popoverRemoveHoverHandlers()
					el.$popoverRemoveClickHandlers()
				}
			}
		})
	}
}
