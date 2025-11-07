// JavaScript Principal do Website do Restaurante
// Otimizado para performance e acessibilidade

(function() {
    'use strict'; // Modo estrito para evitar erros comuns

    // Otimização de Performance: Cache dos elementos DOM
    // Armazenamos referências aos elementos para evitar consultas repetidas ao DOM
    // document no js significa o objeto raiz do HTML
    const DOM = {
        body: document.body, // Elemento body da página
        navbar: document.querySelector('.navbar'), // Barra de navegação
        header: document.querySelector('.header'), // Header fixo
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
        itemModal: document.getElementById('item-modal'), // Modal de detalhes do prato
        itemModalBody: document.querySelector('#item-modal .item-modal-body'), // Conteúdo do modal de item
        itemModalClose: document.querySelector('#item-modal .item-modal-close'), // Botão de fechar modal item
        themeToggle: document.querySelector('.theme-toggle'), // Botão alternar tema
        backToTop: document.getElementById('back-to-top'), // Botão voltar ao topo
        statNumbers: document.querySelectorAll('.stat-number'), // Números das estatísticas
        fadeElements: document.querySelectorAll('.fade-in') // Elementos com animação fade-in
    };

    //! Estado da aplicação
    // Armazena informações importantes sobre o estado atual da página
    const state = {
        currentFilter: 'all', // Filtro atual do cardápio (todos, entradas, etc.)
        isMenuLoaded: false, // Indica se o cardápio já foi carregado
        observers: new Map(), // Armazena os observadores de interseção (Intersection Observers)
        menuData: [] // Dados do cardápio carregados
    };
    //! Dados do cardápio (simulando uma chamada de API)
    const URL_DATA = 'assets/Data/data.json';

    // Cardápio: gerenciamento de carregamento, exibição, filtragem e interação
    // const fallbackMenu = [
    //     // Fallback usado se o fetch do JSON falhar (mantém o site funcional offline)
    //     { id: 1, name: 'Salmão Grelhado', description: 'Salmão fresco grelhado com ervas finas e acompanhamentos sazonais', price: 'R$ 68,00', category: 'pratos-principais', imgSrc: 'assets/images/Salmao.jpg', imgAlt: 'Prato de salmão grelhado com ervas' },
    //     { id: 2, name: 'Risotto de Cogumelos', description: 'Risotto cremoso com mix de cogumelos frescos e parmesão', price: 'R$ 52,00', category: 'pratos-principais', imgSrc: 'assets/images/Cogu.png', imgAlt: 'Risotto cremoso com cogumelos' },
    //     { id: 3, name: 'Bruschetta Trio', description: 'Trio de bruschettas com tomate, burrata e tapenade de azeitona', price: 'R$ 28,00', category: 'entradas', imgSrc: 'assets/images/placeholder-dish.svg', imgAlt: 'Trio de bruschettas variadas' },
    //     { id: 4, name: 'Tiramisu Clássico', description: 'Sobremesa italiana tradicional com café e mascarpone', price: 'R$ 22,00', category: 'sobremesas', imgSrc: 'assets/images/placeholder-dish.svg', imgAlt: 'Tiramisù tradicional' }
    // ];

    const menu = {
        // Inicializa o sistema do cardápio
        init() {
            this.bindEvents(); // Vincula eventos dos botões de filtro
            this.loadMenuData(); // Carrega dados externos ou fallback
        },

        // Carrega os dados do cardápio a partir do arquivo JSON
        async loadMenuData() {
            if (state.isMenuLoaded) return; // Evita recarga duplicada
            this.showLoading();
            try {
                const response = await fetch(URL_DATA, { cache: 'no-store' });
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const data = await response.json();
                if (!Array.isArray(data)) throw new Error('Formato inválido');
                state.menuData = data;
            } catch (error) {
                console.warn('Erro ao carregar JSON do cardápio. Usando fallback.', error);
                state.menuData = fallbackMenu; // Usa dados locais se falhar
            }
            this.renderMenu(state.menuData);
            this.hideLoading();
            state.isMenuLoaded = true;
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
            DOM.filterBtns.forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            this.filterMenu(filter);
        },

        // Renderiza os itens do menu na tela
        renderMenu(items) {
            DOM.menuGrid.innerHTML = '';
            items.forEach((item, index) => {
                const menuItemElement = this.createMenuItem(item);
                DOM.menuGrid.appendChild(menuItemElement);
                setTimeout(() => menuItemElement.classList.add('show'), index * 100);
            });
            document.dispatchEvent(new CustomEvent('menu:rendered'));
        },

        // Cria elemento HTML para um item do cardápio
        createMenuItem(item) {
            const menuItem = document.createElement('div');
            menuItem.className = `menu-item ${item.category}`;
            const placeholder = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'%3E%3Crect width='100%25' height='100%25' fill='%23f5f5f5'/%3E%3C/svg%3E";
            const fallbackSrc = 'assets/images/placeholder-dish.svg';
            const imgHtml = item.imgSrc
                ? `<img class="dish-img lazy" src="${placeholder}" data-src="${item.imgSrc}" alt="${item.imgAlt || item.name}" loading="lazy" decoding="async" onerror="this.onerror=null;this.src='${fallbackSrc}';">`
                : `<div class="emoji-fallback" aria-hidden="true">${item.image || ''}</div>`;

            menuItem.innerHTML = `
                <div class="menu-item-image" aria-hidden="${item.imgSrc ? 'false' : 'true'}">
                    ${imgHtml}
                </div>
                <div class="menu-item-content">
                    <h3 class="menu-item-title">${item.name}</h3>
                    <p class="menu-item-description">${item.description}</p>
                    <div class="menu-item-price">${item.price}</div>
                    <div class="menu-item-actions">
                        <button class="fav-btn" aria-pressed="false" aria-label="Favoritar prato">❤</button>
                        <button class="details-btn" aria-label="Ver detalhes do prato">Ver detalhes</button>
                    </div>
                </div>
            `;

            const favBtn = menuItem.querySelector('.fav-btn');
            const detailsBtn = menuItem.querySelector('.details-btn');
            this.bindCardActions(favBtn, detailsBtn, item);
            return menuItem;
        },

        // Liga ações dos cards (favoritar / detalhes)
        bindCardActions(favBtn, detailsBtn, item) {
            const favKey = 'rt-favorites';
            const favorites = new Set(JSON.parse(localStorage.getItem(favKey) || '[]'));
            if (favorites.has(item.id)) {
                favBtn.classList.add('active');
                favBtn.setAttribute('aria-pressed', 'true');
            }
            favBtn.addEventListener('click', () => {
                if (favBtn.classList.toggle('active')) {
                    favorites.add(item.id);
                    favBtn.setAttribute('aria-pressed', 'true');
                } else {
                    favorites.delete(item.id);
                    favBtn.setAttribute('aria-pressed', 'false');
                }
                localStorage.setItem(favKey, JSON.stringify([...favorites]));
            });
            detailsBtn.addEventListener('click', () => this.showItemDetails(item));
        },

        // Exibe modal com detalhes do prato
        showItemDetails(item) {
            if (!DOM.itemModal || !DOM.itemModalBody) return;
            const img = item.imgSrc ? `<img src="${item.imgSrc}" alt="${item.imgAlt || item.name}" style="width:100%;height:auto;border-radius:8px;">` : '';
            DOM.itemModalBody.innerHTML = `
                ${img}
                <h4 style="margin:1rem 0 0.5rem;color:#2c3e50;">${item.name}</h4>
                <p style="margin-bottom:1rem;color:#555;">${item.description}</p>
                <div style="font-weight:700;color:#e74c3c;">${item.price}</div>
            `;
            DOM.itemModal.classList.add('show');
            DOM.itemModal.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';
        },

        // Filtra itens do menu por categoria
        filterMenu(filter) {
            const items = DOM.menuGrid.querySelectorAll('.menu-item');
            items.forEach(item => {
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
            if (DOM.menuLoading) {
                DOM.menuLoading.classList.add('show');
                DOM.menuLoading.setAttribute('aria-hidden', 'false');
            }
        },

        // Esconde indicador de carregamento
        hideLoading() {
            if (DOM.menuLoading) {
                DOM.menuLoading.classList.remove('show');
                DOM.menuLoading.setAttribute('aria-hidden', 'true');
            }
        }
    };

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

        // Verifica se o telefone BR tem formato válido (fixo 10 dígitos ou celular 11 começando com 9)
        validatePhone(phone) {
            if (!phone) return false; // campo obrigatório
            let digits = phone.replace(/\D/g, ''); // mantém apenas números

            // Remove código do país +55 quando presente
            if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
                digits = digits.slice(2);
            }

            // Valida DDD
            const ddd = digits.slice(0, 2);
            if (ddd.length < 2 || ddd.startsWith('0')) return false;

            // Fixo: 10 dígitos (XX XXXX XXXX)
            if (digits.length === 10) return true;

            // Celular: 11 dígitos e 3º dígito = 9 (XX 9XXXX XXXX)
            if (digits.length === 11 && digits[2] === '9') return true;

            return false;
        },

        // Formata telefone BR dinamicamente para (XX) 9XXXX-XXXX ou (XX) XXXX-XXXX
        formatPhone(value) {
            if (!value) return '';
            let digits = value.replace(/\D/g, '');

            // Remove +55 se presente para formatação local
            if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
                digits = digits.slice(2);
            }

            if (digits.length <= 2) return `(${digits}`;
            if (digits.length <= 6) return `(${digits.slice(0,2)}) ${digits.slice(2)}`;
            if (digits.length <= 10) return `(${digits.slice(0,2)}) ${digits.slice(2,6)}-${digits.slice(6,10)}`;
            return `(${digits.slice(0,2)}) ${digits.slice(2,7)}-${digits.slice(7,11)}`;
        },

        // Exibe mensagem de erro no formulário
        // Adiciona classe de erro e mostra mensagem ao usuário
        showError(input, message) {
            const formGroup = input.closest('.form-group');
            let errorElement = formGroup ? formGroup.querySelector('.error-message') : null;

            // Cria o elemento de erro se não existir (torna o sistema resiliente)
            if (!errorElement) {
                errorElement = document.createElement('span');
                errorElement.className = 'error-message';
                errorElement.setAttribute('aria-live', 'polite');
                // Insere logo após o campo
                if (input && input.insertAdjacentElement) {
                    input.insertAdjacentElement('afterend', errorElement);
                } else if (formGroup) {
                    formGroup.appendChild(errorElement);
                }
            }

            if (formGroup) formGroup.classList.add('error');
            errorElement.textContent = message;
        },

        // Remove mensagem de erro do formulário
        // Limpa visual de erro quando campo é corrigido
        clearError(input) {
            const formGroup = input.closest('.form-group');
            const errorElement = formGroup ? formGroup.querySelector('.error-message') : null;
            
            if (formGroup) formGroup.classList.remove('error');
            if (errorElement) errorElement.textContent = '';
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

    // (Removida segunda definição duplicada de "menu"; agora consolidado acima)

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

            // Máscara e validação para campos de telefone
            const telInputs = document.querySelectorAll('input[type="tel"]');
            telInputs.forEach(tel => {
                tel.addEventListener('input', (e) => {
                    const pos = e.target.selectionStart;
                    const formatted = utils.formatPhone(e.target.value);
                    e.target.value = formatted;
                    // tenta manter o cursor próximo onde estava
                    try { e.target.setSelectionRange(pos, pos); } catch {}
                });
                tel.addEventListener('blur', (e) => {
                    const v = e.target.value;
                    if (v && !utils.validatePhone(v)) {
                        utils.showError(e.target, 'Por favor, insira um telefone válido');
                    }
                });
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
            // Exibe sumário de erros quando inválido
            if (!isValid) {
                this.showErrorSummary(form);
            } else {
                this.clearErrorSummary(form);
            }
            return isValid;
        },

        // Mostra um sumário com a lista de erros e foca para acessibilidade
        showErrorSummary(form) {
            // Coleta mensagens
            const errors = [];
            form.querySelectorAll('.form-group').forEach(group => {
                const input = group.querySelector('input, textarea, select');
                const msg = group.querySelector('.error-message');
                if (group.classList.contains('error') && input && msg && msg.textContent) {
                    const label = form.querySelector(`label[for="${input.id}"]`);
                    const name = label ? label.textContent : input.name || 'Campo';
                    errors.push(`${name}: ${msg.textContent}`);
                }
            });

            // Cria/atualiza contêiner
            let summary = form.previousElementSibling;
            const isSummary = summary && summary.classList && summary.classList.contains('form-error-summary');
            if (!isSummary) {
                summary = document.createElement('div');
                summary.className = 'form-error-summary';
                summary.setAttribute('role', 'alert');
                summary.setAttribute('tabindex', '-1');
                summary.style.cssText = 'background:#fdecea;color:#b00020;border:1px solid #f5c2c7;padding:12px 16px;border-radius:6px;margin:0 0 16px 0;';
                form.parentNode.insertBefore(summary, form);
            }
            summary.innerHTML = `<strong>Há problemas nos campos abaixo:</strong><ul style="margin:8px 0 0 16px;">${errors.map(e => `<li>${e}</li>`).join('')}</ul>`;
            // Foca no resumo
            setTimeout(() => summary.focus(), 0);
        },

        // Remove o sumário de erros caso exista
        clearErrorSummary(form) {
            const prev = form.previousElementSibling;
            if (prev && prev.classList && prev.classList.contains('form-error-summary')) {
                prev.remove();
            }
        },

        // Gerencia envio do formulário de contato
        async handleContactSubmit(e) {
            e.preventDefault();
            
            if (!this.validateForm(DOM.contactForm)) {
                return; // Para se validação falhar (resumo de erro já mostrado)
            }
            
            const formData = new FormData(DOM.contactForm);
            const data = Object.fromEntries(formData);
            
            try {
                // Simula envio para API
                await this.submitContactForm(data);
                this.showSuccessMessage('Mensagem enviada com sucesso! Entraremos em contato em breve.');
                DOM.contactForm.reset();
                this.clearErrorSummary(DOM.contactForm);
            } catch (error) {
                this.showErrorMessage('Erro ao enviar mensagem. Tente novamente.');
            }
        },

        // Gerencia envio do formulário de reserva
        async handleReservationSubmit(e) {
            e.preventDefault();
            
            if (!this.validateForm(DOM.reservationForm)) {
                return; // Para se validação falhar (resumo de erro já mostrado)
            }
            
            const formData = new FormData(DOM.reservationForm);
            const data = Object.fromEntries(formData);
            
            try {
                // Simula envio para API
                await this.submitReservationForm(data);
                this.showSuccessMessage('Reserva confirmada! Você receberá um e-mail de confirmação.');
                // Fecha o modal após sucesso e limpa o formulário
                if (typeof modal !== 'undefined' && modal && modal.hide) {
                    modal.hide();
                }
                DOM.reservationForm.reset();
                this.clearErrorSummary(DOM.reservationForm);
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
        // async submitReservationForm(data) {

        //     const params = {
        //     to_email: data.email,                                // cliente que receberá a confirmação
        //     to_name: data.nome || data.name,                     // nome do cliente
        //     customer_name: data.nome || data.name,
        //     customer_email: data.email,
        //     customer_phone: data.telefone || data.phone,
        //     reservation_date: data.data || data.date || data['res-date'],
        //     reservation_time: data.hora || data.time,
        //     reservation_guests: data.pessoas || data.guests,
        //     reservation_notes: data.mensagem || data.message || '',
        //     };

        //     // IDs do seu serviço/template no EmailJS (pegue no painel do EmailJS)
        //     const SERVICE_ID = 'SEU_SERVICE_ID';
        //     const TEMPLATE_ID = 'SEU_TEMPLATE_ID';

        //     // Garante que a lib foi carregada; se não, lança erro para cair no catch e exibir mensagem amigável
        //     if (!window.emailjs) {
        //       throw new Error('EmailJS não carregado');
        //     }
        
        //     // Envia o e‑mail; retorna uma Promise (aguardamos concluir)
        //     await emailjs.send(SERVICE_ID, TEMPLATE_ID, params);
        //     // Simula delay de API
        //     return new Promise((resolve) => {
        //         setTimeout(() => {
        //             console.log('Formulário de reserva enviado:', data);
        //             resolve();
        //         }, 1000);
        //     });
        // },

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

    // UI geral (tema, back-to-top, header em scroll, modal de item)
    // Centraliza pequenos comportamentos de interface global
    const ui = {
        init() {
            this.initTheme(); // Aplica tema salvo e configura alternância
            this.bindEvents(); // Liga eventos de UI
        },

        // Lê tema do localStorage e aplica no HTML
        initTheme() {
            const saved = localStorage.getItem('rt-theme');
            const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
            const theme = saved || (prefersDark ? 'dark' : 'light');
            this.applyTheme(theme);
        },

        // Aplica tema no elemento raiz e atualiza botão
        applyTheme(theme) {
            const root = document.documentElement;
            root.setAttribute('data-theme', theme);
            localStorage.setItem('rt-theme', theme);
            if (DOM.themeToggle) {
                const isDark = theme === 'dark';
                DOM.themeToggle.setAttribute('aria-pressed', String(isDark));
                DOM.themeToggle.setAttribute('aria-label', isDark ? 'Ativar modo claro' : 'Ativar modo escuro');
                // Opcional: troca conteúdo do botão (caso seja texto)
                if (DOM.themeToggle.dataset.icon !== '1') {
                    DOM.themeToggle.textContent = isDark ? '🌙' : '☀️';
                }
            }
        },

        // Alterna entre claro/escuro
        toggleTheme() {
            const current = document.documentElement.getAttribute('data-theme') || 'light';
            this.applyTheme(current === 'light' ? 'dark' : 'light');
        },

        // Exibe/oculta back-to-top e aplica classe no header conforme rolagem
        handleScroll() {
            const y = window.scrollY || window.pageYOffset;
            if (DOM.header) {
                DOM.header.classList.toggle('scrolled', y > 10);
            }
            if (DOM.backToTop) {
                if (y > 300) DOM.backToTop.classList.add('show');
                else DOM.backToTop.classList.remove('show');
            }
        },

        // Fecha o modal de item (detalhes do prato)
        closeItemModal() {
            if (!DOM.itemModal) return;
            DOM.itemModal.classList.remove('show');
            DOM.itemModal.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
        },

        bindEvents() {
            // Alternância de tema
            if (DOM.themeToggle) {
                DOM.themeToggle.addEventListener('click', this.toggleTheme.bind(this));
            }

            // Rolagem: header scrolled + back-to-top
            const onScroll = utils.throttle(this.handleScroll.bind(this), 100);
            window.addEventListener('scroll', onScroll);
            // Estado inicial
            this.handleScroll();

            // Clique no back-to-top
            if (DOM.backToTop) {
                DOM.backToTop.addEventListener('click', (e) => {
                    e.preventDefault();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                });
            }

            // Fechar modal de item por botão X
            if (DOM.itemModalClose) {
                DOM.itemModalClose.addEventListener('click', this.closeItemModal.bind(this));
            }
            // Fechar modal de item clicando fora do conteúdo
            if (DOM.itemModal) {
                DOM.itemModal.addEventListener('click', (e) => {
                    if (e.target === DOM.itemModal) {
                        this.closeItemModal();
                    }
                });
            }
            // Fechar modal de item via ESC
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && DOM.itemModal && DOM.itemModal.classList.contains('show')) {
                    this.closeItemModal();
                }
            });
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
                const observeAll = () => document.querySelectorAll('img[data-src]').forEach(img => imageObserver.observe(img));
                observeAll();

                // Quando o menu renderiza dinamicamente novos itens, observar novamente
                document.addEventListener('menu:rendered', observeAll);
            } else {
                // Fallback para navegadores antigos: carrega imediatamente
                document.querySelectorAll('img[data-src]').forEach(img => {
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
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
                ui.init(); // Comportos globais de UI (tema, back-to-top, etc.)
                
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