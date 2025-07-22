<template>
  <div class="schedules-list">
    <!-- Header -->
    <div class="page-header">
      <h2>Lista de Agendamentos</h2>
      <button
        v-if="canCreateSchedules"
        class="btn btn-success btn-new-schedule"
        @click="openCreationModal"
      >
        <i class="fas fa-plus"></i> Novo Agendamento
      </button>
    </div>

    <!-- Bulk Actions Bar -->
    <div v-if="canBulkManage" class="bulk-actions-bar">
      <div class="selected-info">
        <span>{{ selectedSchedules.length }} agendamento(s) selecionado(s)</span>
        <button class="btn btn-sm btn-outline-secondary" @click="clearSelection">
          <i class="fas fa-times"></i> Limpar seleção
        </button>
      </div>
      
      <div class="bulk-actions">
        <!-- Actions for Solicitado status -->
        <div v-if="selectedScheduleStatuses[0] === 'Solicitado' && userLevel !== 1" class="action-group">
          <button 
            class="btn btn-sm btn-success" 
            @click="acceptSchedules"
            :disabled="bulkActionLoading"
          >
            <i class="fas fa-check"></i> Aceitar Agendamento
          </button>
          
          <div class="date-change-group">
            <input 
              type="date" 
              v-model="newDate" 
              class="form-control form-control-sm"
              :min="today"
            />
            <button 
              class="btn btn-sm btn-warning" 
              @click="changeDateToContestado"
              :disabled="!newDate || bulkActionLoading"
            >
              <i class="fas fa-calendar-alt"></i> Alterar Data
            </button>
          </div>
        </div>
        
        <!-- Actions for Contestado status -->
        <div v-if="selectedScheduleStatuses[0] === 'Contestado'" class="action-group">
          <!-- For level_access = 1 users -->
          <div v-if="userLevel === 1" class="level-1-actions">
            <button 
              class="btn btn-sm btn-primary" 
              @click="acceptNewDate"
              :disabled="bulkActionLoading"
            >
              <i class="fas fa-check"></i> Aceitar Nova Data
            </button>
            <span class="contact-text">Ou entre em contato com nossa equipe</span>
          </div>
          
          <!-- For non-level 1 users -->
          <div v-else class="non-level-1-actions">
            <button 
              class="btn btn-sm btn-success" 
              @click="confirmContestado"
              :disabled="bulkActionLoading"
            >
              <i class="fas fa-check"></i> Confirmar
            </button>
            
            <div class="date-change-group">
              <input 
                type="date" 
                v-model="newDate" 
                class="form-control form-control-sm"
                :min="today"
              />
              <button 
                class="btn btn-sm btn-primary" 
                @click="changeContestadoToAgendado"
                :disabled="!newDate || bulkActionLoading"
              >
                <i class="fas fa-calendar-alt"></i> Agendar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="table-container">
      <div v-if="loading" class="loading-container">
        <i class="fas fa-spinner fa-spin"></i>
        <p>Carregando agendamentos...</p>
      </div>

      <div v-else-if="schedules.length === 0" class="empty-state">
        <i class="fas fa-inbox"></i>
        <h3>Nenhum agendamento encontrado</h3>
        <p>Não há agendamentos que correspondam aos filtros aplicados.</p>
      </div>

      <table v-else class="schedules-table">
        <thead>
          <tr>
            <th>
              <input
                type="checkbox"
                v-model="selectAll"
                @change="toggleSelectAll"
                :disabled="schedules.length === 0"
              />
            </th>
            <th>N° NF-e</th>
            <th>Cliente</th>
            <th>Data de Entrega</th>
            <th>Volumes</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="schedule in paginatedSchedules" :key="schedule.id">
            <td>
              <input
                type="checkbox"
                :value="schedule.id"
                v-model="selectedSchedules"
                @change="onScheduleSelect"
                :disabled="!canSelectSchedule(schedule)"
              />
            </td>
            <td>{{ schedule.number }}</td>
            <td>{{ schedule.client }}</td>
            <td>{{ formatDate(schedule.date) }}</td>
            <td>{{ schedule.case_count }}</td>
            <td>
              <span
                :class="'status-badge ' + getStatusBadge(schedule.status).class"
                class="status-badge"
              >
                {{ getStatusBadge(schedule.status).label }}
              </span>
            </td>
            <td>
              <button
                class="btn btn-sm btn-outline-primary"
                @click="openInfoModal(schedule)"
                title="Mais informações"
              >
                <i class="fas fa-info-circle"></i>
                Detalhes
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="pagination">
        <button
          class="btn btn-sm btn-outline-secondary"
          :disabled="pagination.page === 1"
          @click="changePage(pagination.page - 1)"
        >
          <i class="fas fa-chevron-left"></i>
        </button>

        <span class="page-info">
          Página {{ pagination.page }} de {{ totalPages }}
        </span>

        <button
          class="btn btn-sm btn-outline-secondary"
          :disabled="pagination.page === totalPages"
          @click="changePage(pagination.page + 1)"
        >
          <i class="fas fa-chevron-right"></i>
        </button>
      </div>
    </div>

    <!-- Modals -->
    <nfe-info-modal
      v-if="showInfoModal"
      :nfe-data="selectedSchedule"
      :show-modal="showInfoModal"
      @close="closeInfoModal"
      @edit="openEditModal"
    >
    </nfe-info-modal>

    <schedule-creation-modal
      v-if="showCreationModal"
      :show-modal="showCreationModal"
      @close="closeCreationModal"
      @created="loadSchedules"
    >
    </schedule-creation-modal>

    <schedule-edit-modal
      v-if="showEditModal"
      :schedule-data="scheduleToEdit"
      :show-modal="showEditModal"
      @close="closeEditModal"
      @updated="handleScheduleUpdated"
      @notification="$emit('notification', $event)"
    >
    </schedule-edit-modal>
  </div>
