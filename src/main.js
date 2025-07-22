import { createApp } from 'vue'
import App from './App.vue'
import axios from 'axios'

// Importar estilos
import './assets/css/main.css'
import './assets/css/vue-components.css'

// Tornar axios disponível globalmente
const app = createApp(App)
app.config.globalProperties.$http = axios

// Configurar axios defaults
axios.defaults.baseURL = 'http://localhost:4000/api'

app.mount('#app')
