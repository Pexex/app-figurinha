# PRD & Plano de Desenvolvimento - App Figurinhas Copa 2026

## 1. PRODUCT REQUIREMENTS DOCUMENT (PRD)

### 1.1 Visão do Produto

**Nome**: Figurinhas Copa 2026  
**Descrição**: Aplicativo web mobile-first para controle pessoal de figurinhas da Copa do Mundo 2026. Permite ao usuário registrar quantidade de figurinhas que possui, filtrar por diferentes critérios, e compartilhar dados via JSON.

**Objetivo Principal**: Facilitar o controle de coleção de figurinhas com interface simples, reconhecimento de códigos via câmera, e persistência local de dados.

---

### 1.2 Público-Alvo

- Colecionadores de figurinhas da Copa 2026
- Usuários mobile (smartphone/tablet)
- Usuários desktop (secundário)
- Pessoas que fazem trocas de figurinhas

---

### 1.3 Funcionalidades Essenciais (MVP - Fase 1-2)

#### F1: Visualização de Figurinhas
- Exibir todas as figurinhas organizadas por:
  - Seção (Página Inicial / Fifa World Cup History)
  - Grupo (A-L)
  - País
- Grid responsivo com card de cada figurinha mostrando código
- Status visual (possuo/faltam/duplicadas)

#### F2: Controle de Quantidade
- Botões **+** (incrementar) e **-** (decrementar)
- Display da quantidade atual
- Estados: 0 (falta), 1+ (possuo), 2+ (duplicada/extra)
- Clique em +/- atualiza imediatamente a UI e IndexedDB

#### F3: Sistema de Filtros
- **Filtro por Grupo**: A, B, C, D, E, F, G, H, I, J, K, L
- **Filtro por País**: Lista dinâmica dos países disponíveis
- **Filtro por Status**: 
  - "Faltam" (quantidade = 0)
  - "Possuo" (quantidade >= 1)
  - "Duplicadas" (quantidade >= 2)
- Combinação de múltiplos filtros

#### F4: Busca por Código
- Input de busca por código de figurinha (ex: "MEX1", "BRA2")
- Busca em tempo real
- Destaque do resultado

#### F5: Contador de Progresso
- Exibir "X de Y figurinhas" no total
- Atualizar em tempo real ao modificar quantidades
- Percentual de conclusão (opcional)

#### F6: OCR com Câmera (Reconhecimento de Códigos)
- **[NOVO]** Botão "Escanear com câmera" no header/footer
- Modal com:
  - Video stream da câmera (feed ao vivo)
  - Botão "Capturar" para tirar foto
  - Botão "Fechar" para sair
- Usar **Tesseract.js** para ler código da figurinha
- Fluxo:
  1. Capturar foto da figurinha
  2. OCR extrai texto (ex: "MEX1")
  3. Buscar figurinha na base de dados
  4. Se encontrar → auto-incrementar quantidade (+1)
  5. Mostrar confirmação (ex: "MEX1 incrementada para 2")
- Permissão de câmera (request do navegador)

#### F7: Exportar Dados (JSON)
- Botão "Download" no header
- Gera arquivo `figurinhas_backup_YYYY-MM-DD.json`
- Contém estado completo: todas as quantidades de figurinhas
- Formato simples para compartilhar via WhatsApp/email

#### F8: Importar Dados (JSON)
- Botão "Upload" no header
- Aceita arquivo JSON anterior
- Restaura estado completo
- Confirmação antes de sobrescrever dados

#### F9: Persistência Local
- **IndexedDB** para armazenar:
  - Todas as figurinhas com quantidades
  - Data da última sincronização
- Dados persistem entre reloads
- Sincronização automática ao carregar página

---

### 1.4 Requisitos Não-Funcionais

| Requisito | Descrição |
|-----------|-----------|
| **Performance** | Carregamento < 2s, transições suave |
| **Responsividade** | Mobile (320px+), Tablet (768px+), Desktop |
| **Compatibilidade** | Chrome, Firefox, Safari (mobile e desktop) |
| **Armazenamento** | Até ~50MB em IndexedDB (mais que suficiente) |
| **Offline** | App funciona offline (sem internet) |
| **Câmera** | Funciona em HTTPS ou localhost |
| **Sem API Externa** | Nenhuma API obrigatória, JSON local |

---

### 1.5 Estrutura de Dados

