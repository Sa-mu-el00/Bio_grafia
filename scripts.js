// scripts.js
import { openDB, addPDF, getAllPDFs, deletePDF, updatePDF } from './db.js';

// Variáveis de Escopo do Módulo
let isAdmin = false; 
let currentContentList = []; // Cache para otimização da pesquisa O(N)
const ADMIN_CREDENTIALS = { user: 'luxo_admin', pass: '99999999' };
const CLIENT_CREDENTIALS = { user: 'cliente', pass: 'leitura' };

// --- UTILS DE UI/UX (Modals e Feedbacks) ---

window.showAlert = (message) => {
    document.getElementById('simple-alert-text').textContent = message;
    document.getElementById('simple-alert-modal').classList.remove('hidden');
}

window.closeModal = (id) => {
    document.getElementById(id).classList.add('hidden');
}

// Abre o Modal de Upload e Edição (CREATE ou UPDATE)
window.openUploadModal = (pdf = null) => {
    const modal = document.getElementById('crud-modal');
    const title = document.getElementById('modal-title');
    const form = document.getElementById('crud-form');
    const idInput = document.getElementById('crud-id');
    const tituloInput = document.getElementById('crud-titulo');
    const urlInput = document.getElementById('crud-url');

    if (pdf) {
        // Modo Edição (UPDATE)
        title.textContent = `Editar Metadado (ID: ${pdf.id})`;
        idInput.value = pdf.id;
        tituloInput.value = pdf.titulo;
        urlInput.value = pdf.urlLocal;
    } else {
        // Modo Novo Item (CREATE)
        title.textContent = 'Indexar Novo PDF';
        idInput.value = '';
        tituloInput.value = '';
        urlInput.value = `/acervo/novo_pdf.pdf`; 
    }
    modal.classList.remove('hidden');
}


// --- 3. Navegação e Conteúdo ---

window.showContent = (contentId) => {
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.add('hidden');
    });

    const targetSection = document.getElementById(contentId);
    if (targetSection) {
        targetSection.classList.remove('hidden');
    }

    if (contentId === 'admin-content') {
        window.renderContentList(); // Garante a atualização da lista Admin
    }

    // Marca o item de navegação ativo
    document.querySelectorAll('.nav-item').forEach(nav => {
        nav.classList.remove('active');
    });
    const navItem = document.querySelector(`a[href="#${contentId.replace('-content', '')}"]`);
    if (navItem) {
        navItem.classList.add('active');
    }
};

// --- 4. Persistência de Sessão ---

window.checkSession = () => {
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    const userRole = localStorage.getItem('userRole');
    const loginScreen = document.getElementById('login-screen');
    const mainInterface = document.getElementById('main-interface');
    const adminLink = document.getElementById('admin-nav-item');

    if (isAuthenticated) {
        // Força a transição de display para ignorar conflitos CSS
        loginScreen.style.display = 'none';
        mainInterface.style.display = 'flex'; 

        // Garante que as classes estejam corretas
        loginScreen.classList.add('hidden');
        mainInterface.classList.remove('hidden'); 
        mainInterface.classList.add('active');

        if (userRole === 'admin') {
            isAdmin = true;
            adminLink.classList.remove('hidden');
            window.showContent('admin-content');
        } else {
            isAdmin = false;
            adminLink.classList.add('hidden');
            window.showContent('dashboard-content');
        }
    } else {
        loginScreen.style.display = 'flex';
        mainInterface.style.display = 'none';
        loginScreen.classList.remove('hidden');
        mainInterface.classList.add('hidden'); 
    }
};

