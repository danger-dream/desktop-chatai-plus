import { App, createApp, h, ref, nextTick } from 'vue'
import Tooltip from './Tooltip.vue'

export default {
	install(Vue: App) {
		Vue.directive('tooltip', {
			beforeMount(el, binding) {
				
				const tooltipVisible = ref(false)
				const tooltipMessage = ref(binding.value)
				
				const tooltipInstance = createApp({
					render: () => h(Tooltip, { visible: tooltipVisible.value, message: tooltipMessage.value })
				})
				const tooltip = tooltipInstance.mount(document.createElement('div'))
				el.tooltipComponent = tooltip
				el.tooltipInstance = tooltipInstance
				el.tooltipMessage = tooltipMessage
				
				document.body.appendChild(tooltip.$el)
				
				el.addEventListener('mouseenter', () => {
					tooltipVisible.value = true
					nextTick().then(() => {
						const rect = el.getBoundingClientRect()
						const tooltipRect = tooltip.$el.getBoundingClientRect()
						
						let top = rect.bottom + window.scrollY
						let left = rect.left + window.scrollX
						
						if (left + tooltipRect.width > window.innerWidth) {
							left = window.innerWidth - tooltipRect.width - 10 // 10 是一个小的偏移量以防止紧贴屏幕边缘
						}
						
						tooltip.$el.style.top = `${ top }px`
						tooltip.$el.style.left = `${ left }px`
					})
				})
				
				el.addEventListener('mouseleave', () => {
					tooltipVisible.value = false
				})
			},
			updated(el, binding) {
				if (binding.oldValue !== binding.value) {
					el.tooltipMessage.value = binding.value
				}
			},
			beforeUnmount(el) {
				try {
					el.tooltipComponent.$el.remove()
					el.tooltipInstance.unmount()
				} catch {
				}
			}
		})
	}
}
