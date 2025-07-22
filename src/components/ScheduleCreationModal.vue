<template>
  <div v-if="showModal" class="modal-overlay" @click="handleModalClick">
    <div class="modal-content large schedule-creation-modal">
      <!-- Header -->
      <div class="modal-header">
        <h3>
          <i class="fas fa-plus-circle"></i>
          Criar Novo Agendamento
        </h3>
        <button class="btn-close" @click="closeModal">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <!-- Progress Steps -->
      <div class="progress-steps">
        <div :class="['step', stepClasses[1]]">
          <div class="step-number">1</div>
          <div class="step-label">Upload XML</div>
        </div>
        <div :class="['step', stepClasses[2]]">
          <div class="step-number">2</div>
          <div class="step-label">Informações</div>
        </div>
        <div :class="['step', stepClasses[3]]">
          <div class="step-number">3</div>
          <div class="step-label">Produtos</div>
        </div>
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

      <!-- Loading -->
      <div v-if="loading" class="loading-container">
        <i class="fas fa-spinner fa-spin"></i>
        <p>Processando...</p>
        <div v-if="uploadProgress > 0" class="progress-bar">
          <div
            class="progress-fill"
            :style="{ width: uploadProgress + '%' }"
          ></div>
        </div>
      </div>

      <!-- Step 1: Upload XML -->
      <div v-if="currentStep === 1 && !loading" class="modal-body">
        <div class="upload-section">
          <div
            class="upload-area"
            @drop="handleDrop"
            @dragover.prevent
            @dragenter.prevent
          >
            <i class="fas fa-upload"></i>
            <h4>Arraste o arquivo XML da NFe aqui</h4>
            <p>ou clique para selecionar</p>
            <input
              type="file"
              accept=".xml"
              @change="handleFileSelect"
              id="xml-file-input"
              style="display: none"
            />
            <label for="xml-file-input" class="btn btn-primary">
              <i class="fas fa-folder-open"></i>
              Selecionar Arquivo
            </label>
          </div>

          <div v-if="selectedFile" class="file-info">
            <i class="fas fa-file-code"></i>
            <span>{{ selectedFile.name }}</span>
            <span class="file-size"
              >({{ (selectedFile.size / 1024).toFixed(1) }} KB)</span
            >
          </div>
        </div>
      </div>

      <!-- Step 2: NFe Information -->
      <div v-if="currentStep === 2 && !loading" class="modal-body">
        <div class="nfe-info">
          <h4>Informações da NFe</h4>
          <div class="info-grid">
            <div class="info-item">
              <label>Número da NFe:</label>
              <span>{{ nfeData.number }}</span>
            </div>
            <div class="info-item">
              <label>Fornecedor:</label>
              <span>{{ nfeData.supplier_name }}</span>
            </div>
            <div class="info-item">
              <label>CNPJ Fornecedor:</label>
              <span>{{ formatCNPJ(nfeData.supplier_cnpj) }}</span>
            </div>
            <div class="info-item">
              <label>Destinatário:</label>
              <span>{{ nfeData.client_name }}</span>
            </div>
            <div class="info-item">
              <label>CNPJ Destinatário:</label>
              <span>{{ formatCNPJ(nfeData.client_cnpj) }}</span>
            </div>
            <div class="info-item">
              <label>Volumes:</label>
              <span>{{ nfeData.case_count }}</span>
            </div>
            <div class="info-item">
              <label>Qtd. Total Produtos:</label>
              <span>{{ totalQuantity }}</span>
            </div>
            <div class="info-item">
              <label>Valor Total:</label>
              <span>{{ formatCurrency(totalValue) }}</span>
            </div>
          </div>

          <!-- Client Selection -->
          <div class="client-selection">
            <h5>Cliente Selecionado</h5>
            <div v-if="isClientAutoSelected" class="selected-client-info">
              <div class="info-item">
                <label>Cliente:</label>
                <span>{{ selectedClient.name }}</span>
              </div>
              <div class="info-item">
                <label>CNPJ:</label>
                <span>{{ formatCNPJ(selectedClient.cnpj) }}</span>
              </div>
              <div v-if="selectedClient.numero" class="info-item">
                <label>Número:</label>
                <span>{{ selectedClient.numero }}</span>
              </div>
              <small class="text-muted"
                >Cliente selecionado automaticamente com base no CNPJ da
                NFe</small
              >
            </div>
            <div v-else>
              <div v-if="selectedClient" class="selected-client-display">
                <div class="client-info">
                  <div class="info-item">
                    <label>Nome:</label>
                    <span>{{ selectedClient.name }}</span>
                  </div>
                  <div class="info-item">
                    <label>CNPJ:</label>
                    <span>{{ formatCNPJ(selectedClient.cnpj) }}</span>
                  </div>
                  <div v-if="selectedClient.numero" class="info-item">
                    <label>Número:</label>
                    <span>{{ selectedClient.numero }}</span>
                  </div>
                </div>
                <button
                  type="button"
                  class="btn btn-outline-primary btn-sm"
                  @click="openClientSelectionModal"
                >
                  <i class="fas fa-edit"></i> Alterar Cliente
                </button>
              </div>
              <div v-else>
                <button
                  type="button"
                  class="btn btn-primary"
                  @click="openClientSelectionModal"
                >
                  <i class="fas fa-users"></i> Selecionar Cliente
                </button>
                <small class="text-muted d-block mt-2"
                  >Clique para escolher o estoque de destino</small
                >
              </div>
            </div>
          </div>

          <!-- Delivery Date Selection -->
          <div class="delivery-date-selection">
            <h5>Data de Entrega Desejada</h5>
            <div class="date-input-container">
              <label for="scheduledDate"
                >Selecione a data para entrega física:</label
              >
              <input
                type="date"
                id="scheduledDate"
                v-model="scheduledDate"
                class="form-control"
                :min="new Date().toISOString().split('T')[0]"
                required
              />
              <small class="help-text"
                >Esta será a data para agendamento da entrega física das
                mercadorias</small
              >
            </div>
          </div>
        </div>
      </div>

      <!-- Step 3: Products -->
      <div v-if="currentStep === 3 && !loading" class="modal-body">
        <div class="products-section">
          <h4>Produtos da NFe</h4>
          <div class="products-table-container">
            <table class="products-table">
              <thead>
                <tr>
                  <th>Cód. Forn.</th>
                  <th>
                    Cód. Venda
                    <i class="fas fa-edit" title="Editável"></i>
                  </th>
                  <th>Descrição Fornecedor</th>
                  <th>
                    Descrição Venda
                    <i class="fas fa-edit" title="Editável"></i>
                  </th>
                  <th>Quant.</th>
                  <th>
                    Fator
                    <i
                      class="fas fa-question-circle"
                      title="Fator de conversão"
                    ></i>
                  </th>
                  <th>Valor Un.</th>
                  <th>Valor Total</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="product in products"
                  :key="product.id || product.supplier_code"
                >
                  <td :title="product.supplier_code">
                    {{ product.supplier_code }}
                  </td>
                  <td>
                    <input
                      v-model="product.client_code"
                      :disabled="product.isLocked"
                      @change="updateProduct(product)"
                      class="form-control form-control-sm"
                    />
                  </td>
                  <td :title="product.supplier_description">
                    {{ product.supplier_description }}
                  </td>
                  <td>
                    <input
                      v-model="product.client_description"
                      :disabled="product.isLocked"
                      @change="updateProduct(product)"
                      class="form-control form-control-sm"
                    />
                  </td>
                  <td>{{ product.quantity }} {{ product.unit }}</td>
                  <td>
                    <input
                      v-model="product.factor"
                      type="number"
                      step="0.01"
                      @change="updateProduct(product)"
                      class="form-control form-control-sm"
                    />
                  </td>
                  <td>{{ formatCurrency(product.unit_value) }}</td>
                  <td>{{ formatCurrency(product.total_value) }}</td>
                  <td>
                    <button
                      v-if="product.isLocked"
                      @click="editProduct(product)"
                      class="btn btn-sm btn-secondary"
                      title="Editar produto"
                    >
                      <i class="fas fa-cog"></i>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="modal-footer">
        <button
          v-if="currentStep > 1"
          @click="previousStep"
          class="btn btn-secondary"
        >
          <i class="fas fa-arrow-left"></i>
          Anterior
        </button>

        <button
          v-if="currentStep < 3"
          @click="nextStep"
          :disabled="
            (currentStep === 1 && !canProceedToStep2) ||
            (currentStep === 2 && !canProceedToStep3)
          "
          class="btn btn-primary"
        >
          Próximo
          <i class="fas fa-arrow-right"></i>
        </button>

        <button
          v-if="currentStep === 3"
          @click="createSchedule"
          :disabled="!canCreateSchedule || loading"
          class="btn btn-success"
        >
          <i class="fas fa-check"></i>
          Efetivar Agendamento
        </button>
      </div>

      <!-- Product Edit Modal -->
      <product-edit-modal
        v-if="showProductEditModal"
        :product="selectedProduct"
        :show-modal="showProductEditModal"
        @close="closeProductEditModal"
        @updated="updateProduct"
      >
      </product-edit-modal>
    </div>
  </div>
