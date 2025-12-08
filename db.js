// db.js
// FUNÇÕES PURAS PARA INTERAGIR COM O INDEXEDDB (PERSISTÊNCIA LOCAL)

const DB_NAME = 'AcervoDeLuxoDB';
const STORE_NAME = 'conteudoPDFs';
let db;

// 1. Abrir e inicializar o banco de dados
export async function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1); 

        request.onerror = (event) => {
            console.error("Erro ao abrir IndexedDB:", event.target.error);
            reject(new Error("Database error"));
        };

        request.onsuccess = (event) => {
            db = event.target.result;
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
                objectStore.createIndex('titulo', 'titulo', { unique: false });
            }
        };
    });
}

// 2. Adicionar um novo metadado de PDF (CREATE)
export async function addPDF(pdfData) {
    if (!db) await openDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    return new Promise((resolve, reject) => {
        const request = store.add(pdfData);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// 3. Listar todos os metadados de PDFs (READ)
export async function getAllPDFs() {
    if (!db) await openDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// 4. Atualizar um metadado de PDF (UPDATE)
export async function updatePDF(pdfData) {
    if (!db) await openDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    // O IndexedDB precisa do objeto COMPLETO com o ID para atualizar
    return new Promise((resolve, reject) => {
        const request = store.put(pdfData); 
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// 5. Deletar um metadado de PDF (DELETE)
export async function deletePDF(id) {
    if (!db) await openDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    return new Promise((resolve, reject) => {
        // ID precisa ser inteiro
        const request = store.delete(parseInt(id, 10)); 
        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error);
    });
}

// Inicialização imediata do DB para garantir que esteja pronto para os imports
openDB().catch(e => console.error("Falha na inicialização do DB.", e));