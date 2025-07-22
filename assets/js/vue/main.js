// main.js atualizado conforme documentação da API
const { createApp } = Vue

class VueApiClient {
  constructor() {
    this.baseURL = 'https://schedule-mercocamp-back-end.up.railway.app/api'
    this.token = localStorage.getItem('token')
  }

  async request(endpoint, options = {}) {
    const token = localStorage.getItem('token')
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    const url = `${this.baseURL}${endpoint}`
    const response = await fetch(url, config)
    if (response.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = 'login.html'
      return
    }
    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.error || 'Erro na requisição')
    }
    return data
  }

  async login(user, password) {
    const response = await fetch(`${this.baseURL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user, password }),
    })
    const data = await response.json()
    if (response.ok) {
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      return data
    } else {
      throw new Error(data.error)
    }
  }

  async getUsers(params = {}) {
    return this.request(
      `/users?page=${params.page || 1}&limit=${params.limit || 10}&search=${params.search || ''}`
    )
  }

  async getProducts(params = {}) {
    return this.request(
      `/products?page=${params.page || 1}&limit=${params.limit || 10}&cli_cnpj=${params.cli_cnpj || ''}&supp_cnpj=${params.supp_cnpj || ''}&user_filter=${params.user_filter || ''}&search=${params.search || ''}`
    )
  }

  async getSchedules(params = {}) {
    return this.request(
      `/schedules?page=${params.page || 1}&limit=${params.limit || 10}&client=${params.client || ''}&status=${params.status || ''}&date_from=${params.date_from || ''}&date_to=${params.date_to || ''}&nfe_key=${params.nfe_key || ''}&number=${params.number || ''}`
    )
  }

  async createSchedule(scheduleData) {
    return this.request('/schedules', {
      method: 'POST',
      body: JSON.stringify(scheduleData),
    })
  }

  async updateScheduleStatus(scheduleId, status, comment) {
    return this.request(`/schedules/${scheduleId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({
        status,
        historic_entry: {
          user: this.getCurrentUser()?.user,
          action: `Status alterado para ${status}`,
          comment,
        },
      }),
    })
  }

  async createScheduleWithProducts(nfe_data) {
    return this.request('/schedules/create-with-products', {
      method: 'POST',
      body: JSON.stringify({ nfe_data }),
    })
  }

  getCurrentUser() {
    const userData = localStorage.getItem('user')
    return userData ? JSON.parse(userData) : null
  }
}

const apiClient = new VueApiClient()

const app = createApp({
  data() {
    return {
      loading: true,
      user: null,
      schedules: [],
      users: [],
      products: [],
      error: null,
    }
  },
  async mounted() {
    try {
      await this.checkAuth()
      await this.loadSchedules()
    } catch (error) {
      this.error = error.message
    } finally {
      this.loading = false
    }
  },
  methods: {
    async checkAuth() {
      const token = localStorage.getItem('token')
      const userData = localStorage.getItem('user')
      if (!token || !userData) {
        window.location.href = 'login.html'
        return
      }
      this.user = JSON.parse(userData)
    },
    async loadSchedules() {
      try {
        const data = await apiClient.getSchedules()
        this.schedules = data.schedules || []
      } catch (error) {
        this.error = error.message
      }
    },
    async loadUsers() {
      try {
        const data = await apiClient.getUsers()
        this.users = data.users || []
      } catch (error) {
        this.error = error.message
      }
    },
    async loadProducts() {
      try {
        const data = await apiClient.getProducts()
        this.products = data.products || []
      } catch (error) {
        this.error = error.message
      }
    },
    async createSchedule(scheduleData) {
      try {
        await apiClient.createSchedule(scheduleData)
        await this.loadSchedules()
      } catch (error) {
        this.error = error.message
      }
    },
    async updateScheduleStatus(scheduleId, status, comment) {
      try {
        await apiClient.updateScheduleStatus(scheduleId, status, comment)
        await this.loadSchedules()
      } catch (error) {
        this.error = error.message
      }
    },
    async createScheduleWithProducts(nfe_data) {
      try {
        await apiClient.createScheduleWithProducts(nfe_data)
        await this.loadSchedules()
      } catch (error) {
        this.error = error.message
      }
    },
    logout() {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = 'login.html'
    },
  },
})

window.VueApp = app
window.apiClient = apiClient
