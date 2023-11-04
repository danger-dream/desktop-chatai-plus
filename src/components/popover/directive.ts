import { events } from './event'

interface PopoverHTMLElement extends HTMLElement {
	$popoverRemoveClickHandlers(): void;
	
	$popoverRemoveHoverHandlers(): void;
}

const addClickEventListener = (target: PopoverHTMLElement, name: string) => {
	const event = 'click'
	const showEventName = `show:${ name }:${ event }`
	const hideEventName = `hide:${ name }:${ event }`
	
	const onClick = (srcEvent: MouseEvent) => {
		events.emit(showEventName, target)
		events.eventNames.filter(x => x !== showEventName && x.startsWith('show:')).forEach(x => {
			events.emit(`hide:${ x.split(':')[1] }:${ event }`)
		})
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
		events.emit(showEventName, target)
		events.eventNames.filter(x => x !== showEventName && x.startsWith('show:')).forEach(x => {
			events.emit(`hide:${ x.split(':')[1] }:${ event }`)
		})
	}
	const onMouseLeave = (srcEvent: MouseEvent) => {
		events.emit(hideEventName, { name, target, srcEvent })
	}
	target.addEventListener('mouseenter', onMouseEnter)
	target.addEventListener('mouseleave', onMouseLeave)
	target.$popoverRemoveHoverHandlers = () => {
		target.removeEventListener('mouseenter', onMouseEnter)
		target.removeEventListener('mouseleave', onMouseLeave)
	}
}

export const directive = () => {
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
}
