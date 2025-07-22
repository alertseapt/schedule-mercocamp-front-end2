<template>
  <div id="app">
    <!-- Loading Screen -->
    <div v-if="loading" class="loading-screen">
      <div class="loading-spinner">
        <i class="fas fa-spinner fa-spin"></i>
        <p>Carregando dashboard...</p>
      </div>
    </div>

    <!-- Main App -->
    <div v-else class="container">
      <!-- Sidebar Component -->
      <SidebarComponent
        :user="user"
        :active-menu="activeMenu"
        @menu-click="handleMenuClick"
        @logout="handleLogout"
      >
      </SidebarComponent>

      <!-- Main Content -->
      <main class="main-content">
        <!-- Dashboard Content -->
        <div v-if="!showSchedulesList" class="content-area">
          <!-- Stats Cards -->
          <StatsCards :stats="dashboardStats" :loading="statsLoading">
          </StatsCards>

          <!-- Recent Activities -->
          <RecentActivities
            :activities="recentActivities"
            :loading="activitiesLoading"
          >
          </RecentActivities>

          <!-- Pending Deliveries Table -->
          <PendingDeliveries
            :deliveries="pendingDeliveries"
            :loading="deliveriesLoading"
            @action="handleDeliveryAction"
          >
          </PendingDeliveries>
        </div>

        <!-- Schedules List -->
        <div v-if="showSchedulesList" class="content-area">
          <SchedulesList @notification="addNotification"> </SchedulesList>
        </div>
      </main>
    </div>

    <!-- Global Notifications -->
    <NotificationsComponent
      :notifications="notifications"
      @close="removeNotification"
    >
    </NotificationsComponent>
  </div>
</template>

<script>
import SidebarComponent from './components/SidebarComponent.vue'
import StatsCards from './components/StatsCards.vue'
import RecentActivities from './components/RecentActivities.vue'
import PendingDeliveries from './components/PendingDeliveries.vue'
import NotificationsComponent from './components/NotificationsComponent.vue'
import SchedulesList from './components/SchedulesList.vue'
import { checkPermission, checkUserLevel } from './utils/permissions.js'
import axios from 'axios'

// Função que inicializa e demonstra o sistema de permissões
function initializePermissions() {
  console.log('=== Sistema de Permissões ===')

  if (checkPermission('create_schedule')) {
    console.log('✅ Usuário pode criar agendamentos')
  } else {
    console.log('❌ Usuário não pode criar agendamentos')
  }

  if (checkPermission('manage_users')) {
    console.log('✅ Usuário pode gerenciar usuários')
  } else {
    console.log('❌ Usuário não pode gerenciar usuários')
  }

  if (checkUserLevel(0)) {
    console.log('✅ Usuário é desenvolvedor - acesso total')
  } else {
    console.log('❌ Usuário não é desenvolvedor')
  }

  if (checkUserLevel(2)) {
    console.log('✅ Usuário tem acesso administrativo')
  } else {
    console.log('❌ Usuário não tem acesso administrativo')
  }
}

// Cliente API para Vue.js
class VueApiClient {
  constructor() {
    this.baseURL = 'https://schedule-mercocamp-back-end.up.railway.app/api'
    this.token = localStorage.getItem('token')
  }

  async request(endpoint, options = {}) {
    const token = localStorage.getItem('token')

    const config = {
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }

    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }

