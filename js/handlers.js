/**
 * Figurinhas Copa 2026 - Central Event Coordinator
 * Binds DOM event listeners and handles high-performance event delegation.
 */

// Temporary holder for validated imported backup list
let tempImportedList = null;

/**
 * Initializes and registers all event handlers in the application.
 */
function initializeEventHandlers() {
  
  // ==================== SEARCH & FILTER INPUTS ====================
  
  // Search input change (real-time reactive search)
  const searchInput = document.getElementById('search-code');
  const searchClear = document.getElementById('search-clear');
  
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const val = e.target.value;
      activeFilters.searchQuery = val;
      
      // Toggle clear icon
      if (searchClear) {
        searchClear.style.display = val.length > 0 ? 'inline' : 'none';
      }
      
      renderStickersGrid();
    });
  }

  if (searchClear) {
    searchClear.addEventListener('click', () => {
      if (searchInput) {
        searchInput.value = '';
        activeFilters.searchQuery = '';
        searchClear.style.display = 'none';
        renderStickersGrid();
      }
    });
  }

  // Section Filters selection
  const sectionPills = document.querySelectorAll('#filter-section .filter-pill');
  const groupWrapper = document.getElementById('filter-group-wrapper');
  const countryWrapper = document.getElementById('filter-country-wrapper');
  
  sectionPills.forEach(pill => {
    pill.addEventListener('click', (e) => {
      sectionPills.forEach(p => p.classList.remove('active'));
      e.target.classList.add('active');
      
      const selectedSection = e.target.dataset.section;
      activeFilters.section = selectedSection;
      
      // Reset dependent filters
      activeFilters.group = 'all';
      activeFilters.country = 'all';
      
      // Update sidebar visual group options
      const groupPills = document.querySelectorAll('#filter-group-letters .filter-pill');
      groupPills.forEach(p => {
        if (p.dataset.group === 'all') p.classList.add('active');
        else p.classList.remove('active');
      });

      // Show/Hide group & country filter wrappers based on Section
      if (selectedSection === 'pagina-inicial' || selectedSection === 'fifa-history' || selectedSection === 'coca-cola') {
        if (groupWrapper) groupWrapper.style.display = 'none';
        if (countryWrapper) countryWrapper.style.display = 'none';
      } else {
        if (groupWrapper) groupWrapper.style.display = 'flex';
        if (countryWrapper) countryWrapper.style.display = 'flex';
      }
      
      refreshCollectionUI();
    });
  });

  // Group Filters selection
  const groupPills = document.querySelectorAll('#filter-group-letters .filter-pill');
  groupPills.forEach(pill => {
    pill.addEventListener('click', (e) => {
      groupPills.forEach(p => p.classList.remove('active'));
      e.target.classList.add('active');
      
      activeFilters.group = e.target.dataset.group;
      activeFilters.country = 'all'; // Reset country
      
      refreshCollectionUI();
    });
  });

  // Country selector change
  const countrySelect = document.getElementById('filter-country');
  if (countrySelect) {
    countrySelect.addEventListener('change', (e) => {
      activeFilters.country = e.target.value;
      renderStickersGrid();
    });
  }

  // Status Radios change
  const statusRadios = document.querySelectorAll('#filter-status input[name="status"]');
  statusRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      activeFilters.status = e.target.value;
      renderStickersGrid();
    });
  });

  // Clear filters button
  const btnClearFilters = document.getElementById('btn-clear-filters');
  if (btnClearFilters) {
    btnClearFilters.addEventListener('click', () => {
      resetAllFilters();
      
      // Reset inputs & dropdowns in DOM
      if (searchInput) searchInput.value = '';
      if (searchClear) searchClear.style.display = 'none';
      
      sectionPills.forEach(p => {
        if (p.dataset.section === 'all') p.classList.add('active');
        else p.classList.remove('active');
      });
      
      groupPills.forEach(p => {
        if (p.dataset.group === 'all') p.classList.add('active');
        else p.classList.remove('active');
      });
      
      if (groupWrapper) groupWrapper.style.display = 'flex';
      if (countryWrapper) countryWrapper.style.display = 'flex';
      
      statusRadios.forEach(r => {
        r.checked = r.value === 'all';
      });
      
      showToast('✓ Filtros limpos com sucesso.', 'info');
      refreshCollectionUI();
    });
  }

  // ==================== EVENT DELEGATION FOR STICKER CARDS ====================
  const gridContainer = document.getElementById('grid-container');
  if (gridContainer) {
    gridContainer.addEventListener('click', async (e) => {
      const target = e.target;

      // Handle increment card button click (+)
      if (target.classList.contains('btn-inc')) {
        e.stopPropagation();
        const code = target.dataset.code;
        const sticker = stateStickers.find(s => s.code === code);
        if (sticker) {
          const newQty = sticker.quantity + 1;
          await updateStickerQuantity(code, newQty);
          updateLocalStickerState(code, newQty);
          refreshCollectionUI();
        }
        return;
      }

      // Handle decrement card button click (-)
      if (target.classList.contains('btn-dec')) {
        e.stopPropagation();
        const code = target.dataset.code;
        const sticker = stateStickers.find(s => s.code === code);
        if (sticker && sticker.quantity > 0) {
          const newQty = sticker.quantity - 1;
          await updateStickerQuantity(code, newQty);
          updateLocalStickerState(code, newQty);
          refreshCollectionUI();
        }
        return;
      }

      // Handle direct click on Card (toggles collection status: 0 -> 1)
      const card = target.closest('.sticker-card');
      if (card) {
        const code = card.dataset.code;
        const sticker = stateStickers.find(s => s.code === code);
        if (sticker && sticker.quantity === 0) {
          await updateStickerQuantity(code, 1);
          updateLocalStickerState(code, 1);
          refreshCollectionUI();
        }
      }
    });
  }

  // ==================== FINE-TUNING LAYOUT & ACCESS CONTROLS ====================
  
  // Toggle Filters Sidebar Drawer
  const btnToggleFilters = document.getElementById('btn-toggle-filters');
  const sidebarFilters = document.getElementById('sidebar-filters');
  const appContent = document.querySelector('.app-content');
  if (btnToggleFilters && sidebarFilters && appContent) {
    btnToggleFilters.addEventListener('click', () => {
      sidebarFilters.classList.toggle('collapsed');
      appContent.classList.toggle('full-width');
    });
  }

  // Toggle Accessibility Mode (Large touch targets)
  const btnToggleAccessibility = document.getElementById('btn-toggle-accessibility');
  if (btnToggleAccessibility) {
    btnToggleAccessibility.addEventListener('click', () => {
      const active = document.body.classList.toggle('accessibility-large');
      btnToggleAccessibility.classList.toggle('active', active);
      if (active) {
        showToast('✓ Modo Acessibilidade Ativado (Cards e botões ampliados!)', 'info');
      } else {
        showToast('✓ Visualização padrão restaurada.', 'info');
      }
    });
  }

  // Print Control Checklist sheet
  const btnPrint = document.getElementById('btn-print');
  if (btnPrint) {
    btnPrint.addEventListener('click', () => {
      window.print();
    });
  }

  // ==================== BACKUP HUB & SOCIAL SHARING EVENTS ====================
  const btnBackupHub = document.getElementById('btn-backup-hub');
  const modalBackup = document.getElementById('modal-backup');
  const modalBackupClose = document.getElementById('modal-backup-close');
  
  const closeBackupHubModal = () => {
    if (modalBackup) modalBackup.classList.remove('show');
  };

  if (btnBackupHub && modalBackup) {
    btnBackupHub.addEventListener('click', () => {
      modalBackup.classList.add('show');
    });
  }

  if (modalBackupClose) {
    modalBackupClose.addEventListener('click', closeBackupHubModal);
  }

  // Action: Download Backup File
  const btnExportJson = document.getElementById('btn-export-json');
  if (btnExportJson) {
    btnExportJson.addEventListener('click', () => {
      exportBackup();
      closeBackupHubModal();
    });
  }

  // Action: Copy Backup JSON String to clipboard
  const btnCopyJson = document.getElementById('btn-copy-json');
  if (btnCopyJson) {
    btnCopyJson.addEventListener('click', () => {
      copyBackupToClipboard();
      closeBackupHubModal();
    });
  }

  // Action: Share progress on WhatsApp
  const btnShareWhatsapp = document.getElementById('btn-share-whatsapp');
  if (btnShareWhatsapp) {
    btnShareWhatsapp.addEventListener('click', () => {
      shareStatusOnWhatsApp();
      closeBackupHubModal();
    });
  }

  // Import Upload triggers (inside backup hub)
  const btnImportTrigger = document.getElementById('btn-import-trigger');
  const inputImport = document.getElementById('input-import');
  
  if (btnImportTrigger && inputImport) {
    btnImportTrigger.addEventListener('click', () => {
      inputImport.click();
    });

    inputImport.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      closeBackupHubModal();

      try {
        const list = await readBackupFile(file);
        tempImportedList = list;
        
        // Open confirmation modal
        const confirmModal = document.getElementById('modal-confirm');
        if (confirmModal) {
          confirmModal.classList.add('show');
        }
      } catch (err) {
        showToast(`❌ ${err.message}`, 'error');
      } finally {
        // Reset file input value to allow uploading same file again
        inputImport.value = '';
      }
    });
  }

  // Paste JSON backup triggers (inside backup hub)
  const btnPasteImportTrigger = document.getElementById('btn-paste-import-trigger');
  const pasteImportWrapper = document.getElementById('paste-import-wrapper');
  const textareaImport = document.getElementById('textarea-import');
  const btnConfirmPasteImport = document.getElementById('btn-confirm-paste-import');

  if (btnPasteImportTrigger && pasteImportWrapper) {
    btnPasteImportTrigger.addEventListener('click', () => {
      const isHidden = pasteImportWrapper.style.display === 'none';
      pasteImportWrapper.style.display = isHidden ? 'block' : 'none';
      if (isHidden && textareaImport) {
        textareaImport.focus();
      }
    });
  }

  if (btnConfirmPasteImport && textareaImport) {
    btnConfirmPasteImport.addEventListener('click', () => {
      const textVal = textareaImport.value;
      try {
        const list = parseBackupText(textVal);
        tempImportedList = list;

        closeBackupHubModal();

        // Clear textarea & hide wrapper for next time
        textareaImport.value = '';
        if (pasteImportWrapper) pasteImportWrapper.style.display = 'none';

        // Open confirmation modal
        const confirmModal = document.getElementById('modal-confirm');
        if (confirmModal) {
          confirmModal.classList.add('show');
        }
      } catch (err) {
        showToast(`❌ ${err.message}`, 'error');
      }
    });
  }

  // Import Confirmation Dialog button binds
  const btnConfirmCancel = document.getElementById('btn-confirm-cancel');
  const btnConfirmOk = document.getElementById('btn-confirm-ok');
  const modalConfirmClose = document.getElementById('modal-confirm-close');
  const confirmModal = document.getElementById('modal-confirm');

  const closeConfirmModal = () => {
    if (confirmModal) confirmModal.classList.remove('show');
    tempImportedList = null;
  };

  if (btnConfirmCancel) btnConfirmCancel.addEventListener('click', closeConfirmModal);
  if (modalConfirmClose) modalConfirmClose.addEventListener('click', closeConfirmModal);
  
  if (btnConfirmOk) {
    btnConfirmOk.addEventListener('click', async () => {
      if (!tempImportedList) return;
      
      try {
        await clearAndImportDatabase(tempImportedList);
        setStickersState(tempImportedList);
        refreshCollectionUI();
        showToast('✓ Backup restaurado com sucesso!', 'success');
      } catch (err) {
        console.error('Failed to import database:', err);
        showToast('❌ Falha ao gravar backup no banco de dados.', 'error');
      } finally {
        closeConfirmModal();
      }
    });
  }

  // ==================== CAMERA & OCR EVENTS ====================
  const btnCamera = document.getElementById('btn-camera');
  const modalCamera = document.getElementById('modal-camera');
  const modalCameraClose = document.getElementById('modal-camera-close');
  const btnCameraCapture = document.getElementById('btn-camera-capture');
  const btnGalleryTrigger = document.getElementById('btn-gallery-trigger');
  const inputGallery = document.getElementById('input-gallery');

  if (btnCamera && modalCamera) {
    btnCamera.addEventListener('click', async () => {
      try {
        modalCamera.classList.add('show');
        await startCamera();
      } catch (err) {
        modalCamera.classList.remove('show');
      }
    });
  }

  const closeCameraModal = () => {
    if (modalCamera) modalCamera.classList.remove('show');
    stopCamera();
  };

  if (modalCameraClose) {
    modalCameraClose.addEventListener('click', closeCameraModal);
  }

  // Close modals clicking outside the content area
  window.addEventListener('click', (e) => {
    if (e.target === modalCamera) closeCameraModal();
    if (e.target === confirmModal) closeConfirmModal();
    if (e.target === modalBackup) closeBackupHubModal();
  });

  // Capture Button Click
  if (btnCameraCapture) {
    btnCameraCapture.addEventListener('click', captureAndProcessOCR);
  }

  // Gallery Fallback Select Bindings
  if (btnGalleryTrigger && inputGallery) {
    btnGalleryTrigger.addEventListener('click', () => {
      inputGallery.click();
    });

    inputGallery.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const img = new Image();
      img.onload = () => {
        runOCR(img);
      };
      
      img.src = URL.createObjectURL(file);
      
      // Clean up input value
      inputGallery.value = '';
    });
  }
}
