const YOUR_TELEGRAM = 'laureyshop';

function openPanel() {
    document.getElementById('sidebar').classList.add('active');
    document.getElementById('overlay').classList.add('active');
}

function closePanel() {
    document.getElementById('sidebar').classList.remove('active');
    document.getElementById('overlay').classList.remove('active');
}

let currentModalProduct = { title: '', price: '' };
let currentGallery = [];
let currentGalleryIndex = 0;

function openModal(el) {
    if (!el || !el.getAttribute) return;
    const title = el.getAttribute('data-title') || '';
    const type = el.getAttribute('data-type') || '';
    const desc = el.getAttribute('data-desc') || '';
    const price = el.getAttribute('data-price-text') || '';
    const images = el.getAttribute('data-images') || '';
    const id = el.getAttribute('data-id');

    if (id) countView(id);
    addToHistory(title, price);

    currentGallery = images ? images.split(',').map(s => s.trim()).filter(Boolean) : [];
    currentGalleryIndex = 0;

    document.getElementById('modalTitle').innerText = title;
    document.getElementById('modalType').innerText = type;
    document.getElementById('modalDesc').innerText = desc;
    document.getElementById('modalPrice').innerText = price;

    updateGallery();
    currentModalProduct = { title, price };

    const favBtn = document.getElementById('modalFavBtn');
    if (favBtn) {
        const isFav = favorites.find(f => f.title === title);
        favBtn.classList.toggle('liked', !!isFav);
        favBtn.textContent = isFav ? '♥ В избранном' : '♡ В избранное';
    }
    document.getElementById('modal').classList.add('active');
}

function updateGallery() {
    const mainImg = document.getElementById('modalMainImage');
    const thumbs = document.getElementById('galleryThumbs');
    if (!mainImg || !thumbs) return;
    if (currentGallery.length === 0) {
        mainImg.src = ''; thumbs.innerHTML = '';
        return;
    }
    mainImg.src = currentGallery[currentGalleryIndex];
    thumbs.innerHTML = '';
    currentGallery.forEach((url, i) => {
        const thumb = document.createElement('button');
        thumb.className = 'gallery-thumb' + (i === currentGalleryIndex ? ' active' : '');
        thumb.innerHTML = '<img src="' + url + '">';
        thumb.onclick = function() { currentGalleryIndex = i; updateGallery(); };
        thumbs.appendChild(thumb);
    });
}

function galleryPrev() { if (!currentGallery.length) return; currentGalleryIndex = (currentGalleryIndex - 1 + currentGallery.length) % currentGallery.length; updateGallery(); }
function galleryNext() { if (!currentGallery.length) return; currentGalleryIndex = (currentGalleryIndex + 1) % currentGallery.length; updateGallery(); }
function closeModal() { document.getElementById('modal').classList.remove('active'); }
document.getElementById('modal').addEventListener('click', function(e) { if (e.target === this) closeModal(); });

function applyFilters() {
    const items = document.querySelectorAll('.item');
    const q = document.getElementById('searchInput').value.toLowerCase().trim();
    const cats = [...document.querySelectorAll('.filter-category:checked')].map(cb => cb.value);
    const brands = [...document.querySelectorAll('.filter-brand:checked')].map(cb => cb.value);
    const sizes = [...document.querySelectorAll('.filter-size:checked')].map(cb => cb.value);
    const sortRadio = document.querySelector('input[name="sortPrice"]:checked');
    const sortValue = sortRadio ? sortRadio.value : 'default';
    const noResults = document.getElementById('noResults');
    let visibleItems = [];

    items.forEach(item => {
        const c = item.getAttribute('data-category');
        const b = item.getAttribute('data-brand');
        const sizeAttr = item.getAttribute('data-size') || '';
        const itemSizes = sizeAttr.split(',').map(s => s.trim());
        const s = item.getAttribute('data-search').toLowerCase();
        const sizeMatch = sizes.length ===0 || sizes.some(sz => itemSizes.includes(sz));
        const ok = (cats.length === 0 || cats.includes(c)) && (brands.length === 0 || brands.includes(b)) && (q === '' || s.includes(q)) && sizeMatch;
        item.classList.add('hidden');
        if (ok) visibleItems.push(item);
    });

    if (sortValue === 'cheap') visibleItems.sort((a, b) => parseInt(a.getAttribute('data-price')) - parseInt(b.getAttribute('data-price')));
    else if (sortValue === 'expensive') visibleItems.sort((a, b) => parseInt(b.getAttribute('data-price')) - parseInt(a.getAttribute('data-price')));

    const catalog = document.getElementById('catalog');
    visibleItems.forEach(item => { item.classList.remove('hidden'); catalog.appendChild(item); });
    noResults.classList.toggle('show', visibleItems.length === 0);
}