    try {
      const response = await axios({
        ...config,
        url: endpoint,
      })
      return response.data
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        console.log('Token expirado, redirecionando para login')
        window.location.href = '/login.html'
        return
      }
      throw error
    }
  }

  async getDashboardStats() {
    return {
      pendingDeliveries: 7,
      processing: 23,
      completedToday: 156,
      divergences: 2,
    }
  }

  async getRecentActivities() {
    return [
      {
        id: 1,
        type: 'received',
        title: 'Produto Recebido',
        description: 'Smartphone Samsung Galaxy - Código: 4587956321',
        time: '15 minutos atrás',
        status: 'success',
      },
      {
        id: 2,
        type: 'pending',
        title: 'Aguardando Conferência',
        description: 'Lote de Notebooks Dell - Pedido: PED-789654',
        time: '1 hora atrás',
        status: 'warning',
      },
      {
        id: 3,
        type: 'divergence',
        title: 'Divergência Detectada',
        description: 'Diferença na quantidade - Produto: MON-4578123',
        time: '2 horas atrás',
        status: 'danger',
      },
    ]
  }

  async getPendingDeliveries() {
    return [
      {
        id: 1,
        nfe: '35240414200166000182550010000134151123456789',
        supplier: 'TechCorp Ltda',
        volumes: '15 volumes',
        scheduledDate: '14/07/2025',
        warehouse: 'Estoque Principal',
        status: 'scheduled',
      },
      {
        id: 2,
        nfe: '35240414200166000182550010000134152234567890',
        supplier: 'SmartPhone Inc',
        volumes: '8 volumes',
        scheduledDate: '14/07/2025',
        warehouse: 'Estoque Eletrônicos',
        status: 'on_way',
      },
      {
        id: 3,
        nfe: '35240414200166000182550010000134153345678901',
        supplier: 'Office Solutions',
        volumes: '20 volumes',
        scheduledDate: '15/07/2025',
        warehouse: 'Estoque Periféricos',
        status: 'scheduled',
      },
      {
        id: 4,
        nfe: '35240414200166000182550010000134154456789012',
        supplier: 'Industrial Corp',
        volumes: '5 volumes',
        scheduledDate: '15/07/2025',
        warehouse: 'Estoque Industrial',
        status: 'processing',
      },
    ]
  }

  async getSchedules(params = {}) {
    return this.request('/schedules', { params })
  }

  async createSchedule(data) {
    return this.request('/schedules', {
      method: 'POST',
      data,
    })
  }

  async updateScheduleStatus(id, status, comment) {
    return this.request(`/schedules/${id}/status`, {
      method: 'PATCH',
      data: {
        status,
        historic_entry: {
          user: this.getCurrentUser()?.user || 'system',
          action: `Status alterado para ${status}`,
          comment,
        },
      },
    })
  }

  async createScheduleWithProducts(nfe_data) {
    return this.request('/schedules/create-with-products', {
      method: 'POST',
      data: { nfe_data },
    })
  }

  getCurrentUser() {
    const userData = localStorage.getItem('user')
    return userData ? JSON.parse(userData) : null
  }
}

const apiClient = new VueApiClient()

// Disponibilizar globalmente para componentes filhos
window.VueApiClient = VueApiClient
window.apiClient = apiClient

