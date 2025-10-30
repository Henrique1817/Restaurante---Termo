// JavaScript Principal do Website do Restaurante
// Otimizado para performance e acessibilidade

(function() {
    'use strict'; // Modo estrito para evitar erros comuns

    // Otimização de Performance: Cache dos elementos DOM
    // Armazenamos referências aos elementos para evitar consultas repetidas ao DOM
    const DOM = {
        body: document.body, // Elemento body da página
        navbar: document.querySelector('.navbar'), // Barra de navegação
        navbarToggle: document.querySelector('.navbar-toggle'), // Botão hambúrguer do menu mobile
        navbarMenu: document.querySelector('.navbar-menu'), // Menu de navegação
        navLinks: document.querySelectorAll('.navbar-menu a'), // Links do menu
        menuGrid: document.getElementById('menu-grid'), // Grid do cardápio
        menuLoading: document.getElementById('menu-loading'), // Indicador de carregamento do menu
        filterBtns: document.querySelectorAll('.filter-btn'), // Botões de filtro do cardápio
        contactForm: document.getElementById('contact-form'), // Formulário de contato
        reservationModal: document.getElementById('reservation-modal'), // Modal de reservas
        reservationForm: document.getElementById('reservation-form'), // Formulário de reservas
        modalClose: document.querySelector('.modal-close'), // Botão de fechar modal
        statNumbers: document.querySelectorAll('.stat-number'), // Números das estatísticas
        fadeElements: document.querySelectorAll('.fade-in') // Elementos com animação fade-in
    };

    // Estado da aplicação
    // Armazena informações importantes sobre o estado atual da página
    const state = {
        currentFilter: 'all', // Filtro atual do cardápio (todos, entradas, etc.)
        isMenuLoaded: false, // Indica se o cardápio já foi carregado
        observers: new Map(), // Armazena os observadores de interseção (Intersection Observers)
        menuData: [] // Dados do cardápio carregados
    };

    // Dados do cardápio (em uma aplicação real, viria de uma API)
    // Array com todos os itens do menu organizados por categoria
    const menuItems = [
        {
            id: 1,
            name: "Salmão Grelhado",
            description: "Salmão fresco grelhado com ervas finas e acompanhamentos sazonais",
            price: "R$ 68,00",
            category: "pratos-principais",
            image: "🐟"
        },
        {
            id: 2,
            name: "Risotto de Cogumelos",
            description: "Risotto cremoso com mix de cogumelos frescos e parmesão",
            price: "R$ 52,00",
            category: "pratos-principais",
            image: "🍄"
        },
        {
            id: 3,
            name: "Bruschetta Trio",
            description: "Trio de bruschettas com tomate, burrata e tapenade de azeitona",
            price: "R$ 28,00",
            category: "entradas",
            image: "🍅"
        },
        {
            id: 4,
            name: "Carpaccio de Carne",
            description: "Fatias finas de carne bovina com rúcula e parmesão",
            price: "R$ 35,00",
            category: "entradas",
            image: "🥩"
        },
        {
            id: 5,
            name: "Tiramisu Clássico",
            description: "Sobremesa italiana tradicional com café e mascarpone",
            price: "R$ 22,00",
            category: "sobremesas",
            image: "🍰"
        },
        {
            id: 6,
            name: "Panna Cotta Frutas Vermelhas",
            description: "Panna cotta cremosa com calda de frutas vermelhas",
            price: "R$ 18,00",
            category: "sobremesas",
            image: "🍓"
        },
        {
            id: 7,
            name: "Vinho Tinto Reserva",
            description: "Seleção especial da casa, safra 2020",
            price: "R$ 85,00",
            category: "bebidas",
            image: "🍷"
        },
        {
            id: 8,
            name: "Suco Natural",
            description: "Suco fresco de frutas da estação",
            price: "R$ 12,00",
            category: "bebidas",
            image: "🥤"
        }
    ];

    // Funções utilitárias
    // Conjunto de funções auxiliares para melhorar performance e funcionalidade
    const utils = {
        // Função debounce para otimização de performance
        // Evita que uma função seja executada muitas vezes seguidas
        debounce(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        },

        // Função throttle para eventos de scroll
        // Limita a frequência de execução de uma função
        throttle(func, limit) {
            let inThrottle;
            return function() {
                const args = arguments;
                const context = this;
                if (!inThrottle) {
                    func.apply(context, args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            };
        },

        // Verifica se um elemento está visível na tela
        // Usado para animações quando o elemento entra no viewport
        isInViewport(element) {
            const rect = element.getBoundingClientRect();
            return (
                rect.top >= 0 &&
                rect.left >= 0 &&
                rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
                rect.right <= (window.innerWidth || document.documentElement.clientWidth)
            );
        },

        // Anima contagem de números
        // Cria efeito visual de números incrementando gradualmente
        animateNumber(element, target, duration = 2000) {
            const start = 0;
            const increment = target / (duration / 16);
            let current = start;
            
            const timer = setInterval(() => {
                current += increment;
                element.textContent = Math.floor(current);
                
                if (current >= target) {
                    element.textContent = target;
                    clearInterval(timer);
                }
            }, 16);
        },

        // Validação de formulários
        // Verifica se o email tem formato válido
        validateEmail(email) {
            const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return re.test(email);
        },

        // Verifica se o telefone tem formato válido
        validatePhone(phone) {
            const re = /^[\d\s\-\(\)]{10,}$/;
            return re.test(phone);
        },

        // Exibe mensagem de erro no formulário
        // Adiciona classe de erro e mostra mensagem ao usuário
        showError(input, message) {
            const formGroup = input.closest('.form-group');
            const errorElement = formGroup.querySelector('.error-message');
            
            formGroup.classList.add('error');
            errorElement.textContent = message;
            errorElement.setAttribute('aria-live', 'polite');
        },

        // Remove mensagem de erro do formulário
        // Limpa visual de erro quando campo é corrigido
        clearError(input) {
            const formGroup = input.closest('.form-group');
            const errorElement = formGroup.querySelector('.error-message');
            
            formGroup.classList.remove('error');
            errorElement.textContent = '';
        }
    };

    // Funcionalidade de navegação
    // Gerencia toda a navegação do site, menu mobile e scroll suave
    const navigation = {
        // Inicializa todos os recursos de navegação
        init() {
            this.bindEvents(); // Vincula eventos de clique e teclado
            this.setupSmoothScroll(); // Configura rolagem suave
            this.setupScrollSpy(); // Configura destaque do menu baseado na posição
        },

        // Vincula eventos aos elementos de navegação
        bindEvents() {
            // Evento para o botão hambúrguer no mobile
            if (DOM.navbarToggle) {
                DOM.navbarToggle.addEventListener('click', this.toggleMobileMenu.bind(this));
            }

            // Eventos para links do menu
            DOM.navLinks.forEach(link => {
                link.addEventListener('click', this.handleNavClick.bind(this));
            });

            // Fecha menu mobile ao clicar fora dele
            document.addEventListener('click', (e) => {
                if (!DOM.navbar.contains(e.target) && DOM.navbarMenu.classList.contains('active')) {
                    this.closeMobileMenu();
                }
            });

            // Fecha menu mobile com tecla Escape
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && DOM.navbarMenu.classList.contains('active')) {
                    this.closeMobileMenu();
                }
            });
        },

        // Alterna entre abrir e fechar o menu mobile
        toggleMobileMenu() {
            const isOpen = DOM.navbarMenu.classList.contains('active');
            
            if (isOpen) {
                this.closeMobileMenu();
            } else {
                this.openMobileMenu();
            }
        },

        // Abre o menu mobile
        openMobileMenu() {
            DOM.navbarMenu.classList.add('active');
            DOM.navbarToggle.setAttribute('aria-expanded', 'true');
            DOM.body.style.overflow = 'hidden'; // Previne scroll de fundo
        },

        // Fecha o menu mobile
        closeMobileMenu() {
            DOM.navbarMenu.classList.remove('active');
            DOM.navbarToggle.setAttribute('aria-expanded', 'false');
            DOM.body.style.overflow = ''; // Restaura scroll normal
        },

        // Gerencia cliques nos links de navegação
        handleNavClick(e) {
            const href = e.target.getAttribute('href');
            
            // Se for âncora interna, faz scroll suave
            if (href.startsWith('#')) {
                e.preventDefault();
                const targetId = href.substring(1);
                const targetElement = document.getElementById(targetId);
                
                if (targetElement) {
                    this.scrollToElement(targetElement);
                    this.closeMobileMenu();
                }
            }
        },

        // Faz scroll suave até um elemento específico
        scrollToElement(element) {
            const headerHeight = DOM.navbar.offsetHeight;
            const elementTop = element.offsetTop - headerHeight;
            
            window.scrollTo({
                top: elementTop,
                behavior: 'smooth'
            });
        },

        // Configura scroll suave para links especiais
        setupSmoothScroll() {
            // Gerencia links de reserva (abre modal)
            document.addEventListener('click', (e) => {
                if (e.target.matches('a[href="#reservas"]') || e.target.closest('a[href="#reservas"]')) {
                    e.preventDefault();
                    modal.show();
                }
            });
        },

        // Configura destaque do menu baseado na posição de scroll
        setupScrollSpy() {
            const sections = document.querySelectorAll('section[id]');
            const scrollHandler = utils.throttle(() => {
                let current = '';
                
                // Determina qual seção está atualmente visível
                sections.forEach(section => {
                    const sectionTop = section.offsetTop - DOM.navbar.offsetHeight - 50;
                    if (window.pageYOffset >= sectionTop) {
                        current = section.getAttribute('id');
                    }
                });

                // Atualiza o menu destacando a seção atual
                DOM.navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${current}`) {
                        link.classList.add('active');
                    }
                });
            }, 100);

            window.addEventListener('scroll', scrollHandler);
        }
    };

    // Funcionalidade do cardápio
    // Gerencia carregamento, exibição e filtragem dos itens do menu
    const menu = {
        // Inicializa o sistema do cardápio
        init() {
            this.bindEvents(); // Vincula eventos dos botões de filtro
            this.loadMenu(); // Carrega os itens do cardápio
        },

        // Vincula eventos aos botões de filtro
        bindEvents() {
            DOM.filterBtns.forEach(btn => {
                btn.addEventListener('click', this.handleFilterClick.bind(this));
            });
        },

        // Gerencia cliques nos botões de filtro do cardápio
        handleFilterClick(e) {
            const filter = e.target.getAttribute('data-filter');
            
            // Atualiza botão ativo visualmente
            DOM.filterBtns.forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            
            // Aplica filtro aos itens do menu
            this.filterMenu(filter);
        },

        // Carrega o cardápio (simula chamada de API)
        async loadMenu() {
            if (state.isMenuLoaded) return; // Evita carregar múltiplas vezes
            
            this.showLoading(); // Mostra indicador de carregamento
            
            // Simula delay de uma chamada de API real
            await new Promise(resolve => setTimeout(resolve, 500));
            
            state.menuData = menuItems; // Armazena dados no estado
            this.renderMenu(state.menuData); // Renderiza itens na tela
            this.hideLoading(); // Esconde indicador de carregamento
            
            state.isMenuLoaded = true; // Marca como carregado
        },

        // Renderiza os itens do menu na tela
        renderMenu(items) {
            DOM.menuGrid.innerHTML = ''; // Limpa conteúdo anterior
            
            // Cria e adiciona cada item com animação escalonada
            items.forEach((item, index) => {
                const menuItemElement = this.createMenuItem(item);
                DOM.menuGrid.appendChild(menuItemElement);
                
                // Anima entrada dos itens com delay progressivo
                setTimeout(() => {
                    menuItemElement.classList.add('show');
                }, index * 100);
            });
        },

        // Cria elemento HTML para um item do cardápio
        createMenuItem(item) {
            const menuItem = document.createElement('div');
            menuItem.className = `menu-item ${item.category}`;
            menuItem.innerHTML = `
                <div class="menu-item-image" aria-hidden="true">
                    ${item.image}
                </div>
                <div class="menu-item-content">
                    <h3 class="menu-item-title">${item.name}</h3>
                    <p class="menu-item-description">${item.description}</p>
                    <div class="menu-item-price">${item.price}</div>
                </div>
            `;
            
            return menuItem;
        },

        // Filtra itens do menu por categoria
        filterMenu(filter) {
            const items = DOM.menuGrid.querySelectorAll('.menu-item');
            
            items.forEach(item => {
                // Determina se item deve ser mostrado baseado no filtro
                const shouldShow = filter === 'all' || item.classList.contains(filter);
                
                if (shouldShow) {
                    item.style.display = 'block';
                    setTimeout(() => item.classList.add('show'), 50);
                } else {
                    item.classList.remove('show');
                    setTimeout(() => item.style.display = 'none', 300);
                }
            });
        },

        // Mostra indicador de carregamento
        showLoading() {
            DOM.menuLoading.classList.add('show');
            DOM.menuLoading.setAttribute('aria-hidden', 'false');
        },

        // Esconde indicador de carregamento
        hideLoading() {
            DOM.menuLoading.classList.remove('show');
            DOM.menuLoading.setAttribute('aria-hidden', 'true');
        }
    };

    // Funcionalidade do modal
    // Gerencia abertura, fechamento e comportamento do modal de reservas
    const modal = {
        // Inicializa eventos do modal
        init() {
            this.bindEvents();
        },

        // Vincula eventos de abertura e fechamento
        bindEvents() {
            // Evento para botão de fechar (X)
            if (DOM.modalClose) {
                DOM.modalClose.addEventListener('click', this.hide.bind(this));
            }

            // Fecha modal ao clicar no fundo escuro
            if (DOM.reservationModal) {
                DOM.reservationModal.addEventListener('click', (e) => {
                    if (e.target === DOM.reservationModal) {
                        this.hide();
                    }
                });
            }

            // Fecha modal com tecla Escape
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && DOM.reservationModal.classList.contains('show')) {
                    this.hide();
                }
            });
        },

        // Mostra o modal de reservas
        show() {
            DOM.reservationModal.classList.add('show');
            DOM.reservationModal.setAttribute('aria-hidden', 'false');
            DOM.body.style.overflow = 'hidden'; // Previne scroll de fundo
            
            // Gerenciamento de foco para acessibilidade
            const firstInput = DOM.reservationModal.querySelector('input, select, textarea');
            if (firstInput) {
                setTimeout(() => firstInput.focus(), 100);
            }
        },

        // Esconde o modal de reservas
        hide() {
            DOM.reservationModal.classList.remove('show');
            DOM.reservationModal.setAttribute('aria-hidden', 'true');
            DOM.body.style.overflow = ''; // Restaura scroll normal
            
            // Reseta o formulário e limpa erros
            if (DOM.reservationForm) {
                DOM.reservationForm.reset();
                this.clearFormErrors(DOM.reservationForm);
            }
        },

        // Limpa todas as mensagens de erro do formulário
        clearFormErrors(form) {
            const errorElements = form.querySelectorAll('.form-group.error');
            errorElements.forEach(element => {
                element.classList.remove('error');
                const errorMessage = element.querySelector('.error-message');
                if (errorMessage) {
                    errorMessage.textContent = '';
                }
            });
        }
    };

    // Funcionalidade dos formulários
    // Gerencia validação, envio e feedback dos formulários de contato e reserva
    const forms = {
        // Inicializa sistema de formulários
        init() {
            this.bindEvents(); // Vincula eventos de validação e envio
            this.setupDateRestrictions(); // Configura restrições de datas
        },

        // Vincula eventos aos formulários
        bindEvents() {
            // Eventos de envio dos formulários
            if (DOM.contactForm) {
                DOM.contactForm.addEventListener('submit', this.handleContactSubmit.bind(this));
            }

            if (DOM.reservationForm) {
                DOM.reservationForm.addEventListener('submit', this.handleReservationSubmit.bind(this));
            }

            // Validação em tempo real
            const allInputs = document.querySelectorAll('input, textarea, select');
            allInputs.forEach(input => {
                input.addEventListener('blur', this.validateField.bind(this)); // Valida ao sair do campo
                input.addEventListener('input', utils.debounce(this.clearFieldError.bind(this), 300)); // Limpa erro ao digitar
            });
        },

        // Configura restrições para campos de data
        setupDateRestrictions() {
            const dateInput = document.getElementById('res-date');
            if (dateInput) {
                // Define data mínima como hoje
                const today = new Date().toISOString().split('T')[0];
                dateInput.setAttribute('min', today);
                
                // Define data máxima como 3 meses no futuro
                const maxDate = new Date();
                maxDate.setMonth(maxDate.getMonth() + 3);
                dateInput.setAttribute('max', maxDate.toISOString().split('T')[0]);
            }
        },

        // Valida um campo específico do formulário
        validateField(e) {
            const field = e.target;
            const value = field.value.trim();
            
            // Validação específica por tipo de campo
            switch (field.type) {
                case 'email':
                    if (value && !utils.validateEmail(value)) {
                        utils.showError(field, 'Por favor, insira um e-mail válido');
                        return false;
                    }
                    break;
                    
                case 'tel':
                    if (value && !utils.validatePhone(value)) {
                        utils.showError(field, 'Por favor, insira um telefone válido');
                        return false;
                    }
                    break;
                    
                default:
                    // Verifica campos obrigatórios
                    if (field.hasAttribute('required') && !value) {
                        utils.showError(field, 'Este campo é obrigatório');
                        return false;
                    }
            }
            
            utils.clearError(field); // Remove erro se validação passou
            return true;
        },

        // Limpa erro de um campo específico
        clearFieldError(e) {
            utils.clearError(e.target);
        },

        // Valida todo o formulário antes do envio
        validateForm(form) {
            const inputs = form.querySelectorAll('input[required], textarea[required], select[required]');
            let isValid = true;
            
            inputs.forEach(input => {
                if (!this.validateField({ target: input })) {
                    isValid = false;
                }
            });
            
            return isValid;
        },

        // Gerencia envio do formulário de contato
        async handleContactSubmit(e) {
            e.preventDefault();
            
            if (!this.validateForm(DOM.contactForm)) {
                return; // Para se validação falhar
            }
            
            const formData = new FormData(DOM.contactForm);
            const data = Object.fromEntries(formData);
            
            try {
                // Simula envio para API
                await this.submitContactForm(data);
                this.showSuccessMessage('Mensagem enviada com sucesso! Entraremos em contato em breve.');
                DOM.contactForm.reset();
            } catch (error) {
                this.showErrorMessage('Erro ao enviar mensagem. Tente novamente.');
            }
        },

        // Gerencia envio do formulário de reserva
        async handleReservationSubmit(e) {
            e.preventDefault();
            
            if (!this.validateForm(DOM.reservationForm)) {
                return; // Para se validação falhar
            }
            
            const formData = new FormData(DOM.reservationForm);
            const data = Object.fromEntries(formData);
            
            try {
                // Simula envio para API
                await this.submitReservationForm(data);
                this.showSuccessMessage('Reserva confirmada! Você receberá um e-mail de confirmação.');
                modal.hide();
            } catch (error) {
                this.showErrorMessage('Erro ao fazer reserva. Tente novamente.');
            }
        },

        // Simula envio do formulário de contato (substituir por API real)
        async submitContactForm(data) {
            // Simula delay de API
            return new Promise((resolve) => {
                setTimeout(() => {
                    console.log('Formulário de contato enviado:', data);
                    resolve();
                }, 1000);
            });
        },

        // Simula envio do formulário de reserva (substituir por API real)
        async submitReservationForm(data) {
            // Simula delay de API
            return new Promise((resolve) => {
                setTimeout(() => {
                    console.log('Formulário de reserva enviado:', data);
                    resolve();
                }, 1000);
            });
        },

        // Mostra mensagem de sucesso
        showSuccessMessage(message) {
            // Cria e exibe notificação de sucesso
            this.showNotification(message, 'success');
        },

        // Mostra mensagem de erro
        showErrorMessage(message) {
            // Cria e exibe notificação de erro
            this.showNotification(message, 'error');
        },

        // Cria e exibe notificação temporária
        showNotification(message, type) {
            const notification = document.createElement('div');
            notification.className = `notification notification-${type}`;
            notification.textContent = message;
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px 20px;
                border-radius: 5px;
                color: white;
                font-weight: 500;
                z-index: 1001;
                transform: translateX(100%);
                transition: transform 0.3s ease;
                ${type === 'success' ? 'background: #27ae60;' : 'background: #e74c3c;'}
            `;
            
            document.body.appendChild(notification);
            
            // Anima entrada da notificação
            setTimeout(() => {
                notification.style.transform = 'translateX(0)';
            }, 100);
            
            // Remove notificação após 5 segundos
            setTimeout(() => {
                notification.style.transform = 'translateX(100%)';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }, 5000);
        }
    };

    // Animações e efeitos de scroll
    // Gerencia animações que aparecem quando elementos entram na tela
    const animations = {
        // Inicializa sistema de animações
        init() {
            this.setupIntersectionObserver(); // Configura observador de interseção
            this.setupStatCounters(); // Configura contadores animados
        },

        // Configura observador para animações fade-in
        setupIntersectionObserver() {
            if (!window.IntersectionObserver) return; // Verifica suporte do navegador
            
            const observerOptions = {
                threshold: 0.1, // Elemento precisa estar 10% visível
                rootMargin: '50px' // Margem adicional para disparar animação
            };
            
            // Cria observador para elementos com fade-in
            const fadeObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible'); // Adiciona classe de animação
                        fadeObserver.unobserve(entry.target); // Para de observar após animar
                    }
                });
            }, observerOptions);
            
            // Observa todos os elementos com classe fade-in
            DOM.fadeElements.forEach(element => {
                fadeObserver.observe(element);
            });
            
            // Armazena observador para limpeza posterior
            state.observers.set('fade', fadeObserver);
        },

        // Configura contadores animados das estatísticas
        setupStatCounters() {
            if (!DOM.statNumbers.length) return; // Verifica se existem elementos
            
            // Cria observador específico para contadores
            const statsObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        // Obtém número alvo do atributo data-count
                        const target = parseInt(entry.target.getAttribute('data-count'));
                        utils.animateNumber(entry.target, target); // Inicia animação
                        statsObserver.unobserve(entry.target); // Para observação após animar
                    }
                });
            }, { threshold: 0.5 }); // Elemento precisa estar 50% visível
            
            // Observa todos os números das estatísticas
            DOM.statNumbers.forEach(element => {
                statsObserver.observe(element);
            });
            
            // Armazena observador para limpeza posterior
            state.observers.set('stats', statsObserver);
        }
    };

    // Monitoramento de performance
    // Implementa otimizações para melhorar velocidade de carregamento
    const performance = {
        // Inicializa otimizações de performance
        init() {
            this.setupLazyLoading(); // Configura carregamento tardio de imagens
            this.setupServiceWorker(); // Registra service worker para cache
        },

        // Configura carregamento tardio de imagens
        setupLazyLoading() {
            // Implementa lazy loading quando Intersection Observer está disponível
            if ('IntersectionObserver' in window) {
                const imageObserver = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            const img = entry.target;
                            img.src = img.dataset.src; // Carrega imagem real
                            img.classList.remove('lazy'); // Remove classe de lazy loading
                            imageObserver.unobserve(img); // Para de observar após carregar
                        }
                    });
                });

                // Observa todas as imagens com atributo data-src
                document.querySelectorAll('img[data-src]').forEach(img => {
                    imageObserver.observe(img);
                });
            }
        },

        // Registra service worker para cache offline
        setupServiceWorker() {
            // Registra service worker se disponível no navegador
            if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                    navigator.serviceWorker.register('/sw.js')
                        .then(() => console.log('Service Worker registrado com sucesso'))
                        .catch(() => console.log('Falha no registro do Service Worker'));
                });
            }
        }
    };

    // Inicialização da aplicação
    // Controla o processo de inicialização de todos os módulos
    const app = {
        // Inicia a aplicação
        init() {
            // Aguarda DOM estar pronto antes de inicializar
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', this.start.bind(this));
            } else {
                this.start(); // DOM já está pronto
            }
        },

        // Inicializa todos os módulos da aplicação
        start() {
            try {
                // Inicializa todos os módulos em ordem
                navigation.init(); // Sistema de navegação
                menu.init(); // Sistema do cardápio
                modal.init(); // Sistema de modais
                forms.init(); // Sistema de formulários
                animations.init(); // Sistema de animações
                performance.init(); // Otimizações de performance
                
                console.log('Website do restaurante inicializado com sucesso');
            } catch (error) {
                console.error('Erro ao inicializar aplicação:', error);
            }
        },

        // Função de limpeza para navegação SPA (Single Page Application)
        destroy() {
            // Limpa todos os observadores de interseção
            state.observers.forEach(observer => {
                observer.disconnect();
            });
            state.observers.clear();
            
            // Reseta estilos do body
            DOM.body.style.overflow = '';
        }
    };

    // Inicia a aplicação
    app.init();

    // Expõe app globalmente para depuração
    window.RestaurantApp = app;

})();