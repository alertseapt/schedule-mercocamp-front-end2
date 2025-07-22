<template>
  <div v-if="showModal" class="modal-overlay" @click="handleModalClick">
    <div class="modal-content nfe-info-modal large" ref="modal" tabindex="-1">
      <!-- Header -->
      <div class="modal-header">
        <h3>
          <i class="fas fa-file-invoice"></i>
          Informações da NF-e
        </h3>
        <button class="btn-close" @click="closeModal">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <!-- Tabs -->
      <div class="modal-tabs">
        <button
          v-for="(section, key) in formattedNfeData"
          :key="key"
          :class="['tab-button', { active: activeTab === key }]"
          @click="setActiveTab(key)"
        >
          <i :class="section.icon"></i>
          {{ section.title }}
        </button>
      </div>

      <!-- Content -->
      <div class="modal-body">
        <!-- General Tab -->
        <div v-if="activeTab === 'general'" class="tab-content">
          <div class="info-grid">
            <div
              v-for="(value, key) in formattedNfeData.general.data"
              :key="key"
              class="info-item"
            >
              <label>{{ key }}:</label>
              <span :class="key === 'Chave da NF-e' ? 'nfe-key' : ''">{{
                value || '-'
              }}</span>
            </div>
          </div>
        </div>

        <!-- Products Tab -->
        <div v-if="activeTab === 'products'" class="tab-content">
          <div
            v-if="formattedNfeData.products.data.length > 0"
            class="products-table-container"
          >
            <table class="products-table">
              <thead>
                <tr>
                  <th>Cód. Fornecedor</th>
                  <th>Descrição Fornecedor</th>
                  <th>Cód. Venda</th>
                  <th>Descrição Venda</th>
                  <th>Quantidade</th>
                  <th>Valor Unit.</th>
                  <th>Valor Total</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="product in formattedNfeData.products.data"
                  :key="product.id"
                >
                  <td>{{ product.supplier_code || '-' }}</td>
                  <td>{{ product.supplier_description || '-' }}</td>
                  <td>{{ product.code || '-' }}</td>
                  <td>{{ product.description || '-' }}</td>
                  <td>{{ product.quantity }} {{ product.unit }}</td>
                  <td>{{ formatCurrency(product.unit_value) }}</td>
                  <td>{{ formatCurrency(product.total_value) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else class="empty-state">
            <i class="fas fa-box-open"></i>
            <p>Nenhum produto encontrado</p>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="modal-footer" style="justify-content: flex-end;">
        <div class="footer-info" style="margin-left: auto;">
          <small class="text-muted">
            <i class="fas fa-info-circle"></i>
            Última atualização:
            {{ formatDate(getLastUpdateFromHistoric().timestamp) }} por
            {{ getLastUpdateFromHistoric().user }}
          </small>
        </div>
      </div>

      <!-- Copy Success Toast -->
      <div v-if="copySuccess" class="copy-toast">
        <i class="fas fa-check"></i>
        Copiado para área de transferência!
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'NfeInfoModal',

  props: {
    nfeData: {
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
      activeTab: 'general',
      expandedSections: {},
      copySuccess: false,
    }
  },

  computed: {
    formattedNfeData() {
      if (!this.nfeData) return {}

      return {
        general: {
          title: 'Informações Gerais',
          icon: 'fas fa-file-alt',
          data: {
            'Número da NF-e': this.nfeData.nfe_number || this.nfeData.number,
            'Chave da NF-e': this.nfeData.nfe_key,
            Status: this.nfeData.status,
            'Data de Entrega': this.formatDate(this.nfeData.date),
            Fornecedor: this.getSupplierInfo(),
            Destinatário: this.getClientInfo(),
            Estoque: this.getStockInfo(),
            Volumes: this.getVolumeCount(),
            'Qtd. Produtos': this.nfeData.qt_prod,
            'Valor Total': this.getTotalValue(),
          },
        },
        products: {
          title: 'Produtos',
          icon: 'fas fa-boxes',
          data: this.getProducts(),
        },
      }
    },

    statusBadgeClass() {
      const statusMap = {
        Solicitado: 'warning',
        Agendado: 'info',
        Recebido: 'success',
        Tratativa: 'danger',
        Estoque: 'success',
        Recusar: 'danger',
        Recusado: 'dark',
        Cancelado: 'secondary',
      }
      return statusMap[this.nfeData.status] || 'secondary'
    },

    canEditSchedule() {
      try {
        const userData = localStorage.getItem('user')
        if (!userData) return false
        
        const user = JSON.parse(userData)
        // Apenas usuários com level_access diferente de 1 podem editar
        return user.level_access !== undefined && user.level_access !== 1
      } catch (error) {
        console.error('Erro ao verificar permissões de edição:', error)
        return false
      }
    },
  },

  methods: {
    closeModal() {
      this.$emit('close')
    },

    openEditModal() {
      console.log('🔧 Abrindo modal de edição para:', this.nfeData)
      this.$emit('edit', this.nfeData)
    },

    setActiveTab(tab) {
      this.activeTab = tab
    },

    toggleSection(section) {
      this.expandedSections[section] = !this.expandedSections[section]
    },

    formatDate(dateString) {
      if (!dateString) return '-'
      const date = new Date(dateString)
      return date.toLocaleDateString('pt-BR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    },

    formatCurrency(value) {
      if (!value) return 'R$ 0,00'
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(value)
    },

    getVolumeCount() {
      if (this.nfeData.info && this.nfeData.info.case_count) {
        return this.nfeData.info.case_count
      }

      if (this.nfeData.case_count) {
        return this.nfeData.case_count
      }

      if (this.nfeData.volumes) {
        return this.nfeData.volumes
      }

      return '-'
    },

    getTotalValue() {
      if (
        this.nfeData.total_value !== undefined &&
        this.nfeData.total_value !== null &&
        this.nfeData.total_value > 0
      ) {
        return this.formatCurrency(this.nfeData.total_value)
      }

      return '-'
    },

    getProducts() {
      if (
        this.nfeData.info &&
        this.nfeData.info.products &&
        Array.isArray(this.nfeData.info.products)
      ) {
        return this.nfeData.info.products
      }

      if (this.nfeData.products && Array.isArray(this.nfeData.products)) {
        return this.nfeData.products
      }

      return []
    },

    getSupplierInfo() {
      if (this.nfeData.info) {
        const supplierName = this.nfeData.info.supplier_name || ''
        const supplierCnpj = this.nfeData.info.supplier_cnpj || ''

        if (supplierName && supplierCnpj) {
          return `${supplierName} - CNPJ: ${supplierCnpj}`
        } else if (supplierName) {
          return supplierName
        } else if (supplierCnpj) {
          return `CNPJ: ${supplierCnpj}`
        }
      }

      return this.nfeData.supplier_name || this.nfeData.supplier || '-'
    },

    getClientInfo() {
      if (this.nfeData.info) {
        const clientName = this.nfeData.info.client_name || ''
        const clientCnpj = this.nfeData.info.client_cnpj || ''

        if (clientName && clientCnpj) {
          return `${clientName} - CNPJ: ${clientCnpj}`
        } else if (clientName) {
          return clientName
        } else if (clientCnpj) {
          return `CNPJ: ${clientCnpj}`
        }
      }

      return this.nfeData.client_name || this.nfeData.client || '-'
    },

    getStockInfo() {
      if (this.nfeData.client_info) {
        const stockName = this.nfeData.client_info.name
        const stockNumber = this.nfeData.client_info.number
        const stockCnpj = this.nfeData.client_cnpj || this.nfeData.client

        let stockInfo = ''

        if (stockName && stockName !== `Cliente ${stockCnpj}`) {
          stockInfo += stockName
        }

        if (stockNumber && stockNumber !== stockCnpj) {
          if (stockInfo) stockInfo += ' '
          stockInfo += `(Nº ${stockNumber})`
        }

        if (stockCnpj) {
          if (stockInfo) stockInfo += ' - '
          stockInfo += `CNPJ: ${stockCnpj}`
        }

        return stockInfo || '-'
      }

      const stockCnpj = this.nfeData.client_cnpj || this.nfeData.client
      return stockCnpj ? `CNPJ: ${stockCnpj}` : '-'
    },

    getLastUpdateFromHistoric() {
      if (this.nfeData.historic && typeof this.nfeData.historic === 'object') {
        let latestTimestamp = null
        let latestEntry = null

        Object.values(this.nfeData.historic).forEach(entry => {
          if (entry && entry.timestamp) {
            const entryTimestamp = new Date(entry.timestamp)
            if (!latestTimestamp || entryTimestamp > latestTimestamp) {
              latestTimestamp = entryTimestamp
              latestEntry = entry
            }
          }
        })

        if (latestEntry) {
          return {
            timestamp: latestTimestamp.toISOString(),
            user: latestEntry.user || 'Sistema',
          }
        }
      }

      return {
        timestamp: this.nfeData.updated_at || this.nfeData.created_at,
        user: 'Sistema',
      }
    },

    async copyToClipboard(text) {
      try {
        await navigator.clipboard.writeText(text)
        this.copySuccess = true
        setTimeout(() => {
          this.copySuccess = false
        }, 2000)
      } catch (error) {
        console.error('Erro ao copiar para área de transferência:', error)
      }
    },

    copySection(sectionData) {
      const text = JSON.stringify(sectionData, null, 2)
      this.copyToClipboard(text)
    },

    copyFullData() {
      const text = JSON.stringify(this.nfeData, null, 2)
      this.copyToClipboard(text)
    },

    formatJsonData(data, level = 0) {
      if (typeof data !== 'object' || data === null) {
        return data
      }

      const indent = '  '.repeat(level)
      const nextIndent = '  '.repeat(level + 1)

      if (Array.isArray(data)) {
        if (data.length === 0) return '[]'

        let result = '[\n'
        data.forEach((item, index) => {
          result += nextIndent + this.formatJsonData(item, level + 1)
          if (index < data.length - 1) result += ','
          result += '\n'
        })
        result += indent + ']'
        return result
      } else {
        const keys = Object.keys(data)
        if (keys.length === 0) return '{}'

        let result = '{\n'
        keys.forEach((key, index) => {
          result +=
            nextIndent +
            `"${key}": ${this.formatJsonData(data[key], level + 1)}`
          if (index < keys.length - 1) result += ','
          result += '\n'
        })
        result += indent + '}'
        return result
      }
    },

    handleModalClick(event) {
      if (event.target.classList.contains('modal-overlay')) {
        this.closeModal()
      }
    },
  },

  mounted() {
    console.log('🔍 NfeInfoModal montado:', { showModal: this.showModal, nfeData: this.nfeData });
    this.$nextTick(() => {
      const modal = this.$refs.modal
      if (modal) {
        modal.focus()
      }
    })
  },

  watch: {
    showModal(newVal) {
      console.log('🔍 showModal changed:', newVal);
    },
    nfeData(newVal) {
      console.log('🔍 nfeData changed:', newVal);
    }
  },
}
</script>
