# Início Rápido

## Instalação e Execução

```bash
# 1. Navegue até a pasta
cd vite-roadmap-v4

# 2. Instale as dependências
npm install

# 3. Inicie o servidor
npm run dev
```

Pronto! O app abrirá automaticamente em `http://localhost:3000`

## Principais Comandos

```bash
# Desenvolvimento
npm run dev          # Inicia servidor com hot reload

# Produção
npm run build        # Cria build otimizada
npm run preview      # Preview da build

# Qualidade
npm run lint         # Verifica código
```

## Primeira Vez com Node.js?

### Instalar Node.js

**macOS:**
```bash
# Usando Homebrew
brew install node

# Ou baixe em: https://nodejs.org
```

**Windows:**
```bash
# Baixe em: https://nodejs.org
```

**Linux:**
```bash
# Ubuntu/Debian
sudo apt install nodejs npm

# Fedora
sudo dnf install nodejs
```

### Verificar Instalação
```bash
node --version  # Deve mostrar v18+
npm --version   # Deve mostrar v9+
```

## Estrutura Básica

```
vite-roadmap-v4/
├── src/
│   ├── App.jsx       → Componente principal
│   ├── main.jsx      → Entry point
│   └── index.css     → Estilos globais
├── index.html        → HTML base
└── package.json      → Dependências
```

## Tecnologias Usadas

- **Vite 5** - Build tool ultra-rápido
- **React 18** - Biblioteca UI
- **Tailwind v4** - CSS moderno
- **Framer Motion** - Animações
- **Lucide React** - Ícones

## Características

- Confetti ao completar tarefas
- Sistema de descrições
- Export/Import JSON
- Filtros de tarefas
- Barra de progresso
- Auto-save
- Animações suaves
- Design responsivo

## Problemas Comuns

### Porta já em uso
Edite `vite.config.js`:
```javascript
server: { port: 3001 }
```

### Dependências faltando
```bash
rm -rf node_modules package-lock.json
npm install
```

### Build falha
```bash
npm run build -- --debug
```

## Próximos Passos

1. Execute `npm run dev`
2. Abra `http://localhost:3000`
3. Adicione suas tarefas
4. Explore as funcionalidades

## Suporte

Dúvidas? Veja o README.md completo!

---

Desenvolvido com Vite + React + Tailwind v4