```json
{
  "sections": [
    {
      "id": "pagina-inicial",
      "name": "Página Inicial",
      "groups": [
        {
          "letter": "A",
          "countries": [
            {
              "code": "MEX",
              "name": "México",
              "figurinhas": [
                {
                  "code": "MEX1",
                  "quantity": 0
                },
                {
                  "code": "MEX2",
                  "quantity": 1
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "id": "fifa-history",
      "name": "Fifa World Cup History",
      "groups": [...]
    }
  ]
}

```

### 1.6 User Stories

**US5: Como colecionador, quero exportar meu backup em JSON**

Critério de Aceitação:
- Botão de download JSON
- Arquivo gerado com data
- Arquivo pode ser compartilhado

**US6: Como colecionador, quero importar backup anterior**

Critério de Aceitação:
- Botão de upload JSON
- Arquivo restaura dados
- Confirmação antes de sobrescrever

---

## 2. PLANO DE DESENVOLVIMENTO

### 2.1 Fases e Cronograma

| Status | Fase | Descrição | Duração |
|--------|------|-----------|---------|
| ⚠️ | **FASE 1: Infraestrutura Base** | • Criar repo GitHub<br>• Estrutura de pastas (HTML/CSS/JS)<br>• Extrair dados do PDF → figurinhas.json<br>• Setup inicial: index.html, main.js | ~2 dias |
| ⚠️ | **FASE 2: Lógica de Dados** | • Implementar IndexedDB (database.js)<br>• Carregar figurinhas.json na primeira execução<br>• Funções: init, getAllFigurinha, updateQuantity | ~1 dia |
| ⚠️ | **FASE 3: UI - Grid de Figurinhas** | • Renderizar grid responsivo (ui.js)<br>• Cards com código + quantidade<br>• Botões +/- funcionais | ~1,5 dias |
| ⚠️ | **FASE 4: Filtros e Busca** | • Componentes de filtro (filters.js)<br>• Lógica de busca por código<br>• Atualizar grid conforme filtros | ~1 dia |
| ⚠️ | **FASE 5: OCR com Câmera** | • Modal câmera (camera-ocr.js)<br>• WebRTC - video stream<br>• Tesseract.js - OCR leitura<br>• Auto-incrementar figurinha | ~2 dias |
| ⚠️ | **FASE 6: Export/Import** | • Função download JSON (export-import.js)<br>• Função upload JSON | ~0,5 dia |
| ⚠️ | **FASE 7: Estilo e Responsividade** | • CSS mobile-first (styles.css)<br>• Media queries (tablet, desktop)<br>• Refinamento de UX | ~1,5 dias |
| ⏳ | **FASE 8: Deploy e Testes** | • Deploy GitHub Pages<br>• Testes em múltiplos navegadores<br>• Testes em dispositivos reais (mobile) | ~1 dia |

**Cronograma Total**: ~8-9 dias de desenvolvimento (iterativo)

### 2.2 Arquitetura Técnica

```
app-figurinha/
├── index.html                 (Layout principal)
├── .gitignore
├── README.md
├── prd.md                     (Este arquivo)
│
├── css/
│   └── styles.css            (Estilos mobile-first)
│
├── js/
│   ├── main.js              (Bootstrap app)
│   ├── database.js          (IndexedDB operations)
│   ├── ui.js                (Renderizar grid)
│   ├── filters.js           (Lógica de filtros)
│   ├── handlers.js          (Event listeners)
│   ├── camera-ocr.js        (Modal câmera + Tesseract.js)
│   └── export-import.js     (Download/upload JSON)
│
└── data/
    └── figurinhas.json      (Base de dados estática)
```

### 2.3 Dependências Externas

| Lib/API | Propósito | Tipo | URL |
|---------|-----------|------|-----|
| **Tesseract.js** | OCR - ler códigos | CDN | https://cdn.jsdelivr.net/npm/tesseract.js |
| **WebRTC API** | Acesso câmera | Nativo | - |
| **IndexedDB** | Persistência | Nativo | - |
| **Fetch API** | HTTP requests | Nativo | - |

### 2.4 Fluxos Principais

**Fluxo 1: Incrementar Figurinha (Botão +)**

1. User clica em botão "+"
2. handlers.js dispara updateQuantity()
3. database.js atualiza IndexedDB
4. ui.js re-renderiza card (novo número)
5. Contador de progresso atualiza

**Fluxo 2: Scanear com Câmera**

1. User clica "Escanear com câmera"
2. camera-ocr.js abre modal
3. WebRTC acessa câmera do dispositivo
4. User clica "Capturar"
5. Frame capturado é enviado para Tesseract.js
6. OCR retorna texto (ex: "MEX1")
7. database.js procura figurinha pelo código
8. Se encontrada → updateQuantity() (incrementa)
9. Mostrar confirmação: "✓ MEX1 incrementada para 2"
10. Modal fecha

