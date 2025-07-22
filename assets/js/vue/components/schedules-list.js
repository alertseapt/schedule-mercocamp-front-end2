// Schedules List Component
const SchedulesList = {
    data() {
        return {
            schedules: [],
            loading: false,
            selectedSchedule: null,
            showInfoModal: false,
            showCreationModal: false,
            filters: {
                status: '',
                client: '',
                date_from: '',
                date_to: '',
                nfe_number: ''
            },
            pagination: {
                page: 1,
                limit: 10,
                total: 0
            },
            statusOptions: [
                { value: '', label: 'Todos os Status' },
                { value: 'Solicitado', label: 'Solicitado' },
                { value: 'Agendado', label: 'Agendado' },
                { value: 'Recebido', label: 'Recebido' },
                { value: 'Tratativa', label: 'Tratativa' },
                { value: 'Estoque', label: 'Estoque' },
                { value: 'Recusar', label: 'Recusar' },
                { value: 'Recusado', label: 'Recusado' },
                { value: 'Cancelado', label: 'Cancelado' }
            ]
        };
    },
    
    computed: {
        paginatedSchedules() {
            // Backend já retorna dados paginados, não precisa paginar novamente
            return this.schedules;
        },
        
        totalPages() {
            return this.pagination.pages || 1;
        },
        
        statusConfig() {
            return {
                'Solicitado': { class: 'warning', label: 'Solicitado' },
                'Agendado': { class: 'info', label: 'Agendado' },
                'Recebido': { class: 'success', label: 'Recebido' },
                'Tratativa': { class: 'danger', label: 'Tratativa' },
                'Estoque': { class: 'success', label: 'Estoque' },
                'Recusar': { class: 'danger', label: 'Recusar' },
                'Recusado': { class: 'dark', label: 'Recusado' },
                'Cancelado': { class: 'secondary', label: 'Cancelado' }
            };
        }
    },
    
    methods: {
        async loadSchedules() {
            this.loading = true;
            try {
                const apiClient = new VueApiClient();
                console.log('Fazendo requisição para /schedules com filtros:', this.filters);
                console.log('Token presente:', !!localStorage.getItem('token'));
                
                const response = await apiClient.request('/schedules', {
                    method: 'GET',
                    params: {
                        ...this.filters,
                        page: this.pagination.page,
                        limit: this.pagination.limit
                    }
                });
                
                console.log('Resposta recebida:', response);
                this.schedules = response.schedules || [];
                this.pagination.total = response.pagination?.total || this.schedules.length;
                this.pagination.pages = response.pagination?.pages || Math.ceil(this.schedules.length / this.pagination.limit);
            } catch (error) {
                console.error('Erro ao carregar agendamentos:', error);
                console.error('URL da requisição:', error.config?.url);
                console.error('Status do erro:', error.response?.status);
                console.error('Dados do erro:', error.response?.data);
                console.error('Headers da requisição:', error.config?.headers);
                
                // Verificar se é erro de autenticação
                if (error.response?.status === 401 || error.response?.status === 403) {
                    this.$emit('notification', {
                        type: 'error',
                        message: 'Erro de autenticação. Por favor, faça login novamente.'
                    });
                    // Redirecionar para login se necessário
                    localStorage.removeItem('token');
                    window.location.href = '/index.html';
                    return;
                }
                
                // Verificar se é erro de servidor
                if (error.response?.status === 500) {
                    this.$emit('notification', {
                        type: 'error',
                        message: 'Erro interno do servidor. Verifique se o backend está funcionando corretamente.'
                    });
                } else {
                    this.$emit('notification', {
                        type: 'error',
                        message: `Erro ao carregar agendamentos: ${error.response?.status || 'Erro desconhecido'}`
                    });
                }
                
                this.schedules = [];
            } finally {
                this.loading = false;
            }
        },
        
        openInfoModal(schedule) {
            this.selectedSchedule = schedule;
            this.showInfoModal = true;
        },
        
        closeInfoModal() {
            this.showInfoModal = false;
            this.selectedSchedule = null;
        },
        
        openCreationModal() {
            this.showCreationModal = true;
        },
        
        closeCreationModal() {
            this.showCreationModal = false;
        },
        
        applyFilters() {
            this.pagination.page = 1;
            this.loadSchedules();
        },
        
        resetFilters() {
            this.filters = {
                status: '',
                client: '',
                date_from: '',
                date_to: '',
                nfe_number: ''
            };
            this.pagination.page = 1;
            this.loadSchedules();
        },
        
        changePage(page) {
            if (page >= 1 && page <= this.totalPages) {
                this.pagination.page = page;
                this.loadSchedules(); // Recarregar dados com a nova página
            }
        },
        
        getStatusBadge(status) {
            return this.statusConfig[status] || { class: 'secondary', label: 'Desconhecido' };
        },
        
        formatDate(dateString) {
            if (!dateString) return '-';
            const date = new Date(dateString);
            return date.toLocaleDateString('pt-BR');
        },
        
        formatCurrency(value) {
            if (!value) return 'R$ 0,00';
            return new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
            }).format(value);
        }
    },
    
    mounted() {
        this.loadSchedules();
    },
    
    template: `
        <div class="schedules-list">
            <!-- Header -->
            <div class="page-header">
                <h2>Lista de Agendamentos</h2>
                <button class="btn btn-success btn-new-schedule" @click="openCreationModal">
                    <i class="fas fa-plus"></i> Novo Agendamento
                </button>
            </div>
            
            <!-- Filters -->
            <schedule-filters 
                :filters="filters"
                :status-options="statusOptions"
                @filters-changed="applyFilters"
                @reset-filters="resetFilters">
            </schedule-filters>
            
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
                            <th>N° NF-e</th>
                            <th>Cliente</th>
                            <th>Data de Entrega</th>
                            <th>Volumes</th>
                            <th>Status</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="schedule in paginatedSchedules" :key="schedule.id">
                            <td>{{ schedule.number }}</td>
                            <td>{{ schedule.client }}</td>
                            <td>{{ formatDate(schedule.date) }}</td>
                            <td>{{ schedule.case_count }}</td>
                            <td>
                                <span 
                                    :class="'status-badge ' + getStatusBadge(schedule.status).class"
                                    class="status-badge">
                                    {{ getStatusBadge(schedule.status).label }}
                                </span>
                            </td>
                            <td>
                                <button 
                                    class="btn btn-sm btn-outline-primary"
                                    @click="openInfoModal(schedule)"
                                    title="Mais informações">
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
                        @click="changePage(pagination.page - 1)">
                        <i class="fas fa-chevron-left"></i>
                    </button>
                    
                    <span class="page-info">
                        Página {{ pagination.page }} de {{ totalPages }}
                    </span>
                    
                    <button 
                        class="btn btn-sm btn-outline-secondary"
                        :disabled="pagination.page === totalPages"
                        @click="changePage(pagination.page + 1)">
                        <i class="fas fa-chevron-right"></i>
                    </button>
                </div>
            </div>
            
            <!-- Modals -->
            <nfe-info-modal 
                v-if="showInfoModal"
                :nfe-data="selectedSchedule"
                :show-modal="showInfoModal"
                @close="closeInfoModal">
            </nfe-info-modal>
            
            <schedule-creation-modal 
                v-if="showCreationModal"
                :show-modal="showCreationModal"
                @close="closeCreationModal"
                @created="loadSchedules">
            </schedule-creation-modal>
        </div>
    `
}; 