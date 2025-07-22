/**
 * ========================================
 * SISTEMA DE AGENDAMENTO VIA NFE - FRONT-END
 * ========================================
 * 
 * Este arquivo contém a aplicação principal Vue.js que gerencia:
 * - Sistema de autenticação e permissões
 * - Cliente API para comunicação com o backend
 * - Dashboard principal com estatísticas e atividades
 * - Gerenciamento de estado global da aplicação
 * 
 * @author Sistema de Agendamento
 * @version 1.0.0
 */

// Importação do Vue.js 3 usando destructuring
const { createApp } = Vue;

/**
 * ========================================
 * SISTEMA DE PERMISSÕES
 * ========================================
 * 
 * Função que inicializa e demonstra o sistema de permissões.
 * Verifica diferentes níveis de acesso do usuário e exibe
 * no console para debug e desenvolvimento.
 */
function initializePermissions() {
    // Exemplos de verificação de permissão
    console.log('=== Sistema de Permissões ===');
    
    // Verificar se usuário pode criar agendamentos
    // Esta permissão é essencial para o funcionamento do sistema
    if (checkPermission('create_schedule')) {
        console.log('✅ Usuário pode criar agendamentos');
    } else {
        console.log('❌ Usuário não pode criar agendamentos');
    }
    
    // Verificar se usuário pode gerenciar usuários
    // Permissão administrativa para gestão de usuários
    if (checkPermission('manage_users')) {
        console.log('✅ Usuário pode gerenciar usuários');
    } else {
        console.log('❌ Usuário não pode gerenciar usuários');
    }
    
    // Verificar se usuário é desenvolvedor (nível 0)
    // Nível mais alto de acesso - acesso total ao sistema
    if (checkUserLevel(0)) {
        console.log('✅ Usuário é desenvolvedor - acesso total');
    } else {
        console.log('❌ Usuário não é desenvolvedor');
    }
    
    // Verificar se usuário tem nível administrativo
    // Nível 2 ou superior - acesso administrativo
    if (checkUserLevel(2)) {
        console.log('✅ Usuário tem acesso administrativo');
    } else {
        console.log('❌ Usuário não tem acesso administrativo');
    }
}

/**
 * ========================================
 * CLIENTE API PARA VUE.JS
 * ========================================
 * 
 * Classe responsável por gerenciar todas as comunicações
 * com o backend através de requisições HTTP autenticadas.
 * 
 * Funcionalidades principais:
 * - Autenticação automática via JWT
 * - Tratamento de erros de autenticação
 * - Métodos específicos para cada endpoint
 * - Gerenciamento de tokens e sessão
 */
class VueApiClient {
    /**
     * Construtor da classe
     * Inicializa a URL base da API e recupera o token armazenado
     */
    constructor() {
        // URL base da API - deve corresponder ao backend
        this.baseURL = 'https://schedule-mercocamp-back-end.up.railway.app/api';
        // Recupera token JWT do localStorage
        this.token = localStorage.getItem('token');
    }

    /**
     * Método genérico para fazer requisições HTTP
     * 
     * @param {string} endpoint - Endpoint da API (ex: '/schedules')
     * @param {object} options - Opções da requisição (method, data, headers, etc.)
     * @returns {Promise<object>} - Resposta da API
     */
    async request(endpoint, options = {}) {
        // Recupera token atualizado do localStorage
        const token = localStorage.getItem('token');
        
        // Configuração padrão da requisição
        const config = {
            baseURL: this.baseURL,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        // Adiciona token de autorização se disponível
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }


        try {
            // Faz a requisição usando axios
            const response = await axios({
                ...config,
                url: endpoint
            });
            return response.data;
        } catch (error) {
            // Tratamento específico para erro 401 (não autorizado)
            if (error.response?.status === 401) {
                // Token expirado - limpa dados e redireciona para login
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = 'login.html';
                return;
            }
            // Re-lança outros erros para tratamento específico
            throw error;
        }
    }

    /**
     * ========================================
     * MÉTODOS ESPECÍFICOS DA API
     * ========================================
     */

    /**
     * Obtém estatísticas do dashboard
     * Retorna dados simulados para demonstração
     * 
     * @returns {Promise<object>} - Estatísticas do dashboard
     */
    async getDashboardStats() {
        // Simular dados de estatísticas (você pode substituir por endpoint real)
        return {
            pendingDeliveries: 7,    // Entregas pendentes
            processing: 23,          // Em processamento
            completedToday: 156,     // Concluídas hoje
            divergences: 2           // Divergências detectadas
        };
    }

