<template>
  <div v-if="showModal" class="modal-overlay" @click="handleModalClick">
    <div
      class="modal-content large schedule-edit-modal"
      ref="modal"
      tabindex="-1"
    >
      <!-- Header -->
      <div class="modal-header">
        <h3>
          <i class="fas fa-edit"></i>
          Editar Agendamento
        </h3>
        <button class="btn-close" @click="closeModal">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <!-- Errors -->
      <div v-if="errors.length > 0" class="error-container">
        <div
          v-for="(error, index) in errors"
          :key="index"
          class="error-message"
        >
          <i class="fas fa-exclamation-triangle"></i>
          {{ error }}
          <button @click="removeError(index)" class="btn-close-error">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>

      <!-- Form -->
      <div class="modal-body">
        <form @submit.prevent="updateSchedule" class="edit-form">
          <!-- Informações Básicas -->
          <div class="form-section">
            <h4><i class="fas fa-info-circle"></i> Informações Básicas</h4>
            <div class="form-row">
              <div class="form-group">
                <label for="nfe_number">Número da NF-e</label>
                <input
                  id="nfe_number"
                  v-model="formData.number"
                  type="text"
                  class="form-control"
                  readonly
                />
              </div>
              <div class="form-group">
                <label for="nfe_key">Chave da NF-e</label>
                <input
                  id="nfe_key"
                  v-model="formData.nfe_key"
                  type="text"
                  class="form-control"
                  readonly
                />
              </div>
            </div>
          </div>

          <!-- Status e Data -->
          <div class="form-section">
            <h4><i class="fas fa-calendar-check"></i> Agendamento</h4>
            <div class="form-row">
              <div class="form-group">
                <label for="status">Status</label>
                <select
                  id="status"
                  v-model="formData.status"
                  class="form-control"
                  required
                >
                  <option value="">Selecione um status</option>
                  <option value="Solicitado">Solicitado</option>
                  <option value="Agendado">Agendado</option>
                  <option value="Recebido">Recebido</option>
                  <option value="Tratativa">Tratativa</option>
                  <option value="Estoque">Estoque</option>
                  <option value="Recusar">Recusar</option>
                  <option value="Recusado">Recusado</option>
                  <option value="Cancelado">Cancelado</option>
                </select>
              </div>
              <div class="form-group">
                <label for="delivery_date">Data de Entrega</label>
                <input
                  id="delivery_date"
                  v-model="formData.date"
                  type="datetime-local"
                  class="form-control"
                  required
                />
              </div>
            </div>
          </div>

          <!-- Cliente -->
          <div class="form-section">
            <h4><i class="fas fa-building"></i> Cliente</h4>
            <div class="form-row">
              <div class="form-group">
                <label for="client">Cliente</label>
                <input
                  id="client"
                  v-model="formData.client"
                  type="text"
                  class="form-control"
                  required
                />
              </div>
              <div class="form-group">
                <label for="case_count">Quantidade de Volumes</label>
                <input
                  id="case_count"
                  v-model="formData.case_count"
                  type="number"
                  class="form-control"
                  min="1"
                  required
                />
              </div>
            </div>
          </div>

          <!-- Observações -->
          <div class="form-section">
            <h4><i class="fas fa-sticky-note"></i> Observações</h4>
            <div class="form-group">
              <label for="observations">Observações Adicionais</label>
              <textarea
                id="observations"
                v-model="formData.observations"
                class="form-control"
                rows="3"
                placeholder="Digite observações sobre este agendamento..."
              ></textarea>
            </div>
          </div>
        </form>
      </div>

      <!-- Footer -->
      <div class="modal-footer">
        <button
          type="button"
          @click="closeModal"
          class="btn btn-secondary"
          :disabled="loading"
        >
          Cancelar
        </button>
        <button
          type="button"
          @click="updateSchedule"
          :disabled="loading || !isFormValid"
          class="btn btn-primary"
        >
          <i v-if="loading" class="fas fa-spinner fa-spin"></i>
          <i v-else class="fas fa-save"></i>
          {{ loading ? 'Salvando...' : 'Salvar Alterações' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ScheduleEditModal',

  props: {
    scheduleData: {
      type: Object,
      default: () => ({}),
    },
    showModal: {
      type: Boolean,
      default: false,
    },
  },

  data() {
    return {
      formData: {
        id: null,
        number: '',
        nfe_key: '',
        status: '',
        date: '',
        client: '',
        case_count: 1,
        observations: '',
      },
      loading: false,
      errors: [],
    }
  },

  computed: {
    isFormValid() {
      return (
        this.formData.status &&
        this.formData.date &&
        this.formData.client &&
        this.formData.case_count > 0
      )
    },
  },

  watch: {
    scheduleData: {
      handler(newData) {
        if (newData && Object.keys(newData).length > 0) {
          this.populateForm(newData)
        }
      },
      immediate: true,
    },

    showModal(newVal) {
      if (newVal && this.scheduleData) {
        this.populateForm(this.scheduleData)
      }
    },
  },

  methods: {
    closeModal() {
      this.$emit('close')
      this.resetForm()
    },

    populateForm(data) {
      console.log('📝 Populando formulário com:', data)

      this.formData = {
        id: data.id,
        number: data.number || data.nfe_number || '',
        nfe_key: data.nfe_key || '',
        status: data.status || '',
        date: this.formatDateForInput(data.date),
        client: data.client || data.client_name || '',
        case_count: data.case_count || data.volumes || 1,
        observations: data.observations || '',
      }
    },

    formatDateForInput(dateString) {
      if (!dateString) return ''

      try {
        const date = new Date(dateString)
        // Formato para input datetime-local: YYYY-MM-DDTHH:MM
        return date.toISOString().slice(0, 16)
      } catch (error) {
        console.error('Erro ao formatar data:', error)
        return ''
      }
    },

    async updateSchedule() {
      if (!this.isFormValid) {
        this.addError('Por favor, preencha todos os campos obrigatórios.')
        return
      }

      this.loading = true
      this.errors = []

      try {
        const apiClient = new VueApiClient()

        // Preparar dados para envio
        const updateData = {
          status: this.formData.status,
          date: this.formData.date,
          client: this.formData.client,
          case_count: parseInt(this.formData.case_count),
          observations: this.formData.observations || null,
        }

        console.log('📤 Enviando dados de atualização:', updateData)

        const response = await apiClient.request(
          `/schedules/${this.formData.id}`,
          {
            method: 'PATCH',
            data: updateData,
          }
        )

        console.log('✅ Agendamento atualizado com sucesso:', response)

        // Emitir evento de sucesso
        this.$emit('updated', response)

        // Fechar modal
        this.closeModal()

        // Notificar sucesso
        this.$emit('notification', {
          type: 'success',
          message: 'Agendamento atualizado com sucesso!',
        })
      } catch (error) {
        console.error('❌ Erro ao atualizar agendamento:', error)

        let errorMessage = 'Erro ao atualizar o agendamento.'

        if (error.response?.data?.message) {
          errorMessage = error.response.data.message
        } else if (error.response?.data?.error) {
          errorMessage = error.response.data.error
        } else if (error.message) {
          errorMessage = error.message
        }

        this.addError(errorMessage)
      } finally {
        this.loading = false
      }
    },

    resetForm() {
      this.formData = {
        id: null,
        number: '',
        nfe_key: '',
        status: '',
        date: '',
        client: '',
        case_count: 1,
        observations: '',
      }
      this.errors = []
    },

    addError(message) {
      if (!this.errors.includes(message)) {
        this.errors.push(message)
      }
    },

    removeError(index) {
      this.errors.splice(index, 1)
    },

    handleModalClick(event) {
      if (event.target.classList.contains('modal-overlay')) {
        this.closeModal()
      }
    },
  },

  mounted() {
    console.log('ScheduleEditModal montado com scheduleData:', this.scheduleData)
    this.$nextTick(() => {
      const modal = this.$refs.modal
      if (modal) {
        modal.focus()
      }
    })
  },
}
</script>

<style scoped>
.schedule-edit-modal {
  max-width: 800px;
}

.form-section {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #007bff;
}

.form-section h4 {
  color: #007bff;
  margin-bottom: 1rem;
  font-size: 1.1rem;
  font-weight: 600;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #495057;
}

.form-control {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 0.95rem;
  transition:
    border-color 0.15s ease-in-out,
    box-shadow 0.15s ease-in-out;
}

.form-control:focus {
  outline: 0;
  border-color: #80bdff;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.form-control:read-only {
  background-color: #e9ecef;
  opacity: 1;
}

.form-control textarea {
  resize: vertical;
  min-height: 80px;
}

.error-container {
  margin-bottom: 1rem;
}

.error-message {
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  margin-bottom: 0.5rem;
  color: #721c24;
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
}

.error-message i {
  margin-right: 0.5rem;
  color: #dc3545;
}

.btn-close-error {
  background: none;
  border: none;
  color: #721c24;
  margin-left: auto;
  cursor: pointer;
  padding: 0.25rem;
}

.btn-close-error:hover {
  color: #dc3545;
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }

  .schedule-edit-modal {
    max-width: 95vw;
    margin: 1rem;
  }
}
</style>
