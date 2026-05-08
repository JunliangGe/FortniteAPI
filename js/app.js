/*
    JavaScript principal de Fortnite Hub
    Hecho para la asignatura de Diseño Web Avanzado
    Controla la API, favoritos, comparador, sonidos...
*/

// --------------------------------------------------------------
// VARIABLES GLOBALES
// --------------------------------------------------------------
const API_URL = 'https://fortnite-api.com/v2/cosmetics';
const SHOP_URL = 'https://fortnite-api.com/v2/shop';
const NEWS_URL = 'https://fortnite-api.com/v2/news/br';

let allCosmetics = [];
let allShopItems = [];
let isotopeInstance = null;
let currentRarityFilter = '*';
let currentTypeFilter = '*';

// Variables para el comparador
let allSkinsList = [];
let currentSkin1 = null;
let currentSkin2 = null;

// Favoritos guardados en el navegador
let favorites = JSON.parse(localStorage.getItem('fortniteFavorites')) || [];

function saveFavorites() {
    localStorage.setItem('fortniteFavorites', JSON.stringify(favorites));
}

// --------------------------------------------------------------
// SONIDOS
// --------------------------------------------------------------
let audioCtx = null;

function initAudio() {
    if (!audioCtx && window.AudioContext) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}

// Reproduce diferentes tipos de sonidos
function playSound(type, volume = 0.1) {
    try {
        initAudio();
        if (!audioCtx) return;
        
        const now = audioCtx.currentTime;
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        gainNode.gain.setValueAtTime(volume, now);
        gainNode.gain.exponentialRampToValueAtTime(0.00001, now + 0.2);
        
        switch(type) {
            case 'click':
                oscillator.type = 'sine';
                oscillator.frequency.value = 880;
                oscillator.start(now);
                oscillator.stop(now + 0.12);
                break;
            case 'select':
                oscillator.type = 'sine';
                oscillator.frequency.value = 440;
                oscillator.start(now);
                oscillator.stop(now + 0.2);
                break;
            case 'hover':
                oscillator.type = 'sine';
                oscillator.frequency.value = 660;
                gainNode.gain.setValueAtTime(0.05, now);
                oscillator.start(now);
                oscillator.stop(now + 0.08);
                break;
            case 'like':
                oscillator.type = 'sine';
                oscillator.frequency.value = 1046.50;
                oscillator.start(now);
                oscillator.stop(now + 0.15);
                const osc2 = audioCtx.createOscillator();
                const gain2 = audioCtx.createGain();
                osc2.connect(gain2);
                gain2.connect(audioCtx.destination);
                osc2.type = 'sine';
                osc2.frequency.value = 1318.52;
                gain2.gain.setValueAtTime(0.08, now);
                gain2.gain.exponentialRampToValueAtTime(0.00001, now + 0.15);
                osc2.start(now);
                osc2.stop(now + 0.15);
                break;
            case 'notification':
                oscillator.type = 'sine';
                oscillator.frequency.value = 523.25;
                oscillator.start(now);
                oscillator.stop(now + 0.2);
                const osc3 = audioCtx.createOscillator();
                const gain3 = audioCtx.createGain();
                osc3.connect(gain3);
                gain3.connect(audioCtx.destination);
                osc3.type = 'sine';
                osc3.frequency.value = 659.25;
                gain3.gain.setValueAtTime(0.08, now);
                gain3.gain.exponentialRampToValueAtTime(0.00001, now + 0.2);
                osc3.start(now + 0.1);
                osc3.stop(now + 0.3);
                break;
        }
    } catch(e) { console.log('Audio no soportado'); }
}

function playBeep(type) { playSound(type); }
function playHover() { playSound('hover', 0.05); }