    /**
     * Obtém atividades recentes do sistema
     * Retorna lista de atividades para o dashboard
     * 
     * @returns {Promise<Array>} - Lista de atividades recentes
     */
    async getRecentActivities() {
        return [
            {
                id: 1,
                type: 'received',           // Tipo: produto recebido
                title: 'Produto Recebido',
                description: 'Smartphone Samsung Galaxy - Código: 4587956321',
                time: '15 minutos atrás',
                status: 'success'           // Status visual: sucesso
            },
            {
                id: 2,
                type: 'pending',            // Tipo: aguardando conferência
                title: 'Aguardando Conferência',
                description: 'Lote de Notebooks Dell - Pedido: PED-789654',
                time: '1 hora atrás',
                status: 'warning'           // Status visual: atenção
            },
            {
                id: 3,
                type: 'divergence',         // Tipo: divergência detectada
                title: 'Divergência Detectada',
                description: 'Diferença na quantidade - Produto: MON-4578123',
                time: '2 horas atrás',
                status: 'danger'            // Status visual: erro
            }
        ];
    }

    /**
     * Obtém lista de entregas pendentes
     * Retorna dados de agendamentos que ainda não foram processados
     * 
     * @returns {Promise<Array>} - Lista de entregas pendentes
     */
    async getPendingDeliveries() {
        return [
            {
                id: 1,
                nfe: '35240414200166000182550010000134151123456789',  // Chave da NFe
                supplier: 'TechCorp Ltda',                            // Fornecedor
                volumes: '15 volumes',                               // Quantidade de volumes
                scheduledDate: '14/07/2025',                         // Data agendada
                warehouse: 'Estoque Principal',                      // Local de armazenamento
                status: 'scheduled'                                  // Status: agendado
            },
            {
                id: 2,
                nfe: '35240414200166000182550010000134152234567890',
                supplier: 'SmartPhone Inc',
                volumes: '8 volumes',
                scheduledDate: '14/07/2025',
                warehouse: 'Estoque Eletrônicos',
                status: 'on_way'                                     // Status: a caminho
            },
            {
                id: 3,
                nfe: '35240414200166000182550010000134153345678901',
                supplier: 'Office Solutions',
                volumes: '20 volumes',
                scheduledDate: '15/07/2025',
                warehouse: 'Estoque Periféricos',
                status: 'scheduled'
            },
            {
                id: 4,
                nfe: '35240414200166000182550010000134154456789012',
                supplier: 'Industrial Corp',
                volumes: '5 volumes',
                scheduledDate: '15/07/2025',
                warehouse: 'Estoque Industrial',
                status: 'processing'                                 // Status: processando
            }
        ];
    }

    /**
     * Obtém lista de agendamentos com filtros opcionais
     * 
     * @param {object} params - Parâmetros de filtro (data, status, etc.)
     * @returns {Promise<Array>} - Lista de agendamentos
     */
    async getSchedules(params = {}) {
        return this.request('/schedules', { params });
    }

    /**
     * Cria um novo agendamento
     * 
     * @param {object} data - Dados do agendamento
     * @returns {Promise<object>} - Agendamento criado
     */
    async createSchedule(data) {
        return this.request('/schedules', {
            method: 'POST',
            data
        });
    }

    /**
     * Atualiza o status de um agendamento
     * 
     * @param {number} id - ID do agendamento
     * @param {string} status - Novo status
     * @param {string} comment - Comentário sobre a mudança
     * @returns {Promise<object>} - Agendamento atualizado
     */
    async updateScheduleStatus(id, status, comment) {
        return this.request(`/schedules/${id}/status`, {
            method: 'PATCH',
            data: {
                status,
                historic_entry: {
                    user: this.getCurrentUser()?.user || 'system',
                    action: `Status alterado para ${status}`,
                    comment
                }
            }
        });
    }

    /**
     * Cria agendamento com produtos extraídos da NFe
     * 
     * @param {object} nfe_data - Dados da NFe processada
     * @returns {Promise<object>} - Agendamento criado com produtos
     */
    async createScheduleWithProducts(nfe_data) {
        return this.request('/schedules/create-with-products', {
            method: 'POST',
            data: { nfe_data }
        });
    }

    /**
     * Obtém dados do usuário atual
     * 
     * @returns {object|null} - Dados do usuário ou null se não autenticado
     */
    getCurrentUser() {
        const userData = localStorage.getItem('user');
        return userData ? JSON.parse(userData) : null;
    }
}

// Instância global do cliente API para uso em toda a aplicação
const apiClient = new VueApiClient();

/**
 * ========================================
 * APLICAÇÃO VUE.JS PRINCIPAL
 * ========================================
 * 
 * Aplicação Vue.js que gerencia todo o estado e funcionalidades
 * do sistema de agendamento.
 */