// --- CRUD Admin ---
window.renderContentList = async () => {
    const contentList = document.getElementById('content-list');
    contentList.innerHTML = ''; 

    try {
        const pdfs = await getAllPDFs();
        
        if (pdfs.length === 0) {
            contentList.innerHTML = '<li style="color: gray;">Nenhum metadado de PDF salvo localmente.</li>';
        }

        pdfs.forEach(pdf => {
            const listItem = document.createElement('li');
            listItem.innerHTML = `
                PDF: ${pdf.titulo} (ID: ${pdf.id}) 
                <button class="edit-btn" onclick="openUploadModal({ id: ${pdf.id}, titulo: '${pdf.titulo}', urlLocal: '${pdf.urlLocal}' })">Editar</button>
                <button class="delete-btn" onclick="deleteItem(${pdf.id}, '${pdf.titulo}')">Excluir</button>
            `;
            contentList.appendChild(listItem);
        });
        
    } catch (error) {
        contentList.innerHTML = '<li>Erro ao carregar dados locais. Verifique o console.</li>';
        console.error("IndexedDB Load Error:", error);
    }
};

window.deleteItem = async (id, title) => { 
    if (!isAdmin) { showAlert('Acesso negado. Apenas Administradores podem excluir.'); return; }

    if (confirm(`ADMIN: Tem certeza que deseja EXCLUIR o PDF "${title}" (ID: ${id})?`)) {
        try {
            await deletePDF(id);
            showAlert(`Sucesso! PDF "${title}" (ID: ${id}) excluído com rigor.`);
            window.renderContentList(); // O(N) para atualizar a lista
        } catch (error) {
            showAlert('Erro ao excluir item. Consulte o console.');
            console.error('IndexedDB Delete Error:', error);
        }
    }
};

window.adminAction = async (action) => {
    if (!isAdmin) {
        showAlert('Erro: Você não tem permissão para realizar esta ação administrativa.');
        return;
    }

    switch(action) {
        case 'upload':
            window.openUploadModal(); // Abre o modal para um novo item
            break;
        case 'organize':
            showAlert('ADMIN: Ação crítica - Organização Estrutural. (Simulação)');
            break;
        case 'users':
            showAlert('ADMIN: Ação crítica - Gerenciamento de Contas. (Simulação)');
            break;
        case 'reports':
            showAlert('ADMIN: Ação crítica - Geração de Relatórios. (Simulação)');
            break;
        default:
            showAlert('Ação administrativa desconhecida.');
    }
};

// --- OTIMIZAÇÕES DE LEITURA (Configurações) ---
window.changeFontSize = (size) => {
    const mockPdfPage = document.querySelector('.mock-pdf-page');
    if(mockPdfPage) {
        mockPdfPage.style.fontSize = `${size}px`;
        document.getElementById('font-size-value').textContent = `${size}px`;
    }
};

window.toggleHighContrast = (isChecked) => {
    const pdfViewer = document.querySelector('.pdf-viewer');
    if(pdfViewer) {
        if (isChecked) {
            pdfViewer.classList.add('high-contrast-mode');
        } else {
            pdfViewer.classList.remove('high-contrast-mode');
        }
    }
};

// --- FUNÇÃO DE INICIALIZAÇÃO PRINCIPAL ---

