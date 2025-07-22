/**
 * ========================================
 * COMPONENTE DE CRIAÇÃO DE AGENDAMENTO
 * ========================================
 * 
 * Este componente Vue.js gerencia todo o processo de criação
 * de agendamentos via upload e parse de arquivos XML de NFe.
 * 
 * Funcionalidades principais:
 * - Upload e parse de arquivos XML de NFe
 * - Extração automática de dados e produtos
 * - Validação de acesso ao cliente
 * - Verificação de produtos existentes
 * - Criação de agendamento com produtos
 * - Interface multi-step para melhor UX
 * 
 * @author Sistema de Agendamento
 * @version 1.0.0
 */

// Componente Vue.js para criação de agendamentos
const ScheduleCreationModal = {
    /**
     * Props do componente
     * Recebe dados do componente pai
     */
    props: {
        showModal: {
            type: Boolean,
            default: false
        }
    },
    
    /**
     * Dados reativos do componente
     * Todas as propriedades aqui são reativas e atualizam a UI automaticamente
     */
    data() {
        return {
            currentStep: 1,                    // Step atual do processo (1-3)
            selectedFile: null,                 // Arquivo XML selecionado
            nfeData: {},                       // Dados extraídos da NFe
            products: [],                      // Lista de produtos extraídos
            loading: false,                    // Estado de loading geral
            errors: [],                        // Lista de erros
            uploadProgress: 0,                 // Progresso do upload (0-100)
            showProductEditModal: false,       // Controla modal de edição de produto
            selectedProduct: null,             // Produto selecionado para edição
            clients: [],                       // Lista de clientes disponíveis
            selectedClient: null,              // Cliente selecionado
            showClientSelectionModal: false,   // Controla modal de seleção de cliente
            scheduledDate: ''                  // Data desejada para entrega física
        };
    },
    
    /**
     * Propriedades computadas
     * Valores calculados automaticamente baseados nos dados
     */
    computed: {
        /**
         * Verifica se pode prosseguir para o step 2
         * Requer arquivo selecionado e dados da NFe extraídos
         */
        canProceedToStep2() {
            return this.selectedFile && this.nfeData && Object.keys(this.nfeData).length > 0;
        },
        
        /**
         * Verifica se pode prosseguir para o step 3
         * Requer dados da NFe e produtos extraídos
         */
        canProceedToStep3() {
            return this.nfeData && this.products.length > 0;
        },
        
        /**
         * Verifica se pode criar o agendamento
         * Requer produtos, cliente selecionado e data de agendamento
         */
        canCreateSchedule() {
            return this.products.length > 0 && this.selectedClient && this.scheduledDate;
        },
        
        /**
         * Classes CSS para os steps
         * Controla visualização dos steps (ativo, completo, etc.)
         */
        stepClasses() {
            return {
                1: { active: this.currentStep === 1, completed: this.currentStep > 1 },
                2: { active: this.currentStep === 2, completed: this.currentStep > 2 },
                3: { active: this.currentStep === 3, completed: false }
            };
        },
        
        /**
         * Calcula valor total dos produtos
         * Soma todos os valores dos produtos extraídos
         */
        totalValue() {
            return this.products.reduce((total, product) => total + (product.total_value || 0), 0);
        },
        
        /**
         * Calcula quantidade total dos produtos
         * Soma todas as quantidades dos produtos extraídos
         */
        totalQuantity() {
            return this.products.reduce((total, product) => total + (product.quantity || 0), 0);
        },
        
        /**
         * Verifica se o cliente foi selecionado automaticamente
         * Baseado no CNPJ da NFe e acesso do usuário
         */
        isClientAutoSelected() {
            const currentUser = this.getCurrentUser();
            return currentUser && 
                   currentUser.cli_access && 
                   this.nfeData.client_cnpj && 
                   currentUser.cli_access[this.nfeData.client_cnpj];
        },
        
        /**
         * Verifica se usuário tem permissão para criar agendamentos
         * Baseado no nível de acesso do usuário (Admin ou Manager)
         */
        hasCreatePermission() {
            const currentUser = this.getCurrentUser();
            return currentUser && currentUser.level_access !== undefined && currentUser.level_access <= 1;
        },
        
        /**
         * Texto do botão de criação
         * Pode ser customizado baseado no contexto
         */
        createButtonText() {
            return 'Efetivar Agendamento';
        }
    },
    
    /**
     * ========================================
     * MÉTODOS DO COMPONENTE
     * ========================================
     */
    methods: {
        /**
         * Fecha o modal e reseta os dados
         * Emite evento para o componente pai
         */
        closeModal() {
            this.resetModal();
            this.$emit('close');
        },
        
        /**
         * Reseta todos os dados do modal
         * Volta ao estado inicial
         */
        resetModal() {
            this.currentStep = 1;
            this.selectedFile = null;
            this.nfeData = {};
            this.products = [];
            this.loading = false;
            this.errors = [];
            this.uploadProgress = 0;
            this.selectedClient = null;
            this.scheduledDate = '';
        },
        
        /**
         * Manipula seleção de arquivo via input
         * Chama parse do XML quando arquivo é selecionado
         * 
         * @param {Event} event - Evento de seleção de arquivo
         */
        async handleFileSelect(event) {
            const file = event.target.files[0];
            if (file) {
                this.selectedFile = file;
                await this.parseAndExtractXML();
            }
        },
        
        /**
         * Manipula drop de arquivo na área de upload
         * Valida se é arquivo XML e chama parse
         * 
         * @param {Event} event - Evento de drop
         */
        async handleDrop(event) {
            event.preventDefault();
            const file = event.dataTransfer.files[0];
            if (file && file.name.endsWith('.xml')) {
                this.selectedFile = file;
                await this.parseAndExtractXML();
            } else {
                this.showError('Por favor, selecione um arquivo XML válido');
            }
        },

        /**
         * Processa o arquivo XML selecionado
         * Extrai dados da NFe e produtos, valida acesso ao cliente
         */
        async parseAndExtractXML() {
            if (!this.selectedFile) return;
            
            this.loading = true;
            this.errors = [];
            this.uploadProgress = 0;
            
            try {
                // ========================================
                // LEITURA DO ARQUIVO XML
                // ========================================
                const xmlText = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = (e) => resolve(e.target.result);
                    reader.onerror = (e) => reject(e);
                    reader.readAsText(this.selectedFile);
                });
                
                // ========================================
                // PARSE DO XML E EXTRAÇÃO DE DADOS
                // ========================================
                const { nfeData, products } = this.parseNFeXML(xmlText);
                
                // ========================================
                // VALIDAÇÃO DE ACESSO AO CLIENTE
                // ========================================
                if (nfeData.client_cnpj) {
                    await this.validateClientAccess(nfeData.client_cnpj);
                }
                
                // ========================================
                // ATUALIZAÇÃO DOS DADOS
                // ========================================
                this.nfeData = nfeData;
                this.products = products;
                this.uploadProgress = 100;
                
                // ========================================
                // VERIFICAÇÕES ADICIONAIS
                // ========================================
                // Verificar produtos existentes no sistema
                await this.checkExistingProducts();
                // Carregar clientes disponíveis
                await this.loadAvailableClients();
                
                this.showSuccess('XML processado com sucesso!');
                
            } catch (error) {
                console.error('Erro ao processar XML:', error);
                
                // ========================================
                // TRATAMENTO ESPECÍFICO DE ERROS
                // ========================================
                if (error.message && (
                    error.message.includes('CNPJ do destinatário não encontrado') ||
                    error.message.includes('não possui acesso ao cliente') ||
                    error.message.includes('não autenticado')
                )) {
                    this.showError(error.message);
                } else {
                    this.showError('Erro ao processar arquivo XML: ' + (error.message || 'Erro desconhecido'));
                }
                
                // Resetar dados em caso de erro
                this.nfeData = {};
                this.products = [];
                this.selectedFile = null;
            } finally {
                this.loading = false;
            }
        },

        /**
         * Parse do XML da NFe e extração de dados
         * Extrai campos principais e lista de produtos
         * 
         * @param {string} xmlText - Conteúdo XML como string
         * @returns {object} - Objeto com dados da NFe e produtos
         */
        parseNFeXML(xmlText) {
            // ========================================
            // PARSE DO XML USANDO DOMParser
            // ========================================
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
            
            // ========================================
            // EXTRAÇÃO DE CAMPOS PRINCIPAIS
            // ========================================
            const ide = xmlDoc.querySelector('ide');
            const emit = xmlDoc.querySelector('emit');
            const dest = xmlDoc.querySelector('dest');
            const vol = xmlDoc.querySelector('vol');
            const infNFe = xmlDoc.querySelector('infNFe');
            
            // Chave da NFe (remove prefixo 'NFe')
            const nfe_key = infNFe?.getAttribute('Id')?.replace(/^NFe/, '') || '';
            
            // ========================================
            // CONSTRUÇÃO DO OBJETO DE DADOS
            // ========================================
            const nfeData = {
                number: ide?.querySelector('nNF')?.textContent || '',           // Número da NFe
                nfe_key: nfe_key,                                               // Chave da NFe
                client_cnpj: dest?.querySelector('CNPJ')?.textContent || '',   // CNPJ do destinatário
                client_name: dest?.querySelector('xNome')?.textContent || '',   // Nome do destinatário
                supplier_cnpj: emit?.querySelector('CNPJ')?.textContent || '',  // CNPJ do emitente
                supplier_name: emit?.querySelector('xNome')?.textContent || '', // Nome do emitente
                case_count: parseInt(vol?.querySelector('qVol')?.textContent || '0'), // Quantidade de volumes
                date: ide?.querySelector('dhEmi')?.textContent?.slice(0, 10) || '',  // Data de emissão
                qt_prod: 0,                                                     // Quantidade de produtos (será atualizado)
                products: []                                                     // Lista de produtos
            };
            
            // ========================================
            // EXTRAÇÃO DE PRODUTOS
            // ========================================
            const products = [];
            const detList = xmlDoc.querySelectorAll('det');
            
            detList.forEach(det => {
                const prod = det.querySelector('prod');
                if (prod) {
                    products.push({
                        item: det.querySelector('nItem')?.textContent || '',      // Número do item
                        code: prod.querySelector('cProd')?.textContent || '',     // Código do produto
                        supplier_code: prod.querySelector('cProd')?.textContent || '', // Código do fornecedor
                        description: prod.querySelector('xProd')?.textContent || '',   // Descrição do produto
                        supplier_description: prod.querySelector('xProd')?.textContent || '', // Descrição do fornecedor
                        ncm: prod.querySelector('NCM')?.textContent || '',        // Classificação NCM
                        quantity: parseFloat(prod.querySelector('qCom')?.textContent || '0'), // Quantidade
                        unit: prod.querySelector('uCom')?.textContent || '',      // Unidade
                        unit_value: parseFloat(prod.querySelector('vUnCom')?.textContent || '0'), // Valor unitário
                        total_value: parseFloat(prod.querySelector('vProd')?.textContent || '0') // Valor total
                    });
                }
            });
            
            // ========================================
            // FINALIZAÇÃO DOS DADOS
            // ========================================
            nfeData.products = products;
            nfeData.qt_prod = products.length;
            
            // ========================================
            // LOG DO RESULTADO NO CONSOLE
            // ========================================
            console.log('JSON resultante do parse do XML NFe:', JSON.stringify(nfeData, null, 2));
            
            return { nfeData, products };
        },
        
        /**
         * Função antiga mantida para compatibilidade
         * Não é mais usada, mas mantida para evitar erros
         */
        async uploadAndParseXML() {
            this.showError('O parseamento do XML agora é feito no navegador. Use a nova função de upload.');
        },
        
        /**
         * Verifica produtos existentes no sistema
         * Compara produtos da NFe com produtos já cadastrados
         */
        async checkExistingProducts() {
            if (!this.products.length) return;
            
            try {
                const apiClient = new VueApiClient();
                
                // ========================================
                // PREPARAÇÃO DOS DADOS PARA VERIFICAÇÃO
                // ========================================
                const productChecks = this.products.map(p => ({
                    supp_code: p.code,                    // Código do produto
                    supp_cnpj: this.nfeData.supplier_cnpj, // CNPJ do fornecedor
                    cli_cnpj: this.nfeData.client_cnpj    // CNPJ do cliente
                }));
                
                // ========================================
                // REQUISIÇÃO PARA API
                // ========================================
                const response = await apiClient.request('/products/check-existing', {
                    method: 'POST',
                    data: { products: productChecks }
                });
                
                const existingProducts = response.results || [];
                
                // ========================================
                // ATUALIZAÇÃO DOS PRODUTOS
                // ========================================
                this.products.forEach(product => {
                    const existing = existingProducts.find(ep => ep.supp_code === product.code);
                    if (existing && existing.exists) {
                        // Produto existe no sistema
                        product.exists = true;
                        product.data = existing.data;
                    } else {
                        // Produto não existe - pré-preenche fator com 1
                        product.exists = false;
                        product.factor = 1;
                    }
                });
                
            } catch (error) {
                console.error('Erro ao verificar produtos existentes:', error);
            }
        },
        
        /**
         * Carrega lista de clientes disponíveis
         * Filtra baseado no acesso do usuário
         */
        async loadAvailableClients() {
            try {
                const apiClient = new VueApiClient();
                
                // ========================================
                // REQUISIÇÃO PARA API
                // ========================================
                const response = await apiClient.request('/clients', {
                    method: 'GET'
                });
                
                let allClients = response.data || [];
                
                // ========================================
                // FILTRAGEM DE CLIENTES
                // ========================================
                // Filtrar clientes com CNPJ válido (não null/undefined)
                allClients = allClients.filter(client => client.cnpj);
                
                // Filtrar clientes baseado no acesso do usuário
                const currentUser = this.getCurrentUser();
                if (currentUser && currentUser.level_access !== 0) {
                    // Usuários com level_access >= 1 - filtrar apenas clientes com acesso
                    if (currentUser.cli_access) {
                        const allowedCNPJs = Object.keys(currentUser.cli_access);
                        allClients = allClients.filter(client => 
                            allowedCNPJs.includes(client.cnpj)
                        );
                    } else {
                        // Se não tem cli_access, não tem acesso a nenhum cliente
                        allClients = [];
                    }
                }
                // Usuários com level_access = 0 (Desenvolvedor) veem todos os clientes
                
                this.clients = allClients;
                
                // ========================================
                // SELEÇÃO AUTOMÁTICA DO CLIENTE
                // ========================================
                if (this.nfeData.client_cnpj) {
                    // Normalizar CNPJ do XML para comparação
                    const normalizedXmlCnpj = this.nfeData.client_cnpj.replace(/[^\d]/g, '');
                    
                    // Buscar cliente na lista filtrada comparando CNPJs normalizados
                    const matchingClient = this.clients.find(client => {
                        // Verificar se o CNPJ do cliente não é null ou undefined
                        if (!client.cnpj) {
                            return false;
                        }
                        const normalizedClientCnpj = client.cnpj.replace(/[^\d]/g, '');
                        return normalizedClientCnpj === normalizedXmlCnpj;
                    });
                    
                    if (matchingClient) {
                        this.selectedClient = matchingClient;
                        console.log('Cliente selecionado automaticamente:', matchingClient.name);
                    } else {
                        console.log('Cliente não encontrado na lista para CNPJ:', this.nfeData.client_cnpj);
                    }
                }
                
            } catch (error) {
                console.error('Erro ao carregar clientes:', error);
            }
        },
        
        /**
         * Avança para o próximo step
         * Valida se pode prosseguir antes de avançar
         */
        nextStep() {
            if (this.currentStep === 1 && this.canProceedToStep2) {
                this.currentStep = 2;
            } else if (this.currentStep === 2 && this.canProceedToStep3) {
                this.currentStep = 3;
            }
        },
        
        /**
         * Volta para o step anterior
         * Permite navegação reversa no processo
         */
        previousStep() {
            if (this.currentStep > 1) {
                this.currentStep--;
            }
        },
        
        /**
         * Atualiza produto na lista local
         * 
         * @param {object} product - Produto atualizado
         */
        updateProduct(product) {
            const index = this.products.findIndex(p => p.id === product.id);
            if (index !== -1) {
                this.products[index] = { ...product };
            }
        },
        
        /**
         * Abre modal de edição de produto
         * 
         * @param {object} product - Produto a ser editado
         */
        editProduct(product) {
            this.selectedProduct = product;
            this.showProductEditModal = true;
        },
        
        /**
         * Fecha modal de edição de produto
         */
        closeProductEditModal() {
            this.showProductEditModal = false;
            this.selectedProduct = null;
        },
        
        /**
         * Abre modal de seleção de cliente
         */
        openClientSelectionModal() {
            this.showClientSelectionModal = true;
        },
        
        /**
         * Fecha modal de seleção de cliente
         */
        closeClientSelectionModal() {
            this.showClientSelectionModal = false;
        },
        
        /**
         * Seleciona um cliente específico
         */
        selectClient(client) {
            this.selectedClient = client;
            this.closeClientSelectionModal();
        },
        
        /**
         * Cria o agendamento no sistema
         * Valida permissões, prepara dados e envia para API
         */
        async createSchedule() {
            if (!this.canCreateSchedule) return;
            
            // ========================================
            // VERIFICAÇÃO DE PERMISSÕES
            // ========================================
            const currentUser = this.getCurrentUser();
            if (!currentUser) {
                this.showError('Usuário não autenticado. Faça login novamente.');
                return;
            }
            
            // Verificar se usuário tem permissão para criar agendamentos (level_access >= 1)
            if (currentUser.level_access === undefined || currentUser.level_access > 1) {
                this.showError('Usuário não possui permissão para criar agendamentos. Necessário nível de acesso Admin ou Manager.');
                return;
            }
            
            this.loading = true;
            this.errors = [];
            
            // Verificar se o token está presente
            const token = localStorage.getItem('token');
            if (!token) {
                this.showError('Token de autenticação não encontrado. Faça login novamente.');
                this.loading = false;
                return;
            }
            
            // ========================================
            // VALIDAÇÃO DOS DADOS OBRIGATÓRIOS
            // ========================================
            if (!this.nfeData.nfe_key) {
                this.showError('Chave da NFe é obrigatória.');
                this.loading = false;
                return;
            }
            
            if (!this.nfeData.client_cnpj) {
                this.showError('CNPJ do cliente é obrigatório.');
                this.loading = false;
                return;
            }
            
            if (!this.nfeData.date) {
                this.showError('Data da NFe é obrigatória.');
                this.loading = false;
                return;
            }
            
            // ========================================
            // NORMALIZAÇÃO DOS DADOS
            // ========================================
            // Normalizar CNPJ do cliente (remover formatação)
            const clientCnpj = this.nfeData.client_cnpj.replace(/[^\d]/g, '');
            if (clientCnpj.length !== 14) {
                this.showError('CNPJ do cliente deve ter exatamente 14 dígitos.');
                this.loading = false;
                return;
            }
            
            // Garantir que o fornecedor não seja vazio
            let supplier = this.nfeData.supplier_name || this.nfeData.supplier_cnpj || '';
            if (!supplier) {
                this.showError('Dados do fornecedor são obrigatórios.');
                this.loading = false;
                return;
            }
            
            // Truncar fornecedor para máximo 50 caracteres
            if (supplier.length > 50) {
                supplier = supplier.substring(0, 50);
            }
            
            // Validar número da NFe (tratado como string)
            const nfeNumber = String(this.nfeData.number || '').trim();
            if (!nfeNumber || !/^\d{1,10}$/.test(nfeNumber)) {
                this.showError('Número da NFe deve conter apenas dígitos e ter no máximo 10 caracteres.');
                this.loading = false;
                return;
            }
            
            // Usar data de agendamento selecionada pelo usuário
            const formattedDate = this.scheduledDate;
            
            // Validar se data foi selecionada
            if (!formattedDate) {
                this.showError('Por favor, selecione a data desejada para entrega física.');
                this.loading = false;
                return;
            }
            
            // Validar formato da data
            if (!/^\d{4}-\d{2}-\d{2}$/.test(formattedDate)) {
                this.showError('Data de entrega deve estar no formato YYYY-MM-DD.');
                this.loading = false;
                return;
            }
            
            console.log('Data de agendamento para envio:', formattedDate);
            
            // ========================================
            // PREPARAÇÃO DOS DADOS DO AGENDAMENTO
            // ========================================
            const scheduleData = {
                number: nfeNumber,                                     // Número da NFe (string, máx 10 chars)
                "nfe_key": this.nfeData.nfe_key,                      // Chave da NFe (máx 44 chars)
                client: clientCnpj,                                    // CNPJ do cliente (14 dígitos)
                case_count: parseInt(this.nfeData.case_count) || 0,   // Quantidade de volumes
                date: formattedDate,                                   // Data desejada para entrega física
                status: 'Solicitado',                                 // Status inicial
                supplier: supplier,                                    // Fornecedor (máx 50 chars)
                qt_prod: parseInt(this.nfeData.qt_prod) || this.products.length, // Quantidade de produtos
                info: this.nfeData                                     // JSON completo do parseamento do XML 
            };
            
            console.log('Enviando dados do agendamento:', scheduleData);
            console.log('Token presente:', !!token);
            console.log('Dados validados individualmente:');
            console.log('- number:', nfeNumber, '(tipo:', typeof nfeNumber, ', válido:', /^\d{1,10}$/.test(nfeNumber), ')');
            console.log('- nfe_key:', this.nfeData.nfe_key, '(tamanho:', this.nfeData.nfe_key.length, ', válido:', this.nfeData.nfe_key.length <= 44, ')');
            console.log('- client:', clientCnpj, '(tamanho:', clientCnpj.length, ', válido:', clientCnpj.length === 14, ')');
            console.log('- date:', formattedDate, '(formato válido:', /^\d{4}-\d{2}-\d{2}$/.test(formattedDate), ')');
            console.log('- supplier:', supplier, '(tamanho:', supplier.length, ', válido:', supplier.length <= 50, ')');
            console.log('- case_count:', parseInt(this.nfeData.case_count) || 0, '(tipo:', typeof (parseInt(this.nfeData.case_count) || 0), ')');
            console.log('- qt_prod:', parseInt(this.nfeData.qt_prod) || this.products.length, '(tipo:', typeof (parseInt(this.nfeData.qt_prod) || this.products.length), ')');
            console.log('- status: Solicitado (válido: true)');
            console.log('- URL da requisição: /schedules');
            
            try {
                const apiClient = new VueApiClient();
                
                // ========================================
                // REQUISIÇÃO PARA API
                // ========================================
                const response = await apiClient.request('/schedules', {
                    method: 'POST',
                    data: scheduleData
                });
                
                console.log('Agendamento criado com sucesso:', response);
                this.showSuccess('Agendamento criado com sucesso!');
                this.$emit('created', response);
                
                // Fecha modal após delay
                setTimeout(() => {
                    this.closeModal();
                }, 1500);
                
            } catch (error) {
                console.error('Erro ao criar agendamento:', error);
                console.error('Resposta da API:', error.response?.data);
                
                // ========================================
                // TRATAMENTO ESPECÍFICO DE ERROS
                // ========================================
                if (error.response?.status === 403) {
                    this.showError('Acesso negado. Usuário não possui permissão para criar agendamentos.');
                } else if (error.response?.status === 401) {
                    this.showError('Token de autenticação inválido. Faça login novamente.');
                    // Redirecionar para login
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    window.location.href = 'login.html';
                } else if (error.response?.status === 400) {
                    // Erro de validação
                    const errorData = error.response?.data;
                    let errorMessage = errorData?.error || 'Dados inválidos enviados para a API.';
                    
                    // Adicionar detalhes se disponíveis
                    if (errorData?.details && Array.isArray(errorData.details)) {
                        const details = errorData.details.map(detail => {
                            if (typeof detail === 'string') return detail;
                            if (detail.message) return detail.message;
                            if (detail.path) return `Campo ${detail.path}: ${detail.message || 'inválido'}`;
                            return JSON.stringify(detail);
                        }).join(', ');
                        errorMessage += `. Detalhes: ${details}`;
                    }
                    
                    this.showError('Erro de validação: ' + errorMessage);
                    console.error('Dados enviados que causaram erro:', scheduleData);
                    console.error('Resposta completa da API:', errorData);
                    console.error('Detalhes do erro (expandido):', JSON.stringify(errorData.details, null, 2));
                } else {
                    // Erro genérico
                    this.showError('Erro ao criar agendamento: ' + (error.message || 'Erro desconhecido'));
                }
            } finally {
                this.loading = false;
            }
        },
        
        /**
         * Obtém dados do usuário atual
         * 
         * @returns {object|null} - Dados do usuário ou null
         */
        getCurrentUser() {
            const userData = localStorage.getItem('user');
            return userData ? JSON.parse(userData) : null;
        },
        
        /**
         * Valida acesso do usuário ao cliente específico
         * Verifica se o usuário tem permissão para acessar o CNPJ
         * 
         * @param {string} clientCNPJ - CNPJ do cliente a ser validado
         */
        async validateClientAccess(clientCNPJ) {
            const currentUser = this.getCurrentUser();
            
            if (!currentUser) {
                throw new Error('Usuário não autenticado');
            }
            
            // Desenvolvedores (nível 0) têm acesso total
            if (currentUser.level_access === 0) {
                return true;
            }
            
            // Verificar se usuário tem acesso ao cliente
            if (currentUser.cli_access && currentUser.cli_access[clientCNPJ]) {
                return true;
            }
            
            // Usuário não tem acesso ao cliente
            throw new Error(`Usuário ${currentUser.user} não possui acesso ao cliente com CNPJ ${clientCNPJ}`);
        },
        
        /**
         * Exibe mensagem de erro
         * 
         * @param {string} message - Mensagem de erro
         */
        showError(message) {
            this.errors.push(message);
        },
        
        /**
         * Exibe mensagem de sucesso
         * 
         * @param {string} message - Mensagem de sucesso
         */
        showSuccess(message) {
            // Implementar notificação de sucesso
            console.log('Sucesso:', message);
        },
        
        /**
         * Remove erro específico da lista
         * 
         * @param {number} index - Índice do erro a ser removido
         */
        removeError(index) {
            this.errors.splice(index, 1);
        },
        
        /**
         * Formata valor monetário
         * 
         * @param {number} value - Valor a ser formatado
         * @returns {string} - Valor formatado
         */
        formatCurrency(value) {
            return new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
            }).format(value);
        },
        
        /**
         * Formata CNPJ para exibição
         * 
         * @param {string} cnpj - CNPJ a ser formatado
         * @returns {string} - CNPJ formatado
         */
        formatCNPJ(cnpj) {
            if (!cnpj) return '';
            return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
        },
        
        /**
         * Manipula cliques no modal
         * Previne propagação de eventos
         * 
         * @param {Event} event - Evento de clique
         */
        handleModalClick(event) {
            event.stopPropagation();
        }
    },
    
    template: `
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
                    <div v-for="(error, index) in errors" :key="index" class="error-message">
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
                        <div class="progress-fill" :style="{ width: uploadProgress + '%' }"></div>
                    </div>
                </div>
                
                <!-- Step 1: Upload XML -->
                <div v-if="currentStep === 1 && !loading" class="modal-body">
                    <div class="upload-section">
                        <div class="upload-area" 
                             @drop="handleDrop" 
                             @dragover.prevent 
                             @dragenter.prevent>
                            <i class="fas fa-upload"></i>
                            <h4>Arraste o arquivo XML da NFe aqui</h4>
                            <p>ou clique para selecionar</p>
                            <input type="file" 
                                   accept=".xml" 
                                   @change="handleFileSelect"
                                   id="xml-file-input"
                                   style="display: none;">
                            <label for="xml-file-input" class="btn btn-primary">
                                <i class="fas fa-folder-open"></i>
                                Selecionar Arquivo
                            </label>
                        </div>
                        
                        <div v-if="selectedFile" class="file-info">
                            <i class="fas fa-file-code"></i>
                            <span>{{ selectedFile.name }}</span>
                            <span class="file-size">({{ (selectedFile.size / 1024).toFixed(1) }} KB)</span>
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
                                <small class="text-muted">Cliente selecionado automaticamente com base no CNPJ da NFe</small>
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
                                    <button type="button" class="btn btn-outline-primary btn-sm" @click="openClientSelectionModal">
                                        <i class="fas fa-edit"></i> Alterar Cliente
                                    </button>
                                </div>
                                <div v-else>
                                    <button type="button" class="btn btn-primary" @click="openClientSelectionModal">
                                        <i class="fas fa-users"></i> Selecionar Cliente
                                    </button>
                                    <small class="text-muted d-block mt-2">Clique para escolher o estoque de destino</small>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Delivery Date Selection -->
                        <div class="delivery-date-selection">
                            <h5>Data de Entrega Desejada</h5>
                            <div class="date-input-container">
                                <label for="scheduledDate">Selecione a data para entrega física:</label>
                                <input 
                                    type="date" 
                                    id="scheduledDate"
                                    v-model="scheduledDate" 
                                    class="form-control"
                                    :min="new Date().toISOString().split('T')[0]"
                                    required>
                                <small class="help-text">Esta será a data para agendamento da entrega física das mercadorias</small>
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
                                            <i class="fas fa-question-circle" title="Fator de conversão"></i>
                                        </th>
                                        <th>Valor Un.</th>
                                        <th>Valor Total</th>
                                        <th>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="product in products" :key="product.id || product.supplier_code">
                                        <td :title="product.supplier_code">{{ product.supplier_code }}</td>
                                        <td>
                                            <input 
                                                v-model="product.client_code" 
                                                :disabled="product.isLocked"
                                                @change="updateProduct(product)"
                                                class="form-control form-control-sm">
                                        </td>
                                        <td :title="product.supplier_description">{{ product.supplier_description }}</td>
                                        <td>
                                            <input 
                                                v-model="product.client_description" 
                                                :disabled="product.isLocked"
                                                @change="updateProduct(product)"
                                                class="form-control form-control-sm">
                                        </td>
                                        <td>{{ product.quantity }} {{ product.unit }}</td>
                                        <td>
                                            <input 
                                                v-model="product.factor" 
                                                type="number" 
                                                step="0.01"
                                                @change="updateProduct(product)"
                                                class="form-control form-control-sm">
                                        </td>
                                        <td>{{ formatCurrency(product.unit_value) }}</td>
                                        <td>{{ formatCurrency(product.total_value) }}</td>
                                        <td>
                                            <button 
                                                v-if="product.isLocked" 
                                                @click="editProduct(product)"
                                                class="btn btn-sm btn-secondary"
                                                title="Editar produto">
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
                        class="btn btn-secondary">
                        <i class="fas fa-arrow-left"></i>
                        Anterior
                    </button>
                    
                    <button 
                        v-if="currentStep < 3" 
                        @click="nextStep" 
                        :disabled="(currentStep === 1 && !canProceedToStep2) || (currentStep === 2 && !canProceedToStep3)"
                        class="btn btn-primary">
                        Próximo
                        <i class="fas fa-arrow-right"></i>
                    </button>
                    
                    <button 
                        v-if="currentStep === 3" 
                        @click="createSchedule" 
                        :disabled="!canCreateSchedule || loading"
                        class="btn btn-success">
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
                    @updated="updateProduct">
                </product-edit-modal>
            </div>
        </div>
    `
}; 