export default {
  name: 'App',
  components: {
    SidebarComponent,
    StatsCards,
    RecentActivities,
    PendingDeliveries,
    NotificationsComponent,
    SchedulesList,
  },

  data() {
    return {
      loading: true,
      user: null,
      activeMenu: 'dashboard',
      showSchedulesList: false,

      dashboardStats: {
        pendingDeliveries: 0,
        processing: 0,
        completedToday: 0,
        divergences: 0,
      },
      statsLoading: false,

      recentActivities: [],
      activitiesLoading: false,

      pendingDeliveries: [],
      deliveriesLoading: false,

      notifications: [],
    }
  },

  async mounted() {
    try {
      await this.checkAuth()
      initializePermissions()
      await this.loadDashboardData()
    } catch (error) {
      console.error('Erro ao inicializar dashboard:', error)
      this.addNotification('Erro ao carregar dados do dashboard', 'error')
    } finally {
      this.loading = false
    }
  },

  methods: {
    async checkAuth() {
      const token = localStorage.getItem('token')
      const userData = localStorage.getItem('user')

      console.log('Verificando autenticação...', {
        token: !!token,
        userData: !!userData,
      })

      if (!token || !userData) {
        console.log(
          'Redirecionando para login - token ou userData não encontrados'
        )
        window.location.href = '/login.html'
        return
      }

      try {
        this.user = JSON.parse(userData)
        console.log('Usuário autenticado:', this.user)
      } catch (error) {
        console.error('Erro ao parsear dados do usuário:', error)
        window.location.href = '/login.html'
      }
    },

    async loadDashboardData() {
      const promises = [
        this.loadStats(),
        this.loadRecentActivities(),
        this.loadPendingDeliveries(),
      ]

      await Promise.all(promises)
    },

    async loadStats() {
      this.statsLoading = true
      try {
        this.dashboardStats = await apiClient.getDashboardStats()
      } catch (error) {
        console.error('Erro ao carregar estatísticas:', error)
        this.addNotification('Erro ao carregar estatísticas', 'error')
      } finally {
        this.statsLoading = false
      }
    },

    async loadRecentActivities() {
      this.activitiesLoading = true
      try {
        this.recentActivities = await apiClient.getRecentActivities()
      } catch (error) {
        console.error('Erro ao carregar atividades:', error)
        this.addNotification('Erro ao carregar atividades recentes', 'error')
      } finally {
        this.activitiesLoading = false
      }
    },

    async loadPendingDeliveries() {
      this.deliveriesLoading = true
      try {
        this.pendingDeliveries = await apiClient.getPendingDeliveries()
      } catch (error) {
        console.error('Erro ao carregar entregas:', error)
        this.addNotification('Erro ao carregar entregas agendadas', 'error')
      } finally {
        this.deliveriesLoading = false
      }
    },

    handleMenuClick(menuId) {
      this.activeMenu = menuId
      console.log('Menu clicado:', menuId)

      this.showSchedulesList = false

      switch (menuId) {
        case 'dashboard':
          this.loadDashboardData()
          break
        case 'agendamento':
          this.showSchedulesList = true
          break
        case 'configuracoes':
          this.showSettingsPage()
          break
        default:
          console.log('Menu não implementado:', menuId)
      }
    },

    showSettingsPage() {
      this.addNotification('Página de configurações em desenvolvimento', 'info')
      console.log('Abrindo página de configurações...')
    },

    handleLogout() {
      const confirmed = confirm('Tem certeza que deseja sair?')
      if (confirmed) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        window.location.href = '/login.html'
      }
    },

    async handleDeliveryAction(action, deliveryId) {
      console.log('Ação na entrega:', action, deliveryId)

      switch (action) {
        case 'start':
          try {
            await apiClient.updateScheduleStatus(
              deliveryId,
              'processing',
              'Recebimento iniciado'
            )
            this.addNotification('Recebimento iniciado', 'success')
            await this.loadPendingDeliveries()
          } catch (error) {
            this.addNotification('Erro ao iniciar recebimento', 'error')
          }
          break
        case 'track':
          this.addNotification('Abrindo rastreamento...', 'info')
          break
        case 'view':
          this.addNotification('Abrindo detalhes...', 'info')
          break
        default:
          this.addNotification('Ação não reconhecida', 'warning')
      }
    },

    addNotification(message, type = 'info') {
      const notification = {
        id: Date.now(),
        message,
        type,
        timestamp: new Date(),
      }

      this.notifications.push(notification)

      setTimeout(() => {
        this.removeNotification(notification.id)
      }, 5000)
    },

    removeNotification(id) {
      const index = this.notifications.findIndex(n => n.id === id)
      if (index > -1) {
        this.notifications.splice(index, 1)
      }
    },

    async refresh() {
      this.loading = true
      try {
        await this.loadDashboardData()
        this.addNotification('Dados atualizados com sucesso', 'success')
      } catch (error) {
        this.addNotification('Erro ao atualizar dados', 'error')
      } finally {
        this.loading = false
      }
    },
  },
}

// Disponibilizar globalmente para compatibilidade
window.apiClient = apiClient
</script>
