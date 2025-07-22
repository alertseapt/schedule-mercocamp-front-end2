# 🚀 LogiReceive - Sistema de Recebimento com Vue.js

Sistema web completo para gestão de recebimento de mercadorias, desenvolvido com Vue.js 3 e integração total com API REST. Combina tela de login em JavaScript puro com dashboard reativo em Vue.js.

## 🎯 Características Principais

✅ **Tela de Login** - JavaScript puro com autenticação JWT
✅ **Dashboard Vue.js** - Interface reativa e moderna
✅ **Integração API** - Conectado com API REST completa
✅ **Sistema de Notificações** - Feedback em tempo real
✅ **Responsivo** - Funciona em desktop, tablet e mobile
✅ **Segurança** - Autenticação e autorização robustas

## 📁 Estrutura do Projeto

```
Front-end/
├── login.html                                    # 🔐 Tela de login (JS puro)
├── dashboard.html                                # 📊 Dashboard principal (Vue.js)
├── package.json                                  # 📦 Configuração NPM
├── COMO_EXECUTAR.md                              # 🚀 Instruções de execução
├── MUDANCAS_ENTREGAS.md                          # 📝 Mudanças no componente de entregas
├── REMOCAO_HEADER.md                             # 🗑️ Remoção do componente header
├── REMOCAO_QUICK_ACTIONS.md                      # 🗑️ Remoção do componente quick actions
├── ALTERACAO_STATS_CARDS.md                     # 📝 Alteração no texto dos cards de estatísticas
├── REMOCAO_BOTOES_ENTREGAS.md                   # 🗑️ Remoção dos botões de filtrar e exportar
├── ALTERACAO_SIDEBAR_USUARIO.md                 # 👤 Alteração na sidebar para exibir nome do usuário
├── MELHORIA_BOTAO_LOGOUT.md                     # 🚪 Melhorias no botão de logout
├── ANIMACAO_SIDEBAR_SUTIL.md                    # ✨ Animação sutil da sidebar
├── assets/
│   ├── css/               
│   │   ├── main.css                              # 🎨 Estilos base do sistema
│   │   ├── login.css                             # 🎨 Estilos da tela de login
│   │   └── vue-components.css                    # 🎨 Estilos dos componentes Vue
│   ├── js/                
│   │   ├── login.js                              # 🔐 Lógica de login
│   │   ├── auth-guard.js                         # 🛡️ Proteção de rotas
│   │   └── vue/
│   │       ├── main.js                           # 🚀 Aplicação Vue principal
│   │       └── components/
│   │           ├── sidebar.js                    # 📋 Componente da sidebar
│   │           ├── stats-cards.js                # 📊 Cards de estatísticas
│   │           ├── recent-activities.js          # 📝 Atividades recentes
│   │           ├── pending-deliveries.js         # 🚚 Entregas agendadas
│   │           └── notifications.js              # 🔔 Sistema de notificações
│   └── img/               
│       └── logo.png                              # 🎨 Logo do sistema
├── API_FRONTEND_DOCUMENTATION.md                 # 📖 Documentação da API
└── README.md                                     # 📖 Este arquivo
```

## 🚀 Como Executar

### **Forma Mais Simples (NPM)**
```bash
npm start
```
- Abre automaticamente em `http://localhost:8000`
- Acesse: `http://localhost:8000/login.html`

### **Servidor Python**
```bash
python -m http.server 8000
```
- Acesse: `http://localhost:8000/login.html`

### **Servidor Node.js**
```bash
npx serve -s . -l 8000
```
- Acesse: `http://localhost:8000/login.html`

> 📖 **Instruções detalhadas**: Veja `COMO_EXECUTAR.md`

### **Configuração da API**
```javascript
// A API está rodando em:
https://schedule-mercocamp-back-end.up.railway.app/api

// Para alterar a URL, edite:
// assets/js/login.js (linha 3)
// assets/js/vue/main.js (linha 8)
```

## 📦 Scripts NPM Disponíveis

```bash
npm start          # Inicia servidor na porta 8000
npm run dev        # Modo desenvolvimento (mesmo que start)
npm run python-server  # Usa servidor Python
npm run open       # Abre o navegador automaticamente
```

## 🔧 Tecnologias Utilizadas

### Frontend
- **Vue.js 3** - Framework reativo principal
- **JavaScript ES6+** - Linguagem moderna
- **Axios** - Cliente HTTP para API
- **CSS3** - Estilos avançados
- **Font Awesome 6.7.2** - Ícones

