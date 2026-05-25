/**
 * ui.js - Renderização da Interface
 * Responsável pela construção visual do grid de figurinhas
 */

const UI = {
    /**
     * Renderizar grid de figurinhas
     */
    renderFigurinhascarta() {
        const grid = document.getElementById('figurinhasGrid');
        const figurinhas = DB.extractAllFigurinha();
        
        if (figurinhas.length === 0) {
            grid.innerHTML = '<div class="loading">Nenhuma figurinha encontrada</div>';
            return;
        }

        grid.innerHTML = figurinhas.map(fig => this.createFigurinhCard(fig)).join('');
        
        // Adicionar event listeners aos botões
        grid.querySelectorAll('.btn-increment').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const code = btn.dataset.code;
                Handlers.incrementFigurinha(code);
            });
        });

        grid.querySelectorAll('.btn-decrement').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const code = btn.dataset.code;
                Handlers.decrementFigurinha(code);
            });
        });
    },

    /**
     * Criar HTML do card de figurinha
     */
    createFigurinhCard(fig) {
        const status = this.getStatus(fig.quantity);
        const statusClass = `status-${status.type}`;
        
        return `
            <div class="figurinha-card" data-code="${fig.code}">
                <div class="figurinha-code">${fig.code}</div>
                <div class="figurinha-country">${fig.country}</div>
                <div class="figurinha-quantity">
                    <button class="quantity-btn btn-decrement" data-code="${fig.code}">−</button>
                    <span class="quantity-display">${fig.quantity}</span>
                    <button class="quantity-btn btn-increment" data-code="${fig.code}">+</button>
                </div>
                <div class="status-badge ${statusClass}">${status.label}</div>
            </div>
        `;
    },

    /**
     * Determinar status da figurinha
     */
    getStatus(quantity) {
        if (quantity === 0) {
            return { type: 'faltam', label: 'Faltam' };
        } else if (quantity === 1) {
            return { type: 'possuo', label: 'Possuo' };
        } else {
            return { type: 'duplicada', label: `×${quantity}` };
        }
    },

    /**
     * Atualizar card de figurinha individual
     */
    updateCardFigurinha(code, newQuantity) {
        const card = document.querySelector(`[data-code="${code}"]`);
        if (!card) return;

        // Atualizar quantidade
        const quantityDisplay = card.querySelector('.quantity-display');
        quantityDisplay.textContent = newQuantity;

        // Atualizar status
        const status = this.getStatus(newQuantity);
        const badge = card.querySelector('.status-badge');
        badge.className = `status-badge status-${status.type}`;
        badge.textContent = status.label;
    },

    /**
     * Atualizar contador de progresso
     */
    updateProgress() {
        const figurinhas = DB.extractAllFigurinha();
        const total = figurinhas.length;
        const possessed = figurinhas.filter(f => f.quantity > 0).length;
        const percent = total > 0 ? Math.round((possessed / total) * 100) : 0;

        const progressText = document.getElementById('progressText');
        const progressFill = document.getElementById('progressFill');
        const progressPercent = document.getElementById('progressPercent');

        progressText.textContent = `${possessed} de ${total} figurinhas`;
        progressFill.style.width = `${percent}%`;
        progressPercent.textContent = `${percent}%`;
    },

    /**
     * Limpar e renderizar grid com filtros
     */
    rerenderWithFilters(figurinhas) {
        const grid = document.getElementById('figurinhasGrid');
        
        if (figurinhas.length === 0) {
            grid.innerHTML = '<div class="loading">Nenhuma figurinha encontrada com esses filtros</div>';
            return;
        }

        grid.innerHTML = figurinhas.map(fig => this.createFigurinhCard(fig)).join('');

        // Readicionar event listeners
        grid.querySelectorAll('.btn-increment').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const code = btn.dataset.code;
                Handlers.incrementFigurinha(code);
            });
        });

        grid.querySelectorAll('.btn-decrement').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const code = btn.dataset.code;
                Handlers.decrementFigurinha(code);
            });
        });
    }
};
