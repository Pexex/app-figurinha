# Figurinhas Copa 2026

App web mobile-first para controle pessoal de figurinhas da Copa do Mundo 2026.

## 🎯 Objetivo

Facilitar o controle de coleção de figurinhas com interface simples, reconhecimento de códigos via câmera, e persistência local de dados.

## ✨ Funcionalidades

- ✅ Visualização de figurinhas organizadas por seção, grupo e país
- ✅ Controle de quantidade (+/-)
- ✅ Filtros por grupo, país e status
- ✅ Busca por código de figurinha
- ✅ Reconhecimento de códigos via câmera (OCR)
- ✅ Exportar/Importar dados em JSON
- ✅ Persistência local com IndexedDB
- ✅ Responsivo para mobile, tablet e desktop

## 🚀 Como Usar

1. Abra `index.html` no navegador
2. Navegue pelas figurinhas e aumente/diminua a quantidade
3. Use filtros para encontrar figurinhas específicas
4. Escaneie códigos com a câmera para incrementar automaticamente
5. Exporte seus dados em JSON para backup

## 📱 Compatibilidade

- Chrome (mobile + desktop)
- Firefox (desktop)
- Safari (mobile + desktop)
- Edge (desktop)

## 🛠️ Stack Técnico

- **HTML5** - Markup
- **CSS3** - Estilos mobile-first
- **Vanilla JavaScript** - Lógica
- **IndexedDB** - Persistência local
- **Tesseract.js** - OCR para câmera
- **WebRTC API** - Acesso câmera

## 📋 Estrutura

```
app-figurinha/
├── index.html              (Layout principal)
├── README.md               (Este arquivo)
├── prd.md                  (PRD e Plano)
├── css/
│   └── styles.css         (Estilos)
├── js/
│   ├── main.js            (Bootstrap)
│   ├── database.js        (IndexedDB)
│   ├── ui.js              (Renderização)
│   ├── filters.js         (Filtros)
│   ├── handlers.js        (Event listeners)
│   ├── camera-ocr.js      (Câmera + OCR)
│   └── export-import.js   (Import/Export)
└── data/
    └── figurinhas.json    (Base de dados)
```

## 📄 Licença

MIT
