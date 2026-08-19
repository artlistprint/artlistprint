let selectedCategory = 'all';
let selectedAge = 'all';

function filterItems(type, value, element) {
    const group = element.closest('.filter-group');
    group.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    element.classList.add('active');

    if (type === 'cat') selectedCategory = value;
    if (type === 'age') selectedAge = value;

    if (typeof ym !== 'undefined') ym(111499772, 'reachGoal', 'use_filter');
    applyFilters();
}

function applyFilters() {
    const searchQuery = document.getElementById('search-input').value.toLowerCase().trim();
    const cards = document.querySelectorAll('.card');

    cards.forEach(card => {
        const cat = card.getAttribute('data-category');
        const age = card.getAttribute('data-age');
        const tags = (card.getAttribute('data-tags') || '').toLowerCase();
        const title = card.querySelector('.card-title').innerText.toLowerCase();

        const matchCategory = (selectedCategory === 'all' || cat === selectedCategory);
        const matchAge = (selectedAge === 'all' || age === selectedAge);
        const matchSearch = searchQuery === '' || (title + ' ' + tags).includes(searchQuery);

        if (matchCategory && matchAge && matchSearch) {
            card.style.display = 'flex';
        } else {
            card.style.display = 'none';
        }
    });
}

function openModal(imgSrc) {
    document.getElementById('modal-img').src = imgSrc;
    document.getElementById('image-modal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('image-modal').style.display = 'none';
}

function acceptCookies() {
    localStorage.setItem('cookieAccepted', 'true');
    document.getElementById('cookie-banner').style.display = 'none';
}

document.addEventListener('DOMContentLoaded', function() {
    if (!localStorage.getItem('cookieAccepted')) {
        document.getElementById('cookie-banner').style.display = 'flex';
    }
});