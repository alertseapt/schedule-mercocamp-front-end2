<template>
  <div class="schedule-filters">
    <!-- Filter Header -->
    <div class="filter-header">
      <div class="filter-title">
        <h4>
          <i class="fas fa-filter"></i>
          Filtros
          <span v-if="filterCount > 0" class="filter-count">
            ({{ filterCount }})
          </span>
        </h4>
      </div>

      <div class="filter-actions">
        <button
          class="btn btn-sm btn-outline-secondary"
          @click="toggleExpanded"
          :title="expanded ? 'Recolher filtros' : 'Expandir filtros'"
        >
          <i
            :class="expanded ? 'fas fa-chevron-up' : 'fas fa-chevron-down'"
          ></i>
        </button>

        <button
          v-if="hasActiveFilters"
          class="btn btn-sm btn-outline-danger"
          @click="resetFilters"
          title="Limpar filtros"
        >
          <i class="fas fa-times"></i>
          Limpar
        </button>
      </div>
    </div>

    <!-- Filter Content -->
    <div v-show="expanded" class="filter-content">
      <!-- First Row -->
      <div class="filter-row">
        <div class="filter-group">
          <label for="nfe-number">№ NF-e:</label>
          <input
            id="nfe-number"
            type="text"
            v-model="localFilters.nfe_number"
            @input="handleInputChange"
            placeholder="Digite o número da NF-e"
            class="form-control"
          />
        </div>

        <div class="filter-group">
          <label for="status">Status:</label>
          <select
            id="status"
            v-model="localFilters.status"
            @change="handleSelectChange"
            class="form-control"
          >
            <option
              v-for="option in statusOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </option>
          </select>
        </div>

        <div class="filter-group">
          <label for="client">Cliente:</label>
          <input
            id="client"
            type="text"
            v-model="localFilters.client"
            @input="handleInputChange"
            placeholder="Nome do cliente"
            class="form-control"
          />
        </div>
      </div>

      <!-- Second Row -->
      <div class="filter-row">
        <div class="filter-group">
          <label for="date-from">Data de:</label>
          <input
            id="date-from"
            type="date"
            v-model="localFilters.date_from"
            @change="handleSelectChange"
            class="form-control"
          />
        </div>

        <div class="filter-group">
          <label for="date-to">Data até:</label>
          <input
            id="date-to"
            type="date"
            v-model="localFilters.date_to"
            @change="handleSelectChange"
            class="form-control"
          />
        </div>

        <div class="filter-group filter-actions-buttons">
          <button
            class="btn btn-primary"
            @click="applyFilters"
            title="Aplicar filtros"
          >
            <i class="fas fa-search"></i>
            Filtrar
          </button>

          <button
            class="btn btn-secondary"
            @click="saveFilters"
            title="Salvar filtros"
          >
            <i class="fas fa-save"></i>
            Salvar
          </button>
        </div>
      </div>

      <!-- Quick Filters -->
      <div class="quick-filters">
        <span class="quick-filter-label">Filtros rápidos:</span>
        <button class="btn btn-sm btn-outline-info" @click="filterSolicitado">
          Solicitados
        </button>
        <button class="btn btn-sm btn-outline-primary" @click="filterAgendado">
          Agendados
        </button>
        <button class="btn btn-sm btn-outline-success" @click="filterRecebido">
          Recebidos
        </button>
        <button class="btn btn-sm btn-outline-warning" @click="filterToday">
          Hoje
        </button>
        <button
          class="btn btn-sm btn-outline-secondary"
          @click="filterLastWeek"
        >
          Última semana
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ScheduleFilters',

  props: {
    filters: {
      type: Object,
      required: true,
    },
    statusOptions: {
      type: Array,
      default: () => [],
    },
  },

  data() {
    return {
      localFilters: { ...this.filters },
      expanded: false,
    }
  },

  watch: {
    filters: {
      handler(newFilters) {
        this.localFilters = { ...newFilters }
      },
      deep: true,
    },
  },

  computed: {
    hasActiveFilters() {
      return Object.values(this.localFilters).some(
        value => value && value.toString().trim() !== ''
      )
    },

    filterCount() {
      return Object.values(this.localFilters).filter(
        value => value && value.toString().trim() !== ''
      ).length
    },
  },

  methods: {
    applyFilters() {
      this.$emit('filters-changed', { ...this.localFilters })
    },

    resetFilters() {
      this.localFilters = {
        status: '',
        client: '',
        date_from: '',
        date_to: '',
        nfe_number: '',
      }
      this.$emit('reset-filters')
    },

    toggleExpanded() {
      this.expanded = !this.expanded
    },

    handleInputChange() {
      clearTimeout(this.debounceTimer)
      this.debounceTimer = setTimeout(() => {
        this.applyFilters()
      }, 500)
    },

    handleSelectChange() {
      this.applyFilters()
    },

    formatDate(dateString) {
      if (!dateString) return ''
      const date = new Date(dateString)
      return date.toISOString().split('T')[0]
    },

    saveFilters() {
      localStorage.setItem('scheduleFilters', JSON.stringify(this.localFilters))
    },

    loadSavedFilters() {
      const saved = localStorage.getItem('scheduleFilters')
      if (saved) {
        try {
          this.localFilters = { ...this.localFilters, ...JSON.parse(saved) }
        } catch (error) {
          console.error('Erro ao carregar filtros salvos:', error)
        }
      }
    },

    filterToday() {
      this.localFilters.date_from = new Date().toISOString().split('T')[0]
      this.handleSelectChange()
    },

    filterLastWeek() {
      const lastWeek = new Date()
      lastWeek.setDate(lastWeek.getDate() - 7)
      this.localFilters.date_from = lastWeek.toISOString().split('T')[0]
      this.handleSelectChange()
    },

    filterSolicitado() {
      this.localFilters.status = 'Solicitado'
      this.handleSelectChange()
    },

    filterAgendado() {
      this.localFilters.status = 'Agendado'
      this.handleSelectChange()
    },

    filterRecebido() {
      this.localFilters.status = 'Recebido'
      this.handleSelectChange()
    },
  },

  mounted() {
    this.loadSavedFilters()
  },

  beforeUnmount() {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
    }
  },
}
</script>