function resetFilters() {
    document.querySelectorAll('.filter-category, .filter-brand, .filter-size').forEach(cb => cb.checked = false);
    document.getElementById('searchInput').value = '';
    const def = document.querySelector('input[name="sortPrice"][value="default"]');
    if (def) def.checked = true;
    applyFilters(); closePanel();
}

let currentSizeType = 'shoes';
function switchSizeType(type) {
    currentSizeType = type;
    const container = document.getElementById('sizeCheckboxes');
    const btnShoes = document.getElementById('sizeTypeShoes');
    const btnClothes = document.getElementById('sizeTypeClothes');
    if (!container) return;
    if (btnShoes) btnShoes.classList.toggle('active', type === 'shoes');
    if (btnClothes) btnClothes.classList.toggle('active', type === 'clothes');
    const sizes = type === 'shoes' ? [37, 38, 39, 40, 41, 42, 43, 44, 45] : ['S', 'M', 'L', 'XL'];
    container.innerHTML = '';
    sizes.forEach(sz => {
        const label = document.createElement('label');
        label.innerHTML = '<input type="checkbox" class="filter-size" value="' + sz + '" onchange="applyFilters()"> ' + sz;
        container.appendChild(label);
    });
    applyFilters();
}

let favorites = JSON.parse(localStorage.getItem('laurey_fav') || '[]');
function updateBadges() {
    const favBadge = document.getElementById('favBadge');
    if (!favBadge) return;
    if (favorites.length > 0) { favBadge.textContent = favorites.length; favBadge.classList.add('active'); }
    else { favBadge.classList.remove('active'); }
}
function toggleFav(btn, title, price) {
    event.stopPropagation();
    const index = favorites.findIndex(item => item.title === title);
    if (index > -1) { favorites.splice(index, 1); btn.classList.remove('liked'); btn.textContent = '♡'; }
    else { favorites.push({ title, price }); btn.classList.add('liked'); btn.textContent = '♥'; }
    localStorage.setItem('laurey_fav', JSON.stringify(favorites));
    updateBadges();
}
function toggleFavFromModal() {
    const btn = document.getElementById('modalFavBtn');
    if (!btn) return;
    const { title, price } = currentModalProduct;
    const index = favorites.findIndex(item => item.title === title);
    if (index > -1) { favorites.splice(index, 1); btn.classList.remove('liked'); btn.textContent = '♡ В избранное'; }
    else { favorites.push({ title, price }); btn.classList.add('liked'); btn.textContent = '♥ В избранном'; }
    localStorage.setItem('laurey_fav', JSON.stringify(favorites));
    updateBadges(); updateAllFavButtons();
}
function updateAllFavButtons() {
    document.querySelectorAll('.fav-btn').forEach(btn => {
        const onclickAttr = btn.getAttribute('onclick');
        if (!onclickAttr) return;
        const match = onclickAttr.match(/toggleFav\(this,\s*'(.+?)',\s*'(.+?)'\)/);
        if (match && favorites.find(f => f.title === match[1])) { btn.classList.add('liked'); btn.textContent = '♥'; }
        else if (match) { btn.classList.remove('liked'); btn.textContent = '♡'; }
    });
}
function openFavorites() {
    const modal = document.getElementById('favoritesModal');
    const list = document.getElementById('favoritesList');
    if (!modal || !list) return;
    list.innerHTML = '';
    if (favorites.length === 0) list.innerHTML = '<div class="history-empty">В избранном пока ничего нет</div>';
    else {
        favorites.forEach(item => {
            const row = document.createElement('div');
            row.className = 'history-row';
            row.innerHTML = '<div class="history-info"><div class="history-name">' + item.title + '</div><div class="history-price">' + item.price + '</div></div><div class="history-arrow">→</div>';
            row.onclick = function() { closeFavorites(); const search = item.title.replace(/'/g, "\\'"); const target = document.querySelector('.item[data-title*="' + search + '"]'); if (target) { target.scrollIntoView({ behavior: 'smooth', block: 'center' }); setTimeout(() => target.click(), 400); } };
            list.appendChild(row);
        });
    }
    modal.style.display = 'flex'; modal.classList.add('active');
}
function closeFavorites() { const m = document.getElementById('favoritesModal'); if (m) { m.classList.remove('active'); setTimeout(() => m.style.display = 'none', 300); } }
document.getElementById('favoritesModal').addEventListener('click', function(e) { if (e.target === this) closeFavorites(); });

// ==================== КОРЗИНА ====================
let cart = JSON.parse(localStorage.getItem('laurey_cart') || '[]');

function updateCartBadge() {
    const cartBadge = document.getElementById('cartBadge');
    if (!cartBadge) return;
    let totalCount = cart.reduce((sum, item) => sum + item.qty, 0);
    if (totalCount > 0) { cartBadge.textContent = totalCount; cartBadge.classList.add('active'); }
    else { cartBadge.classList.remove('active'); }
}

function addToCartFromModal() {
    const { title, price } = currentModalProduct;
    const el = document.querySelector('.item[data-title="' + title + '"]');
    const availableSizes = el ? el.getAttribute('data-size') : null;

    let size = '';

    // Если размеры есть в карточке — спрашиваем
    if (availableSizes && availableSizes.trim() !== '') {
        const isShoes = /asics|salomon|new balance/i.test(title);
        const sizePrompt = isShoes
            ? prompt('Выберите размер обуви:\n37, 38, 39, 40, 41, 42, 43, 44, 45')
            : prompt('Выберите размер:\nS, M, L, XL');
        
        if (sizePrompt === null) return; // Если нажали отмену
        size = sizePrompt.trim() || 'не указан';
    } else {
        // Если размеров нет (сумка, кепка), просто ставим пометку
        size = 'Единый размер';
    }

    const existing = cart.findIndex(item => item.title === title && item.size === size);
    if (existing > -1) {
        cart[existing].qty += 1;
    } else {
        cart.push({ title, price, size, qty: 1 });
    }

    localStorage.setItem('laurey_cart', JSON.stringify(cart));
    updateCartBadge();
    
    if (size === 'Единый размер') {
        alert('Добавлено в корзину: ' + title);
    } else {
        alert('Добавлено в корзину: ' + title + ' (размер ' + size + ')');
    }
}

function openCart() {
    const modal = document.getElementById('cartModal');
    const list = document.getElementById('cartList');
    const totalEl = document.getElementById('cartTotal');
    if (!modal || !list) return;
    list.innerHTML = '';
    let total = 0;
    if (cart.length === 0) {
        list.innerHTML = '<div class="history-empty">Корзина пуста</div>';
        if (totalEl) totalEl.innerText = '';
    } else {
        cart.forEach((item, index) => {
            const priceNum = parseInt(item.price.replace(/[^\d]/g, '')) || 0;
            total += priceNum * item.qty;
            const row = document.createElement('div');
            row.className = 'cart-row';
            row.innerHTML = 
                '<div class="cart-info">' +
                    '<div class="cart-name">' + item.title + '</div>' +
                    '<div class="cart-meta">Размер: ' + item.size + '</div>' +
                    '<div class="cart-price">' + item.price + '</div>' +
                '</div>' +
                '<div class="cart-controls">' +
                    '<button class="cart-btn-qty" onclick="changeQty(' + index + ', -1)">−</button>' +
                    '<span class="cart-qty-val">' + item.qty + '</span>' +
                    '<button class="cart-btn-qty" onclick="changeQty(' + index + ', 1)">+</button>' +
                    '<button class="cart-remove" onclick="removeFromCart(' + index + ')" style="margin-left: 10px;">✕</button>' +
                '</div>';
            list.appendChild(row);
        });
        if (totalEl) totalEl.innerText= 'Итого: ~' + total.toLocaleString() + ' ₽';
    }
    modal.style.display = 'flex'; modal.classList.add('active');
}

function changeQty(index, delta) {
    cart[index].qty += delta;
    if (cart[index].qty < 1) cart[index].qty = 1;
    localStorage.setItem('laurey_cart', JSON.stringify(cart));
    updateCartBadge(); openCart();
}

function removeFromCart(index) {
    cart.splice(index, 1);
    localStorage.setItem('laurey_cart', JSON.stringify(cart));
    updateCartBadge(); openCart();
}

function closeCart() { const m = document.getElementById('cartModal'); if (m) { m.classList.remove('active'); setTimeout(() => m.style.display = 'none', 300); } }
document.getElementById('cartModal').addEventListener('click', function(e) { if (e.target === this) closeCart(); });

function orderDirectFromCard() { const { title, price } = currentModalProduct; if (!title) return; orderDirect(title, price); }

function orderDirect(title, price) {
    const el = document.querySelector('.item[data-title="' + title + '"]');
    const availableSizes = el ? el.getAttribute('data-size') : null;

    let size = '';

    // Если размеры есть — спрашиваем
    if (availableSizes && availableSizes.trim() !== '') {
        const isShoes = /asics|salomon|new balance/i.test(title);
        const sizePrompt = isShoes
            ? prompt('Выберите размер обуви:\n37, 38, 39, 40, 41, 42, 43, 44, 45')
            : prompt('Выберите размер:\nS, M, L, XL');
        
        if (sizePrompt === null) return;
        size = sizePrompt.trim() || 'не указан';
    } else {
        size = 'Единый размер';
    }

    const message = 'Новый заказ!\n\nТовар: ' + title + '\nЦена: ' + price + '\nРазмер: ' + size;
    const choice = prompt('Куда отправить заказ?\n\nНапиши: telegram или avito\nИли нажми Отмена, чтобы закрыть', 'telegram');

    if (choice === null) return;
    const answer = choice.toLowerCase().trim();

    if (answer === 'telegram' || answer === 'тг' || answer === 'tg') {
        window.open('https://t.me/' + YOUR_TELEGRAM + '?text=' + encodeURIComponent(message), '_blank');
    } else if (answer === 'avito' || answer === 'авито' || answer === 'av') {
        navigator.clipboard.writeText(message).then(function() {
            alert('Текст заказа скопирован. Вставь в чат на Авито.');
            window.open('https://www.avito.ru/', '_blank');
        }).catch(function() {
            alert('Текст заказа:\n\n' + message);
        });
    }
}

function sendCartOrder() {
    if (cart.length === 0) { alert('Корзина пуста'); return; }
    let message = 'Новый заказ!\n\n';
    let total = 0;
    cart.forEach((item, i) => {
        const priceNum = parseInt(item.price.replace(/[^\d]/g, '')) || 0;
        total += priceNum * item.qty;
        message += (i + 1) + '. ' + item.title + '\n   Размер: ' + item.size + ' · Кол-во: ' + item.qty + '\n   Цена: ' + item.price + '\n\n';
    });
    message += 'ИТОГО: ~' + total.toLocaleString() + ' ₽';
    const choice = prompt('Куда отправить заказ?\n\nНапиши: telegram или avito', 'telegram');
    if (choice === null) return;
    const answer = choice.toLowerCase().trim();
    if (answer === 'telegram' || answer === 'тг' || answer === 'tg') {
        window.open('https://t.me/' + YOUR_TELEGRAM + '?text=' + encodeURIComponent(message), '_blank');
    } else if (answer === 'avito' || answer === 'авито' || answer === 'av') {
        navigator.clipboard.writeText(message).then(function() { alert('Текст скопирован. Вставь в чат на Авито.'); window.open('https://www.avito.ru/', '_blank'); }).catch(function() { alert('Текст заказа:\n\n' + message); });
    }
}

function shareProduct() {
    const url = window.location.href; const { title, price } = currentModalProduct;
    const text = title + ' — ' + price + '\n\n' + url;
    if (navigator.share) navigator.share({ title, text, url }).catch(() => {});
    else if (navigator.clipboard) navigator.clipboard.writeText(text).then(function() { alert('Ссылка скопирована!'); });
}

let viewHistory = JSON.parse(localStorage.getItem('laurey_history') || '[]');
function addToHistory(title, price) {
    viewHistory = viewHistory.filter(item => item.title !== title);
    viewHistory.unshift({ title, price });
    if (viewHistory.length > 10) viewHistory.pop();
    localStorage.setItem('laurey_history', JSON.stringify(viewHistory));
}
function openHistory() {
    const modal = document.getElementById('historyModal'); const list = document.getElementById('historyList');
    if (!modal || !list) return;
    list.innerHTML = '';
    if (viewHistory.length === 0) list.innerHTML = '<div class="history-empty">Вы пока ничего не смотрели</div>';
    else {
        viewHistory.forEach(item => {
            const row = document.createElement('div'); row.className = 'history-row';
            row.innerHTML = '<div class="history-info"><div class="history-name">' + item.title + '</div><div class="history-price">' + item.price + '</div></div><div class="history-arrow">→</div>';
            row.onclick = function() { closeHistory(); const search = item.title.replace(/'/g, "\\'"); const target = document.querySelector('.item[data-title*="' + search + '"]'); if (target) { target.scrollIntoView({ behavior: 'smooth', block: 'center' }); setTimeout(() => target.click(), 400); } };
            list.appendChild(row);
        });
    }
    modal.style.display = 'flex'; modal.classList.add('active');
}
function closeHistory() { const m = document.getElementById('historyModal'); m.classList.remove('active'); setTimeout(() => m.style.display = 'none', 300); }
function clearHistory() { viewHistory = []; localStorage.setItem('laurey_history', '[]'); openHistory(); }
document.getElementById('historyModal').addEventListener('click', function(e) { if (e.target === this) closeHistory(); });

let viewsData = JSON.parse(localStorage.getItem('laurey_views') || '{}');
function countView(productId) {
    if (!productId) return; viewsData[productId] = (viewsData[productId] || 0) + 1;
    localStorage.setItem('laurey_views', JSON.stringify(viewsData));
    const el = document.getElementById('views-' + productId); if (el) el.textContent = 'Просмотров: ' + viewsData[productId];
}
function loadAllViewCounters() { Object.keys(viewsData).forEach(id => { const el = document.getElementById('views-' + id); if (el) el.textContent = 'Просмотров: ' + viewsData[id]; }); }

const scrollBtn = document.getElementById('scrollToTopBtn');
window.addEventListener('scroll', function() { if (scrollBtn) scrollBtn.classList.toggle('show', window.scrollY > 400); });
function scrollToTop() { window.scrollTo({ top: 0, behavior: 'smooth' }); }

switchSizeType('shoes');
updateBadges();
updateCartBadge();
updateAllFavButtons();
loadAllViewCounters();