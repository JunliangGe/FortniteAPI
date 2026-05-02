const API_URL = 'https://fortnite-api.com/v2/cosmetics';
const NEWS_URL = 'https://fortnite-api.com/v2/news/br';

let allCosmetics = [];
let displayedCount = 20;
let currentRarity = 'all';
let currentSearch = '';

// ============================================
// MODO OSCURO / CLARO
// ============================================

function initTheme() {
    const savedTheme = localStorage.getItem('fortnite-theme');
    if (savedTheme === 'light') {
        $('body').addClass('light-mode');
        $('#themeToggle i').removeClass('bi-moon-stars-fill').addClass('bi-sun-fill');
    } else {
        $('body').removeClass('light-mode');
        $('#themeToggle i').removeClass('bi-sun-fill').addClass('bi-moon-stars-fill');
    }
}

function toggleTheme() {
    if ($('body').hasClass('light-mode')) {
        $('body').removeClass('light-mode');
        localStorage.setItem('fortnite-theme', 'dark');
        $('#themeToggle i').removeClass('bi-sun-fill').addClass('bi-moon-stars-fill');
    } else {
        $('body').addClass('light-mode');
        localStorage.setItem('fortnite-theme', 'light');
        $('#themeToggle i').removeClass('bi-moon-stars-fill').addClass('bi-sun-fill');
    }
}

// ============================================
// INICIALIZACIÓN DE LIBRERÍAS
// ============================================

function initAOS() {
    if (typeof AOS !== 'undefined') {
        AOS.init({
            duration: 800,
            once: true,
            offset: 100,
            easing: 'ease-in-out'
        });
        console.log('✅ AOS inicializado');
    }
}

function initGlide() {
    if (typeof Glide !== 'undefined' && document.querySelector('.glide')) {
        new Glide('.glide', {
            type: 'carousel',
            perView: 3,
            gap: 20,
            autoplay: 4000,
            hoverpause: true,
            animationDuration: 600,
            breakpoints: {
                768: { perView: 1 },
                992: { perView: 2 }
            }
        }).mount();
        console.log('✅ Glide.js inicializado');
    }
}

function initLightbox() {
    if (typeof lightbox !== 'undefined') {
        lightbox.option({
            resizeDuration: 200,
            wrapAround: true,
            albumLabel: 'Imagen %1 de %2'
        });
        console.log('✅ Lightbox inicializado');
    }
}

function initParticles() {
    if (typeof tsParticles !== 'undefined') {
        tsParticles.load("tsparticles", {
            fpsLimit: 60,
            particles: {
                color: { value: "#00f3ff" },
                move: {
                    direction: "none",
                    enable: true,
                    outModes: { default: "out" },
                    random: false,
                    speed: 1,
                    straight: false
                },
                number: { density: { enable: true, area: 800 }, value: 80 },
                opacity: { value: 0.3 },
                shape: { type: "circle" },
                size: { value: { min: 1, max: 3 } }
            },
            detectRetina: true
        });
        console.log('✅ Partículas inicializadas');
    }
}

// ============================================
// FUNCIONES PARA INDEX.HTML - ESTADÍSTICAS
// ============================================

function loadStats() {
    $('#skinsCount, #emotesCount, #totalCount').text('...');
    $.ajax({
        url: API_URL,
        method: 'GET',
        success: function(response) {
            if (response && response.status === 200 && response.data) {
                let allItems = [];
                
                if (Array.isArray(response.data)) {
                    allItems = response.data;
                } else if (response.data.br && Array.isArray(response.data.br)) {
                    allItems = response.data.br;
                } else if (response.data.items && response.data.items.br) {
                    allItems = response.data.items.br;
                } else {
                    for (let key in response.data) {
                        if (Array.isArray(response.data[key]) && response.data[key].length > 100) {
                            allItems = response.data[key];
                            break;
                        }
                    }
                }
                
                if (allItems && allItems.length > 0) {
                    const skins = allItems.filter(item => item.type?.value === 'outfit' || item.type === 'outfit').length;
                    const emotes = allItems.filter(item => item.type?.value === 'emote' || item.type === 'emote').length;
                    
                    animateNumber($('#skinsCount'), skins);
                    animateNumber($('#emotesCount'), emotes);
                    animateNumber($('#totalCount'), allItems.length);
                    
                    console.log(`✅ Stats: ${skins} skins, ${emotes} emotes, ${allItems.length} total`);
                } else {
                    $('#skinsCount, #emotesCount, #totalCount').text('?');
                }
            } else {
                $('#skinsCount, #emotesCount, #totalCount').text('Error');
            }
        },
        error: function() {
            $('#skinsCount, #emotesCount, #totalCount').text('Error');
            console.error('❌ Error al cargar estadísticas');
        }
    });
}

function animateNumber(element, target) {
    if (target === 0 || isNaN(target)) {
        element.text('?');
        return;
    }
    let current = 0;
    const increment = Math.ceil(target / 60);
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            clearInterval(timer);
            element.text(target.toLocaleString());
        } else {
            element.text(current.toLocaleString());
        }
    }, 15);
}