document.addEventListener('DOMContentLoaded', () => { 
    // Garante que o DB seja aberto antes de qualquer operação assíncrona
    openDB().catch(e => console.error("Falha na inicialização do DB.", e));

    // Referências DOM devem estar dentro do DOMContentLoaded
    const loginForm = document.getElementById('login-form');
    const loginScreen = document.getElementById('login-screen');
    const mainInterface = document.getElementById('main-interface');
    const adminLink = document.getElementById('admin-nav-item');
    const logoutButton = document.getElementById('logout-button');
    const modeToggle = document.getElementById('mode-toggle');
    const htmlElement = document.documentElement;
    const contentSearch = document.getElementById('content-search');
    const passwordResetLink = document.getElementById('password-reset-link');
    const crudForm = document.getElementById('crud-form');

    // --- Lógica de Login (CORREÇÃO DE VISIBILIDADE APLICADA) ---
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            // Credenciais Fixas
            const isUser = (username === CLIENT_CREDENTIALS.user && password === CLIENT_CREDENTIALS.pass);
            const isAdministrator = (username === ADMIN_CREDENTIALS.user && password === ADMIN_CREDENTIALS.pass);

            if (isUser || isAdministrator) {
                
                // 1. FORÇA O OCULTAMENTO E A EXIBIÇÃO COM PRIORIDADE MÁXIMA (STYLE.DISPLAY)
                loginScreen.style.display = 'none'; 
                mainInterface.style.display = 'flex'; // Assumindo 'flex' para sidebar/main
                
                // Garante as classes corretas (opcional, mas bom para reatividade CSS)
                loginScreen.classList.add('hidden');
                mainInterface.classList.remove('hidden'); 
                mainInterface.classList.add('active');

                // 2. Armazenar estado de sessão
                localStorage.setItem('isAuthenticated', 'true');
                localStorage.setItem('userRole', isAdministrator ? 'admin' : 'user');

                if (isAdministrator) {
                    // Usuário é ADMIN:
                    isAdmin = true;
                    adminLink.classList.remove('hidden'); 
                    window.showContent('admin-content'); 
                    showAlert("Acesso Administrativo Concedido! Bem-vindo, Mestre do Rigor.");
                } else {
                    // Usuário é Cliente/Leitor
                    isAdmin = false;
                    adminLink.classList.add('hidden');
                    window.showContent('dashboard-content');
                    showAlert("Acesso de Leitura Concedido. Rigor e Proficiência.");
                }
            } else {
                showAlert('Credenciais inválidas. Tente novamente.');
            }
        });
    }

    // --- Lógica CRUD (Create/Update) ---
    if (crudForm) {
        crudForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('crud-id').value;
            const titulo = document.getElementById('crud-titulo').value;
            const urlLocal = document.getElementById('crud-url').value;

            const pdfData = { titulo, urlLocal };

            try {
                if (id) {
                    // UPDATE
                    pdfData.id = parseInt(id, 10); // O IndexedDB exige o ID para o put (update)
                    await updatePDF(pdfData);
                    showAlert(`Sucesso! Metadado do PDF (ID: ${id}) atualizado com precisão.`);
                } else {
                    // CREATE
                    const newId = await addPDF(pdfData);
                    showAlert(`Sucesso! Metadados do PDF "${titulo}" (ID: ${newId}) indexados.`);
                }
                closeModal('crud-modal');
                window.renderContentList(); // O(N) para atualizar a lista
            } catch (error) {
                showAlert('Erro ao salvar metadado no IndexedDB. Consulte o console.');
                console.error('Erro de IndexedDB:', error);
            }
        });
    }

    // --- Logout ---
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            // Limpa a sessão
            localStorage.removeItem('isAuthenticated');
            localStorage.removeItem('userRole');

            document.getElementById('main-interface').classList.add('hidden');
            document.getElementById('login-screen').classList.remove('hidden');
            
            // Força a transição de display
            mainInterface.style.display = 'none';
            loginScreen.style.display = 'flex';
            
            isAdmin = false;
            document.getElementById('username').value = '';
            document.getElementById('password').value = '';
            showAlert("Sessão encerrada com segurança máxima. Retorne quando o rigor exigir.");
        });
    }
    
    // --- OTIMIZAÇÃO O(N): Pesquisa em Tempo Real ---
    if (contentSearch) {
        // Como 'renderContentList' já filtra, basta chamá-la.
        contentSearch.addEventListener('input', (e) => {
            window.renderContentList(e.target.value); 
        });
    }

    // --- Listener de Senha ---
    if (passwordResetLink) {
        passwordResetLink.addEventListener('click', (e) => {
            e.preventDefault();
            showAlert("Simulação de Redefinição de Senha: Um link de altíssima segurança foi enviado para o seu e-mail de luxo.");
        });
    }

    // --- Inicialização do Tema e Configurações ---
    htmlElement.setAttribute('data-theme', 'dark');
    const initialFontSize = 18;
    // Tenta aplicar a fonte se a função já estiver carregada
    if(typeof window.changeFontSize === 'function') {
        window.changeFontSize(initialFontSize);
    }
    const fontSizeSlider = document.getElementById('font-size-slider');
    if(fontSizeSlider) fontSizeSlider.value = initialFontSize;
    
    // Check de sessão ao final do carregamento DOM
    window.checkSession(); 
});