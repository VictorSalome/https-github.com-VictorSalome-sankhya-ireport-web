# Sankhya iReport Web

Ambiente web moderno para desenho, edicao visual e geracao de relatorios JasperReports (JRXML) com foco em compatibilidade estrita para o ecossistema Sankhya ERP.

---

## 1. Visao Geral

O **Sankhya iReport Web** foi desenvolvido para solucionar a defasagem operacional das ferramentas legadas de relatorios baseadas em Java Desktop (como o JasperReports / iReport 4.0.1 e Jaspersoft Studio), oferecendo uma interface web contemporanea, intuitiva e de alta performance construida sobre Next.js 16, React 19 e TypeScript.

A aplicacao permite carregar, criar, manipular visualmente e exportar arquivos `.jrxml` prontos para upload na central de relatorios formatados do Sankhya, assegurando total conformidade com os esquemas XSD suportados pelo servidor corporativo.

---

## 2. Principais Recursos

### Editor Visual e Canvas Interativo
- **Manipulacao Direta**: Selecao, arrasto, redimensionamento pixel-perfect e duplicacao de elementos em tempo real com auxilio da biblioteca `react-moveable`.
- **Bandas Estruturadas**: Suporte completo ao ciclo de bandas do JasperReports:
  - Title
  - Page Header
  - Column Header
  - Detail (com suporte avancado a multiplos sub-blocos de `<band>`)
  - Column Footer
  - Page Footer
  - Last Page Footer
  - Summary
  - Background
- **Agrupamentos Dinamicos (Groups)**: Criacao e edicao de grupos com bandas dedicadas de `groupHeader` e `groupFooter`, alem de expressoes customizadas de quebra.
- **Grade Inteligente (Smart Grid)**: Ferramenta de alinhamento automatico com conversao bidirecional entre pontos tipograficos (pt) e milimetros (mm), calculo de slots e distribuicao proporcional de colunas.
- **Navegacao e Zoom**: Controle de escala fluido (de 25% a 200%), alem de configuracao de snap-to-grid parametrizavel.
- **Sub-relatorios em Abas**: Suporte a gerenciamento de multiplas abas dentro da mesma sessao de trabalho, facilitando a edicao simultanea de relatorios principais e seus respectivos sub-relatorios.

### Compatibilidade Rigorosa com Sankhya ERP (JasperReports 4.0.1)
O Sankhya ERP opera tipicamente com o motor JasperReports versao 4.0.1, que rejeita tags e atributos introduzidos em versoes posteriores. O motor de serializacao desta ferramenta conta com um pipeline de compatibilidade ativo:
- **Sanitizacao de UUIDs**: Omissao automatica do atributo `uuid` em `<jasperReport>` e em todos os nós visuais (`<reportElement>`), evitando falhas de parser no motor legado.
- **Metadados de Posicionamento**: Inclusao das propriedades de controle compativeis com o iReport tradicional (`ireport.zoom`, `ireport.x`, `ireport.y`).
- **Mapeamento de Fontes PDF**: Configuracao automatica dos atributos essenciais para geracao de PDF no servidor: `pdfFontName="Helvetica-Bold"` (quando aplicavel negrito), `pdfEncoding="CP1252"` e `isPdfEmbedded="false"`.
- **Alternancia de Versao**: Possibilidade de exportar em conformidade com JasperReports 4.0.1 (padrao Sankhya) ou JasperReports 5.6.0.

### Componentes e Scaffolds Corporativos
A paleta conta com componentes fundamentais e blocos de negocio pre-configurados:
- **Elementos Basicos**: Textos estaticos (`staticText`), campos dinamicos (`textField`), retangulos (`rectangle`), linhas (`line`), imagens (`image`) e sub-relatorios (`subreport`).
- **Codigos de Barras**: Barcode 1D e 2D (Code128, EAN13, QRCode, PDF417).
- **Graficos e Tabelas Cruzadas**: Suporte a declaracao e estilizacao de graficos (`chart`) e tabelas dinamicas (`crosstab`).
- **Scaffolds Prontos para Negocio**:
  - Cabecalho empresarial completo (Logotipo, Razao Social, CNPJ, Inscricao Estadual, Data/Hora e Paginacao).
  - Tabela zebrada de produtos/itens.
  - Painel de totalizadores fiscais e financeiros.
  - Quadro de termos e assinaturas de responsabilidade.
  - Etiquetas logisticas com codigo de barras.

### Gerenciador de Consultas SQL e Dados
- Editor integrado para inspecao e definicao do comando SQL (`<queryString>`).
- Deteccao e declaracao automatica de campos (`$F{CAMPO}`) e parametros (`$P{PARAMETRO}`).
- Modo de simulacao e pre-visualizacao (Data Preview) para inspecao de layout com dados ficticios antes da exportacao final.

---

## 3. Arquitetura do Projeto

