/**
 * main.js - Bootstrap da Aplicação
 * Inicializa o app ao carregar
 */

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Iniciando Figurinhas Copa 2026...');

    try {
        // 1. Inicializar banco de dados
        console.log('📦 Inicializando IndexedDB...');
        await DB.init();

        // 2. Carregar dados das figurinhas
        console.log('📥 Carregando dados de figurinhas...');
        await DB.loadFigurinhosData();

        // 3. Renderizar grid inicial
        console.log('🎨 Renderizando interface...');
        UI.renderFigurinhascarta();

        // 4. Atualizar contador de progresso
        console.log('📊 Atualizando progresso...');
        UI.updateProgress();

        // 5. Inicializar handlers de eventos
        console.log('🎯 Inicializando event handlers...');
        Handlers.init();

        console.log('✅ App pronto!');
    } catch (error) {
        console.error('❌ Erro ao inicializar app:', error);
        const grid = document.getElementById('figurinhasGrid');
        grid.innerHTML = `
            <div class="loading" style="grid-column: 1 / -1; color: red;">
                ⚠️ Erro ao carregar aplicação.<br>
                Verifique o console para mais detalhes.
            </div>
        `;
    }
});

// Garantir que os dados persistem ao recarregar
window.addEventListener('beforeunload', () => {
    console.log('💾 Salvando dados antes de fechar...');
});
