<script setup lang='ts'>
import { onMounted, onUnmounted, reactive, computed, useAttrs, nextTick, ref } from 'vue'
import { events } from './event'

const pointerSize = 6
const directions = { left: [-1, 0], right: [1, 0], top: [0, 1], bottom: [0, -1] }

const attrs = useAttrs()
defineOptions({ inheritAttrs: false })
const props = defineProps({
	name: { type: String, required: true },
	width: { type: Number, default: 180 },
	zIndex: { type: Number, default: 999 },
	pointer: { type: Boolean, default: true },
	event: { type: String, default: 'click' },
	showPosition: { type: String, default: 'bottom' },
	offset: { type: Object, default: { top: 0, left: 0 } },
})
const emit = defineEmits(['show', 'hide'])
const dropdown = ref<HTMLElement>()
const state = reactive({
	visible: false,
	positionClass: '',
	fixedParent: false,
	position: { left: '0px', top: '0px' },
})
const showEventName = `show:${ props.name }:${ props.event }`
const hideEventName = `hide:${ props.name }:${ props.event }`

const className = computed(() => ['vue-popover', props.pointer && state.positionClass])
const style = computed(() => {
	const styles: Record<string, any> = {
		width: `${ props.width }px`,
		zIndex: props.zIndex,
		...state.position,
	}
	if (state.fixedParent) {
		styles.position = 'fixed'
	}
	return styles
})

onMounted(() => {
	events.on(showEventName, showEventListener)
	events.on(hideEventName, hideEventListener)
})

onUnmounted(() => {
	events.off(showEventName)
	events.off(hideEventName)
})

function showEventListener(target: HTMLElement) {
	if (state.visible) {
		events.emit(hideEventName)
		return
	}
	state.positionClass = `dropdown-position-${ props.showPosition }`
	state.visible = true
	nextTick().then(() => {
		emit('show')
		let position = getDropdownPosition(target)
		if (props.offset?.left) {
			position.left += props.offset.left
		}
		if (props.offset?.top) {
			position.top += props.offset.top
		}
		state.position = { left: `${ position.left }px`, top: `${ position.top }px` }
	})
}

function hideEventListener() {
	if (state.visible) {
		state.visible = false
		emit('hide')
	}
}

function isFixedPositionParents(startElement: Element): boolean {
	let el = startElement as any
	while (el?.parentNode && el?.parentNode?.tagName !== 'BODY') {
		if (window.getComputedStyle(el).position === 'fixed') {
			return true
		}
		el = el.parentNode
	}
	return false
}

function getDropdownPosition(target: HTMLElement) {
	try {
		const direction = directions[props.showPosition]
		const trRect = target.getBoundingClientRect()
		const ddRect = dropdown.value.getBoundingClientRect()
		state.fixedParent = isFixedPositionParents(target)
		
		let offsetLeft = trRect.left
		let offsetTop = trRect.top
		
		if (state.fixedParent) {
			const scrollTop = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop
			const scrollLeft = window.scrollX || document.documentElement.scrollLeft || document.body.scrollLeft
			offsetLeft = trRect.left + scrollLeft
			offsetTop = trRect.top + scrollTop
		}
		let shiftY = 0.5 * (ddRect.height + trRect.height)
		let centerX = offsetLeft - 0.5 * (ddRect.width - trRect.width)
		let centerY = offsetTop + trRect.height - shiftY
		let x = direction[0] * 0.5 * (ddRect.width + trRect.width)
		let y = direction[1] * shiftY
		if (props.pointer) {
			x += direction[0] * pointerSize
			y += direction[1] * pointerSize
		}
		let left = Math.round(centerX + x)
		if (left < 0) {
			left = 0
		} else if (left + ddRect.width > window.innerWidth) {
			left = window.innerWidth - ddRect.width
		}
		let top = Math.round(centerY - y)
		
		return { left, top }
	} catch {
		return { left: 0, top: 0 }
	}
}

defineExpose({
	hide() {
		hideEventListener()
	},
})
</script>

<template>
	<div v-if='state.visible' :class='className' :style='style' :data-popover='props.name' @click.stop ref='dropdown' v-bind='attrs'>
		<slot />
	</div>
</template>

<style lang='scss'>
$pointer-size: 6px;

.dark .vue-popover {
	--pointer-color: rgb(3 7 18 / 1);
}

.vue-popover {
	--box-shadow-color: rgba(52, 73, 94, 0.1);
	--filter-color: rgba(52, 73, 94, 0.1);
	--pointer-color: #fff;
	display: block;
	position: absolute;
	box-shadow: 0 4px 20px 20px var(--box-shadow-color);
	
	padding: 0;
	
	z-index: 998;
	
	&:before {display: block;position: absolute;width: 0;height: 0;content: "";}
	
	&.dropdown-position-bottom:before {
		border-left: $pointer-size solid transparent;
		border-right: $pointer-size solid transparent;
		border-bottom: $pointer-size solid var(--pointer-color);
		top: -$pointer-size;
		left: calc(50% - #{$pointer-size});
		filter: drop-shadow(0px -2px 2px var(--filter-color));
	}
	
	&.dropdown-position-top:before {
		border-left: $pointer-size solid transparent;
		border-right: $pointer-size solid transparent;
		border-top: $pointer-size solid var(--pointer-color);
		bottom: -$pointer-size;
		left: calc(50% - #{$pointer-size});
		filter: drop-shadow(0px 2px 2px var(--filter-color));
	}
	
	&.dropdown-position-left:before {
		border-top: $pointer-size solid transparent;
		border-bottom: $pointer-size solid transparent;
		border-left: $pointer-size solid var(--pointer-color);
		right: -$pointer-size;
		top: calc(50% - #{$pointer-size});
		filter: drop-shadow(2px 0px 2px var(--filter-color));
	}
	
	&.dropdown-position-right:before {
		border-top: $pointer-size solid transparent;
		border-bottom: $pointer-size solid transparent;
		border-right: $pointer-size solid var(--pointer-color);
		left: -$pointer-size;
		top: calc(50% - #{$pointer-size});
		filter: drop-shadow(-2px 0px 2px var(--filter-color));
	}
}
</style>