```
sankhya-ireport-web/
├── engine/                       # Schemas XSD e binarios de referencia
│   ├── jasperreport.xsd          # Schema XML oficial JasperReports 4.0.1 / 5.6.0
│   ├── components.xsd            # Schema de componentes estendidos (barcodes)
│   ├── combined_schema.xsd       # Schema unificado para validacao via xmllint
│   └── jasperreports-5.6.0.jar   # Biblioteca de referencia
├── scripts/                      # Automacoes e validadores de integridade
│   ├── validate-engine.ts        # Suite de testes com validacao XSD
│   ├── test-group.mjs            # Teste isolado de agrupamentos
│   └── export-sample.mjs         # Script utilitario de exportacao de exemplo
├── src/
│   ├── app/                      # Camada de rotas do Next.js (App Router)
│   │   ├── globals.css           # Estilos globais e tokens de interface
│   │   ├── layout.tsx            # Shell da aplicacao
│   │   └── page.tsx              # Componente principal do workspace e estado global
│   ├── components/               # Componentes de interface do usuario
│   │   ├── VisualCanvas.tsx      # Area de desenho visual interativa
│   │   ├── Palette.tsx           # Paleta lateral de elementos e scaffolds
│   │   ├── PropertiesPanel.tsx   # Painel de edicao de atributos do elemento selecionado
│   │   ├── Toolbar.tsx           # Barra de navegacao, zoom, modos e acoes
│   │   ├── CodeEditor.tsx        # Editor de codigo JRXML com sincronizacao
│   │   ├── DataPreview.tsx       # Pre-visualizacao com injecao de registros simulados
│   │   ├── SqlQueryModal.tsx     # Modal de edicao de query SQL e parametros
│   │   ├── GroupModal.tsx        # Gerenciador de bandas e quebras de grupo
│   │   ├── SmartGridToolbar.tsx  # Ferramentas de distribuicao e alinhamento
│   │   └── Toast.tsx             # Sistema de notificacoes de acoes
│   ├── engine/                   # Motor central de parsing, serializacao e templates
│   │   ├── parser.ts             # Parser de JRXML para AST TypeScript
│   │   ├── serializer.ts         # Serializador de AST TypeScript para XML final
│   │   ├── sankhya-components.ts # Catalogo de blocos de negocio e geracao de scaffolds
│   │   ├── smart-grid.ts         # Motor matematico de calculo de grid e espacamentos
│   │   ├── templates.ts          # Templates de relatorios completos pre-fabricados
│   │   └── presets.ts            # Configuracoes padrao de pagina e layout inicial
│   └── types/
│       └── jrxml.ts              # Tipagem estrita de todos os nos e atributos JRXML
├── package.json                  # Dependencias e scripts do projeto
├── pnpm-lock.yaml                # Trava de dependencias deterministica
└── tsconfig.json                 # Configuracoes do compilador TypeScript
```

---

## 4. Stack Tecnologica

| Componente | Tecnologia | Versao | Finalidade |
| :--- | :--- | :--- | :--- |
| Framework Full-Stack | Next.js (Turbopack) | 16.4.2 | Roteamento, SSR e bundle de alto desempenho |
| Interface do Usuario | React | 19.3.1 | Renderizacao declarativa e hooks de estado |
| Tipagem Estatica | TypeScript | 7.x / 5.8+ | Seguranca de tipos em todo o pipeline JRXML |
| Estilizacao | Tailwind CSS | 4.3.3 | Sistema utilitario de design e responsividade |
| Manipulador XML | fast-xml-parser | 5.11.2 | Analise rapida e deterministica de documentos JRXML |
| Motor Interativo | react-moveable | 0.56.0 | Controle de translacao, redimensionamento e selecao |
| Iconografia | Lucide React | 1.59.0 | Icones consistentes e otimizados |
| Gerenciador de Pacotes | pnpm | 12.x | Gestao eficiente e reprodutivel de dependencias |

---

## 5. Instalacao e Execucao

### Pre-requisitos
- **Node.js**: versao 20.x ou superior.
- **pnpm**: versao 9.x ou superior.
- **xmllint** (opcional, para execucao dos testes de schema XSD locais): disponivel nativamente no macOS e Linux (`libxml2-utils`).

### Passo a Passo

1. **Clonar o repositório:**
```bash
# Clone via SSH (Recomendado)
git clone git@github.com:VictorSalome/https-github.com-VictorSalome-sankhya-ireport-web.git
cd https-github.com-VictorSalome-sankhya-ireport-web

# Ou clone via HTTPS
git clone https://github.com/VictorSalome/https-github.com-VictorSalome-sankhya-ireport-web.git
cd https-github.com-VictorSalome-sankhya-ireport-web
```

2. **Instalar as dependencias:**
```bash
pnpm install
```

3. **Iniciar o ambiente de desenvolvimento:**
```bash
pnpm dev
```
A aplicacao estara disponivel em `http://localhost:3000` (ou na porta configurada pelo terminal).

4. **Validar o motor contra os schemas XSD:**
```bash
pnpm test:engine
```
Esse script executa uma bateria com testes unitarios e validacoes formais com `xmllint` contra o arquivo `engine/jasperreport.xsd`, garantindo integridade sintatica e estrutural.

5. **Gerar o build de producao:**
```bash
pnpm build
```

6. **Executar em producao:**
```bash
pnpm start
```

---

## 6. Padroes de Codigo e Boas Praticas

- **Determinismo na Serializacao**: A ordem dos nos gerados pelo serializador obedece estritamente a sequencia exigida pelo XSD oficial do JasperReports (ex: `property`, `import`, `parameter`, `queryString`, `field`, `variable`, `group`, `title`, `pageHeader`, `columnHeader`, `detail`, `columnFooter`, `pageFooter`, `lastPageFooter`, `summary`).
- **Nomes de Atributos Normalizados**: Todos os nomes e chaves do JSON interno sao tipados no arquivo `src/types/jrxml.ts` para evitar divergencias de nomenclatura.
- **Isolamento de Modulos**: O motor de processamento (`src/engine/`) e desvinculado dos componentes visuais (`src/components/`), permitindo testes e execucoes via linha de comando ou servico externo sem necessidade de montagem de tela.

---

## 7. Licenca e Creditos

Projeto desenvolvido e mantido por **Victor Salome**. Distribuido sob licenca proprietaria/corporativa para integracao com sistemas Sankhya ERP.
