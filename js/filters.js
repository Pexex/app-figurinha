/**
 * Figurinhas Copa 2026 - Combined Filters & Search Logic
 * Reactively filters the sticker collection based on active UI criteria.
 */

// Global state holding loaded stickers
let stateStickers = [];

// Active filter settings
const activeFilters = {
  searchQuery: '',
  section: 'all',
  group: 'all',
  country: 'all',
  status: 'all' // 'all', 'missing', 'have', 'duplicate'
};

/**
 * Updates the global state of stickers.
 */
function setStickersState(stickers) {
  stateStickers = stickers;
}

/**
 * Updates a single sticker quantity in local state memory.
 */
function updateLocalStickerState(code, quantity) {
  const sticker = stateStickers.find(s => s.code === code);
  if (sticker) {
    sticker.quantity = quantity;
  }
}

/**
 * Returns a list of unique countries available under the current section/group filters.
 * Used to dynamically populate the Country select dropdown.
 */
function getFilteredCountries() {
  const countriesMap = new Map();
  
  stateStickers.forEach(s => {
    // Only countries in "grupos" section
    if (s.sectionId === 'grupos' && s.countryCode) {
      // Filter by group if selected
      if (activeFilters.group === 'all' || s.groupLetter === activeFilters.group) {
        countriesMap.set(s.countryCode, s.countryName);
      }
    }
  });

  // Convert map to sorted array of objects
  const countries = Array.from(countriesMap.entries()).map(([code, name]) => ({
    code,
    name
  }));
  
  // Sort alphabetically by country name
  return countries.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Returns the fully filtered array of stickers matching combined filter parameters.
 */
function getFilteredStickers() {
  return stateStickers.filter(s => {
    // 1. Filter by Search Query (Case Insensitive match on code or country name)
    if (activeFilters.searchQuery.trim() !== '') {
      const q = activeFilters.searchQuery.toLowerCase().trim();
      const codeMatch = s.code.toLowerCase().includes(q);
      const countryMatch = s.countryName && s.countryName.toLowerCase().includes(q);
      
      if (!codeMatch && !countryMatch) {
        return false;
      }
    }

    // 2. Filter by Section
    if (activeFilters.section !== 'all' && s.sectionId !== activeFilters.section) {
      return false;
    }

    // 3. Filter by Group (applicable if Section is all or groups)
    if (activeFilters.group !== 'all') {
      if (s.sectionId !== 'grupos' || s.groupLetter !== activeFilters.group) {
        return false;
      }
    }

    // 4. Filter by Country (applicable if Section is all or groups)
    if (activeFilters.country !== 'all') {
      if (s.sectionId !== 'grupos' || s.countryCode !== activeFilters.country) {
        return false;
      }
    }

    // 5. Filter by Status (Missing, Have, Duplicate)
    if (activeFilters.status !== 'all') {
      if (activeFilters.status === 'missing' && s.quantity !== 0) {
        return false;
      }
      if (activeFilters.status === 'have' && s.quantity < 1) {
        return false;
      }
      if (activeFilters.status === 'duplicate' && s.quantity < 2) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Resets all filter settings to default values.
 */
function resetAllFilters() {
  activeFilters.searchQuery = '';
  activeFilters.section = 'all';
  activeFilters.group = 'all';
  activeFilters.country = 'all';
  activeFilters.status = 'all';
}
