/**
 * ========================================
 * SISTEMA DE LOGIN E AUTENTICAÇÃO
 * ========================================
 * 
 * Este arquivo gerencia todo o processo de autenticação do sistema:
 * - Validação de credenciais
 * - Gerenciamento de tokens JWT
 * - Verificação de sessão
 * - Interface de login responsiva
 * - Tratamento de erros de autenticação
 * 
 * @author Sistema de Agendamento
 * @version 1.0.0
 */

/**
 * ========================================
 * GERENCIADOR DE LOGIN
 * ========================================
 * 
 * Classe principal responsável por gerenciar todo o processo
 * de login, incluindo validação, autenticação e redirecionamento.
 */
class LoginManager {
    /**
     * Construtor da classe
     * Inicializa a URL da API e chama o método de inicialização
     */
    constructor() {
        // URL base da API de autenticação
        this.apiBaseUrl = 'https://schedule-mercocamp-back-end.up.railway.app/api';
        // Inicializa o sistema de login
        this.init();
    }

    /**
     * Inicializa o sistema de login
     * Configura eventos e verifica credenciais armazenadas
     */
    init() {
        // Configura todos os eventos de interação
        this.bindEvents();
        // Verifica se há credenciais salvas
        this.checkStoredCredentials();
    }

    /**
     * Configura todos os eventos de interação da página de login
     * Inclui submissão do formulário, validação em tempo real, etc.
     */
    bindEvents() {
        // Elementos do DOM
        const loginForm = document.getElementById('loginForm');
        const togglePassword = document.getElementById('togglePassword');
        const usernameInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');

        // ========================================
        // EVENTO DE SUBMISSÃO DO FORMULÁRIO
        // ========================================
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault(); // Previne submissão padrão
            this.handleLogin(); // Chama método de login
        });

        // ========================================
        // TOGGLE DE VISIBILIDADE DA SENHA
        // ========================================
        togglePassword.addEventListener('click', () => {
            this.togglePasswordVisibility();
        });

        // ========================================
        // VALIDAÇÃO EM TEMPO REAL DOS CAMPOS
        // ========================================
        usernameInput.addEventListener('keyup', () => {
            this.validateField(usernameInput, 'username');
        });

        passwordInput.addEventListener('keyup', () => {
            this.validateField(passwordInput, 'password');
        });

        // ========================================
        // NAVEGAÇÃO POR TECLAS
        // ========================================
        // Enter no campo usuário foca no campo senha
        usernameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') passwordInput.focus();
        });

        // Enter no campo senha executa login
        passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleLogin();
        });

        // ========================================
        // FECHAMENTO DE MODAIS
        // ========================================
        // Fecha modal ao clicar no overlay
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                this.closeErrorModal();
            }
        });

        // Fecha modal com tecla ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeErrorModal();
            }
        });
    }

    /**
     * Verifica se há credenciais salvas no localStorage
     * Se houver, preenche o formulário e verifica se o token ainda é válido
     */
    checkStoredCredentials() {
        // Recupera usuário lembrado e token do localStorage
        const rememberedUser = localStorage.getItem('rememberedUser');
        const token = localStorage.getItem('token');

        // Se há usuário lembrado, preenche o campo
        if (rememberedUser) {
            document.getElementById('username').value = rememberedUser;
            document.getElementById('rememberMe').checked = true;
        }

        // Se há token, verifica se ainda é válido
        if (token) {
            this.verifyToken(token);
        }
    }

    /**
     * Verifica se o token JWT ainda é válido
     * Se válido, redireciona para o dashboard
     * Se inválido, remove o token
     * 
     * @param {string} token - Token JWT para verificação
     */
    async verifyToken(token) {
        try {
            // Faz requisição para verificar token
            const response = await fetch(`${this.apiBaseUrl}/auth/verify`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                // Token é válido - redireciona para dashboard
                window.location.href = 'index.html';
            } else {
                // Token é inválido - remove dados
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            }
        } catch (error) {
            console.error('Token verification failed:', error);
            // Em caso de erro, remove dados por segurança
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        }
    }

    /**
     * Alterna a visibilidade da senha
     * Muda entre tipo 'password' e 'text' e atualiza o ícone
     */
    togglePasswordVisibility() {
        const passwordInput = document.getElementById('password');
        const toggleIcon = document.querySelector('#togglePassword i');

        if (passwordInput.type === 'password') {
            // Mostra a senha
            passwordInput.type = 'text';
            toggleIcon.classList.remove('fa-eye');
            toggleIcon.classList.add('fa-eye-slash');
        } else {
            // Esconde a senha
            passwordInput.type = 'password';
            toggleIcon.classList.remove('fa-eye-slash');
            toggleIcon.classList.add('fa-eye');
        }
    }

    /**
     * Valida um campo específico em tempo real
     * Adiciona feedback visual (sucesso/erro) baseado na validação
     * 
     * @param {HTMLElement} input - Elemento input a ser validado
     * @param {string} fieldType - Tipo do campo ('username' ou 'password')
     * @returns {boolean} - True se válido, false caso contrário
     */
    validateField(input, fieldType) {
        const value = input.value.trim();
        const formGroup = input.closest('.form-group');

        // Remove estados anteriores
        formGroup.classList.remove('error', 'success');

        // Campo vazio é inválido
        if (value === '') {
            return false;
        }

        // Validação básica
        let isValid = true;
        
        // Usuário deve ter pelo menos 3 caracteres
        if (fieldType === 'username' && value.length < 3) {
            isValid = false;
        }
        
        // Senha deve ter pelo menos 3 caracteres
        if (fieldType === 'password' && value.length < 3) {
            isValid = false;
        }

        // Adiciona feedback visual
        if (isValid) {
            formGroup.classList.add('success');
        } else {
            formGroup.classList.add('error');
        }

        return isValid;
    }

    /**
     * Controla o estado de loading do formulário
     * Desabilita botão, mostra spinner e adiciona classe de loading
     * 
     * @param {boolean} isLoading - True para ativar loading, false para desativar
     */
    setLoading(isLoading) {
        const loginBtn = document.getElementById('loginBtn');
        const btnText = loginBtn.querySelector('.btn-text');
        const spinner = loginBtn.querySelector('.loading-spinner');
        const loginForm = document.getElementById('loginForm');

        if (isLoading) {
            // Ativa estado de loading
            loginBtn.disabled = true;
            btnText.textContent = 'Entrando...';
            spinner.style.display = 'inline-block';
            loginForm.classList.add('form-loading');
        } else {
            // Desativa estado de loading
            loginBtn.disabled = false;
            btnText.textContent = 'Entrar';
            spinner.style.display = 'none';
            loginForm.classList.remove('form-loading');
        }
    }

    /**
     * Processa o login do usuário
     * Valida campos, faz requisição para API e trata resposta
     */
    async handleLogin() {
        // Obtém valores dos campos
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();
        const rememberMe = document.getElementById('rememberMe').checked;

        // ========================================
        // VALIDAÇÃO DOS CAMPOS
        // ========================================
        if (!username || !password) {
            this.showError('Por favor, preencha todos os campos.');
            return;
        }

        if (username.length < 3) {
            this.showError('O nome de usuário deve ter pelo menos 3 caracteres.');
            return;
        }

        if (password.length < 3) {
            this.showError('A senha deve ter pelo menos 3 caracteres.');
            return;
        }

        // Ativa loading
        this.setLoading(true);

        try {
            // ========================================
            // REQUISIÇÃO PARA API
            // ========================================
            const response = await fetch(`${this.apiBaseUrl}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    user: username,
                    password: password
                })
            });

            const data = await response.json();

            if (response.ok) {
                // Login bem-sucedido
                this.handleLoginSuccess(data, rememberMe);
            } else {
                // Login falhou
                this.handleLoginError(data);
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showError('Erro de conexão. Verifique sua conexão com a internet e tente novamente.');
        } finally {
            // Desativa loading
            this.setLoading(false);
        }
    }

    /**
     * Processa login bem-sucedido
     * Armazena dados do usuário e token, gerencia "lembrar-me"
     * 
     * @param {object} data - Dados retornados pela API
     * @param {boolean} rememberMe - Se deve lembrar o usuário
     */
    handleLoginSuccess(data, rememberMe) {
        // Armazena token e dados do usuário
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        // Gerencia funcionalidade "lembrar-me"
        if (rememberMe) {
            localStorage.setItem('rememberedUser', data.user.user);
        } else {
            localStorage.removeItem('rememberedUser');
        }

        // Mostra animação de sucesso e redireciona
        this.showSuccessAndRedirect(data.user);
    }

    /**
     * Processa erro de login
     * Extrai mensagem de erro da resposta da API
     * 
     * @param {object} data - Dados de erro da API
     */
    handleLoginError(data) {
        let errorMessage = 'Erro ao fazer login. Tente novamente.';

        // Tenta extrair mensagem de erro da resposta
        if (data.error) {
            errorMessage = data.error;
        } else if (data.message) {
            errorMessage = data.message;
        }

        this.showError(errorMessage);
    }

    /**
     * Mostra animação de sucesso e redireciona para dashboard
     * Atualiza botão com ícone de sucesso e redireciona após delay
     * 
     * @param {object} user - Dados do usuário logado
     */
    showSuccessAndRedirect(user) {
        const loginBtn = document.getElementById('loginBtn');
        const btnText = loginBtn.querySelector('.btn-text');
        const spinner = loginBtn.querySelector('.loading-spinner');

        // Atualiza botão para mostrar sucesso
        btnText.textContent = 'Login realizado com sucesso!';
        spinner.style.display = 'none';
        loginBtn.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';

        // Adiciona animação de sucesso
        loginBtn.innerHTML = `
            <i class="fas fa-check"></i>
            <span>Bem-vindo, ${user.name}!</span>
        `;

        // Redireciona após delay curto
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1500);
    }

    /**
     * Exibe modal de erro com mensagem específica
     * Auto-remove após 5 segundos
     * 
     * @param {string} message - Mensagem de erro a ser exibida
     */
    showError(message) {
        const errorModal = document.getElementById('errorModal');
        const errorMessage = document.getElementById('errorMessage');

        errorMessage.textContent = message;
        errorModal.style.display = 'flex';

        // Auto-remove após 5 segundos
        setTimeout(() => {
            this.closeErrorModal();
        }, 5000);
    }

    /**
     * Fecha o modal de erro
     * Esconde o modal de erro
     */
    closeErrorModal() {
        const errorModal = document.getElementById('errorModal');
        errorModal.style.display = 'none';
    }
}

/**
 * ========================================
 * CLIENTE API UTILITÁRIO
 * ========================================
 * 
 * Classe utilitária para fazer requisições autenticadas
 * para a API. Gerencia tokens automaticamente.
 */
class ApiClient {
    /**
     * Construtor da classe
     * Inicializa URL base da API
     */
    constructor() {
        this.baseURL = 'https://schedule-mercocamp-back-end.up.railway.app/api';
    }

    /**
     * Método genérico para fazer requisições HTTP autenticadas
     * Adiciona token automaticamente e trata erros de autenticação
     * 
     * @param {string} endpoint - Endpoint da API
     * @param {object} options - Opções da requisição
     * @returns {Promise<object>} - Resposta da API
     */
    async request(endpoint, options = {}) {
        const token = localStorage.getItem('token');
        
        // Configuração da requisição
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        // Adiciona token se disponível
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }

        // Faz a requisição
        const response = await fetch(`${this.baseURL}${endpoint}`, config);
        
        // Trata erro 401 (não autorizado)
        if (response.status === 401) {
            // Token expirado - redireciona para login
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = 'login.html';
            return;
        }

        const data = await response.json();
        
        // Se resposta não ok, lança erro
        if (!response.ok) {
            throw new Error(data.error || 'Erro na requisição');
        }
        
        return data;
    }
}

/**
 * ========================================
 * FUNÇÕES GLOBAIS
 * ========================================
 */

/**
 * Fecha modal de erro (função global)
 * Pode ser chamada de qualquer lugar
 */
function closeErrorModal() {
    const errorModal = document.getElementById('errorModal');
    errorModal.style.display = 'none';
}

/**
 * ========================================
 * INICIALIZAÇÃO
 * ========================================
 * 
 * Inicializa o sistema de login quando o DOM estiver carregado
 */
document.addEventListener('DOMContentLoaded', () => {
    new LoginManager();
});

/**
 * ========================================
 * EXPORTAÇÃO GLOBAL
 * ========================================
 * 
 * Disponibiliza classes globalmente para uso em outros arquivos
 */
window.LoginManager = LoginManager;
window.ApiClient = ApiClient; 