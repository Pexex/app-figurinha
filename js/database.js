/**
 * Figurinhas Copa 2026 - IndexedDB Database Management
 * Persistent local storage for album collection status.
 */

const DB_NAME = 'FigurinhasCopa2026DB';
const DB_VERSION = 1;
const STORE_NAME = 'figurinhas';

let dbInstance = null;

/**
 * Initializes the IndexedDB database.
 * If empty, loads the default data from data/figurinhas.json and populates the DB.
 */
function initDB() {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      return resolve(dbInstance);
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('IndexedDB error:', event.target.error);
      reject(event.target.error);
    };

    request.onsuccess = (event) => {
      dbInstance = event.target.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'code' });
      }
    };
  });
}

/**
 * Loads static figurinhas.json data from the network and flattens it for the database.
 */
async function loadDefaultData() {
  try {
    const response = await fetch('data/figurinhas.json');
    if (!response.ok) {
      throw new Error('Falha ao carregar figurinhas.json padrão');
    }
    const data = await response.json();
    const flattenedList = [];

    // Flatten Section 1: Página Inicial
    const paginaInicial = data.sections.find(s => s.id === 'pagina-inicial');
    if (paginaInicial && paginaInicial.figurinhas) {
      paginaInicial.figurinhas.forEach(f => {
        flattenedList.push({
          code: f.code,
          quantity: f.quantity || 0,
          sectionId: 'pagina-inicial',
          sectionName: 'Página Inicial',
          groupLetter: null,
          countryCode: null,
          countryName: null
        });
      });
    }

    // Flatten Section 2: Grupos
    const grupos = data.sections.find(s => s.id === 'grupos');
    if (grupos && grupos.groups) {
      grupos.groups.forEach(g => {
        const groupLetter = g.letter;
        g.countries.forEach(c => {
          const countryCode = c.code;
          const countryName = c.name;
          c.figurinhas.forEach(f => {
            flattenedList.push({
              code: f.code,
              quantity: f.quantity || 0,
              sectionId: 'grupos',
              sectionName: 'Grupos',
              groupLetter: groupLetter,
              countryCode: countryCode,
              countryName: countryName
            });
          });
        });
      });
    }

    // Flatten Section 3: Fifa History
    const fifaHistory = data.sections.find(s => s.id === 'fifa-history');
    if (fifaHistory && fifaHistory.figurinhas) {
      fifaHistory.figurinhas.forEach(f => {
        flattenedList.push({
          code: f.code,
          quantity: f.quantity || 0,
          sectionId: 'fifa-history',
          sectionName: 'Fifa World Cup History',
          groupLetter: null,
          countryCode: null,
          countryName: null
        });
      });
    }

    // Flatten Section 4: Coca-Cola
    const cocaCola = data.sections.find(s => s.id === 'coca-cola');
    if (cocaCola && cocaCola.figurinhas) {
      cocaCola.figurinhas.forEach(f => {
        flattenedList.push({
          code: f.code,
          quantity: f.quantity || 0,
          sectionId: 'coca-cola',
          sectionName: 'Coca-Cola',
          groupLetter: null,
          countryCode: null,
          countryName: null
        });
      });
    }

    return flattenedList;
  } catch (error) {
    console.error('Error fetching/parsing standard JSON data:', error);
    throw error;
  }
}

/**
 * Returns all stickers from IndexedDB.
 * If IndexedDB is empty, populates it first with default data.
 */
async function getAllFigurinhas() {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = async () => {
      let results = request.result;
      
      // If DB is brand new or empty, populate with default data
      if (results.length === 0) {
        console.log('Database is empty. Loading default stickers database...');
        try {
          const defaultList = await loadDefaultData();
          await populateDatabase(defaultList);
          resolve(defaultList);
        } catch (err) {
          reject(err);
        }
      } else {
        resolve(results);
      }
    };

    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
}

/**
 * Bulk insert of stickers in a single transaction.
 */
async function populateDatabase(stickerList) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    stickerList.forEach(sticker => {
      store.put(sticker);
    });

    transaction.oncomplete = () => {
      console.log(`IndexedDB populated successfully with ${stickerList.length} items.`);
      resolve();
    };

    transaction.onerror = (event) => {
      reject(event.target.error);
    };
  });
}

/**
 * Updates the quantity of a single sticker by its code.
 */
async function updateStickerQuantity(code, quantity) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    // First get the record to maintain other fields
    const getRequest = store.get(code);
    
    getRequest.onsuccess = () => {
      const sticker = getRequest.result;
      if (!sticker) {
        reject(new Error(`Figurinha com código ${code} não encontrada`));
        return;
      }
      
      sticker.quantity = Math.max(0, quantity); // Ensure non-negative
      
      const putRequest = store.put(sticker);
      
      putRequest.onsuccess = () => {
        resolve(sticker);
      };
      
      putRequest.onerror = (e) => {
        reject(e.target.error);
      };
    };
    
    getRequest.onerror = (e) => {
      reject(e.target.error);
    };
  });
}

/**
 * Clears the object store and re-populates it with imported backup list.
 */
async function clearAndImportDatabase(importedList) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    const clearRequest = store.clear();
    
    clearRequest.onsuccess = () => {
      // Put imported elements in
      importedList.forEach(sticker => {
        store.put(sticker);
      });
    };
    
    transaction.oncomplete = () => {
      resolve();
    };
    
    transaction.onerror = (e) => {
      reject(e.target.error);
    };
  });
}