// --------------------------------------------------------------
// NOTIFICACIONES EMERGENTES (TOASTS)
// --------------------------------------------------------------
function showToast(title, message, soundType = 'notification') {
    playSound(soundType, 0.1);
    const toast = $(`<div class="toast-notification">${title}<br><small>${message}</small></div>`);
    $('body').append(toast);
    toast.addClass('show');
    setTimeout(() => {
        toast.removeClass('show');
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}

// --------------------------------------------------------------
// ANIMACIÓN DE CHISPAS (para el like)
// --------------------------------------------------------------
function createSparkles(x, y) {
    for (let i = 0; i < 12; i++) {
        const spark = $('<div class="like-spark"></div>');
        const angle = (i / 12) * Math.PI * 2;
        const distance = 40 + Math.random() * 30;
        spark.css({
            '--tx': Math.cos(angle) * distance + 'px',
            '--ty': Math.sin(angle) * distance + 'px',
            position: 'absolute',
            left: x + 'px',
            top: y + 'px'
        });
        $('body').append(spark);
        setTimeout(() => spark.remove(), 500);
    }
}

// --------------------------------------------------------------
// FAVORITOS
// --------------------------------------------------------------
function toggleFavorite(skinId, skinName, skinImage, skinRarity, skinType, event) {
    playSound('like', 0.15);
    
    const btn = $(event?.currentTarget);
    const icon = btn.find('i');
    const rect = btn[0].getBoundingClientRect();
    createSparkles(rect.left + rect.width/2, rect.top + rect.height/2);
    
    const index = favorites.findIndex(f => f.id === skinId);
    if (index === -1) {
        favorites.push({ id: skinId, name: skinName, image: skinImage, rarity: skinRarity, type: skinType });
        icon.removeClass('bi-heart').addClass('bi-heart-fill');
        showToast('❤️ Añadido a favoritos', skinName, 'notification');
    } else {
        favorites.splice(index, 1);
        icon.removeClass('bi-heart-fill').addClass('bi-heart');
        showToast('💔 Eliminado de favoritos', skinName, 'notification');
    }
    saveFavorites();
    updateAllFavoriteButtons();
    updateFavoritesDisplay();
    updateFavoritesPreview();
    updateCompareFavoritesList();
}

function updateAllFavoriteButtons() {
    $('.favorite-btn').each(function() {
        const skinId = $(this).data('id');
        const isFav = favorites.some(f => f.id === skinId);
        const icon = $(this).find('i');
        if (isFav) {
            icon.removeClass('bi-heart').addClass('bi-heart-fill');
        } else {
            icon.removeClass('bi-heart-fill').addClass('bi-heart');
        }
    });
}

function isFavorite(skinId) {
    return favorites.some(f => f.id === skinId);
}

// Actualizar la sección de favoritos (lista completa)
function updateFavoritesDisplay() {
    if ($('#favoritesContainer').length === 0) return;
    
    if (favorites.length === 0) {
        $('#favoritesContainer').html(`<div class="col-12 text-center"><div class="empty-favorites"><i class="bi bi-heart fs-1 mb-3 d-block"></i><p>No tienes skins favoritas aún.</p><p class="small">Haz clic en el ❤️ de cualquier skin para guardarla aquí.</p></div></div>`);
        return;
    }
    
    let html = '';
    favorites.forEach(fav => {
        const rarityClass = getRarityClassFromName(fav.rarity);
        html += `<div class="col-lg-3 col-md-4 col-sm-6"><div class="cosmetic-card"><button class="favorite-btn" data-id="${fav.id}" onclick="toggleFavorite('${fav.id}', '${escapeHtml(fav.name)}', '${fav.image}', '${fav.rarity}', '${fav.type}', event)"><i class="bi bi-heart-fill"></i></button><img src="${fav.image}" alt="${escapeHtml(fav.name)}" loading="lazy"><div class="card-body"><h5 class="card-title">${escapeHtml(fav.name)}</h5><span class="rarity-badge ${rarityClass}">${fav.rarity || 'Común'}</span><p class="small text-white-50 mt-1">${fav.type || 'Cosmético'}</p></div></div></div>`;
    });
    $('#favoritesContainer').html(html);
}

// Vista previa de favoritos (en la página principal)
function updateFavoritesPreview() {
    if ($('#favoritesPreview').length === 0) return;
    if (favorites.length === 0) {
        $('#favoritesPreview').html('<div class="text-center py-4 text-white-50"><i class="bi bi-heart fs-1"></i><p class="mt-2">No hay favoritos aún</p><small>Haz clic en ❤️ en cualquier skin</small></div>');
        return;
    }
    let html = '';
    favorites.slice(0, 3).forEach(fav => {
        html += `<div class="trending-preview-item"><img src="${fav.image}" alt="${escapeHtml(fav.name)}"><div class="trending-info"><div class="trending-name">${escapeHtml(fav.name)}</div><div class="trending-rank">⭐ Favorito</div></div></div>`;
    });
    if (favorites.length > 3) html += `<div class="text-center mt-2 text-white-50 small">+${favorites.length - 3} más</div>`;
    $('#favoritesPreview').html(html);
}

// Lista de favoritos dentro del comparador
function updateCompareFavoritesList() {
    if ($('#compareFavoritesList').length === 0) return;
    if (favorites.length === 0) {
        $('#compareFavoritesList').html('<div class="text-center py-4 text-white-50"><i class="bi bi-heart fs-1"></i><p class="mt-2">No tienes favoritos aún</p><small>Haz clic en ❤️ en cualquier skin para guardarla</small></div>');
        return;
    }
    let html = '';
    favorites.forEach(fav => {
        const rarityClass = getRarityClassFromName(fav.rarity);
        html += `<div class="favorite-item" onclick="selectFavoriteForCompare('${fav.id}', '${escapeHtml(fav.name)}', '${fav.image}', '${fav.rarity}', '${fav.type}')">
            <img src="${fav.image}" alt="${escapeHtml(fav.name)}">
            <div class="fav-name">${escapeHtml(fav.name)}</div>
            <span class="fav-rarity ${rarityClass}">${fav.rarity || 'Común'}</span>
            <i class="bi bi-arrow-right-circle text-neon ms-2"></i>
        </div>`;
    });
    $('#compareFavoritesList').html(html);
}

// --------------------------------------------------------------
// COMPARADOR DE SKINS
// --------------------------------------------------------------
function loadSkinsForCompare() {
    $('#skinSelect1, #skinSelect2').html('<option value="">Cargando skins...</option>');
    
    $.ajax({
        url: API_URL,
        method: 'GET',
        success: function(response) {
            let allItems = [];
            if (response?.data) {
                if (Array.isArray(response.data)) allItems = response.data;
                else if (response.data.br) allItems = response.data.br;
                else if (response.data.items?.br) allItems = response.data.items.br;
            }
            allSkinsList = allItems.filter(item => item.type?.value === 'outfit');
            
            let options = '<option value="">Selecciona una skin...</option>';
            allSkinsList.forEach(skin => {
                options += `<option value="${skin.id}">${escapeHtml(skin.name)}</option>`;
            });
            $('#skinSelect1, #skinSelect2').html(options);
            
            $('#skinSelect1').change(function() {
                const skinId = $(this).val();
                if (skinId) {
                    currentSkin1 = allSkinsList.find(s => s.id === skinId);
                    updateSkinPreview('skinPreview1', currentSkin1);
                    updateComparisonDetails();
                    playSound('select');
                } else {
                    currentSkin1 = null;
                    resetPreview('skinPreview1');
                    updateComparisonDetails();
                }
            });
            
            $('#skinSelect2').change(function() {
                const skinId = $(this).val();
                if (skinId) {
                    currentSkin2 = allSkinsList.find(s => s.id === skinId);
                    updateSkinPreview('skinPreview2', currentSkin2);
                    updateComparisonDetails();
                    playSound('select');
                } else {
                    currentSkin2 = null;
                    resetPreview('skinPreview2');
                    updateComparisonDetails();
                }
            });
            
            console.log(`Cargadas ${allSkinsList.length} skins para el comparador`);
        },
        error: function() {
            $('#skinSelect1, #skinSelect2').html('<option value="">Error al cargar skins</option>');
        }
    });
}

function updateSkinPreview(containerId, skin) {
    if (!skin) return;
    const imgUrl = skin.images?.icon || 'https://placehold.co/400x400/1a1a2e/00f3ff?text=No+Img';
    const rarityClass = getRarityClass(skin.rarity?.value);
    const isFav = isFavorite(skin.id);
    
    const html = `
        <img src="${imgUrl}" alt="${escapeHtml(skin.name)}" class="img-fluid rounded-3" style="max-height: 200px;">
        <h5 class="mt-2">${escapeHtml(skin.name)}</h5>
        <span class="rarity-badge ${rarityClass}">${skin.rarity?.displayValue || 'Común'}</span>
        <button class="favorite-btn-compare mt-2 d-block mx-auto" onclick="toggleFavorite('${skin.id}', '${escapeHtml(skin.name)}', '${imgUrl}', '${skin.rarity?.displayValue || 'Común'}', '${getTypeDisplay(skin.type?.value)}', event)">
            <i class="bi ${isFav ? 'bi-heart-fill' : 'bi-heart'}"></i> Favorito
        </button>
    `;
    $(`#${containerId}`).html(html);
}

function resetPreview(containerId) {
    $(`#${containerId}`).html(`
        <img src="https://placehold.co/300x300/1a1a2e/00f3ff?text=Selecciona+una+skin" alt="Sin selección" class="img-fluid rounded-3" style="max-height: 200px;">
        <p class="mt-2 text-white-50">Selecciona una skin para comparar</p>
    `);
}

function updateComparisonDetails() {
    if (currentSkin1) {
        $('#detailName1').text(currentSkin1.name || 'Sin nombre');
        $('#detailRarity1').html(`<span class="rarity-badge ${getRarityClass(currentSkin1.rarity?.value)}">${currentSkin1.rarity?.displayValue || 'Común'}</span>`);
        $('#detailType1').text(getTypeDisplay(currentSkin1.type?.value));
        $('#detailDesc1').text(currentSkin1.description || 'No hay descripción disponible');
    } else {
        $('#detailName1').text('---');
        $('#detailRarity1').text('---');
        $('#detailType1').text('---');
        $('#detailDesc1').text('Selecciona una skin para ver sus detalles');
    }
    
    if (currentSkin2) {
        $('#detailName2').text(currentSkin2.name || 'Sin nombre');
        $('#detailRarity2').html(`<span class="rarity-badge ${getRarityClass(currentSkin2.rarity?.value)}">${currentSkin2.rarity?.displayValue || 'Común'}</span>`);
        $('#detailType2').text(getTypeDisplay(currentSkin2.type?.value));
        $('#detailDesc2').text(currentSkin2.description || 'No hay descripción disponible');
    } else {
        $('#detailName2').text('---');
        $('#detailRarity2').text('---');
        $('#detailType2').text('---');
        $('#detailDesc2').text('Selecciona una skin para ver sus detalles');
    }
    
    if (currentSkin1 && currentSkin2) {
        $('.vs-icon').addClass('vs-active');
    } else {
        $('.vs-icon').removeClass('vs-active');
    }
}

// Botones de skin aleatoria para cada lado del comparador
function initRandomForSkin1() {
    $('#randomSkin1Btn').click(function() {
        playSound('click');
        if (allSkinsList.length === 0) {
            showToast('Cargando skins', 'Espera un momento', 'click');
            return;
        }
        const randomSkin = allSkinsList[Math.floor(Math.random() * allSkinsList.length)];
        $('#skinSelect1').val(randomSkin.id).trigger('change');
        showToast('Skin aleatoria cargada', randomSkin.name, 'select');
    });
}

function initRandomForSkin2() {
    $('#randomSkin2Btn').click(function() {
        playSound('click');
        if (allSkinsList.length === 0) {
            showToast('Cargando skins', 'Espera un momento', 'click');
            return;
        }
        const randomSkin = allSkinsList[Math.floor(Math.random() * allSkinsList.length)];
        $('#skinSelect2').val(randomSkin.id).trigger('change');
        showToast('Skin aleatoria cargada', randomSkin.name, 'select');
    });
}

function selectFavoriteForCompare(id, name, image, rarity, type) {
    playSound('click');
    const skin = allSkinsList.find(s => s.id === id);
    if (!skin) {
        if (!$('#skinSelect1').val()) {
            $('#skinSelect1').val(id).trigger('change');
            showToast('Skin 1 actualizada', name);
        } else if (!$('#skinSelect2').val()) {
            $('#skinSelect2').val(id).trigger('change');
            showToast('Skin 2 actualizada', name);
        } else {
            showToast('Ya tienes dos skins seleccionadas', 'Puedes cambiar una desde los selects', 'click');
        }
        return;
    }
    
    if (!$('#skinSelect1').val()) {
        $('#skinSelect1').val(id).trigger('change');
        showToast('Skin 1 actualizada', name);
    } else if (!$('#skinSelect2').val()) {
        $('#skinSelect2').val(id).trigger('change');
        showToast('Skin 2 actualizada', name);
    } else {
        showToast('Ya tienes dos skins seleccionadas', 'Puedes cambiar una desde los selects', 'click');
    }
}

// --------------------------------------------------------------
// MODO OSCURO / CLARO
// --------------------------------------------------------------
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
    playSound('click');
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

// --------------------------------------------------------------
// FILTROS DE LA TIENDA (desplegables)
// --------------------------------------------------------------
function initFilterToggles() {
    $('.btn-filter-toggle').click(function() {
        playSound('click');
        const targetGroup = $(this).data('filter-group');
        $('.btn-filter-toggle').removeClass('active');
        $(this).addClass('active');
        $('.filter-group').hide();
        $(`#filter-${targetGroup}`).show();
    });
}

// --------------------------------------------------------------
// MODALES (ventanas emergentes)
// --------------------------------------------------------------
function showSkinModal(skin) {
    try {
        playSound('select');
        $('#skinModalTitle').text(skin.name || 'Sin nombre');
        $('#skinModalImg').attr('src', skin.images?.icon || 'https://placehold.co/400x400/1a1a2e/00f3ff?text=No+Img');
        $('#skinModalDesc').text(skin.description || 'No hay descripción disponible');
        const rarityClass = getRarityClass(skin.rarity?.value);
        $('#skinModalRarity').html(`<span class="rarity-badge ${rarityClass}">${skin.rarity?.displayValue || 'Común'}</span>`);
        $('#skinModalType').text(getTypeDisplay(skin.type?.value));
        new bootstrap.Modal($('#skinModal')[0]).show();
    } catch(e) { console.error('Error modal skin:', e); }
}

function showNewsModal(title, body, imageUrl) {
    try {
        playSound('click');
        $('#newsModalTitle').text(title);
        $('#newsModalBody').html(`<div class="text-center"><img src="${imageUrl}" alt="${title}" class="img-fluid rounded mb-3" style="max-height: 200px;"><p class="mt-3">${body}</p><hr class="border-neon"><small class="text-white-50">Fuente: Fortnite-API.com</small></div>`);
        new bootstrap.Modal($('#newsModal')[0]).show();
    } catch(e) { console.error('Error modal noticia:', e); }
}

// --------------------------------------------------------------
// PÁGINA DE INICIO (LANDING)
// --------------------------------------------------------------
function loadStats() {
    $('#skinsCount, #emotesCount, #totalCount').text('...');
    $.ajax({
        url: API_URL,
        method: 'GET',
        success: function(response) {
            let allItems = [];
            if (response?.data) {
                if (Array.isArray(response.data)) allItems = response.data;
                else if (response.data.br) allItems = response.data.br;
                else if (response.data.items?.br) allItems = response.data.items.br;
            }
            if (allItems.length > 0) {
                const skins = allItems.filter(item => item.type?.value === 'outfit').length;
                const emotes = allItems.filter(item => item.type?.value === 'emote').length;
                animateNumber($('#skinsCount'), skins);
                animateNumber($('#emotesCount'), emotes);
                $('#totalCount').text(allItems.length.toLocaleString());
                console.log(`Estadísticas: ${skins} skins, ${emotes} emotes, ${allItems.length} items`);
            } else {
                $('#skinsCount, #emotesCount, #totalCount').text('Error');
            }
        },
        error: () => $('#skinsCount, #emotesCount, #totalCount').text('Error')
    });
}

function animateNumber(element, target) {
    if (target === 0 || isNaN(target)) { element.text('?'); return; }
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

// Estos son los mensajes de carga (para que la espera no sea tan aburrida)
const loadingMessages = ["Saltando del autobús...", "Recargando armas...", "Construyendo rampas...", "Abriendo un cofre...", "Tomando escudo de Slurp...", "Buscando loot...", "Preparando victoria...", "Conectando con la isla...", "Invocando grieta..."];
function getRandomLoadingMessage() { return loadingMessages[Math.floor(Math.random() * loadingMessages.length)]; }

function loadNews() {
    const loadingMsg = getRandomLoadingMessage();
    $('#newsContainer').html(`<div class="col-12 text-center"><div class="spinner-border text-neon"></div><p class="mt-2 text-white-50">${loadingMsg}</p></div>`);
    $.ajax({
        url: NEWS_URL,
        method: 'GET',
        success: function(response) {
            if (response?.data?.motds) {
                const newsItems = response.data.motds.filter(n => !n.hidden).slice(0, 6);
                displayNews(newsItems);
            } else {
                $('#newsContainer').html('<div class="col-12 text-center"><div class="alert alert-info">No hay noticias disponibles</div></div>');
            }
        },
                error: () => $('#newsContainer').html('<div class="col-12 text-center"><div class="alert alert-danger">Error al cargar noticias</div></div>')
    });
}

function displayNews(newsItems) {
    if (!newsItems || newsItems.length === 0) {
        $('#newsContainer').html('<div class="col-12 text-center"><div class="alert alert-info">No hay noticias disponibles</div></div>');
        return;
    }
    let html = '';
    newsItems.forEach((news, index) => {
        let colClass = index === 0 ? 'col-12' : 'col-md-6 col-sm-12';
        const imageUrl = news.tileImage || news.image || 'https://placehold.co/720x400/1a1a2e/00f3ff?text=Noticia';
        html += `<div class="${colClass}" data-aos="fade-up" data-aos-delay="${(index % 3) * 100}"><div class="news-card h-100"><div class="news-image"><img src="${imageUrl}" alt="${escapeHtml(news.title)}" loading="lazy"></div><div class="news-body"><h3 class="news-title">${escapeHtml(news.title)}</h3><p class="news-description">${escapeHtml(news.body.substring(0, 120))}...</p><div class="news-footer"><span class="news-date"><i class="bi bi-calendar-event"></i> ${new Date().toLocaleDateString('es-ES')}</span><a href="#" class="news-read-more" data-title="${escapeHtml(news.title)}" data-body="${escapeHtml(news.body)}" data-image="${imageUrl}">Leer más <i class="bi bi-arrow-right-short"></i></a></div></div></div></div>`;
    });
    $('#newsContainer').html(html);
    if (typeof AOS !== 'undefined') AOS.refresh();
    $('.news-read-more').off('click').on('click', function(e) {
        e.preventDefault();
        showNewsModal($(this).data('title'), $(this).data('body'), $(this).data('image'));
    });
}

function initCountdown() {
    const eventDate = new Date('June 15, 2026 00:00:00').getTime();
    function updateCountdown() {
        const now = new Date().getTime();
        const distance = eventDate - now;
        if (distance > 0) {
            $('#days').text(String(Math.floor(distance / (1000*60*60*24))).padStart(2,'0'));
            $('#hours').text(String(Math.floor((distance % (1000*60*60*24)) / (1000*60*60))).padStart(2,'0'));
            $('#minutes').text(String(Math.floor((distance % (1000*60*60)) / (1000*60))).padStart(2,'0'));
            $('#seconds').text(String(Math.floor((distance % (1000*60)) / 1000)).padStart(2,'0'));
        } else {
            $('.countdown-timer').html('<div class="text-center"><h3 class="text-neon">¡EL EVENTO YA COMENZÓ!</h3></div>');
        }
    }
    updateCountdown();
    setInterval(updateCountdown, 1000);
}

// Las skins en tendencia (desde la tienda)
function loadTrending() {
    $.ajax({
        url: SHOP_URL,
        method: 'GET',
        success: function(response) {
            if (response?.data?.entries) {
                let shopItems = [];
                response.data.entries.forEach(entry => {
                    if (entry.brItems && entry.brItems.length > 0) {
                        shopItems = shopItems.concat(entry.brItems);
                    }
                });
                const uniqueItems = [];
                const ids = new Set();
                for (const item of shopItems) {
                    if (!ids.has(item.id) && item.type?.value === 'outfit') {
                        ids.add(item.id);
                        uniqueItems.push(item);
                    }
                }
                displayTrending(uniqueItems.slice(0, 12));
                console.log(`Tendencias cargadas: ${uniqueItems.length} skins`);
            } else {
                $('#trendingContainer').html('<div class="col-12 text-center"><div class="alert alert-info">No hay tendencias disponibles</div></div>');
            }
        },
        error: () => $('#trendingContainer').html('<div class="col-12 text-center"><div class="alert alert-danger">Error al cargar tendencias</div></div>')
    });
}

function displayTrending(items) {
    if (!items || items.length === 0) {
        $('#trendingContainer').html('<div class="col-12 text-center"><div class="alert alert-info">No hay tendencias disponibles</div></div>');
        return;
    }
    let html = '';
    items.forEach((item, index) => {
        const rarityClass = getRarityClass(item.rarity?.value);
        const imgUrl = item.images?.icon || 'https://placehold.co/400x400/1a1a2e/00f3ff?text=No+Img';
        const isFav = isFavorite(item.id);
        html += `<div class="col-lg-3 col-md-4 col-sm-6"><div class="cosmetic-card"><div class="trending-badge"><i class="bi bi-fire"></i> #${index + 1}</div><button class="favorite-btn" data-id="${item.id}" onclick="toggleFavorite('${item.id}', '${escapeHtml(item.name)}', '${imgUrl}', '${item.rarity?.displayValue || 'Común'}', '${getTypeDisplay(item.type?.value)}', event)"><i class="bi ${isFav ? 'bi-heart-fill' : 'bi-heart'}"></i></button><img src="${imgUrl}" alt="${escapeHtml(item.name)}" loading="lazy"><div class="card-body"><h5 class="card-title">${escapeHtml(item.name)}</h5><span class="rarity-badge ${rarityClass}">${item.rarity?.displayValue || 'Común'}</span><p class="small text-white-50 mt-1">${getTypeDisplay(item.type?.value)}</p></div></div></div>`;
    });
    $('#trendingContainer').html(html);
}

// --------------------------------------------------------------
// TIENDA (FILTROS, BÚSQUEDA, ISOTOPE)
// --------------------------------------------------------------
function loadShopCosmetics() {
    const loadingMsg = getRandomLoadingMessage();
    $('#cosmeticsContainer').html(`<div class="col-12 text-center"><div class="spinner-border text-neon"></div><p class="mt-2 text-white-50">${loadingMsg}</p></div>`);
    $.ajax({
        url: SHOP_URL,
        method: 'GET',
        success: function(response) {
            if (response?.data?.entries) {
                let shopItems = [];
                response.data.entries.forEach(entry => {
                    if (entry.brItems && entry.brItems.length > 0) {
                        shopItems = shopItems.concat(entry.brItems);
                    }
                });
                const uniqueItems = [];
                const ids = new Set();
                for (const item of shopItems) {
                    if (!ids.has(item.id)) {
                        ids.add(item.id);
                        uniqueItems.push(item);
                    }
                }
                allShopItems = uniqueItems;
                renderIsotopeGrid(allShopItems.slice(0, 60));
                setupFilters();
                setupSearch();
                updateResultsCount();
                console.log(`Tienda cargada: ${allShopItems.length} cosméticos`);
            } else {
                $('#cosmeticsContainer').html('<div class="alert alert-danger">No se encontraron cosméticos</div>');
            }
        },
        error: () => $('#cosmeticsContainer').html('<div class="alert alert-danger">Error de conexión</div>')
    });
}

function renderIsotopeGrid(items) {
    if (!items || items.length === 0) {
        $('#cosmeticsContainer').html('<div class="col-12 text-center"><div class="alert alert-info">No hay cosméticos</div></div>');
        $('#resultsCount').html('<span class="badge bg-neon">0 resultados</span>');
        return;
    }
    let html = '';
    items.forEach(item => {
        const rarityClass = getRarityClass(item.rarity?.value);
        const typeValue = item.type?.value || 'other';
        const imgUrl = item.images?.icon || 'https://placehold.co/400x400/1a1a2e/00f3ff?text=No+Img';
        const isFav = isFavorite(item.id);
        html += `<div class="col-lg-3 col-md-4 col-sm-6 isotope-item ${rarityClass.replace('rarity-', '')} ${typeValue}"><div class="cosmetic-card"><button class="favorite-btn" data-id="${item.id}" onclick="toggleFavorite('${item.id}', '${escapeHtml(item.name)}', '${imgUrl}', '${item.rarity?.displayValue || 'Común'}', '${getTypeDisplay(item.type?.value)}', event)"><i class="bi ${isFav ? 'bi-heart-fill' : 'bi-heart'}"></i></button><img src="${imgUrl}" alt="${escapeHtml(item.name)}" loading="lazy"><div class="card-body"><h5 class="card-title">${escapeHtml(item.name) || '???'}</h5><span class="rarity-badge ${rarityClass}">${item.rarity?.displayValue || 'Común'}</span><p class="small text-white-50 mt-1">${getTypeDisplay(item.type?.value)}</p></div></div></div>`;
    });
    $('#cosmeticsContainer').html(html);
    if (isotopeInstance) isotopeInstance.destroy();
    isotopeInstance = new Isotope('#cosmeticsContainer', { itemSelector: '.isotope-item', layoutMode: 'fitRows', transitionDuration: '0.6s' });
    applyCombinedFilter();
    updateResultsCount();
}

function updateResultsCount() {
    const visibleCount = $('.isotope-item:visible').length;
    $('#resultsCount').html(`<span class="badge bg-neon">${visibleCount} de ${allShopItems.length} cosméticos</span>`);
}

function getTypeDisplay(typeValue) {
    const types = { 'outfit': '🎭 Skin', 'emote': '💃 Emote', 'backpack': '🎒 Mochila', 'pickaxe': '⛏️ Pico', 'glider': '🪂 Ala', 'wrap': '🎨 Envoltura', 'other': '📦 Otro' };
    return types[typeValue] || `📦 ${typeValue || 'Cosmético'}`;
}

function setupFilters() {
    $('.rarity-buttons .filter-btn').click(function() {
        playSound('click');
        currentRarityFilter = $(this).data('filter');
        $('.rarity-buttons .filter-btn').removeClass('active');
        $(this).addClass('active');
        applyCombinedFilter();
    });
    $('.type-buttons .filter-btn').click(function() {
        playSound('click');
        currentTypeFilter = $(this).data('type');
        $('.type-buttons .filter-btn').removeClass('active');
        $(this).addClass('active');
        applyCombinedFilter();
    });
}

function applyCombinedFilter() {
    let filterString = '';
    if (currentRarityFilter !== '*' && currentTypeFilter !== '*') filterString = `${currentRarityFilter}.${currentTypeFilter}`;
    else if (currentRarityFilter !== '*') filterString = currentRarityFilter;
    else if (currentTypeFilter !== '*') filterString = `.${currentTypeFilter}`;
    else filterString = '*';
    isotopeInstance.arrange({ filter: filterString });
    setTimeout(updateResultsCount, 100);
}

function setupSearch() {
    $('#searchBtn').click(function() {
        playSound('click');
        const term = $('#searchInput').val().toLowerCase();
        if (!term) { renderIsotopeGrid(allShopItems.slice(0, 60)); return; }
        renderIsotopeGrid(allShopItems.filter(c => c.name?.toLowerCase().includes(term)).slice(0, 60));
    });
    $('#searchInput').keypress(e => { if (e.which === 13) $('#searchBtn').click(); });
}

// --------------------------------------------------------------
// FUNCIONES AUXILIARES
// --------------------------------------------------------------
function getRarityClass(rarity) {
    const rarities = { 'common': 'rarity-common', 'uncommon': 'rarity-uncommon', 'rare': 'rarity-rare', 'epic': 'rarity-epic', 'legendary': 'rarity-legendary', 'starwars': 'rarity-legendary', 'icon': 'rarity-epic', 'slurp': 'rarity-epic' };
    return rarities[rarity] || 'rarity-common';
}

function getRarityClassFromName(rarityName) {
    const map = { 'Legendario': 'rarity-legendary', 'Épico': 'rarity-epic', 'Raro': 'rarity-rare', 'Poco común': 'rarity-uncommon', 'Común': 'rarity-common' };
    return map[rarityName] || 'rarity-common';
}

function escapeHtml(text) {
    if (!text) return '';
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function setCurrentYear() { $('#currentYear').text(new Date().getFullYear()); }

// --------------------------------------------------------------
// TRUCOS Y CONSEJOS (de Fortnite)
// --------------------------------------------------------------
const fortniteTips = [
    "Apunta a la cabeza: el daño crítico es mucho mayor.",
    "Construye siempre rampas para tener ventaja sobre tus enemigos.",
    "Los cofres siempre están en los mismos lugares, ¡aprende sus spawns!",
    "Escucha los pasos: el sonido es clave para saber dónde están.",
    "El escudo de Slurp se regenera con el tiempo.",
    "La pistola de hielo congela a los enemigos y los ralentiza.",
    "Comunícate con tu equipo, es la clave del éxito.",
    "Los eventos en vivo dan recompensas exclusivas.",
    "Usa auriculares para escuchar los pasos de los enemigos.",
    "El humo de las granadas puede cubrir tu escape.",
    "Si sales del autobús tarde, llegarás más lejos.",
    "Las mejoras de armas se encuentran en cofres de alto nivel."
];

function showRandomTip() { $('#currentTip').text(fortniteTips[Math.floor(Math.random() * fortniteTips.length)]); }

// --------------------------------------------------------------
// EFECTOS VISUALES
// --------------------------------------------------------------
function initScrollProgress() {
    $(window).scroll(function() {
        const scrolled = ($(document).scrollTop() / ($(document).height() - $(window).height())) * 100;
        $('.scroll-progress').css('width', scrolled + '%');
    });
}

// Efecto máquina de escribir para el título principal
function typeWriter(element, text, speed = 100) {
    let i = 0;
    element.textContent = '';
    function type() {
        if (i < text.length) {
            element.textContent += text.charAt(i);
            i++;
            setTimeout(type, speed);
        }
    }
    type();
}

// Sonidos al pasar el ratón por encima de los botones
$('body').on('mouseenter', '.btn, .cosmetic-card, .news-card, .stat-card, .slider-card, .favorite-btn, .filter-btn, .btn-filter-toggle, .favorite-item', function() { playHover(); });

// --------------------------------------------------------------
// INICIO DE LA PÁGINA: detecta qué página es y la inicia
// --------------------------------------------------------------
$(document).ready(function() {
    console.log('Fortnite Hub iniciado');
    
    initTheme();
    $('#themeToggle').click(toggleTheme);
    initFilterToggles();
    setCurrentYear();
    initScrollProgress();
    if (document.getElementById('typed-title')) typeWriter(document.getElementById('typed-title'), 'EL UNIVERSO FORTNITE', 100);
    $('#newTipBtn').click(function() { playSound('click'); showRandomTip(); });
    showRandomTip();
    updateFavoritesDisplay();
    updateFavoritesPreview();
    
    $('#backToTop').click(() => $('html, body').animate({ scrollTop: 0 }, 500));
    
    // Enlaces internos (smooth scroll)
    $('a[href^="#"]').on('click', function(e) {
        const target = $(this.getAttribute('href'));
        if (target.length) {
            e.preventDefault();
            $('html, body').animate({ scrollTop: target.offset().top - 70 }, 800);
        }
    });
    
    const currentPage = window.location.pathname;
    if (currentPage.includes('shop.html')) {
        console.log('Página: Tienda');
        loadShopCosmetics();
    } else if (currentPage.includes('compare.html')) {
        console.log('Página: Comparador');
        loadSkinsForCompare();
        initRandomForSkin1();
        initRandomForSkin2();
        updateCompareFavoritesList();
    } else if (currentPage.includes('maps.html')) {
    console.log('Página: Mapas');
    initTimeline();
    } else {
        console.log('Página: Inicio');
        loadStats();
        loadNews();
        initCountdown();
        loadTrending();
    }
    
    window.toggleFavorite = toggleFavorite;
    window.selectFavoriteForCompare = selectFavoriteForCompare;
    window.showSkinModal = showSkinModal;

    function initTimeline() {
    const container = $('#timelineContainer');
    if (container.length === 0) return;
    
    container.html(`
        <div class="text-center py-5">
            <div class="spinner-border text-neon" role="status">
                <span class="visually-hidden">Cargando...</span>
            </div>
            <p class="mt-2 text-white-50">Cargando línea del tiempo...</p>
        </div>
    `);
    
    setTimeout(() => {
        let html = '';
        mapasHistoricos.forEach((mapa, index) => {
            // Añadir un manejador de error más robusto
            const imgHandler = `this.onerror=null; this.src='https://placehold.co/800x500/1a1a2e/00f3ff?text=${encodeURIComponent(mapa.nombre)}'`;
            
            html += `
                <div class="timeline-item" data-aos="fade-up" data-aos-delay="${index * 100}">
                    <div class="timeline-card" onclick="window.openMapModal('${mapa.imagen}', '${mapa.nombre.replace(/'/g, "\\'")}', '${mapa.descripcion.replace(/'/g, "\\'")}')">
                        <img src="${mapa.imagen}" alt="${mapa.nombre}" class="timeline-img" loading="lazy" 
                             onerror="${imgHandler}">
                        <div class="timeline-content">
                            <span class="timeline-season">${mapa.anio}</span>
                            <h3 class="timeline-title">${mapa.nombre}</h3>
                            <div class="timeline-tag">${mapa.tag}</div>
                            <p class="timeline-desc">${mapa.descripcion}</p>
                            <div class="timeline-year">
                                <i class="bi bi-calendar-event"></i> ${mapa.anio}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
        
        container.html(html);
        
        if (typeof AOS !== 'undefined') {
            AOS.refresh();
        }
        
        console.log('✅ Línea del tiempo cargada con', mapasHistoricos.length, 'mapas de Fortnite');
    }, 500);
}

// MAPAS REALES DE FORTNITE (imágenes funcionales)
// ============================================

const mapasHistoricos = [
    {
        nombre: "CAPÍTULO 1 - TEMPORADA 1",
        descripcion: "El mapa original de Fortnite. Ubicaciones clásicas: Parque Placentero, Ciudad Comercio, Lago Loot, y el famoso Bosque Sospechoso.",
        tag: "🏔️ Mapa Original (2017)",
        anio: "2017",
        imagen: "https://i.redd.it/qtswly1i1kz11.jpg"
    },
    {
        nombre: "CAPÍTULO 1 - TEMPORADA 4",
        descripcion: "La llegada de los superhéroes y el meteorito. La grieta cambió la isla para siempre.",
        tag: "☄️ Meteorito",
        anio: "2018",
        imagen: "https://i.imgur.com/7yB2L0T.jpeg"
    },
    {
        nombre: "CAPÍTULO 1 - TEMPORADA X",
        descripcion: "El caos total. Locaciones distorsionadas, grietas y el agujero negro que lo cambió todo.",
        tag: "🌀 Distorsión Temporal",
        anio: "2019",
        imagen: "https://i.imgur.com/7h3PQyR.jpeg"
    },
    {
        nombre: "CAPÍTULO 2 - TEMPORADA 1",
        descripcion: "Un mapa completamente nuevo con agua, barcos motorizados y nuevas ubicaciones.",
        tag: "🌊 Nuevo Capítulo",
        anio: "2019",
        imagen: "https://i.imgur.com/kE5Xr3P.jpeg"
    },
    {
        nombre: "CAPÍTULO 2 - TEMPORADA 2",
        descripcion: "Espías de SHADOW y GHOST, escondites secretos y el Agente Midas.",
        tag: "🕵️ Espías",
        anio: "2020",
        imagen: "https://i.imgur.com/XQ2mY9Z.jpeg"
    },
    {
        nombre: "CAPÍTULO 2 - TEMPORADA 4",
        descripcion: "Nexus Guerra. Thor, Iron Man y los héroes de Marvel llegan a la isla.",
        tag: "🦸 Marvel",
        anio: "2020",
        imagen: "https://i.imgur.com/d07Fq2n.jpeg"
    },
    {
        nombre: "CAPÍTULO 3 - TEMPORADA 1",
        descripcion: "La isla se volteó. Nuevos biomas, arañas deslizantes y el Santuario.",
        tag: "🕷️ Spider-Man",
        anio: "2021",
        imagen: "https://i.imgur.com/8vJKFpN.jpeg"
    },
    {
        nombre: "CAPÍTULO 3 - TEMPORADA 3",
        descripcion: "Colapso de la realidad. Darth Vader llega y el Paradigma distorsiona todo.",
        tag: "⭐ Colapso Realidad",
        anio: "2022",
        imagen: "https://i.imgur.com/WZqG1cE.jpeg"
    },
    {
        nombre: "CAPÍTULO 4 - TEMPORADA 1",
        descripcion: "Biomas medievales, el Castillo de Slone, el Llamativo y Geralt de Rivia.",
        tag: "🏰 Medieval",
        anio: "2022",
        imagen: "https://i.imgur.com/YLqBQvZ.jpeg"
    },
    {
        nombre: "CAPÍTULO 4 - TEMPORADA 4",
        descripcion: "Atraco en la isla. El robo más grande de la historia de Fortnite.",
        tag: "💰 Atraco",
        anio: "2023",
        imagen: "https://i.imgur.com/2FcDfGh.jpeg"
    },
    {
        nombre: "CAPÍTULO 5 - TEMPORADA 1",
        descripcion: "La isla se transforma con zonas subterráneas. Peter Griffin y Solid Snake.",
        tag: "⛰️ Subterráneo",
        anio: "2023",
        imagen: "https://i.imgur.com/1VHqJcb.jpeg"
    },
    {
        nombre: "CAPÍTULO 5 - TEMPORADA 4",
        descripcion: "Absoluto Doom. El Doctor Doom conquista la isla con su imperio.",
        tag: "👑 Doom",
        anio: "2024",
        imagen: "https://i.imgur.com/CdXqMhJ.jpeg"
    },
    {
        nombre: "CAPÍTULO 6 - TEMPORADA 1",
        descripcion: "Demonios, armas elementales y espíritus ancestrales. La magia regresa.",
        tag: "👹 Demonios",
        anio: "2024",
        imagen: "https://i.imgur.com/9XpQwJp.jpeg"
    },
    {
        nombre: "CAPÍTULO 6 - TEMPORADA 2",
        descripcion: "Élite: competición, gremios y el enfrentamiento definitivo entre facciones.",
        tag: "🏆 Élite",
        anio: "2025",
        imagen: "https://i.imgur.com/Qw3eRty.jpeg"
    }
];
});