const app = createApp({
    /**
     * Dados reativos da aplicação
     * Todas as propriedades aqui são reativas e atualizam a UI automaticamente
     */
    data() {
        return {
            // ========================================
            // ESTADO GERAL
            // ========================================
            loading: true,                    // Estado de carregamento geral
            user: null,                       // Dados do usuário logado
            activeMenu: 'dashboard',          // Menu ativo no sidebar
            showSchedulesList: false,         // Controla exibição da lista de agendamentos
            
            // ========================================
            // ESTADO DO DASHBOARD
            // ========================================
            dashboardStats: {
                pendingDeliveries: 0,         // Entregas pendentes
                processing: 0,                // Em processamento
                completedToday: 0,            // Concluídas hoje
                divergences: 0                // Divergências
            },
            statsLoading: false,              // Loading das estatísticas
            
            // ========================================
            // ATIVIDADES RECENTES
            // ========================================
            recentActivities: [],             // Lista de atividades recentes
            activitiesLoading: false,         // Loading das atividades
            
            // ========================================
            // ENTREGAS PENDENTES
            // ========================================
            pendingDeliveries: [],            // Lista de entregas pendentes
            deliveriesLoading: false,         // Loading das entregas
            
            // ========================================
            // NOTIFICAÇÕES
            // ========================================
            notifications: []                 // Lista de notificações do sistema
        };
    },
    
    /**
     * Hook do Vue.js executado quando o componente é montado
     * Inicializa a aplicação e carrega dados iniciais
     */
    async mounted() {
        try {
            // Verificar autenticação do usuário
            await this.checkAuth();
            
            // Inicializar sistema de permissões
            initializePermissions();
            
            // Carregar dados do dashboard
            await this.loadDashboardData();
            
        } catch (error) {
            console.error('Erro ao inicializar dashboard:', error);
            this.addNotification('Erro ao carregar dados do dashboard', 'error');
        } finally {
            // Remove loading geral independente do resultado
            this.loading = false;
        }
    },
    
    /**
     * ========================================
     * MÉTODOS DA APLICAÇÃO
     * ========================================
     */
    methods: {
        /**
         * Verifica autenticação do usuário
         * Valida token e dados do usuário no localStorage
         */
        async checkAuth() {
            const token = localStorage.getItem('token');
            const userData = localStorage.getItem('user');
            
            // Se não há token ou dados do usuário, redireciona para login
            if (!token || !userData) {
                window.location.href = 'login.html';
                return;
            }
            
            try {
                // Parse dos dados do usuário
                this.user = JSON.parse(userData);
            } catch (error) {
                console.error('Erro ao parsear dados do usuário:', error);
                // Se erro no parse, redireciona para login
                window.location.href = 'login.html';
            }
        },
        
        /**
         * Carrega todos os dados do dashboard em paralelo
         * Usa Promise.all para otimizar performance
         */
        async loadDashboardData() {
            // Carregar dados em paralelo para melhor performance
            const promises = [
                this.loadStats(),
                this.loadRecentActivities(),
                this.loadPendingDeliveries()
            ];
            
            // Aguarda todas as requisições terminarem
            await Promise.all(promises);
        },
        
        /**
         * Carrega estatísticas do dashboard
         * Atualiza dados de métricas principais
         */
        async loadStats() {
            this.statsLoading = true;
            try {
                this.dashboardStats = await apiClient.getDashboardStats();
            } catch (error) {
                console.error('Erro ao carregar estatísticas:', error);
                this.addNotification('Erro ao carregar estatísticas', 'error');
            } finally {
                this.statsLoading = false;
            }
        },
        
        /**
         * Carrega atividades recentes
         * Atualiza lista de atividades no dashboard
         */
        async loadRecentActivities() {
            this.activitiesLoading = true;
            try {
                this.recentActivities = await apiClient.getRecentActivities();
            } catch (error) {
                console.error('Erro ao carregar atividades:', error);
                this.addNotification('Erro ao carregar atividades recentes', 'error');
            } finally {
                this.activitiesLoading = false;
            }
        },
        
        /**
         * Carrega entregas pendentes
         * Atualiza lista de agendamentos pendentes
         */
        async loadPendingDeliveries() {
            this.deliveriesLoading = true;
            try {
                this.pendingDeliveries = await apiClient.getPendingDeliveries();
            } catch (error) {
                console.error('Erro ao carregar entregas:', error);
                this.addNotification('Erro ao carregar entregas agendadas', 'error');
            } finally {
                this.deliveriesLoading = false;
            }
        },
        
        /**
         * Manipula cliques nos itens do menu
         * Controla navegação entre diferentes seções
         * 
         * @param {string} menuId - ID do menu clicado
         */
        handleMenuClick(menuId) {
            this.activeMenu = menuId;
            console.log('Menu clicado:', menuId);
            
            // Reset views - limpa outras visualizações
            this.showSchedulesList = false;
            
            // Implementar navegação específica para cada menu
            switch (menuId) {
                case 'dashboard':
                    // Página principal - recarregar dados do dashboard
                    this.loadDashboardData();
                    break;
                case 'agendamento':
                    // Mostrar lista de agendamentos
                    this.showSchedulesList = true;
                    break;
                case 'configuracoes':
                    // Mostrar página de configurações
                    this.showSettingsPage();
                    break;
                default:
                    console.log('Menu não implementado:', menuId);
            }
        },
        
        /**
         * Exibe página de configurações
         * Placeholder para funcionalidade futura
         */
        showSettingsPage() {
            this.addNotification('Página de configurações em desenvolvimento', 'info');
            // TODO: Implementar página de configurações
            console.log('Abrindo página de configurações...');
        },
        
        /**
         * Manipula logout do usuário
         * Limpa dados de sessão e redireciona para login
         */
        handleLogout() {
            const confirmed = confirm('Tem certeza que deseja sair?');
            if (confirmed) {
                // Remove dados de autenticação
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                // Redireciona para página de login
                window.location.href = 'login.html';
            }
        },
        
        /**
         * Manipula ações em entregas pendentes
         * Processa diferentes ações como iniciar recebimento, rastrear, etc.
         * 
         * @param {string} action - Tipo de ação (start, track, view)
         * @param {number} deliveryId - ID da entrega
         */
        async handleDeliveryAction(action, deliveryId) {
            console.log('Ação na entrega:', action, deliveryId);
            
            switch(action) {
                case 'start':
                    try {
                        // Atualizar status para processando
                        await apiClient.updateScheduleStatus(deliveryId, 'processing', 'Recebimento iniciado');
                        this.addNotification('Recebimento iniciado', 'success');
                        await this.loadPendingDeliveries(); // Recarregar dados
                    } catch (error) {
                        this.addNotification('Erro ao iniciar recebimento', 'error');
                    }
                    break;
                case 'track':
                    this.addNotification('Abrindo rastreamento...', 'info');
                    break;
                case 'view':
                    this.addNotification('Abrindo detalhes...', 'info');
                    break;
                default:
                    this.addNotification('Ação não reconhecida', 'warning');
            }
        },
        
        /**
         * Adiciona notificação ao sistema
         * Cria notificação temporária que auto-remove após 5 segundos
         * 
         * @param {string} message - Mensagem da notificação
         * @param {string} type - Tipo da notificação (info, success, warning, error)
         */
        addNotification(message, type = 'info') {
            const notification = {
                id: Date.now(),               // ID único baseado no timestamp
                message,                      // Mensagem da notificação
                type,                         // Tipo (info, success, warning, error)
                timestamp: new Date()         // Timestamp de criação
            };
            
            // Adiciona à lista de notificações
            this.notifications.push(notification);
            
            // Auto-remove após 5 segundos
            setTimeout(() => {
                this.removeNotification(notification.id);
            }, 5000);
        },
        
        /**
         * Remove notificação específica da lista
         * 
         * @param {number} id - ID da notificação a ser removida
         */
        removeNotification(id) {
            const index = this.notifications.findIndex(n => n.id === id);
            if (index > -1) {
                this.notifications.splice(index, 1);
            }
        },
        
        /**
         * Recarrega todos os dados do dashboard
         * Útil para atualização manual dos dados
         */
        async refresh() {
            this.loading = true;
            try {
                await this.loadDashboardData();
                this.addNotification('Dados atualizados com sucesso', 'success');
            } catch (error) {
                this.addNotification('Erro ao atualizar dados', 'error');
            } finally {
                this.loading = false;
            }
        }
    }
});

/**
 * ========================================
 * REGISTRO DE COMPONENTES
 * ========================================
 * 
 * Registra todos os componentes Vue.js globalmente
 * para uso em toda a aplicação
 */

// Componentes básicos do dashboard
app.component('sidebar-component', SidebarComponent);
app.component('stats-cards', StatsCards);
app.component('recent-activities', RecentActivities);
app.component('pending-deliveries', PendingDeliveries);
app.component('notifications', NotificationsComponent);

// Componentes de agendamento
app.component('schedules-list', SchedulesList);
app.component('schedule-creation-modal', ScheduleCreationModal);
app.component('product-edit-modal', ProductEditModal);
app.component('nfe-info-modal', NfeInfoModal);
app.component('schedule-filters', ScheduleFilters);

/**
 * ========================================
 * MONTAGEM DA APLICAÇÃO
 * ========================================
 * 
 * Monta a aplicação Vue.js no elemento com id 'app'
 * e disponibiliza globalmente para debug
 */
app.mount('#app');

// Disponibilizar globalmente para debug e desenvolvimento
window.VueApp = app;
window.apiClient = apiClient; 