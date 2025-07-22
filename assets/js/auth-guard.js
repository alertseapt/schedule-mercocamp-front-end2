// auth-guard.js atualizado conforme documentação da API
class AuthGuard {
  constructor() {
    this.apiBaseUrl = 'https://schedule-mercocamp-back-end.up.railway.app/api'
    this.init()
  }
  init() {
    this.checkAuthentication()
  }
  async checkAuthentication() {
    const token = localStorage.getItem('token')
    if (!token) {
      this.redirectToLogin()
      return
    }
    try {
      const response = await fetch(`${this.apiBaseUrl}/auth/verify`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      if (response.ok) {
        // Token válido
        this.initializeDashboard()
      } else {
        this.handleInvalidToken()
      }
    } catch (error) {
      this.handleInvalidToken()
    }
  }
  handleInvalidToken() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    this.redirectToLogin()
  }
  redirectToLogin() {
    window.location.href = 'login.html'
  }
  initializeDashboard() {
    // Pode adicionar lógica extra aqui se necessário
  }
}
document.addEventListener('DOMContentLoaded', () => {
  new AuthGuard()
})
window.AuthGuard = AuthGuard
