/**
 * handlers.js - Event Handlers
 * Responsável por manipular eventos do usuário
 */

const Handlers = {
    /**
     * Inicializar todos os event handlers
     */
    init() {
        // Inicializar filtros
        Filters.init();

        // Event listeners dos modais e botões
        this.setupCameraHandlers();
        this.setupFileHandlers();
    },

    /**
     * Incrementar figurinha
     */
    async incrementFigurinha(code) {
        try {
            const newQuantity = await DB.incrementFigurinha(code);
            UI.updateCardFigurinha(code, newQuantity);
            UI.updateProgress();
            console.log(`✅ ${code} incrementada para ${newQuantity}`);
        } catch (error) {
            console.error('Erro ao incrementar figurinha:', error);
        }
    },

    /**
     * Decrementar figurinha
     */
    async decrementFigurinha(code) {
        try {
            const newQuantity = await DB.decrementFigurinha(code);
            UI.updateCardFigurinha(code, newQuantity);
            UI.updateProgress();
            console.log(`✅ ${code} decrementada para ${newQuantity}`);
        } catch (error) {
            console.error('Erro ao decrementar figurinha:', error);
        }
    },

    /**
     * Configurar handlers da câmera
     */
    setupCameraHandlers() {
        const scanBtn = document.getElementById('scanBtn');
        const cameraModal = document.getElementById('cameraModal');
        const closeModalBtn = document.getElementById('closeModalBtn');

        scanBtn.addEventListener('click', () => {
            cameraModal.classList.remove('hidden');
            CameraOCR.openCamera();
        });

        closeModalBtn.addEventListener('click', () => {
            cameraModal.classList.add('hidden');
            CameraOCR.closeCamera();
        });

        // Fechar modal ao clicar fora
        cameraModal.addEventListener('click', (e) => {
            if (e.target === cameraModal) {
                cameraModal.classList.add('hidden');
                CameraOCR.closeCamera();
            }
        });
    },

    /**
     * Configurar handlers de upload/download
     */
    setupFileHandlers() {
        const downloadBtn = document.getElementById('downloadBtn');
        const uploadBtn = document.getElementById('uploadBtn');
        const uploadInput = document.getElementById('uploadInput');

        downloadBtn.addEventListener('click', () => {
            ExportImport.downloadJSON();
        });

        uploadBtn.addEventListener('click', () => {
            uploadInput.click();
        });

        uploadInput.addEventListener('change', (e) => {
            ExportImport.handleFileUpload(e);
        });
    }
};