</template>

<script>
import NfeInfoModal from './NfeInfoModal.vue'
import ScheduleCreationModal from './ScheduleCreationModal.vue'
import ScheduleEditModal from './ScheduleEditModal.vue'

export default {
  name: 'SchedulesList',

  components: {
    NfeInfoModal,
    ScheduleCreationModal,
    ScheduleEditModal,
  },

  data() {
    return {
      schedules: [],
      loading: false,
      selectedSchedule: null,
      selectedSchedules: [],
      selectAll: false,
      newDate: '',
      bulkActionLoading: false,
      showInfoModal: false,
      showCreationModal: false,
      showEditModal: false,
      scheduleToEdit: null,
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
      },
    }
  },

  computed: {
    paginatedSchedules() {
      // Backend já retorna dados paginados, não precisa paginar novamente
      return this.schedules
    },

    totalPages() {
      return this.pagination.pages || 1
    },

    canCreateSchedules() {
      try {
        const userData = localStorage.getItem('user')
        if (!userData) return false

        const user = JSON.parse(userData)
        // Usuários nível 1 PODEM criar agendamentos
        return user.level_access !== undefined && user.level_access >= 0
      } catch (error) {
        console.error('Erro ao verificar permissões de criação:', error)
        return false
      }
    },

    statusConfig() {
      return {
        Solicitado: { class: 'warning', label: 'Solicitado' },
        Contestado: { class: 'contestado', label: 'Contestado' },
        Agendado: { class: 'primary', label: 'Agendado' },
        Recebido: { class: 'success', label: 'Recebido' },
        Tratativa: { class: 'danger', label: 'Tratativa' },
        Estoque: { class: 'success', label: 'Estoque' },
        Recusar: { class: 'danger', label: 'Recusar' },
        Recusado: { class: 'dark', label: 'Recusado' },
        Cancelado: { class: 'secondary', label: 'Cancelado' },
      }
    },

    selectedScheduleStatuses() {
      const selected = this.schedules.filter(s => this.selectedSchedules.includes(s.id))
      return [...new Set(selected.map(s => s.status))]
    },

    canBulkManage() {
      return this.selectedSchedules.length > 0 && this.selectedScheduleStatuses.length === 1
    },

    userLevel() {
      try {
        const userData = localStorage.getItem('user')
        if (!userData) return null
        const user = JSON.parse(userData)
        return user.level_access
      } catch (error) {
        console.error('Erro ao obter nível do usuário:', error)
        return null
      }
    },

    today() {
      return new Date().toISOString().split('T')[0]
    },
  },

  methods: {
    async loadSchedules() {
      this.loading = true
      this.clearSelection() // Clear selection when reloading
      try {
        const apiClient = new VueApiClient()
        console.log('Fazendo requisição para /schedules')
        console.log('Token presente:', !!localStorage.getItem('token'))

        const response = await apiClient.request('/schedules', {
          method: 'GET',
          params: {
            page: this.pagination.page,
            limit: this.pagination.limit,
          },
        })

        console.log('Resposta recebida:', response)
        this.schedules = response.schedules || []
        this.pagination.total =
          response.pagination?.total || this.schedules.length
        this.pagination.pages =
          response.pagination?.pages ||
          Math.ceil(this.schedules.length / this.pagination.limit)
      } catch (error) {
        console.error('Erro ao carregar agendamentos:', error)
        console.error('URL da requisição:', error.config?.url)
        console.error('Status do erro:', error.response?.status)
        console.error('Dados do erro:', error.response?.data)
        console.error('Headers da requisição:', error.config?.headers)

        // Verificar se é erro de autenticação
        if (error.response?.status === 401 || error.response?.status === 403) {
          this.$emit('notification', {
            type: 'error',
            message: 'Erro de autenticação. Por favor, faça login novamente.',
          })
          // Redirecionar para login se necessário
          localStorage.removeItem('token')
          window.location.href = '/index.html'
          return
        }

        // Verificar se é erro de servidor
        if (error.response?.status === 500) {
          this.$emit('notification', {
            type: 'error',
            message:
              'Erro interno do servidor. Verifique se o backend está funcionando corretamente.',
          })
        } else {
          this.$emit('notification', {
            type: 'error',
            message: `Erro ao carregar agendamentos: ${error.response?.status || 'Erro desconhecido'}`,
          })
        }

        this.schedules = []
      } finally {
        this.loading = false
      }
    },

    openInfoModal(schedule) {
      console.log('📋 Abrindo modal NFe:', schedule)
      this.selectedSchedule = schedule
      this.showInfoModal = true
      console.log('📋 Modal state:', {
        showInfoModal: this.showInfoModal,
        selectedSchedule: this.selectedSchedule,
      })
    },

    closeInfoModal() {
      this.showInfoModal = false
      this.selectedSchedule = null
    },

    openCreationModal() {
      this.showCreationModal = true
    },

    closeCreationModal() {
      this.showCreationModal = false
    },

    openEditModal(schedule) {
      console.log('🔧 Abrindo modal de edição:', schedule)
      this.scheduleToEdit = schedule
      this.showEditModal = true
      // Fechar o modal de informações NFe se estiver aberto
      this.showInfoModal = false
    },

    closeEditModal() {
      this.showEditModal = false
      this.scheduleToEdit = null
    },

    handleScheduleUpdated(updatedSchedule) {
      console.log('✅ Agendamento atualizado:', updatedSchedule)
      // Recarregar a lista para mostrar as alterações
      this.loadSchedules()
      this.closeEditModal()
    },

    changePage(page) {
      if (page >= 1 && page <= this.totalPages) {
        this.pagination.page = page
        this.loadSchedules() // Recarregar dados com a nova página
      }
    },

    getStatusBadge(status) {
      return (
        this.statusConfig[status] || {
          class: 'secondary',
          label: 'Desconhecido',
        }
      )
    },

    formatDate(dateString) {
      if (!dateString) return '-'
      const date = new Date(dateString)
      return date.toLocaleDateString('pt-BR')
    },

    formatCurrency(value) {
      if (!value) return 'R$ 0,00'
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(value)
    },

    toggleSelectAll() {
      if (this.selectAll) {
        this.selectedSchedules = this.paginatedSchedules
          .filter(schedule => this.canSelectSchedule(schedule))
          .map(schedule => schedule.id)
      } else {
        this.selectedSchedules = []
      }
    },

    onScheduleSelect() {
      // Verificar se todos os agendamentos selecionáveis estão selecionados
      const selectableSchedules = this.paginatedSchedules.filter(schedule => 
        this.canSelectSchedule(schedule)
      )
      this.selectAll = selectableSchedules.length > 0 && 
        selectableSchedules.every(schedule => this.selectedSchedules.includes(schedule.id))
      
      // Verificar se os agendamentos selecionados têm o mesmo status
      const selectedStatuses = this.selectedScheduleStatuses
      if (selectedStatuses.length > 1) {
        // Se tiver status diferentes, manter apenas o último selecionado
        const lastSelected = this.selectedSchedules[this.selectedSchedules.length - 1]
        const lastSelectedSchedule = this.schedules.find(s => s.id === lastSelected)
        if (lastSelectedSchedule) {
          this.selectedSchedules = this.selectedSchedules.filter(id => {
            const schedule = this.schedules.find(s => s.id === id)
            return schedule && schedule.status === lastSelectedSchedule.status
          })
        }
      }
    },

    canSelectSchedule(schedule) {
      // Verificar se pode selecionar baseado no status e permissões do usuário
      const allowedStatuses = ['Solicitado', 'Contestado']
      if (!allowedStatuses.includes(schedule.status)) return false

      // Se já tem agendamentos selecionados, só pode selecionar do mesmo status
      if (this.selectedSchedules.length > 0) {
        const selectedStatuses = this.selectedScheduleStatuses
        if (selectedStatuses.length === 1 && !selectedStatuses.includes(schedule.status)) {
          return false
        }
      }

      return true
    },

    clearSelection() {
      this.selectedSchedules = []
      this.selectAll = false
      this.newDate = ''
    },

    async acceptSchedules() {
      if (this.selectedSchedules.length === 0) return

      this.bulkActionLoading = true
      try {
        await this.bulkUpdateStatus('Agendado', 'Agendamento aceito')
        this.$emit('notification', {
          type: 'success',
          message: `${this.selectedSchedules.length} agendamento(s) aceito(s) com sucesso`
        })
        this.clearSelection()
        await this.loadSchedules()
      } catch (error) {
        console.error('Erro ao aceitar agendamentos:', error)
        this.$emit('notification', {
          type: 'error',
          message: 'Erro ao aceitar agendamentos'
        })
      } finally {
        this.bulkActionLoading = false
      }
    },

    async changeDateToContestado() {
      if (this.selectedSchedules.length === 0 || !this.newDate) return

      this.bulkActionLoading = true
      try {
        await this.bulkUpdateStatusWithDate('Contestado', this.newDate, 'Data contestada e alterada')
        this.$emit('notification', {
          type: 'success',
          message: `Data alterada para ${this.selectedSchedules.length} agendamento(s)`
        })
        this.clearSelection()
        await this.loadSchedules()
      } catch (error) {
        console.error('Erro ao alterar data:', error)
        this.$emit('notification', {
          type: 'error',
          message: 'Erro ao alterar data dos agendamentos'
        })
      } finally {
        this.bulkActionLoading = false
      }
    },

    async acceptNewDate() {
      if (this.selectedSchedules.length === 0) return

      this.bulkActionLoading = true
      try {
        await this.bulkUpdateStatus('Agendado', 'Nova data aceita')
        this.$emit('notification', {
          type: 'success',
          message: `Nova data aceita para ${this.selectedSchedules.length} agendamento(s)`
        })
        this.clearSelection()
        await this.loadSchedules()
      } catch (error) {
        console.error('Erro ao aceitar nova data:', error)
        this.$emit('notification', {
          type: 'error',
          message: 'Erro ao aceitar nova data'
        })
      } finally {
        this.bulkActionLoading = false
      }
    },

    async confirmContestado() {
      if (this.selectedSchedules.length === 0) return

      this.bulkActionLoading = true
      try {
        await this.bulkUpdateStatus('Agendado', 'Data contestada confirmada')
        this.$emit('notification', {
          type: 'success',
          message: `${this.selectedSchedules.length} agendamento(s) confirmado(s)`
        })
        this.clearSelection()
        await this.loadSchedules()
      } catch (error) {
        console.error('Erro ao confirmar agendamentos:', error)
        this.$emit('notification', {
          type: 'error',
          message: 'Erro ao confirmar agendamentos'
        })
      } finally {
        this.bulkActionLoading = false
      }
    },

    async changeContestadoToAgendado() {
      if (this.selectedSchedules.length === 0 || !this.newDate) return

      this.bulkActionLoading = true
      try {
        await this.bulkUpdateStatusWithDate('Agendado', this.newDate, 'Data contestada reagendada')
        this.$emit('notification', {
          type: 'success',
          message: `${this.selectedSchedules.length} agendamento(s) reagendado(s)`
        })
        this.clearSelection()
        await this.loadSchedules()
      } catch (error) {
        console.error('Erro ao reagendar:', error)
        this.$emit('notification', {
          type: 'error',
          message: 'Erro ao reagendar agendamentos'
        })
      } finally {
        this.bulkActionLoading = false
      }
    },

    async bulkUpdateStatus(newStatus, comment) {
      const apiClient = new VueApiClient()
      
      for (const scheduleId of this.selectedSchedules) {
        const payload = {
          status: newStatus,
          historic_entry: {
            user: this.getCurrentUser(),
            action: `Status alterado para ${newStatus}`,
            comment: comment
          }
        }
        
        console.log('📤 Enviando payload para status update:', payload)
        console.log('📍 URL:', `/schedules/${scheduleId}/status`)
        
        await apiClient.request(`/schedules/${scheduleId}/status`, {
          method: 'PATCH',
          data: payload
        })
      }
    },

    async bulkUpdateStatusWithDate(newStatus, newDate, comment) {
      const apiClient = new VueApiClient()
      
      // Garantir que a data seja formatada corretamente
      const formattedDate = this.formatDateForBackend(newDate)
      console.log(`📤 Data escolhida: ${newDate}`)
      console.log(`📤 Data formatada para backend: ${formattedDate}`)
      
      for (const scheduleId of this.selectedSchedules) {
        console.log(`📤 Atualizando agendamento ${scheduleId} com nova data ${formattedDate} e status ${newStatus}`)
        
        // Buscar o agendamento atual para ter todos os dados
        const scheduleResponse = await apiClient.request(`/schedules/${scheduleId}`, {
          method: 'GET'
        })
        
        const currentSchedule = scheduleResponse.schedule
        
        // Atualizar com todos os campos necessários incluindo a nova data
        const updatePayload = {
          number: currentSchedule.number,
          nfe_key: currentSchedule.nfe_key,
          client: currentSchedule.client_cnpj || currentSchedule.client,
          case_count: currentSchedule.case_count,
          date: formattedDate,
          qt_prod: currentSchedule.qt_prod,
          historic: {
            ...currentSchedule.historic,
            [`date_change_${Date.now()}`]: {
              timestamp: new Date().toISOString(),
              user: this.getCurrentUser(),
              action: `Data alterada de ${currentSchedule.date} para ${formattedDate}`,
              comment: 'Data alterada via bulk action',
              previous_date: currentSchedule.date,
              new_date: formattedDate
            }
          }
        }
        
        console.log('📤 Payload para atualização:', updatePayload)
        
        // Primeiro atualiza a data e dados
        await apiClient.request(`/schedules/${scheduleId}`, {
          method: 'PUT',
          data: updatePayload
        })
        
        // Depois atualiza o status
        const statusPayload = {
          status: newStatus,
          historic_entry: {
            user: this.getCurrentUser(),
            action: `Status alterado para ${newStatus} com nova data ${formattedDate}`,
            comment: comment
          }
        }
        
        console.log('📤 Payload para status:', statusPayload)
        
        await apiClient.request(`/schedules/${scheduleId}/status`, {
          method: 'PATCH',
          data: statusPayload
        })
      }
    },

    getCurrentUser() {
      try {
        const userData = localStorage.getItem('user')
        if (!userData) return 'Usuário desconhecido'
        const user = JSON.parse(userData)
        return user.user || 'Usuário desconhecido'
      } catch (error) {
        return 'Usuário desconhecido'
      }
    },

    // Função para garantir que a data seja processada corretamente sem problemas de timezone
    formatDateForBackend(dateString) {
      if (!dateString) return null
      
      // Se já está no formato YYYY-MM-DD, manter como está
      if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        console.log('📅 Data original:', dateString)
        return dateString
      }
      
      // Se for um objeto Date, formatar corretamente
      const date = new Date(dateString)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      
      const formattedDate = `${year}-${month}-${day}`
      console.log('📅 Data formatada:', formattedDate)
      return formattedDate
    },
  },

  mounted() {
    this.loadSchedules()
  },
}
</script>

<style scoped>
.bulk-actions-bar {
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 0.375rem;
  padding: 1rem;
  margin-bottom: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.selected-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  color: #495057;
}

.bulk-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.action-group {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.date-change-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.date-change-group input[type="date"] {
  width: 150px;
}

.level-1-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.non-level-1-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.contact-text {
  color: #6c757d;
  font-style: italic;
  font-size: 0.875rem;
}

/* Status badge personalizado para Contestado */
.status-badge.contestado {
  background-color: #8B1538 !important; /* Cor vinho */
  color: white !important;
  border-color: #8B1538 !important;
}

/* Checkboxes maiores */
.schedules-table input[type="checkbox"] {
  transform: scale(1.3);
  margin: 0;
  cursor: pointer;
}

@media (max-width: 768px) {
  .bulk-actions-bar {
    flex-direction: column;
    align-items: stretch;
  }
  
  .bulk-actions {
    justify-content: center;
  }
  
  .action-group {
    justify-content: center;
  }
}
</style>
