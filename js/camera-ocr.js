/**
 * Figurinhas Copa 2026 - WebRTC Camera & OCR Engine
 * Uses local WebRTC streams, canvas cropping, and Tesseract.js (local OCR Worker) to read sticker codes.
 */

let videoStream = null;
let tesseractWorker = null;

/**
 * Initializes the Tesseract OCR Worker.
 * Caches the worker globally for sub-second recognition on subsequent scans.
 */
async function initOCRWorker(progressCallback) {
  if (tesseractWorker) {
    return tesseractWorker;
  }

  updateOCRProgress('Preparando processador OCR...', 0.1);
  
  try {
    // Create local Tesseract Worker using 'eng' language (3x smaller than 'por' and extremely accurate for alphanumeric codes)
    tesseractWorker = await Tesseract.createWorker('eng', 1, {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          updateOCRProgress('Reconhecendo texto...', m.progress);
        } else if (m.status === 'loading language traineddata') {
          updateOCRProgress('Carregando biblioteca de idiomas...', m.progress);
        }
      }
    });
    
    // Set OCR parameters: only look for uppercase letters, numbers, and space to prevent casing mismatches
    await tesseractWorker.setParameters({
      tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ ',
    });
    
    return tesseractWorker;
  } catch (err) {
    console.error('Failed to initialize Tesseract Worker:', err);
    throw new Error('Falha ao inicializar motor de inteligência artificial.');
  }
}

/**
 * Starts the WebRTC camera stream inside the video element.
 */
async function startCamera() {
  const videoEl = document.getElementById('camera-video');
  if (!videoEl) return;

  // Stop any active streams first
  stopCamera();

  // WebRTC options: prefer rear/back camera
  const constraints = {
    audio: false,
    video: {
      facingMode: { ideal: 'environment' },
      width: { ideal: 1280 },
      height: { ideal: 720 }
    }
  };

  try {
    videoStream = await navigator.mediaDevices.getUserMedia(constraints);
    videoEl.srcObject = videoStream;
  } catch (err) {
    console.warn('Could not open rear camera. Trying any available camera...', err);
    try {
      // Fallback to any camera
      videoStream = await navigator.mediaDevices.getUserMedia({ audio: false, video: true });
      videoEl.srcObject = videoStream;
    } catch (fallbackErr) {
      console.error('Camera access completely blocked:', fallbackErr);
      showToast('❌ Permissão de câmera negada ou câmera não encontrada.', 'error');
      throw fallbackErr;
    }
  }
}

/**
 * Stops the active WebRTC camera stream and releases hardware.
 */
function stopCamera() {
  if (videoStream) {
    videoStream.getTracks().forEach(track => track.stop());
    videoStream = null;
  }
  const videoEl = document.getElementById('camera-video');
  if (videoEl) {
    videoEl.srcObject = null;
  }
}

/**
 * Updates the OCR loading dialog with text and progress bar.
 */
function updateOCRProgress(text, progress) {
  const textEl = document.getElementById('ocr-loader-text');
  const barFillEl = document.getElementById('ocr-progress-fill');
  
  if (textEl) textEl.textContent = text;
  if (barFillEl) {
    const percentage = Math.round(progress * 100);
    barFillEl.style.width = `${percentage}%`;
  }
}

/**
 * Displays or hides the OCR progress overlay.
 */
function toggleOCRLoader(show) {
  const loader = document.getElementById('ocr-loader');
  if (loader) {
    loader.style.display = show ? 'flex' : 'none';
  }
}

/**
 * Captures a cropped snapshot from the active video feed and processes OCR.
 */
async function captureAndProcessOCR() {
  const videoEl = document.getElementById('camera-video');
  if (!videoEl || !videoStream) {
    showToast('❌ Câmera não está ativa.', 'error');
    return;
  }

  // Create an offscreen canvas
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  // Set dimensions to match natural video
  const width = videoEl.videoWidth;
  const height = videoEl.videoHeight;
  canvas.width = width;
  canvas.height = height;
  
  // Draw the current video frame on canvas
  ctx.drawImage(videoEl, 0, 0, width, height);

  // Crop the canvas to the centered scanning reticle area (60% width, 40% height) for high OCR quality
  const cropWidth = Math.round(width * 0.6);
  const cropHeight = Math.round(height * 0.4);
  const cropX = Math.round((width - cropWidth) / 2);
  const cropY = Math.round((height - cropHeight) / 2);

  const croppedCanvas = document.createElement('canvas');
  croppedCanvas.width = cropWidth;
  croppedCanvas.height = cropHeight;
  const croppedCtx = croppedCanvas.getContext('2d');
  
  croppedCtx.drawImage(canvas, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
  
  // Optional pre-processing to increase contrast (helpful for OCR)
  preprocessImageForOCR(croppedCtx, cropWidth, cropHeight);

  // Run OCR
  await runOCR(croppedCanvas);
}

/**
 * Performs professional greyscale conversion and adaptive contrast stretching on captured canvas.
 */
function preprocessImageForOCR(ctx, w, h) {
  try {
    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      // High-quality luminance greyscale conversion
      const grey = Math.round(0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2]);
      
      // Mild contrast stretching to boost font definitions without destroying shapes in variable lighting
      let contrastValue = grey;
      if (grey < 100) {
        contrastValue = Math.max(0, grey - 35);
      } else if (grey > 150) {
        contrastValue = Math.min(255, grey + 35);
      }
      
      data[i] = contrastValue;     // R
      data[i+1] = contrastValue;   // G
      data[i+2] = contrastValue;   // B
    }
    ctx.putImageData(imgData, 0, 0);
  } catch (e) {
    console.warn('Canvas pre-processing skipped (cross-origin or unsupported):', e);
  }
}