### Bibliotecas CDN
```html
<!-- Vue.js 3 -->
<script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>

<!-- Axios -->
<script src="https://unpkg.com/axios/dist/axios.min.js"></script>

<!-- Font Awesome -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css">
```

## 🎨 Arquitetura do Sistema

### Fluxo de Autenticação
```
Login (JS puro) → API → JWT Token → Dashboard (Vue.js)
```

### Componentes Vue.js
- **SidebarComponent** - Menu lateral com navegação
- **StatsCards** - Cartões de estatísticas
- **RecentActivities** - Lista de atividades recentes
- **PendingDeliveries** - Tabela de entregas agendadas
- **NotificationsComponent** - Sistema de notificações

### Gerenciamento de Estado
```javascript
// Estado global reativo
data() {
    return {
        user: null,
        dashboardStats: {},
        recentActivities: [],
        pendingDeliveries: [],
        notifications: []
    };
}
```

## ✨ Funcionalidades

### 🔐 Autenticação
- **Login seguro** com JWT tokens
- **Lembrar usuário** com localStorage
- **Verificação automática** de tokens
- **Logout seguro** com confirmação
- **Redirecionamento inteligente**

### 📊 Dashboard Reativo
- **Estatísticas em tempo real**
- **Notificações automáticas**
- **Atualizações sem reload**
- **Interface responsiva**
- **Loading states elegantes**

### 🎯 Funcionalidades Específicas
- **Ações contextuais** na tabela
- **Filtros e exportação**
- **Menu hierárquico**

## 🔄 Integração com API

### Endpoints Principais
```javascript
POST /api/auth/login          # Login de usuário
GET  /api/auth/verify         # Verificação de token
POST /api/auth/refresh        # Renovação de token
GET  /api/schedules           # Lista de agendamentos
PATCH /api/schedules/:id/status # Atualização de status
```

### Cliente API Vue.js
```javascript
class VueApiClient {
    async request(endpoint, options = {}) {
        // Configuração automática de JWT
        // Tratamento de erros 401
        // Redirecionamento para login
    }
}
```

## 🎨 Sistema de Notificações

### Tipos de Notificação
- **Success** (verde) - Ações bem-sucedidas
- **Error** (vermelho) - Erros e falhas
- **Warning** (amarelo) - Avisos importantes
- **Info** (azul) - Informações gerais

### Características
- **Posicionamento** no canto superior direito
- **Animações** suaves de entrada/saída
- **Auto-dismiss** após 5 segundos
- **Clique para fechar** manualmente

## 📱 Responsividade

### Breakpoints
- **Desktop** (>768px) - Layout completo
- **Tablet** (768px) - Ajustes de layout
- **Mobile** (<480px) - Layout otimizado

### Adaptações
- **Sidebar colapsável** em mobile
- **Notificações adaptativas**
- **Tabelas com scroll** horizontal
- **Formulários otimizados**

## 🔒 Segurança

### Medidas Implementadas
- **JWT Tokens** para autenticação
- **Verificação automática** de tokens
- **Limpeza de dados** sensíveis
- **Proteção de rotas** com AuthGuard
- **Renovação automática** de tokens

### Boas Práticas
- **Não armazenamento** de senhas
- **Tokens com expiração**
- **Verificação contínua**
- **Redirecionamento seguro**

## 📚 Documentação

### Arquivos de Documentação
- **[API_FRONTEND_DOCUMENTATION.md](API_FRONTEND_DOCUMENTATION.md)** - Documentação da API
- **[LOGIN_README.md](LOGIN_README.md)** - Guia da tela de login
- **[VUE_IMPLEMENTATION.md](VUE_IMPLEMENTATION.md)** - Detalhes da implementação Vue.js
- **[COMO_USAR_VUE.md](COMO_USAR_VUE.md)** - Guia prático de uso
- **[IMPLEMENTACAO_COMPLETA.md](IMPLEMENTACAO_COMPLETA.md)** - Resumo técnico

