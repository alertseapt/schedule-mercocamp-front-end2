// login.js atualizado conforme documentação da API
class LoginManager {
  constructor() {
    this.apiBaseUrl = 'https://schedule-mercocamp-back-end.up.railway.app/api'
    this.init()
  }
  init() {
    const form = document.getElementById('login-form')
    if (form) {
      form.addEventListener('submit', e => {
        e.preventDefault()
        this.handleLogin()
      })
    }
  }
  async handleLogin() {
    const username = document.getElementById('username').value
    const password = document.getElementById('password').value
    try {
      const response = await fetch(`${this.apiBaseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: username, password }),
      })
      const data = await response.json()
      if (response.ok) {
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
        window.location.href = 'dashboard.html'
      } else {
        this.showError(data.error || 'Usuário ou senha inválidos')
      }
    } catch (error) {
      this.showError('Erro de conexão. Tente novamente.')
    }
  }
  showError(message) {
    const errorDiv = document.getElementById('login-error')
    if (errorDiv) {
      errorDiv.textContent = message
      errorDiv.style.display = 'block'
    } else {
      alert(message)
    }
  }
}
document.addEventListener('DOMContentLoaded', () => {
  new LoginManager()
})