**Fluxo 3: Exportar JSON**
1. User clica "Download"
2. export-import.js chama getAllFigurinha()
3. Cria objeto JSON com estado completo
4. Gera filename com data (figurinhas_2026-05-24.json)
5. Navegador baixa arquivo

**Fluxo 4: Importar JSON**
1. User clica "Upload"
2. Input file picker abre
3. User seleciona JSON anterior
4. export-import.js lê arquivo
5. Mostra confirmação: "Você tem certeza?"
6. Se confirma → database.js limpa e importa dados
7. UI re-renderiza

### 2.5 Checklist de Implementação

**Fase 1: Infraestrutura** ⚠️
- [x] Repositório GitHub criado
- [x] Pastas estruturadas (css/, js/, data/)
- [x] index.html base criado
- [ ] figurinhas.json com todos os dados extraído do PDF (apenas exemplo)

**Fase 2: IndexedDB** ⚠️ (Implementado, não testado)
- [x] database.js criado
- [ ] initDB() funciona
- [ ] getAllFigurinha() retorna dados
- [ ] updateQuantity() atualiza e persiste

**Fase 3: Grid UI** ⚠️ (Implementado, não testado)
- [x] ui.js renderiza figurinhas
- [ ] Grid responsivo (320px+)
- [ ] Cards mostram código + quantidade
- [ ] Botões +/- visíveis

**Fase 4: Filtros** ⚠️ (Implementado, não testado)
- [x] filters.js implementado
- [ ] Filtro por grupo funciona
- [ ] Filtro por país funciona
- [ ] Filtro por status funciona
- [ ] Múltiplos filtros combinam

**Fase 5: Câmera + OCR** ⚠️ (Implementado, não testado)
- [x] camera-ocr.js criado
- [ ] Modal abre/fecha
- [ ] WebRTC acessa câmera
- [ ] Tesseract.js carrega via CDN
- [ ] Captura foto funciona
- [ ] OCR lê código
- [ ] Auto-incrementa figurinha

**Fase 6: Export/Import** ⚠️ (Implementado, não testado)
- [x] export-import.js criado
- [ ] Download JSON funciona
- [ ] Upload JSON funciona
- [ ] Backup restaura corretamente

**Fase 7: Estilo** ⚠️ (Implementado, não testado)
- [x] styles.css mobile-first
- [ ] Media queries tablet/desktop
- [ ] Responsivo em 320px, 768px, 1024px
- [ ] UX smooth (transitions, hover)

**Fase 8: Deploy**
- [ ] GitHub Pages configurado
- [ ] Deploy bem-sucedido
- [ ] App funciona em: Chrome mobile, Safari mobile, Firefox, Chrome desktop
- [ ] Câmera funciona em mobile (HTTPS)

---

### 2.6 Testes (Validação)

**Testes Funcionais**
- [ ] Figurinhas carregam ao abrir app
- [ ] +/- incrementa/decrementa quantidade
- [ ] Quantidade salva no IndexedDB
- [ ] Filtros funcionam isoladamente e combinados
- [ ] Busca encontra figurinha
- [ ] OCR identifica código correto
- [ ] Auto-incremento funciona
- [ ] Export baixa JSON válido
- [ ] Import restaura dados

**Testes de Responsividade**
- [ ] Mobile (iPhone 6: 375px)
- [ ] Tablet (iPad: 768px)
- [ ] Desktop (1024px+)
- [ ] Rotação de tela funciona

**Testes de Compatibilidade**
- [ ] Chrome (mobile + desktop)
- [ ] Safari (mobile + desktop)
- [ ] Firefox (desktop)
- [ ] Edge (desktop)

**Testes de Performance**
- [ ] Carregamento < 2s
- [ ] Grid renderiza < 500ms
- [ ] Filtro aplica < 200ms
- [ ] OCR completa em < 5s

---

## 3. PRÓXIMOS PASSOS

- ✅ PRD e Plano aprovados
- ⚠️ Fase 1-7: Código implementado (faltam testes e validação)
- ➜ AGORA: Corrigir bugs, testar funcionalidades
- ➜ DEPOIS: Deploy GitHub Pages (FASE 8)

---

**Versão**: 1.0  
**Data**: 24/05/2026  
**Status**: ⚠️ Código implementado (~50%), pendente de testes e ajustes