### Referências Técnicas
- **[Vue.js 3 Docs](https://vuejs.org/)** - Documentação oficial
- **[Axios Docs](https://axios-http.com/)** - Cliente HTTP
- **[Font Awesome](https://fontawesome.com/)** - Ícones

## 🎯 Status do Projeto

### ✅ Implementado
- **Tela de login** com autenticação JWT
- **Dashboard Vue.js** completamente funcional
- **Sistema de notificações** moderno
- **Integração com API** completa
- **Responsividade** total
- **Documentação** completa

### 🔄 Em Desenvolvimento
- **Páginas específicas** dos módulos
- **Relatórios** detalhados
- **Configurações** do sistema

### 🔮 Próximos Passos
- **Vue Router** para navegação SPA
- **Pinia** para gerenciamento de estado
- **TypeScript** para tipagem
- **PWA** para funcionalidades offline

## 🚀 Exemplo de Uso

### 1. Login
```bash
# Acessar login.html
# Digitar usuário e senha
# Clicar em "Entrar"
# Redirecionamento automático para dashboard
```

### 2. Dashboard
```bash
# Interface carrega automaticamente
# Dados são buscados da API
# Notificações aparecem conforme necessário
# Interação reativa com componentes
```

### 3. Desenvolvimento
```javascript
// Adicionar novo componente
const NovoComponente = {
    template: `<div>{{ mensagem }}</div>`,
    data() {
        return { mensagem: 'Olá Vue.js!' };
    }
};

// Registrar no main.js
app.component('novo-componente', NovoComponente);
```

## 🐛 Solução de Problemas

### Problemas Comuns
1. **API não responde** - Verificar se está rodando na porta 3000
2. **Login não funciona** - Verificar credenciais e token
3. **Componentes não carregam** - Verificar console do navegador
4. **Dados não atualizam** - Verificar conexão com API

### Debug
```javascript
// Acessar instância Vue
console.log(window.VueApp);

// Verificar API client
console.log(window.apiClient);

// Ver dados atuais
console.log(window.VueApp.$data);
```

## 🎉 Conclusão

O sistema LogiReceive foi modernizado com sucesso usando Vue.js 3, oferecendo:

✅ **Interface moderna** e reativa
✅ **Autenticação segura** com JWT
✅ **Componentes reutilizáveis**
✅ **Integração completa** com API
✅ **Experiência fluida** para o usuário
✅ **Código bem documentado**

**🚀 Pronto para produção com Vue.js e API REST!**

## 📄 Licença

Este projeto faz parte do sistema YOUWARE/LogiReceive.
Desenvolvido com ❤️ em Vue.js 3. 

## 🛠️ Instruções para o Backend (Integração NFe)

Estas instruções são essenciais para garantir a integração correta entre o front-end e o back-end no sistema de agendamento via NFe:

### 1. Endpoints REST obrigatórios
- **GET /api/clients**: Retorna lista de clientes cadastrados. Resposta: `{ "clients": [ { "cnpj": "...", "name": "..." } ] }`. Requer autenticação JWT.
- **POST /api/products/check-existing**: Recebe array de produtos e retorna se já existem no banco. Requer autenticação JWT.
- **POST /api/schedules/create-with-products**: Cria novo agendamento a partir dos dados parseados do XML da NFe. Body: `{ nfe_data: { ... } }`. Requer autenticação JWT.
- **GET /api/schedules**: Lista agendamentos com filtros e paginação. Requer autenticação JWT.

### 2. Autenticação JWT
- Todos os endpoints (exceto login) exigem header: `Authorization: Bearer <token>`.
- Backend deve validar o token e retornar 401 se inválido.

### 3. Banco de Dados
- Tabela de clientes, produtos e agendamentos devem existir e estar compatíveis com os contratos da API.

### 4. CORS
- Backend deve aceitar requisições do front-end (localhost, 127.0.0.1, origem de arquivo).

### 5. Tratamento de Erros
- Retornar status HTTP adequados (404, 400, 401, etc) e mensagens de erro claras.

### 6. Exemplo de rota (Node.js/Express)
```js
app.get('/api/clients', authenticateJWT, async (req, res) => {
  const clients = await db.query('SELECT cnpj, name FROM clients');
  res.json({ clients });
});
```

### 7. Documentação
- O backend deve seguir fielmente os contratos de request/response descritos em `API_FRONTEND_DOCUMENTATION.md`.

---

## 📜 Histórico e Notas Técnicas

- Todos os componentes Vue.js foram criados de forma modular, com integração total à API REST.
- O sistema de agendamento via NFe faz o parse do XML no front-end e envia os dados já estruturados para o backend.
- O fluxo de autenticação é JWT, com renovação automática e proteção de rotas.
- O sistema foi testado com mock e com API real, e possui tratamento de erros e feedback visual em todas as ações.
- Para detalhes completos dos endpoints e contratos, consulte `API_FRONTEND_DOCUMENTATION.md`. 