/**
 * Figurinhas Copa 2026 - Reactive UI Renderer
 * Manages grid layouts, country filter options, progress bar animations, card highlights, and toasts.
 */

/**
 * Initializes or updates the sidebar's Country selector dropdown.
 */
function updateCountrySelectDropdown() {
  const selectEl = document.getElementById('filter-country');
  if (!selectEl) return;

  const currentSelection = activeFilters.country;
  const countries = getFilteredCountries();

  // Keep first "Todos os Países" option
  let html = '<option value="all">Todos os Países</option>';
  
  countries.forEach(c => {
    const selectedAttr = c.code === currentSelection ? 'selected' : '';
    html += `<option value="${c.code}" ${selectedAttr}>${c.name}</option>`;
  });

  selectEl.innerHTML = html;

  // If previous selected country is no longer in the list, reset country filter
  const countryStillExists = countries.some(c => c.code === currentSelection);
  if (currentSelection !== 'all' && !countryStillExists) {
    activeFilters.country = 'all';
  }
}

/**
 * Updates the header progress widgets (Linear Bar, Total text, percentage, missing, duplicates).
 */
function updateCollectionProgressStats() {
  const totalStickers = stateStickers.length;
  if (totalStickers === 0) return;

  let collected = 0;
  let missing = 0;
  let duplicates = 0;

  stateStickers.forEach(s => {
    if (s.quantity > 0) {
      collected++;
      // If we have more than 1, they are extras
      if (s.quantity > 1) {
        duplicates += (s.quantity - 1);
      }
    } else {
      missing++;
    }
  });

  const percentage = Math.round((collected / totalStickers) * 100);

  // Update DOM Elements
  const totalEl = document.getElementById('stats-total');
  const percentTextEl = document.getElementById('stats-percentage-text');
  const barFillEl = document.getElementById('stats-bar');
  const missingEl = document.getElementById('stats-missing');
  const haveEl = document.getElementById('stats-have');
  const duplicatesEl = document.getElementById('stats-duplicates');

  if (totalEl) totalEl.textContent = `${collected} de ${totalStickers}`;
  if (percentTextEl) percentTextEl.textContent = `${percentage}%`;
  if (barFillEl) barFillEl.style.width = `${percentage}%`;
  
  if (missingEl) missingEl.textContent = missing;
  if (haveEl) haveEl.textContent = collected;
  if (duplicatesEl) duplicatesEl.textContent = duplicates;
}

/**
 * Renders the main stickers grid in groups, sections, and countries.
 */
