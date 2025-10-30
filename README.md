# Restaurante Termo - Website

Um website moderno e responsivo para restaurante, focado em **performance**, **acessibilidade** e **experiência do usuário (UX/UI)**.

## 🚀 Características

### Performance
- **Critical CSS** separado para carregamento instantâneo
- **Lazy loading** de imagens e conteúdo
- **CSS e JS minificados** em produção
- **Intersection Observer** para animações eficientes
- **Debounce/Throttle** em eventos de scroll
- **Service Worker** ready para cache offline

### UX/UI
- **Design responsivo** (Mobile-first)
- **Navegação intuitiva** com scroll suave
- **Animações fluidas** e microinterações
- **Sistema de filtros** no cardápio
- **Modal de reservas** com validação
- **Feedback visual** para formulários
- **Loading states** para melhor percepção

### Acessibilidade
- **Navegação por teclado** completa
- **ARIA labels** e roles adequados
- **Skip links** para usuários de screen reader
- **Contraste** adequado de cores
- **Foco visível** em elementos interativos
- **Textos alternativos** para imagens

## 📁 Estrutura do Projeto

```
Restaurante - Termo/
├── index.html              # Página principal
├── assets/
│   ├── css/
│   │   ├── critical.css     # CSS crítico (above-the-fold)
│   │   └── main.css         # CSS principal (carregado async)
│   ├── js/
│   │   └── main.js          # JavaScript principal
│   └── images/              # Imagens do site
└── README.md               # Este arquivo
```

## 🛠️ Tecnologias

- **HTML5** semântico
- **CSS3** com Flexbox/Grid
- **JavaScript ES6+** vanilla
- **Web APIs** modernas (Intersection Observer, Service Worker)
- **Progressive Enhancement**

## 📱 Responsividade

- **Mobile**: 320px - 767px
- **Tablet**: 768px - 1023px
- **Desktop**: 1024px+

## 🎨 Funcionalidades

### Navegação
- Menu responsivo com hamburger no mobile
- Navegação por âncoras com scroll suave
- Scroll spy para destacar seção ativa
- Fechamento automático do menu mobile

### Cardápio
- Sistema de filtros por categoria
- Carregamento dinâmico dos itens
- Animações escalonadas nos cards
- Layout em grid responsivo

### Formulários
- Validação em tempo real
- Feedback visual de erros
- Máscaras para telefone/email
- Estados de loading/sucesso

### Modal de Reservas
- Abre com animação suave
- Fecha com ESC ou clique fora
- Gerenciamento de foco
- Validação de datas futuras

### Animações
- Counter animado nas estatísticas
- Fade-in elements on scroll
- Hover effects nos cards
- Transições suaves

## 🚀 Como Usar

1. **Desenvolvimento Local**:
   ```bash
   # Abra index.html diretamente no navegador
   # Ou use um servidor local
   npx serve .
   # ou
   python -m http.server 8000
   ```

2. **Personalização**:
   - Edite as cores no `:root` do CSS
   - Modifique o array `menuItems` no JavaScript
   - Ajuste o conteúdo no HTML
   - Substitua as imagens placeholder

3. **Deploy**:
   - Faça upload dos arquivos para seu servidor
   - Configure HTTPS para melhor performance
   - Considere usar um CDN para assets

## 📊 Otimizações de Performance

### CSS
- Critical CSS inlined no `<head>`
- CSS não-crítico carregado assincronamente
- Media queries para print
- Suporte a `prefers-reduced-motion`

### JavaScript
- Carregamento com `defer`
- Debounce em eventos frequentes
- Throttle para scroll events
- Lazy loading de conteúdo

### HTML
- Preload de recursos críticos
- DNS prefetch para fonts
- Semantic markup
- Structured data ready

## 🔧 Configurações Avançadas

### Service Worker
Para ativar o cache offline, crie um arquivo `sw.js`:

```javascript
const CACHE_NAME = 'restaurante-termo-v1';
const urlsToCache = [
  '/',
  '/assets/css/critical.css',
  '/assets/css/main.css',
  '/assets/js/main.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});
```

### Google Analytics
Adicione antes do `</head>`:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_TRACKING_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_TRACKING_ID');
</script>
```

## 🎯 Melhorias Futuras

- [ ] Integração com API real
- [ ] Sistema de reservas backend
- [ ] Chat online
- [ ] Galeria de fotos
- [ ] Blog/Notícias
- [ ] Sistema de avaliações
- [ ] Delivery online
- [ ] Multilíngue (i18n)

## 📈 Métricas de Performance

- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1
- **First Input Delay**: < 100ms
- **Lighthouse Score**: > 95

## 🐛 Suporte a Navegadores

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## 📝 Licença

Este projeto é de uso livre para fins educacionais e comerciais.

---

**Desenvolvido com foco em performance e experiência do usuário** 🚀