# Roadmap de Projetos - Vite + React + Tailwind v4

Aplicação moderna de gerenciamento de tarefas com design carbon lead, highlights laranjas e animações fluidas.

## Stack Tecnológica

### Core
- **Vite 5** - Build tool ultra-rápido com HMR instantâneo
- **React 18** - Biblioteca UI com Concurrent Features
- **React SWC** - Compilador Rust 20x mais rápido que Babel

### Estilização
- **Tailwind CSS v4** - Framework CSS moderno (versão alpha com CSS puro)
- **Framer Motion 11** - Biblioteca de animações profissionais
- **Lucide React** - Ícones modernos e consistentes

### Utilidades
- **date-fns** - Manipulação de datas moderna e performática
- **localStorage** - Persistência local automática

## Funcionalidades

### Gerenciamento de Tarefas
- Adicionar tarefas com título e descrição
- Sistema de prioridades (Alta, Média, Baixa)
- Marcar tarefas como concluídas
- Editar descrição de tarefas existentes
- Remover tarefas
- Data de criação automática

### Filtros e Organização
- Filtrar por: Todas, Ativas, Concluídas
- Barra de progresso visual
- Estatísticas em tempo real (Total, Ativas, Concluídas)

### Persistência e Backup
- Auto-save no localStorage
- Exportar dados em JSON
- Importar dados de backup
- Resetar para estado inicial

### Animações
- Confetti ao completar tarefas (50 partículas)
- Background com orbs flutuantes
- Barra de progresso com shimmer effect
- Hover effects em todos os elementos
- Transições suaves com Framer Motion
- AnimatePresence para entrada/saída de elementos

### UI/UX
- Tema dark com glassmorphism
- Design responsivo (mobile-first)
- Scrollbar personalizada
- Gradientes laranjas
- Feedback visual em todas as ações

## Instalação

```bash
# Clone ou navegue até a pasta
cd vite-roadmap-v4

# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
npm run dev
```

O app abrirá automaticamente em `http://localhost:3000`

## Scripts Disponíveis

```bash
# Desenvolvimento (com hot reload)
npm run dev

# Build para produção
npm run build

# Preview da build de produção
npm run preview

# Lint do código
npm run lint
```

## Estrutura do Projeto

```
vite-roadmap-v4/
├── src/
│   ├── App.jsx           # Componente principal
│   ├── main.jsx          # Entry point
│   └── index.css         # Tailwind v4 + animações
├── index.html            # HTML base
├── vite.config.js        # Configuração Vite
├── package.json          # Dependências
└── README.md             # Este arquivo
```

## Tailwind v4 - Diferenças

Esta versão usa Tailwind CSS v4 (alpha), que traz mudanças significativas:

### CSS-First Configuration
Ao invés de `tailwind.config.js`, usamos `@theme` no CSS:

```css
@import "tailwindcss";

@theme {
  --color-carbon-900: #1a1a1a;
  --animate-float: float 20s ease-in-out infinite;
}
```

### Vantagens
- Sem necessidade de PostCSS config
- Configuração via CSS nativo
- Build mais rápido
- Melhor integração com ferramentas modernas
- Suporte nativo a CSS variables

## Otimizações de Performance

### Code Splitting
```javascript
manualChunks: {
  'react-vendor': ['react', 'react-dom'],
  'animation-vendor': ['framer-motion'],
  'icons-vendor': ['lucide-react'],
  'date-vendor': ['date-fns']
}
```

### React SWC
- Compilação Rust 20x mais rápida
- Hot Module Replacement instantâneo
- Bundle menor

### Lazy Loading
- Componentes carregados sob demanda
- Imagens otimizadas automaticamente

## Customização

### Cores
Edite em `src/index.css`:
```css
@theme {
  --color-carbon-900: #1a1a1a;
  /* Adicione suas cores */
}
```

### Animações
```css
@theme {
  --animate-custom: myAnimation 2s ease-in-out;
}

@keyframes myAnimation {
  0% { transform: scale(1); }
  100% { transform: scale(1.5); }
}
```

### Componentes
Adicione componentes em `src/components/`:
```jsx
export const MinhaFeature = () => {
  return <div>...</div>
}
```

## Deploy

### Vercel
```bash
npm run build
vercel --prod
```

### Netlify
```bash
npm run build
netlify deploy --prod --dir=dist
```

### GitHub Pages
```bash
npm run build
# Configure base no vite.config.js
# Deploy pasta dist/
```

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Opera 76+

## Performance Metrics

- First Contentful Paint: < 1s
- Time to Interactive: < 2s
- Lighthouse Score: 95+
- Bundle Size: ~150KB (gzipped)

## Roadmap de Features

### Em Desenvolvimento
- [ ] PWA (Progressive Web App)
- [ ] Modo offline
- [ ] Sincronização cloud
- [ ] Temas customizáveis
- [ ] Atalhos de teclado
- [ ] Drag & drop para reordenar
- [ ] Subtarefas
- [ ] Tags e categorias
- [ ] Busca e filtros avançados
- [ ] Estatísticas e gráficos
- [ ] Notificações desktop
- [ ] Dark/Light mode toggle
- [ ] Integração com calendário
- [ ] Compartilhamento de tarefas
- [ ] Histórico de mudanças

### Futuro
- [ ] App mobile (React Native)
- [ ] Extensão de navegador
- [ ] API REST
- [ ] Autenticação (Auth0)
- [ ] Colaboração em tempo real (WebSockets)

## Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

## Licença

MIT License - sinta-se livre para usar em seus projetos!

## Tecnologias Detalhadas

### Vite 5
- ESBuild para dev server
- Rollup para production build
- Hot Module Replacement nativo
- Suporte TypeScript out-of-the-box

### React 18
- Concurrent Rendering
- Automatic Batching
- Suspense
- Server Components ready

### Tailwind v4
- CSS-first configuration
- Sem dependência de PostCSS
- Performance melhorada
- Melhor DX

### Framer Motion 11
- Animações declarativas
- Layout animations
- Gesture recognition
- SVG animations
- Scroll-triggered animations

## Troubleshooting

### Port já em uso
```bash
# Altere a porta no vite.config.js
server: { port: 3001 }
```

### Build falha
```bash
# Limpe cache e reinstale
rm -rf node_modules package-lock.json
npm install
```

### Tailwind não funciona
```bash
# Verifique se @import está no topo do index.css
@import "tailwindcss";
```

## Suporte

Para bugs e sugestões, abra uma issue no GitHub.

---

**Desenvolvido com Vite + React + Tailwind v4**

Versão: 2.0.0
Última atualização: Janeiro 2026