function renderStickersGrid() {
  const container = document.getElementById('grid-container');
  if (!container) return;

  const filteredList = getFilteredStickers();

  if (filteredList.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fa-solid fa-magnifying-glass"></i>
        <h3>Nenhuma figurinha encontrada</h3>
        <p>Tente ajustar ou limpar seus filtros de busca na barra lateral.</p>
      </div>
    `;
    return;
  }

  // Group filtered list by Section
  const sectionsMap = new Map();
  filteredList.forEach(s => {
    if (!sectionsMap.has(s.sectionId)) {
      sectionsMap.set(s.sectionId, {
        id: s.sectionId,
        name: s.sectionName,
        stickers: [],
        groups: new Map() // for section 'grupos'
      });
    }
    
    const sec = sectionsMap.get(s.sectionId);
    
    if (s.sectionId === 'grupos' && s.groupLetter) {
      // Group by letter under "grupos"
      if (!sec.groups.has(s.groupLetter)) {
        sec.groups.set(s.groupLetter, {
          letter: s.groupLetter,
          countries: new Map()
        });
      }
      const grp = sec.groups.get(s.groupLetter);
      
      // Group by country under letter
      if (!grp.countries.has(s.countryCode)) {
        grp.countries.set(s.countryCode, {
          code: s.countryCode,
          name: s.countryName,
          stickers: []
        });
      }
      grp.countries.get(s.countryCode).stickers.push(s);
    } else {
      sec.stickers.push(s);
    }
  });

  // Re-build HTML structure
  let html = '';
  let cardCount = 0; // used for staggered transitions delay

  // 1. Render Página Inicial Section
  if (sectionsMap.has('pagina-inicial')) {
    const sec = sectionsMap.get('pagina-inicial');
    html += `
      <div class="grid-section-group section-pagina-inicial">
        <h3 class="section-header-title">
          <span class="country-code">00</span>
          <i class="fa-solid fa-home"></i> ${sec.name}
        </h3>
        <div class="stickers-grid">
          ${sec.stickers.map(s => renderStickerCardHTML(s, cardCount++)).join('')}
        </div>
      </div>
    `;
  }

  // 2. Render Fifa History Section (FIFA World Cup Story)
  if (sectionsMap.has('fifa-history')) {
    const sec = sectionsMap.get('fifa-history');
    html += `
      <div class="grid-section-group section-fifa-history">
        <h3 class="section-header-title">
          <span class="country-code">FWC</span>
          <i class="fa-solid fa-clock-rotate-left"></i> ${sec.name}
        </h3>
        <div class="stickers-grid">
          ${sec.stickers.map(s => renderStickerCardHTML(s, cardCount++)).join('')}
        </div>
      </div>
    `;
  }

  // 3. Render Coca-Cola Section
  if (sectionsMap.has('coca-cola')) {
    const sec = sectionsMap.get('coca-cola');
    html += `
      <div class="grid-section-group section-coca-cola">
        <h3 class="section-header-title">
          <span class="country-code">CC</span>
          <i class="fa-solid fa-glass-water"></i> ${sec.name}
        </h3>
        <div class="stickers-grid">
          ${sec.stickers.map(s => renderStickerCardHTML(s, cardCount++)).join('')}
        </div>
      </div>
    `;
  }

  // 4. Render Grupos (A-L) Section
  if (sectionsMap.has('grupos')) {
    const sec = sectionsMap.get('grupos');
    
    // Sort groups by letter
    const sortedGroups = Array.from(sec.groups.values()).sort((a, b) => a.letter.localeCompare(b.letter));
    
    let groupsHtml = '';
    
    sortedGroups.forEach(grp => {
      // Sort countries inside group alphabetically
      const sortedCountries = Array.from(grp.countries.values()).sort((a, b) => a.name.localeCompare(b.name));
      
      let countriesHtml = '';
      
      sortedCountries.forEach(country => {
        // Calculate country stats
        const countryTotal = country.stickers.length;
        const countryCollected = country.stickers.filter(s => s.quantity > 0).length;
        
        countriesHtml += `
          <div class="country-group">
            <div class="country-header">
              <h4 class="country-title">
                <span class="country-code">${country.code}</span>
                ${country.name}
              </h4>
              <span class="country-progress">${countryCollected} / ${countryTotal}</span>
            </div>
            <div class="stickers-grid">
              ${country.stickers.map(s => renderStickerCardHTML(s, cardCount++)).join('')}
            </div>
          </div>
        `;
      });

      groupsHtml += `
        <div class="grid-section-group section-grupos">
          <h3 class="section-header-title">
            <span class="group-letter-badge">${grp.letter}</span>
            Grupo ${grp.letter}
          </h3>
          ${countriesHtml}
        </div>
      `;
    });
    
    html += groupsHtml;
  }

  container.innerHTML = html;
}

/**
 * Returns HTML string of a single sticker card.
 * Uses animation delay for staggered drop-in transitions.
 */
function renderStickerCardHTML(sticker, index) {
  const qty = sticker.quantity;
  
  // Determine state class
  let stateClass = 'state-missing';
  let badgeHtml = '';
  
  if (qty >= 1) {
    stateClass = 'state-have';
  }
  if (qty >= 2) {
    stateClass = 'state-duplicate';
    badgeHtml = `<div class="duplicate-badge">+${qty - 1}</div>`;
  }

  // Render checkmark or dash dot
  const statusDot = qty >= 1 
    ? '<i class="fa-solid fa-circle-check"></i>' 
    : '<i class="fa-solid fa-circle-plus"></i>';

  // Calculate staggered delay (up to 40 cards, then cap to avoid long loading on large renders)
  const delay = index < 45 ? `${index * 0.015}s` : '0s';
  const animationStyle = delay !== '0s' 
    ? `style="animation: fadeInCard 0.4s cubic-bezier(0.25, 0.8, 0.25, 1) forwards; animation-delay: ${delay}; opacity: 0; transform: translateY(10px);"` 
    : '';

  // Parse prefix and suffix for ultra-dense print checklist layouts
  const codeMatch = sticker.code.match(/^([A-Z]+|[0-9]+)(\d*)$/);
  let formattedCode = sticker.code;
  if (codeMatch) {
    const prefix = codeMatch[1];
    const suffix = codeMatch[2];
    // Keep 00 as is
    if (sticker.code === '00') {
      formattedCode = `<span class="code-prefix"></span><span class="code-suffix">00</span>`;
    } else {
      formattedCode = `<span class="code-prefix">${prefix}</span><span class="code-suffix">${suffix}</span>`;
    }
  }

  return `
    <div class="sticker-card ${stateClass}" data-code="${sticker.code}" ${animationStyle}>
      ${badgeHtml}
      <span class="card-code">${formattedCode}</span>
      <div class="card-status-dot">${statusDot}</div>
      <div class="card-controls">
        <button class="card-btn btn-dec" data-code="${sticker.code}" title="Decrementar">-</button>
        <button class="card-btn btn-inc" data-code="${sticker.code}" title="Incrementar">+</button>
      </div>
    </div>
  `;
}

// Add card fade-in animation to stylesheet dynamically
const styleSheet = document.createElement("style");
styleSheet.innerText = `
@keyframes fadeInCard {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
`;
document.head.appendChild(styleSheet);

/**
 * Pulses a card in the viewport to draw user attention (such as after an OCR capture).
 */
function triggerCardPulseHighlight(code) {
  // Let's filter to that card code to make it visible
  const card = document.querySelector(`.sticker-card[data-code="${code}"]`);
  if (card) {
    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    card.classList.add('highlight-pulse');
    
    // Remove class after animation completes
    setTimeout(() => {
      card.classList.remove('highlight-pulse');
    }, 1000);
  }
}

/**
 * Triggers re-rendering of dependent UI components.
 */
function refreshCollectionUI() {
  updateCountrySelectDropdown();
  updateCollectionProgressStats();
  renderStickersGrid();
}

/**
 * Renders floating toast notifications.
 */
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type} glassmorphism`;

  let icon = '<i class="fa-solid fa-circle-check toast-icon"></i>';
  if (type === 'error') {
    icon = '<i class="fa-solid fa-circle-xmark toast-icon"></i>';
  } else if (type === 'info') {
    icon = '<i class="fa-solid fa-circle-info toast-icon"></i>';
  }

  toast.innerHTML = `
    ${icon}
    <span class="toast-message">${message}</span>
  `;

  container.appendChild(toast);

  // Trigger smooth transition
  setTimeout(() => {
    toast.classList.add('show');
  }, 50);

  // Auto-remove toast after 4s
  setTimeout(() => {
    toast.classList.remove('show');
    // Remove from DOM after animation completes
    setTimeout(() => {
      container.removeChild(toast);
    }, 400);
  }, 4000);
}
