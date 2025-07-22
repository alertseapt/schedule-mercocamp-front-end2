// Exemplo de uso do sistema de permissões
// Este arquivo demonstra como usar as funções de permissão implementadas

// Exemplo 1: Verificar permissão específica
function showCreateScheduleButton() {
    const createButton = document.getElementById('createScheduleButton');
    if (checkPermission('create_schedule')) {
        createButton.style.display = 'block';
    } else {
        createButton.style.display = 'none';
    }
}

// Exemplo 2: Verificar nível de acesso
function showAdminPanel() {
    const adminPanel = document.getElementById('adminPanel');
    if (checkUserLevel(2)) { // Nível 2 ou superior (Administrador)
        adminPanel.style.display = 'block';
    } else {
        adminPanel.style.display = 'none';
    }
}

// Exemplo 3: Verificar se é desenvolvedor
function showDeveloperTools() {
    const devTools = document.getElementById('developerTools');
    if (checkUserLevel(0)) { // Nível 0 (Desenvolvedor)
        devTools.style.display = 'block';
    } else {
        devTools.style.display = 'none';
    }
}

// Exemplo 4: Aplicar permissões condicionais
function applyPermissions() {
    const currentUser = JSON.parse(localStorage.getItem('user'));
    
    if (!currentUser) {
        console.log('Usuário não logado');
        return;
    }
    
    console.log(`Usuário: ${currentUser.name || currentUser.user}`);
    console.log(`Nível: ${currentUser.level_access}`);
    
    // Aplicar permissões baseadas no nível
    switch (currentUser.level_access) {
        case 0: // Desenvolvedor
            console.log('🔧 Desenvolvedor - Acesso total');
            showDeveloperTools();
            showAdminPanel();
            showCreateScheduleButton();
            break;
            
        case 1: // Usuário
            console.log('👤 Usuário - Acesso limitado');
            showCreateScheduleButton();
            break;
            
        case 2: // Administrador
            console.log('👑 Administrador - Acesso administrativo');
            showAdminPanel();
            showCreateScheduleButton();
            break;
            
        case 3: // Gerente
            console.log('👨‍💼 Gerente - Acesso gerencial');
            showCreateScheduleButton();
            break;
            
        default:
            console.log('❓ Nível desconhecido');
    }
}

// Exemplo 5: Função utilitária para exibir/ocultar elementos baseado em permissões
function toggleElementByPermission(elementId, permission) {
    const element = document.getElementById(elementId);
    if (element) {
        if (checkPermission(permission)) {
            element.style.display = 'block';
        } else {
            element.style.display = 'none';
        }
    }
}

// Exemplo 6: Função utilitária para exibir/ocultar elementos baseado em nível
function toggleElementByLevel(elementId, requiredLevel) {
    const element = document.getElementById(elementId);
    if (element) {
        if (checkUserLevel(requiredLevel)) {
            element.style.display = 'block';
        } else {
            element.style.display = 'none';
        }
    }
}

// Exemplo 7: Inicializar permissões ao carregar a página
function initializePagePermissions() {
    // Verificar se usuário está logado
    const userData = localStorage.getItem('user');
    if (!userData) {
        console.log('Usuário não autenticado');
        return;
    }
    
    try {
        const user = JSON.parse(userData);
        console.log('Aplicando permissões para:', user.name || user.user);
        
        // Aplicar permissões específicas
        toggleElementByPermission('createScheduleBtn', 'create_schedule');
        toggleElementByPermission('manageUsersBtn', 'manage_users');
        toggleElementByPermission('editScheduleBtn', 'edit_schedule');
        toggleElementByPermission('deleteScheduleBtn', 'delete_schedule');
        toggleElementByPermission('manageProductsBtn', 'manage_products');
        toggleElementByPermission('viewReportsBtn', 'view_reports');
        
        // Aplicar permissões por nível
        toggleElementByLevel('developerPanel', 0);
        toggleElementByLevel('adminPanel', 2);
        toggleElementByLevel('managerPanel', 3);
        
    } catch (error) {
        console.error('Erro ao aplicar permissões:', error);
    }
}

// Exemplo 8: Verificar múltiplas permissões
function hasAnyPermission(permissions) {
    return permissions.some(permission => checkPermission(permission));
}

function hasAllPermissions(permissions) {
    return permissions.every(permission => checkPermission(permission));
}

// Exemplo de uso:
// if (hasAnyPermission(['edit_schedule', 'delete_schedule'])) {
//     // Mostrar botões de edição
// }

// if (hasAllPermissions(['manage_users', 'manage_products'])) {
//     // Mostrar painel administrativo completo
// }

// Executar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    initializePagePermissions();
});