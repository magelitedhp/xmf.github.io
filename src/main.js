import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import router from './router'
import App from './App.vue'
import svgIcon from '@c/SvgIcon/index.vue'


const pinia = createPinia()
const app = createApp(App)

app.use(router)
app.use(pinia)
app.component("svg-icon", svgIcon)
app.mount('#app')
