/**
 * filters.js - Lógica de Filtros
 * Responsável pela aplicação de filtros ao grid
 */

const Filters = {
    currentFilters: {
        search: '',
        group: '',
        country: '',
        status: ''
    },

    /**
     * Inicializar filtros
     */
    init() {
        this.populateCountryFilter();
        this.setupEventListeners();
    },

    /**
     * Popular dropdown de países
     */
    populateCountryFilter() {
        const countries = DB.getAllCountries();
        const countrySelect = document.getElementById('countryFilter');
        
        const options = countries.map(c => `<option value="${c.code}">${c.name}</option>`).join('');
        countrySelect.innerHTML = '<option value="">Todos</option>' + options;
    },

    /**
     * Configurar event listeners dos filtros
     */
    setupEventListeners() {
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.currentFilters.search = e.target.value.toUpperCase();
            this.applyFilters();
        });

        document.getElementById('groupFilter').addEventListener('change', (e) => {
            this.currentFilters.group = e.target.value;
            this.applyFilters();
        });

        document.getElementById('countryFilter').addEventListener('change', (e) => {
            this.currentFilters.country = e.target.value;
            this.applyFilters();
        });

        document.getElementById('statusFilter').addEventListener('change', (e) => {
            this.currentFilters.status = e.target.value;
            this.applyFilters();
        });

        document.getElementById('clearFiltersBtn').addEventListener('click', () => {
            this.clearFilters();
        });
    },

    /**
     * Aplicar todos os filtros ativos
     */
    applyFilters() {
        let figurinhas = DB.extractAllFigurinha();

        // Filtro de busca
        if (this.currentFilters.search) {
            figurinhas = figurinhas.filter(f =>
                f.code.includes(this.currentFilters.search)
            );
        }

        // Filtro de grupo
        if (this.currentFilters.group) {
            figurinhas = figurinhas.filter(f =>
                f.group === this.currentFilters.group
            );
        }

        // Filtro de país
        if (this.currentFilters.country) {
            figurinhas = figurinhas.filter(f =>
                f.countryCode === this.currentFilters.country
            );
        }

        // Filtro de status
        if (this.currentFilters.status) {
            figurinhas = figurinhas.filter(f => {
                switch (this.currentFilters.status) {
                    case 'faltam':
                        return f.quantity === 0;
                    case 'possuo':
                        return f.quantity >= 1;
                    case 'duplicadas':
                        return f.quantity >= 2;
                    default:
                        return true;
                }
            });
        }

        // Renderizar resultado
        UI.rerenderWithFilters(figurinhas);
    },

    /**
     * Limpar todos os filtros
     */
    clearFilters() {
        this.currentFilters = {
            search: '',
            group: '',
            country: '',
            status: ''
        };

        document.getElementById('searchInput').value = '';
        document.getElementById('groupFilter').value = '';
        document.getElementById('countryFilter').value = '';
        document.getElementById('statusFilter').value = '';

        this.applyFilters();
    }
};
