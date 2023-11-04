import { createApp } from 'vue'
import './assets/style.css'
import App from './App.vue'
import Popover from './components/popover'
import Tooltip from './components/tooltip'

createApp(App).use(Popover).use(Tooltip).mount('#app')
