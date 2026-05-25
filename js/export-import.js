/**
 * export-import.js - Export/Import de Dados
 * Responsável por download e upload de backup em JSON
 */

const ExportImport = {
    /**
     * Fazer download de backup em JSON
     */
    async downloadJSON() {
        try {
            // Obter todas as figurinhas
            const figurinhas = DB.extractAllFigurinha();

            // Criar objeto de backup
            const backup = {
                version: '1.0',
                date: new Date().toISOString(),
                totalFigurinha: figurinhas.length,
                figurinhas: figurinhas.map(f => ({
                    code: f.code,
                    quantity: f.quantity,
                    country: f.country,
                    group: f.group,
                    page: f.page
                }))
            };

            // Converter para JSON
            const jsonString = JSON.stringify(backup, null, 2);

            // Criar blob
            const blob = new Blob([jsonString], { type: 'application/json' });

            // Gerar filename com data
            const date = new Date().toISOString().split('T')[0];
            const filename = `figurinhas_backup_${date}.json`;

            // Fazer download
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            link.click();

            URL.revokeObjectURL(url);
            console.log(`✅ Backup baixado: ${filename}`);
            alert(`✅ Backup salvo como: ${filename}`);
        } catch (error) {
            console.error('Erro ao fazer download:', error);
            alert('Erro ao fazer download do backup');
        }
    },

    /**
     * Manipular upload de arquivo JSON
     */
    async handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            // Ler arquivo
            const fileContent = await this.readFile(file);
            const backup = JSON.parse(fileContent);

            // Validar backup
            if (!backup.figurinhas || !Array.isArray(backup.figurinhas)) {
                throw new Error('Formato de arquivo inválido');
            }

            // Solicitar confirmação
            const confirmed = confirm(
                `Deseja restaurar ${backup.figurinhas.length} figurinhas?\n\n` +
                `Data do backup: ${new Date(backup.date).toLocaleString()}\n\n` +
                `Isso substituirá seus dados atuais!`
            );

            if (!confirmed) {
                return;
            }

            // Importar dados
            await this.importData(backup.figurinhas);

            console.log('✅ Dados restaurados com sucesso');
            alert('✅ Backup restaurado com sucesso!');

            // Recarregar página
            window.location.reload();
        } catch (error) {
            console.error('Erro ao importar:', error);
            alert('Erro ao restaurar backup: ' + error.message);
        }

        // Limpar input
        event.target.value = '';
    },

    /**
     * Ler arquivo
     */
    readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e);
            reader.readAsText(file);
        });
    },

    /**
     * Importar dados de backup
     */
    async importData(figurinhas) {
        // Limpar dados existentes
        await DB.clearAllData();

        // Importar novos dados
        for (const fig of figurinhas) {
            await DB.addOrUpdateFigurinha(
                fig.code,
                fig.quantity,
                fig.country,
                fig.group,
                fig.page || 'page-inicial'
            );
        }

        console.log(`✅ ${figurinhas.length} figurinhas importadas`);
    }
};
