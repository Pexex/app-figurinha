/**
 * database.js - Gerenciamento de IndexedDB
 * Responsável por persistência local de dados
 */

const DB = {
    dbName: 'FigurinhasDB',
    version: 1,
    storeName: 'figurinhas',
    db: null,
    figurinhasData: null,

    /**
     * Inicializar IndexedDB
     */
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => {
                console.error('Erro ao abrir IndexedDB:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('✅ IndexedDB inicializado');
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Criar object store se não existir
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName, { keyPath: 'code' });
                    console.log('✅ Object store criado');
                }
            };
        });
    },

    /**
     * Carregar dados de figurinhas do JSON e popular IndexedDB
     */
    async loadFigurinhosData() {
        try {
            // Buscar JSON
            const response = await fetch('data/figurinhas.json');
            this.figurinhasData = await response.json();
            console.log('✅ Dados de figurinhas carregados');

            // Verificar se já existem dados no IndexedDB
            const existingCount = await this.countFigurinha();
            
            if (existingCount === 0) {
                console.log('📝 Populando IndexedDB com dados iniciais...');
                await this.populateInitialData();
            } else {
                console.log('✅ Dados já existem no IndexedDB');
                // Carregar dados existentes
                await this.loadFromIndexedDB();
            }
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            throw error;
        }
    },

    /**
     * Contar total de figurinhas no IndexedDB
     */
    async countFigurinha() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.count();

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    },

    /**
     * Popular IndexedDB com dados iniciais do JSON
     */
    async populateInitialData() {
        const allFigurinha = this.extractAllFigurinha();
        
        for (const fig of allFigurinha) {
            await this.addOrUpdateFigurinha(fig.code, fig.quantity, fig.country, fig.group, fig.page);
        }
        
        console.log(`✅ ${allFigurinha.length} figurinhas adicionadas ao IndexedDB`);
    },

    /**
     * Extrair todas as figurinhas do JSON em formato plano
     */
    extractAllFigurinha() {
        const allFigurinha = [];
        
        this.figurinhasData.album.pages.forEach(page => {
            page.groups.forEach(group => {
                group.countries.forEach(country => {
                    country.figurinhas.forEach(fig => {
                        allFigurinha.push({
                            code: fig.code,
                            quantity: fig.quantity || 0,
                            country: country.name,
                            countryCode: country.code,
                            group: group.letter,
                            page: page.id,
                            pageName: page.name
                        });
                    });
                });
            });
        });

        return allFigurinha;
    },

    /**
     * Carregar todas as figurinhas do IndexedDB
     */
    async loadFromIndexedDB() {
        const figurinhas = await this.getAllFigurinha();
        
        // Atualizar dados na memória
        this.figurinhasData.album.pages.forEach(page => {
            page.groups.forEach(group => {
                group.countries.forEach(country => {
                    country.figurinhas = country.figurinhas.map(fig => {
                        const updated = figurinhas.find(f => f.code === fig.code);
                        return updated ? { code: fig.code, quantity: updated.quantity } : fig;
                    });
                });
            });
        });
    },

    /**
     * Obter todas as figurinhas
     */
    async getAllFigurinha() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.getAll();

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    },

    /**
     * Obter figurinha por código
     */
    async getFigurinhaByCode(code) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.get(code);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    },

    /**
     * Adicionar ou atualizar figurinha
     */
    async addOrUpdateFigurinha(code, quantity, country, group, page) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            
            const data = {
                code,
                quantity,
                country,
                group,
                page,
                lastUpdated: new Date().toISOString()
            };

            const request = store.put(data);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                // Atualizar também na memória
                this.updateFigurinhInMemory(code, quantity);
                resolve();
            };
        });
    },

    /**
     * Incrementar quantidade de figurinha
     */
    async incrementFigurinha(code) {
        const fig = await this.getFigurinhaByCode(code);
        if (fig) {
            const newQuantity = fig.quantity + 1;
            await this.addOrUpdateFigurinha(code, newQuantity, fig.country, fig.group, fig.section);
            return newQuantity;
        }
        return 0;
    },

    /**
     * Decrementar quantidade de figurinha
     */
    async decrementFigurinha(code) {
        const fig = await this.getFigurinhaByCode(code);
        if (fig && fig.quantity > 0) {
            const newQuantity = fig.quantity - 1;
            await this.addOrUpdateFigurinha(code, newQuantity, fig.country, fig.group, fig.section);
            return newQuantity;
        }
        return 0;
    },

    /**
     * Atualizar figurinha na memória (JSON)
     */
    updateFigurinhInMemory(code, quantity) {
        this.figurinhasData.album.pages.forEach(page => {
            page.groups.forEach(group => {
                group.countries.forEach(country => {
                    country.figurinhas.forEach(fig => {
                        if (fig.code === code) {
                            fig.quantity = quantity;
                        }
                    });
                });
            });
        });
    },

    /**
     * Limpar todos os dados (para import)
     */
    async clearAllData() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.clear();

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                console.log('✅ IndexedDB limpo');
                resolve();
            };
        });
    },

    /**
     * Obter todos os países
     */
    getAllCountries() {
        const countries = [];
        this.figurinhasData.album.pages.forEach(page => {
            page.groups.forEach(group => {
                group.countries.forEach(country => {
                    if (!countries.some(c => c.code === country.code)) {
                        countries.push({ code: country.code, name: country.name });
                    }
                });
            });
        });
        return countries.sort((a, b) => a.name.localeCompare(b.name));
    },

    /**
     * Obter dados estruturados para renderização
     */
    getStructuredData() {
        return this.figurinhasData;
    }
};
