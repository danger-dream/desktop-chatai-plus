import { App } from 'vue'
import Popover from './Popover.vue'
import { events } from './event'
import { directive } from './directive'

export default {
	install(Vue: App) {
		document.addEventListener('resize', event => {
			events.eventNames.filter(x => x.startsWith('hide')).forEach(k => events.emit(k, { srcEvent: event }))
		})
		Vue.component('Popover', Popover)
		Vue.directive('popover', directive())
	}
}
