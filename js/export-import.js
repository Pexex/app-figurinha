/**
 * Figurinhas Copa 2026 - Export & Import System
 * Handles JSON serialization, backup downloads, upload reading and schema validation.
 */

/**
 * Downloads a JSON file containing the collection state from IndexedDB.
 */
async function exportBackup() {
  try {
    const stickers = await getAllFigurinhas();
    
    // Sort stickers by code/section/group for clean backups
    stickers.sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));

    const backupData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      totalStickers: stickers.length,
      stickers: stickers.map(s => ({
        code: s.code,
        quantity: s.quantity,
        sectionId: s.sectionId,
        groupLetter: s.groupLetter,
        countryCode: s.countryCode,
        countryName: s.countryName
      }))
    };

    const jsonString = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Generate filename with current date: YYYY-MM-DD
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `figurinhas_backup_${dateStr}.json`;

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast('✓ Backup exportado com sucesso!', 'success');
  } catch (error) {
    console.error('Error exporting backup:', error);
    showToast('❌ Falha ao exportar backup.', 'error');
  }
}

/**
 * Local helper to check if a sticker code belongs to the official album layout.
 */
function validateStickerExistsLocal(code) {
  if (typeof stateStickers !== 'undefined' && Array.isArray(stateStickers)) {
    return stateStickers.some(s => s.code === code);
  }
  return false;
}

/**
 * Sanitizes and validates backup JSON structures, consolidating duplicate rows
 * and excluding foreign entries to maintain 100% database keys integrity.
 */
function validateAndConsolidateBackup(backupData) {
  if (!backupData || typeof backupData !== 'object') {
    throw new Error('Formato de backup inválido.');
  }

  if (!Array.isArray(backupData.stickers)) {
    throw new Error('O arquivo/texto não contém uma lista válida de figurinhas.');
  }

  const consolidatedMap = new Map();

  for (const sticker of backupData.stickers) {
    if (!sticker || typeof sticker.code !== 'string' || typeof sticker.quantity !== 'number') {
      throw new Error('Estrutura de figurinha corrompida ou inválida encontrada no backup.');
    }

    const code = sticker.code.toUpperCase().trim();
    const quantity = Math.max(0, parseInt(sticker.quantity, 10));

    // Deduplication Shield: Keep the maximum quantity if the sticker code repeats.
    // This entirely prevents duplicate key violation crashes in IndexedDB!
    if (consolidatedMap.has(code)) {
      const existing = consolidatedMap.get(code);
      existing.quantity = Math.max(existing.quantity, quantity);
    } else {
      consolidatedMap.set(code, {
        code: code,
        quantity: quantity,
        sectionId: sticker.sectionId || 'grupos',
        groupLetter: sticker.groupLetter || null,
        countryCode: sticker.countryCode || null,
        countryName: sticker.countryName || null
      });
    }
  }

  // Convert map back to list
  const validatedList = Array.from(consolidatedMap.values());

  // foreign-check filter: ensure each code is actually in our standard album layout
  const filteredList = validatedList.filter(s => validateStickerExistsLocal(s.code));

  if (filteredList.length === 0) {
    throw new Error('Nenhuma figurinha correspondente ao álbum oficial foi encontrada no backup.');
  }

  return filteredList;
}

/**
 * Reads a JSON file uploaded by the user, validates and returns the consolidated stickers list.
 */
function readBackupFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const backupData = JSON.parse(event.target.result);
        const consolidatedList = validateAndConsolidateBackup(backupData);
        resolve(consolidatedList);
      } catch (err) {
        console.error('Validation error on backup file import:', err);
        reject(new Error(`Erro no arquivo: ${err.message}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('Erro ao ler o arquivo de backup.'));
    };

    reader.readAsText(file);
  });
}

/**
 * Parses pasted JSON string, validates and returns the consolidated stickers list.
 */
function parseBackupText(rawText) {
  try {
    if (!rawText || rawText.trim() === '') {
      throw new Error('O campo de texto está vazio.');
    }
    const backupData = JSON.parse(rawText.trim());
    return validateAndConsolidateBackup(backupData);
  } catch (err) {
    console.error('Validation error on pasted text import:', err);
    throw new Error(`Código inválido: ${err.message}`);
  }
}

/**
 * Copies the collection JSON backup string directly to the user's clipboard.
 */
async function copyBackupToClipboard() {
  try {
    const stickers = await getAllFigurinhas();
    stickers.sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));

    const backupData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      totalStickers: stickers.length,
      stickers: stickers.map(s => ({
        code: s.code,
        quantity: s.quantity,
        sectionId: s.sectionId,
        groupLetter: s.groupLetter,
        countryCode: s.countryCode,
        countryName: s.countryName
      }))
    };

    const jsonString = JSON.stringify(backupData);
    await navigator.clipboard.writeText(jsonString);
    showToast('✓ Código de backup copiado para a área de transferência!', 'success');
  } catch (error) {
    console.error('Error copying to clipboard:', error);
    showToast('❌ Falha ao copiar dados. Permita acesso à área de transferência.', 'error');
  }
}

/**
 * Encodes and opens a WhatsApp Web/App link sharing album progress stats.
 */
function shareStatusOnWhatsApp() {
  try {
    const totalStickers = stateStickers.length;
    if (totalStickers === 0) {
      showToast('❌ Nenhuma figurinha carregada no momento.', 'error');
      return;
    }

    let collected = 0;
    let missing = 0;
    let duplicates = 0;

    stateStickers.forEach(s => {
      if (s.quantity > 0) {
        collected++;
        if (s.quantity > 1) {
          duplicates += (s.quantity - 1);
        }
      } else {
        missing++;
      }
    });

    const percentage = Math.round((collected / totalStickers) * 100);

    const msg = `🏆⚽ *Meu Álbum - Figurinhas Copa 2026* ⚽🏆\n` +
                `Estou controlando meu progresso do álbum da Copa do Mundo pelo app!\n\n` +
                `📊 *Estatísticas de Coleção:*\n` +
                `• Coletadas: *${collected} de ${totalStickers}* (${percentage}%)\n` +
                `• Faltando: *${missing}*\n` +
                `• Repetidas para troca: *${duplicates}*\n\n` +
                `Vamos trocar figurinhas? 🤝`;

    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
    showToast('✓ Abrindo WhatsApp para compartilhar progresso...', 'info');
  } catch (error) {
    console.error('Error sharing on WhatsApp:', error);
    showToast('❌ Falha ao compartilhar status.', 'error');
  }
}