/**
 * Sends a canvas or image source to Tesseract.js, extracts code, and increments quantity.
 */
async function runOCR(imageSource) {
  toggleOCRLoader(true);
  updateOCRProgress('Iniciando Inteligência Artificial...', 0.0);

  try {
    const worker = await initOCRWorker();
    updateOCRProgress('Lendo código da figurinha...', 0.4);
    
    const { data: { text } } = await worker.recognize(imageSource);
    console.log('OCR Raw Text Output:', text);
    
    // Parse code from text
    const processedCode = parseStickerCode(text);
    
    if (processedCode) {
      // Increment sticker quantity in DB
      const result = await incrementStickerByCode(processedCode);
      if (result) {
        showToast(`✓ Código reconhecido: ${processedCode}. Adicionada à coleção!`, 'success');
        
        // Highlight the card in the UI if visible
        triggerCardPulseHighlight(processedCode);
        
        // Close camera modal
        document.getElementById('modal-camera').classList.remove('show');
        stopCamera();
      }
    } else {
      showToast('❌ Não foi possível identificar um código de figurinha válido. Tente novamente.', 'error');
    }
  } catch (error) {
    console.error('OCR Process failed:', error);
    showToast('❌ Erro no processamento de imagem do scanner.', 'error');
  } finally {
    toggleOCRLoader(false);
  }
}

/**
 * Standardizes raw text and extracts sticker codes using intelligent correction and regular expressions.
 */
function parseStickerCode(rawText) {
  if (!rawText) return null;

  // Clean characters, trim space, convert to uppercase
  let cleanText = rawText.toUpperCase().replace(/[^A-Z0-9\s]/g, '');
  
  // Direct match for "00" (intro sticker)
  if (/\b00\b/.test(cleanText) || cleanText.trim() === '00') {
    return '00';
  }

  // Regex matching codes like "BRA 5", "MEX10", "FWC 12", "CC3"
  // (Group 1: letters like BRA/FWC/CC, Group 2: numbers)
  const regex = /\b(FWC|CC|[A-Z]{3})\s*(\d{1,2})\b/;
  const match = cleanText.match(regex);

  if (match) {
    let letters = match[1];
    // Strip leading zeros (e.g., "05" -> "5") to match database keys
    let digits = parseInt(match[2], 10).toString();
    
    // Formulate final code
    let finalCode = `${letters}${digits}`;
    
    // Validate if this code actually exists in our collection list
    if (validateStickerExists(finalCode)) {
      return finalCode;
    }
  }

  // ADVANCED SMART CORRECTIONS
  // Common mistakes: O instead of 0, I or l instead of 1, S instead of 5, Z instead of 2.
  const lines = cleanText.split('\n');
  for (let line of lines) {
    let words = line.trim().split(/\s+/);
    for (let word of words) {
      // If it looks like [3 letters] + [some characters]
      if (word.length >= 4 && word.length <= 6) {
        let rawLetters = word.substring(0, 3);
        let remainder = word.substring(3);
        
        // Intelligent spell correction on letters
        let letters = rawLetters
          .replace(/8/g, 'B')
          .replace(/1/g, 'I')
          .replace(/0/g, 'O')
          .replace(/5/g, 'S')
          .replace(/FVC/g, 'FWC');
        
        // If first 3 chars are letters (e.g. BRA, FWC, MEX, GER, ESP)
        if (/^[A-Z]{3}$/.test(letters) || letters.substring(0, 2) === 'CC') {
          if (letters.substring(0, 2) === 'CC') {
            remainder = word.substring(2);
            letters = 'CC';
          }
          
          // Try corrections on the numbers
          let correctedDigits = remainder
            .replace(/O/g, '0')
            .replace(/[Il|]/g, '1')
            .replace(/S/g, '5')
            .replace(/Z/g, '2')
            .replace(/B/g, '8')
            .replace(/G/g, '6')
            .replace(/T/g, '7');
            
          // Keep only digits
          correctedDigits = correctedDigits.replace(/[^0-9]/g, '');
          
          if (correctedDigits) {
            // Strip leading zeros
            let digits = parseInt(correctedDigits, 10).toString();
            let attemptCode = `${letters}${digits}`;
            if (validateStickerExists(attemptCode)) {
              return attemptCode;
            }
          }
        }
      }
    }
  }

  return null;
}

/**
 * Synchronously checks if a code exists in local state memory.
 */
function validateStickerExists(code) {
  return stateStickers.some(s => s.code === code);
}

/**
 * Increments sticker quantity in the database and updates local state.
 */
async function incrementStickerByCode(code) {
  const sticker = stateStickers.find(s => s.code === code);
  if (!sticker) return null;

  const newQty = sticker.quantity + 1;
  
  // Persist in IndexedDB
  const updatedSticker = await updateStickerQuantity(code, newQty);
  
  // Update local memory state
  updateLocalStickerState(code, newQty);
  
  // Trigger re-rendering of stats and search
  refreshCollectionUI();
  
  return updatedSticker;
}