// ============================================
// CONTADOR DE EVENTO
// ============================================

function initCountdown() {
    // Fecha del próximo evento: 15 de junio de 2026
    const eventDate = new Date('June 15, 2026 00:00:00').getTime();
    
    function updateCountdown() {
        const now = new Date().getTime();
        const distance = eventDate - now;
        
        if (distance > 0) {
            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);
            
            $('#days').text(String(days).padStart(2, '0'));
            $('#hours').text(String(hours).padStart(2, '0'));
            $('#minutes').text(String(minutes).padStart(2, '0'));
            $('#seconds').text(String(seconds).padStart(2, '0'));
        } else {
            $('.countdown-timer').html('<div class="text-center"><h3 class="text-neon">¡EL EVENTO YA COMENZÓ!</h3></div>');
        }
    }
    
    updateCountdown();
    setInterval(updateCountdown, 1000);
    console.log('✅ Contador de evento inicializado');
}

// ============================================
// NOTICIAS
// ============================================

function loadNews() {
    $.ajax({
        url: NEWS_URL,
        method: 'GET',
        success: function(response) {
            if (response && response.status === 200 && response.data && response.data.motds) {
                const newsItems = response.data.motds.filter(n => !n.hidden).slice(0, 6);
                displayNews(newsItems);
                console.log(`✅ Noticias cargadas: ${newsItems.length}`);
            } else {
                $('#newsContainer').html('<div class="col-12 text-center"><div class="alert alert-info">No hay noticias disponibles</div></div>');
            }
        },
        error: function() {
            $('#newsContainer').html('<div class="col-12 text-center"><div class="alert alert-danger">Error al cargar noticias</div></div>');
            console.error('❌ Error al cargar noticias');
        }
    });
}

