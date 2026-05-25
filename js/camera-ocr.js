/**
 * camera-ocr.js - Câmera e OCR
 * Responsável por capturar fotos e processar OCR
 */

const CameraOCR = {
    video: null,
    canvas: null,
    stream: null,
    isProcessing: false,

    /**
     * Abrir câmera
     */
    async openCamera() {
        this.video = document.getElementById('videoFeed');
        this.canvas = document.getElementById('captureCanvas');

        try {
            // Solicitar acesso à câmera
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });

            this.video.srcObject = this.stream;
            console.log('✅ Câmera aberta');

            this.setupCaptureButton();
        } catch (error) {
            console.error('❌ Erro ao acessar câmera:', error);
            alert('Não foi possível acessar a câmera. Verifique as permissões.');
        }
    },

    /**
     * Fechar câmera
     */
    closeCamera() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        console.log('✅ Câmera fechada');
    },

    /**
     * Configurar botão de captura
     */
    setupCaptureButton() {
        const captureBtn = document.getElementById('captureBtn');
        const processBtn = document.getElementById('processBtn');

        captureBtn.onclick = async () => {
            if (this.isProcessing) return;

            this.isProcessing = true;
            captureBtn.classList.add('hidden');
            processBtn.classList.remove('hidden');

            try {
                // Capturar frame
                const imageData = this.captureFrame();

                // Processar OCR
                const text = await this.processOCR(imageData);

                // Mostrar resultado
                this.showOCRResult(text);

                // Tentar incrementar figurinha
                if (text) {
                    await this.handleDetectedCode(text);
                }
            } catch (error) {
                console.error('Erro no processamento:', error);
                alert('Erro ao processar imagem');
            } finally {
                this.isProcessing = false;
                captureBtn.classList.remove('hidden');
                processBtn.classList.add('hidden');
            }
        };
    },

    /**
     * Capturar frame da câmera
     */
    captureFrame() {
        const ctx = this.canvas.getContext('2d');
        this.canvas.width = this.video.videoWidth;
        this.canvas.height = this.video.videoHeight;
        ctx.drawImage(this.video, 0, 0);
        return this.canvas.toDataURL('image/jpeg');
    },

    /**
     * Processar OCR com Tesseract.js
     */
    async processOCR(imageData) {
        try {
            console.log('🔄 Processando OCR...');
            
            const result = await Tesseract.recognize(
                imageData,
                'eng',
                {
                    logger: m => console.log('OCR Progress:', m.progress)
                }
            );

            let text = result.data.text
                .toUpperCase()
                .replace(/\s+/g, '')
                .substring(0, 10);

            console.log('✅ OCR resultado:', text);
            return text;
        } catch (error) {
            console.error('Erro no OCR:', error);
            return '';
        }
    },

    /**
     * Mostrar resultado do OCR
     */
    showOCRResult(text) {
        const ocrResult = document.getElementById('ocrResult');
        const ocrText = document.getElementById('ocrText');

        if (text) {
            ocrText.textContent = text;
            ocrResult.classList.remove('hidden');
        } else {
            ocrResult.classList.add('hidden');
        }
    },

    /**
     * Manipular código detectado
     */
    async handleDetectedCode(detectedText) {
        // Tentar encontrar figurinha por código
        const figurinhas = DB.extractAllFigurinha();
        
        // Procurar correspondência exata ou parcial
        let foundFigurinha = figurinhas.find(f => f.code === detectedText);
        
        if (!foundFigurinha) {
            // Procurar prefixo (ex: MEX detectado em MEX1)
            foundFigurinha = figurinhas.find(f => 
                detectedText.includes(f.code) || f.code.includes(detectedText)
            );
        }

        if (foundFigurinha) {
            // Incrementar figurinha
            await Handlers.incrementFigurinha(foundFigurinha.code);
            
            // Mostrar confirmação
            setTimeout(() => {
                alert(`✓ ${foundFigurinha.code} incrementada!`);
            }, 500);
        } else {
            console.log('Figurinha não encontrada:', detectedText);
        }
    }
};
