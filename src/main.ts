import { createApp } from 'vue'
import './assets/style.css'
import App from './App.vue'
import Tooltip from './components/tooltip'

createApp(App).use(Tooltip).mount('#app')