function displayNews(newsItems) {
    if (!newsItems || newsItems.length === 0) {
        $('#newsContainer').html('<div class="col-12 text-center"><div class="alert alert-info">No hay noticias disponibles</div></div>');
        return;
    }
    
    let html = '';
    newsItems.forEach((news, index) => {
        const colClass = index === 0 ? 'col-12' : 'col-md-6 col-lg-4';
        const imageUrl = news.tileImage || news.image || 'https://placehold.co/720x400/1a1a2e/00f3ff?text=Noticia';
        html += `
            <div class="${colClass}" data-aos="fade-up" data-aos-delay="${index * 100}">
                <div class="news-card">
                    <div class="news-image">
                        <img src="${imageUrl}" alt="${escapeHtml(news.title)}" loading="lazy">
                    </div>
                    <div class="news-body">
                        <h3 class="news-title">${escapeHtml(news.title)}</h3>
                        <p class="news-description">${escapeHtml(news.body.substring(0, 120))}...</p>
                        <div class="news-footer">
                            <span class="news-date"><i class="bi bi-calendar-event"></i> ${new Date().toLocaleDateString('es-ES')}</span>
                            <a href="#" class="news-read-more" data-title="${escapeHtml(news.title)}" data-body="${escapeHtml(news.body)}">Leer más <i class="bi bi-arrow-right-short"></i></a>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    $('#newsContainer').html(html);
    
    if (typeof AOS !== 'undefined') {
        AOS.refresh();
    }
    
    $('.news-read-more').off('click').on('click', function(e) {
        e.preventDefault();
        const title = $(this).data('title');
        const body = $(this).data('body');
        showNewsModal(title, body);
    });
}

function showNewsModal(title, body) {
    if ($('#newsModal').length === 0) {
        $('body').append(`
            <div class="modal fade" id="newsModal" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered modal-lg">
                    <div class="modal-content bg-dark text-white">
                        <div class="modal-header border-neon">
                            <h5 class="modal-title text-neon fs-4"></h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body" style="max-height: 60vh; overflow-y: auto;">
                            <p class="fs-5"></p>
                            <hr class="border-neon">
                            <small class="text-white-50">Fuente: Fortnite-API.com</small>
                        </div>
                        <div class="modal-footer border-neon">
                            <button class="btn btn-outline-custom" data-bs-dismiss="modal">Cerrar</button>
                        </div>
                    </div>
                </div>
            </div>
        `);
    }
    $('#newsModal .modal-title').text(title);
    $('#newsModal .modal-body p').html(body);
    
    const modalElement = document.getElementById('newsModal');
    if (modalElement) {
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
    }
}

// ============================================
// FUNCIONES PARA SHOP.HTML
// ============================================

function loadCosmetics() {
    $('#loading').show();
    $.ajax({
        url: API_URL,
        method: 'GET',
        success: function(response) {
            let allItems = [];
            
            if (response && response.status === 200 && response.data) {
                if (Array.isArray(response.data)) {
                    allItems = response.data;
                } else if (response.data.br && Array.isArray(response.data.br)) {
                    allItems = response.data.br;
                } else if (response.data.items && response.data.items.br) {
                    allItems = response.data.items.br;
                } else {
                    for (let key in response.data) {
                        if (Array.isArray(response.data[key]) && response.data[key].length > 100) {
                            allItems = response.data[key];
                            break;
                        }
                    }
                }
            }
            
            if (allItems && allItems.length > 0) {
                allCosmetics = allItems;
                applyFilters();
                console.log(`✅ Tienda: ${allCosmetics.length} cosméticos cargados`);
            } else {
                showError('No se pudieron cargar los cosméticos');
            }
            $('#loading').hide();
        },
        error: function() {
            showError('Error de conexión con la API');
            $('#loading').hide();
            console.error('❌ Error al cargar cosméticos');
        }
    });
}

function applyFilters() {
    currentRarity = $('#rarityFilter').val();
    currentSearch = $('#searchInput').val().toLowerCase().trim();
    displayedCount = 20;
    filterAndDisplay();
}

function filterAndDisplay() {
    let filtered = [...allCosmetics];
    if (currentRarity !== 'all') {
        filtered = filtered.filter(c => c.rarity?.value === currentRarity);
    }
    if (currentSearch) {
        filtered = filtered.filter(c => c.name?.toLowerCase().includes(currentSearch));
    }
    
    const paginated = filtered.slice(0, displayedCount);
    displayCosmetics(paginated);
    
    if (filtered.length > displayedCount) {
        $('#loadMoreContainer').show();
    } else {
        $('#loadMoreContainer').hide();
    }
    
    if (paginated.length === 0) {
        $('#cosmeticsContainer').html('<div class="col-12 text-center"><div class="alert alert-info">No hay resultados con esos filtros</div></div>');
    }
}

function displayCosmetics(cosmetics) {
    if (!cosmetics.length) return;
    let html = '';
    cosmetics.forEach(cos => {
        const rarityClass = getRarityClass(cos.rarity?.value);
        const imageUrl = cos.images?.icon || 'https://placehold.co/400x400/1a1a2e/00f3ff?text=No+Image';
        html += `
            <div class="col-lg-3 col-md-4 col-sm-6">
                <div class="cosmetic-card">
                    <img src="${imageUrl}" alt="${escapeHtml(cos.name)}" loading="lazy">
                    <div class="card-body">
                        <h5 class="card-title">${escapeHtml(cos.name) || '???'}</h5>
                        <span class="rarity-badge ${rarityClass}">${cos.rarity?.displayValue || 'Común'}</span>
                    </div>
                </div>
            </div>
        `;
    });
    $('#cosmeticsContainer').html(html);
}

function loadMoreItems() {
    displayedCount += 20;
    filterAndDisplay();
}

function showError(message) {
    $('#cosmeticsContainer').html(`<div class="col-12"><div class="alert alert-danger text-center">${message}</div></div>`);
}

// ============================================
// FUNCIÓN AUXILIAR
// ============================================

function getRarityClass(rarity) {
    const rarities = {
        'common': 'rarity-common', 'uncommon': 'rarity-uncommon', 'rare': 'rarity-rare',
        'epic': 'rarity-epic', 'legendary': 'rarity-legendary', 'starwars': 'rarity-legendary',
        'icon': 'rarity-epic', 'slurp': 'rarity-epic'
    };
    return rarities[rarity] || 'rarity-common';
}

function escapeHtml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// ============================================
// INICIALIZACIÓN PRINCIPAL
// ============================================

$(document).ready(function() {
    console.log('🚀 App iniciada');
    
    // Inicializar tema
    initTheme();
    $('#themeToggle').click(toggleTheme);
    
    // Inicializar librerías visuales
    initAOS();
    initLightbox();
    initParticles();
    initCountdown();
    
    // Efecto navbar scroll
    $(window).scroll(function() {
        if ($(this).scrollTop() > 50) {
            $('.navbar').css({background: 'rgba(10,12,16,0.98)', padding: '0.5rem 0'});
        } else {
            $('.navbar').css({background: 'rgba(10,12,16,0.95)', padding: '1rem 0'});
        }
        
        // Botón volver arriba
        if ($(this).scrollTop() > 300) {
            $('#backToTop').addClass('show');
        } else {
            $('#backToTop').removeClass('show');
        }
    });
    
    // Botón volver arriba - click
    $('#backToTop').click(function() {
        $('html, body').animate({ scrollTop: 0 }, 500);
    });
    
    // Smooth scroll para enlaces internos
    $('a[href^="#"]').on('click', function(event) {
        const target = $(this.getAttribute('href'));
        if (target.length) {
            event.preventDefault();
            $('html, body').animate({
                scrollTop: target.offset().top - 70
            }, 800);
        }
    });
    
    // Detectar página actual
    const currentPage = window.location.pathname;
    
    if (currentPage.includes('shop.html')) {
        console.log('🛒 Modo tienda activado');
        loadCosmetics();
        $('#filterBtn').click(applyFilters);
        $('#searchInput').on('keyup', applyFilters);
        $('#loadMoreBtn').click(loadMoreItems);
    } else {
        console.log('🏠 Modo landing activado');
        loadStats();
        loadNews();
        initGlide();
    }
});