</template>

<script>
import ProductEditModal from './ProductEditModal.vue'

export default {
  name: 'ScheduleCreationModal',

  components: {
    ProductEditModal,
  },

  props: {
    showModal: {
      type: Boolean,
      default: false,
    },
  },

  data() {
    return {
      currentStep: 1,
      selectedFile: null,
      nfeData: {},
      products: [],
      loading: false,
      errors: [],
      uploadProgress: 0,
      showProductEditModal: false,
      selectedProduct: null,
      clients: [],
      selectedClient: null,
      showClientSelectionModal: false,
      scheduledDate: '',
    }
  },

  computed: {
    canProceedToStep2() {
      return (
        this.selectedFile &&
        this.nfeData &&
        Object.keys(this.nfeData).length > 0
      )
    },

    canProceedToStep3() {
      return this.nfeData && this.products.length > 0
    },

    canCreateSchedule() {
      return (
        this.products.length > 0 && this.selectedClient && this.scheduledDate
      )
    },

    stepClasses() {
      return {
        1: { active: this.currentStep === 1, completed: this.currentStep > 1 },
        2: { active: this.currentStep === 2, completed: this.currentStep > 2 },
        3: { active: this.currentStep === 3, completed: false },
      }
    },

    totalValue() {
      return this.products.reduce(
        (total, product) => total + (product.total_value || 0),
        0
      )
    },

    totalQuantity() {
      return this.products.reduce(
        (total, product) => total + (product.quantity || 0),
        0
      )
    },

    isClientAutoSelected() {
      const currentUser = this.getCurrentUser()
      return (
        currentUser &&
        currentUser.cli_access &&
        this.nfeData.client_cnpj &&
        currentUser.cli_access[this.nfeData.client_cnpj]
      )
    },

    hasCreatePermission() {
      const currentUser = this.getCurrentUser()
      return (
        currentUser &&
        currentUser.level_access !== undefined &&
        currentUser.level_access >= 0 // Usuários nível 1 PODEM criar
      )
    },

    createButtonText() {
      return 'Efetivar Agendamento'
    },
  },

  methods: {
    closeModal() {
      this.resetModal()
      this.$emit('close')
    },

    resetModal() {
      this.currentStep = 1
      this.selectedFile = null
      this.nfeData = {}
      this.products = []
      this.loading = false
      this.errors = []
      this.uploadProgress = 0
      this.selectedClient = null
      this.scheduledDate = ''
    },

    async handleFileSelect(event) {
      const file = event.target.files[0]
      if (file) {
        this.selectedFile = file
        await this.parseAndExtractXML()
      }
    },

    async handleDrop(event) {
      event.preventDefault()
      const file = event.dataTransfer.files[0]
      if (file && file.name.endsWith('.xml')) {
        this.selectedFile = file
        await this.parseAndExtractXML()
      } else {
        this.showError('Por favor, selecione um arquivo XML válido')
      }
    },

    async parseAndExtractXML() {
      if (!this.selectedFile) return

      this.loading = true
      this.errors = []
      this.uploadProgress = 0

      try {
        const xmlText = await new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = e => resolve(e.target.result)
          reader.onerror = e => reject(e)
          reader.readAsText(this.selectedFile)
        })

        const { nfeData, products } = this.parseNFeXML(xmlText)

        if (nfeData.client_cnpj) {
          await this.validateClientAccess(nfeData.client_cnpj)
        }

        this.nfeData = nfeData
        this.products = products
        this.uploadProgress = 100

        await this.checkExistingProducts()
        await this.loadAvailableClients()

        this.showSuccess('XML processado com sucesso!')
      } catch (error) {
        console.error('Erro ao processar XML:', error)

        if (
          error.message &&
          (error.message.includes('CNPJ do destinatário não encontrado') ||
            error.message.includes('não possui acesso ao cliente') ||
            error.message.includes('não autenticado'))
        ) {
          this.showError(error.message)
        } else {
          this.showError(
            'Erro ao processar arquivo XML: ' +
              (error.message || 'Erro desconhecido')
          )
        }

        this.nfeData = {}
        this.products = []
        this.selectedFile = null
      } finally {
        this.loading = false
      }
    },

    parseNFeXML(xmlText) {
      const parser = new DOMParser()
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml')

      const ide = xmlDoc.querySelector('ide')
      const emit = xmlDoc.querySelector('emit')
      const dest = xmlDoc.querySelector('dest')
      const vol = xmlDoc.querySelector('vol')
      const infNFe = xmlDoc.querySelector('infNFe')

      const nfe_key = infNFe?.getAttribute('Id')?.replace(/^NFe/, '') || ''

      const nfeData = {
        number: ide?.querySelector('nNF')?.textContent || '',
        nfe_key: nfe_key,
        client_cnpj: dest?.querySelector('CNPJ')?.textContent || '',
        client_name: dest?.querySelector('xNome')?.textContent || '',
        supplier_cnpj: emit?.querySelector('CNPJ')?.textContent || '',
        supplier_name: emit?.querySelector('xNome')?.textContent || '',
        case_count: parseInt(vol?.querySelector('qVol')?.textContent || '0'),
        date: ide?.querySelector('dhEmi')?.textContent?.slice(0, 10) || '',
        qt_prod: 0,
        products: [],
      }

      const products = []
      const detList = xmlDoc.querySelectorAll('det')

      detList.forEach(det => {
        const prod = det.querySelector('prod')
        if (prod) {
          products.push({
            item: det.querySelector('nItem')?.textContent || '',
            code: prod.querySelector('cProd')?.textContent || '',
            supplier_code: prod.querySelector('cProd')?.textContent || '',
            description: prod.querySelector('xProd')?.textContent || '',
            supplier_description:
              prod.querySelector('xProd')?.textContent || '',
            ncm: prod.querySelector('NCM')?.textContent || '',
            quantity: parseFloat(
              prod.querySelector('qCom')?.textContent || '0'
            ),
            unit: prod.querySelector('uCom')?.textContent || '',
            unit_value: parseFloat(
              prod.querySelector('vUnCom')?.textContent || '0'
            ),
            total_value: parseFloat(
              prod.querySelector('vProd')?.textContent || '0'
            ),
          })
        }
      })

      nfeData.products = products
      nfeData.qt_prod = products.length

      console.log(
        'JSON resultante do parse do XML NFe:',
        JSON.stringify(nfeData, null, 2)
      )

      return { nfeData, products }
    },

    async uploadAndParseXML() {
      this.showError(
        'O parseamento do XML agora é feito no navegador. Use a nova função de upload.'
      )
    },

    async checkExistingProducts() {
      if (!this.products.length) return

      try {
        const apiClient = new VueApiClient()

        const productChecks = this.products.map(p => ({
          supp_code: p.code,
          supp_cnpj: this.nfeData.supplier_cnpj,
          cli_cnpj: this.nfeData.client_cnpj,
        }))

        const response = await apiClient.request('/products/check-existing', {
          method: 'POST',
          data: { products: productChecks },
        })

        const existingProducts = response.results || []

        this.products.forEach(product => {
          const existing = existingProducts.find(
            ep => ep.supp_code === product.code
          )
          if (existing && existing.exists) {
            product.exists = true
            product.data = existing.data
          } else {
            product.exists = false
            product.factor = 1
          }
        })
      } catch (error) {
        console.error('Erro ao verificar produtos existentes:', error)
      }
    },

    async loadAvailableClients() {
      try {
        const apiClient = new VueApiClient()

        const response = await apiClient.request('/clients', {
          method: 'GET',
        })

        let allClients = response.data || []

        allClients = allClients.filter(client => client.cnpj)

        const currentUser = this.getCurrentUser()
        if (currentUser && currentUser.level_access !== 0) {
          if (currentUser.cli_access) {
            const allowedCNPJs = Object.keys(currentUser.cli_access)
            allClients = allClients.filter(client =>
              allowedCNPJs.includes(client.cnpj)
            )
          } else {
            allClients = []
          }
        }

        this.clients = allClients

        if (this.nfeData.client_cnpj) {
          const normalizedXmlCnpj = this.nfeData.client_cnpj.replace(
            /[^\d]/g,
            ''
          )

          const matchingClient = this.clients.find(client => {
            if (!client.cnpj) {
              return false
            }
            const normalizedClientCnpj = client.cnpj.replace(/[^\d]/g, '')
            return normalizedClientCnpj === normalizedXmlCnpj
          })

          if (matchingClient) {
            this.selectedClient = matchingClient
            console.log(
              'Cliente selecionado automaticamente:',
              matchingClient.name
            )
          } else {
            console.log(
              'Cliente não encontrado na lista para CNPJ:',
              this.nfeData.client_cnpj
            )
          }
        }
      } catch (error) {
        console.error('Erro ao carregar clientes:', error)
      }
    },

    nextStep() {
      if (this.currentStep === 1 && this.canProceedToStep2) {
        this.currentStep = 2
      } else if (this.currentStep === 2 && this.canProceedToStep3) {
        this.currentStep = 3
      }
    },

    previousStep() {
      if (this.currentStep > 1) {
        this.currentStep--
      }
    },

    updateProduct(product) {
      const index = this.products.findIndex(p => p.id === product.id)
      if (index !== -1) {
        this.products[index] = { ...product }
      }
    },

    editProduct(product) {
      this.selectedProduct = product
      this.showProductEditModal = true
    },

    closeProductEditModal() {
      this.showProductEditModal = false
      this.selectedProduct = null
    },

    openClientSelectionModal() {
      this.showClientSelectionModal = true
    },

    closeClientSelectionModal() {
      this.showClientSelectionModal = false
    },

    selectClient(client) {
      this.selectedClient = client
      this.closeClientSelectionModal()
    },

    async createSchedule() {
      if (!this.canCreateSchedule) return

      const currentUser = this.getCurrentUser()
      if (!currentUser) {
        this.showError('Usuário não autenticado. Faça login novamente.')
        return
      }

      if (
        currentUser.level_access === undefined ||
        currentUser.level_access < 0
      ) {
        this.showError(
          'Usuário não autenticado. Faça login novamente.'
        )
        return
      }

      this.loading = true
      this.errors = []

      const token = localStorage.getItem('token')
      if (!token) {
        this.showError(
          'Token de autenticação não encontrado. Faça login novamente.'
        )
        this.loading = false
        return
      }

      if (!this.nfeData.nfe_key) {
        this.showError('Chave da NFe é obrigatória.')
        this.loading = false
        return
      }

      if (!this.nfeData.client_cnpj) {
        this.showError('CNPJ do cliente é obrigatório.')
        this.loading = false
        return
      }

      if (!this.nfeData.date) {
        this.showError('Data da NFe é obrigatória.')
        this.loading = false
        return
      }

      const clientCnpj = this.nfeData.client_cnpj.replace(/[^\d]/g, '')
      if (clientCnpj.length !== 14) {
        this.showError('CNPJ do cliente deve ter exatamente 14 dígitos.')
        this.loading = false
        return
      }

      let supplier =
        this.nfeData.supplier_name || this.nfeData.supplier_cnpj || ''
      if (!supplier) {
        this.showError('Dados do fornecedor são obrigatórios.')
        this.loading = false
        return
      }

      if (supplier.length > 50) {
        supplier = supplier.substring(0, 50)
      }

      const nfeNumber = String(this.nfeData.number || '').trim()
      if (!nfeNumber || !/^\d{1,10}$/.test(nfeNumber)) {
        this.showError(
          'Número da NFe deve conter apenas dígitos e ter no máximo 10 caracteres.'
        )
        this.loading = false
        return
      }

      const formattedDate = this.scheduledDate

      if (!formattedDate) {
        this.showError(
          'Por favor, selecione a data desejada para entrega física.'
        )
        this.loading = false
        return
      }

      if (!/^\d{4}-\d{2}-\d{2}$/.test(formattedDate)) {
        this.showError('Data de entrega deve estar no formato YYYY-MM-DD.')
        this.loading = false
        return
      }

      console.log('Data de agendamento para envio:', formattedDate)

      const scheduleData = {
        number: nfeNumber,
        nfe_key: this.nfeData.nfe_key,
        client: clientCnpj,
        case_count: parseInt(this.nfeData.case_count) || 0,
        date: formattedDate,
        status: 'Solicitado',
        supplier: supplier,
        qt_prod: parseInt(this.nfeData.qt_prod) || this.products.length,
        info: this.nfeData,
      }

      console.log('Enviando dados do agendamento:', scheduleData)
      console.log('Token presente:', !!token)

      try {
        const apiClient = new VueApiClient()

        const response = await apiClient.request('/schedules', {
          method: 'POST',
          data: scheduleData,
        })

        console.log('Agendamento criado com sucesso:', response)
        this.showSuccess('Agendamento criado com sucesso!')
        this.$emit('created', response)

        setTimeout(() => {
          this.closeModal()
        }, 1500)
      } catch (error) {
        console.error('Erro ao criar agendamento:', error)
        console.error('Resposta da API:', error.response?.data)

        if (error.response?.status === 403) {
          this.showError(
            'Acesso negado. Usuário não possui permissão para criar agendamentos.'
          )
        } else if (error.response?.status === 401) {
          this.showError(
            'Token de autenticação inválido. Faça login novamente.'
          )
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          window.location.href = 'login.html'
        } else if (error.response?.status === 400) {
          const errorData = error.response?.data
          let errorMessage =
            errorData?.error || 'Dados inválidos enviados para a API.'

          if (errorData?.details && Array.isArray(errorData.details)) {
            const details = errorData.details
              .map(detail => {
                if (typeof detail === 'string') return detail
                if (detail.message) return detail.message
                if (detail.path)
                  return `Campo ${detail.path}: ${detail.message || 'inválido'}`
                return JSON.stringify(detail)
              })
              .join(', ')
            errorMessage += `. Detalhes: ${details}`
          }

          this.showError('Erro de validação: ' + errorMessage)
          console.error('Dados enviados que causaram erro:', scheduleData)
          console.error('Resposta completa da API:', errorData)
          console.error(
            'Detalhes do erro (expandido):',
            JSON.stringify(errorData.details, null, 2)
          )
        } else {
          this.showError(
            'Erro ao criar agendamento: ' +
              (error.message || 'Erro desconhecido')
          )
        }
      } finally {
        this.loading = false
      }
    },

    getCurrentUser() {
      const userData = localStorage.getItem('user')
      return userData ? JSON.parse(userData) : null
    },

    async validateClientAccess(clientCNPJ) {
      const currentUser = this.getCurrentUser()

      if (!currentUser) {
        throw new Error('Usuário não autenticado')
      }

      if (currentUser.level_access === 0) {
        return true
      }

      if (currentUser.cli_access && currentUser.cli_access[clientCNPJ]) {
        return true
      }

      throw new Error(
        `Usuário ${currentUser.user} não possui acesso ao cliente com CNPJ ${clientCNPJ}`
      )
    },

    showError(message) {
      this.errors.push(message)
    },

    showSuccess(message) {
      console.log('Sucesso:', message)
    },

    removeError(index) {
      this.errors.splice(index, 1)
    },

    formatCurrency(value) {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(value)
    },

    formatCNPJ(cnpj) {
      if (!cnpj) return ''
      return cnpj.replace(
        /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
        '$1.$2.$3/$4-$5'
      )
    },

    handleModalClick(event) {
      event.stopPropagation()
    },
  },
}
</script>
