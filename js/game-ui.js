function openGameModal() {
    document.getElementById('game-modal').style.display = 'flex';
    loadGameCatalog('all');
    backToGameSelection();
}

function closeGameModal() {
    document.getElementById('game-modal').style.display = 'none';
}

function switchGameTab(filter, element) {
    document.querySelectorAll('.game-tab-btn').forEach(btn => btn.classList.remove('active'));
    element.classList.add('active');
    loadGameCatalog(filter);
}

function loadGameCatalog(ageFilter = 'all') {
    const grid = document.getElementById('game-grid');
    grid.innerHTML = '';
    
    // Берем раскраски из основного каталога
    const cards = document.querySelectorAll('.card[data-category="kids"], .card[data-category="antistress"]');
    
    cards.forEach(card => {
        const age = card.getAttribute('data-age');
        const isKids = age === '2-5' || age === '6-9';
        
        if (ageFilter === 'kids' && !isKids) return;
        if (ageFilter === 'adult' && age !== 'adult') return;

        const title = card.querySelector('.card-title').innerText;
        const img = card.querySelector('.card-image-wrapper').getAttribute('onclick').match(/'([^']+)'/)[1];
        
        const item = document.createElement('div');
        item.className = 'game-item-card';
        item.onclick = () => startColoring(img, title);
        item.innerHTML = `<img src="${img}" alt="${title}"><p>${title}</p>`;
        grid.appendChild(item);
    });
}

function backToGameSelection() {
    document.getElementById('game-selection-view').style.display = 'block';
    document.getElementById('game-editor-view').style.display = 'none';
    document.getElementById('game-header-title').innerText = '🌼 Онлайн Раскраски';
}

function startColoring(imgSrc, title) {
    document.getElementById('game-selection-view').style.display = 'none';
    document.getElementById('game-editor-view').style.display = 'flex';
    document.getElementById('game-header-title').innerText = '🎨 ' + title;
    initCanvas(imgSrc);
}