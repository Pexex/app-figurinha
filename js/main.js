/**
 * Figurinhas Copa 2026 - Main Bootstrapper
 * Orchestrates the application startup, data load, and event registrations.
 */

document.addEventListener('DOMContentLoaded', async () => {
  console.log('Bootstrapping Figurinhas Copa 2026 App...');
  
  try {
    // 1. Load stickers from local IndexedDB (auto-populates with default data if empty)
    const stickers = await getAllFigurinhas();
    console.log(`Loaded ${stickers.length} stickers from local storage.`);
    
    // 2. Set global state memory
    setStickersState(stickers);
    
    // 3. Initialize all event listeners
    initializeEventHandlers();
    
    // 4. Perform initial rendering of UI grid, dropdowns and metrics
    refreshCollectionUI();
    
    // 5. Show initial success greeting toast
    showToast('✓ Coleção de figurinhas carregada com sucesso!', 'info');
    
  } catch (error) {
    console.error('Fatal initialization error:', error);
    
    // Handle loading state error visual feedback in grid container
    const gridContainer = document.getElementById('grid-container');
    if (gridContainer) {
      gridContainer.innerHTML = `
        <div class="empty-state">
          <i class="fa-solid fa-circle-exclamation text-danger" style="font-size: 3rem;"></i>
          <h3>Falha de Inicialização</h3>
          <p>Ocorreu um erro ao acessar o banco de dados local. Por favor, recarregue a página.</p>
        </div>
      `;
    }
    
    // Show error toast
    showToast('❌ Falha ao carregar coleção. Verifique as permissões de armazenamento do seu navegador.', 'error');
  }
});
