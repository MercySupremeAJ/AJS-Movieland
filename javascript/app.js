// ===== APPLICATION STATE =====
const state = {
    currentUser: null,       // The logged-in User object
    currentFilter: 'all',   // Current genre filter
    selectedRating: 0,      // Star rating selected in review form
    trendingMovies: []       // Cached trending movie objects
};

// ===== SCREEN MANAGEMENT =====
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    document.getElementById(screenId).classList.remove('hidden');
}

function showModal() {
    document.getElementById('movie-modal').classList.remove('hidden');
}

function hideModal() {
    document.getElementById('movie-modal').classList.add('hidden');
}

// ===== AUTH FUNCTIONS =====
function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const errorEl = document.getElementById('login-error');

    const result = User.login(email, password);

    if (result.success) {
        state.currentUser = result.user;
        errorEl.textContent = '';
        document.getElementById('login-form').reset();
        showDashboard();
    } else {
        errorEl.textContent = result.message;
    }
}

function handleSignup(e) {
    e.preventDefault();
    const name = document.getElementById('signup-name').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;
    const errorEl = document.getElementById('signup-error');

    if (name.length < 2) {
        errorEl.textContent = 'Name must be at least 2 characters.';
        return;
    }

    const result = User.signup(name, email, password);

    if (result.success) {
        state.currentUser = result.user;
        errorEl.textContent = '';
        document.getElementById('signup-form').reset();
        showDashboard();
    } else {
        errorEl.textContent = result.message;
    }
}

function handleLogout() {
    User.logout();
    state.currentUser = null;
    showScreen('auth-screen');
}

// ===== DASHBOARD =====
function showDashboard() {
    showScreen('dashboard-screen');
    document.getElementById('user-greeting').textContent = `Welcome, ${state.currentUser.name}`;
    updateStats();
    renderCollection();
    loadTrendingMovies();
}

// ===== TRENDING MOVIES (auto-loaded on login) =====
async function loadTrendingMovies() {
    const message = document.getElementById('trending-message');
    message.textContent = 'Loading trending movies...';
    document.getElementById('trending-grid').innerHTML = '';

    // Popular recent movie titles — more terms = more variety
    const trendingSearches = [
        'Oppenheimer', 'Barbie', 'Dune', 'Spider-Man', 'John Wick',
        'Avatar', 'Guardians', 'Black Panther', 'Top Gun', 'Batman',
        'Mission Impossible', 'Mario', 'Fast X', 'Aquaman', 'Wonka'
    ];

    // Pick 5 random search terms to get ~20 movies
    const shuffled = [...trendingSearches].sort(() => 0.5 - Math.random());
    const picks = shuffled.slice(0, 5);

    let allResults = [];

    for (const term of picks) {
        const results = await MovieAPI.search(term);
        if (results.length > 0) {
            allResults = allResults.concat(results.slice(0, 5));
        }
    }

    // Remove duplicates by imdbID
    const seen = new Set();
    allResults = allResults.filter(r => {
        if (seen.has(r.imdbID)) return false;
        seen.add(r.imdbID);
        return true;
    });

    // Sort by year (newest first) so recent movies show up top
    allResults.sort((a, b) => parseInt(b.Year) - parseInt(a.Year));

    if (allResults.length === 0) {
        message.textContent = 'Could not load trending movies. Try searching above!';
        return;
    }

    message.textContent = '';
    state.trendingMovies = [];

    // Fetch full details for each movie and store in state
    for (const result of allResults) {
        const details = await MovieAPI.getById(result.imdbID);
        if (!details) continue;
        const movie = createMovie(details);
        state.trendingMovies.push(movie);
    }

    // Render the grid (respects current filter)
    renderTrendingGrid();
}

// Render trending movies — can be called again when filter changes
function renderTrendingGrid() {
    const grid = document.getElementById('trending-grid');
    const message = document.getElementById('trending-message');
    grid.innerHTML = '';

    // Filter trending movies by current genre selection
    let moviesToShow = state.trendingMovies;
    if (state.currentFilter !== 'all') {
        if (state.currentFilter === 'Other') {
            moviesToShow = moviesToShow.filter(m =>
                !['Action', 'Comedy', 'Drama', 'Horror'].includes(m.genre)
            );
        } else {
            moviesToShow = moviesToShow.filter(m => m.genre === state.currentFilter);
        }
    }

    if (moviesToShow.length === 0 && state.trendingMovies.length > 0) {
        message.textContent = `No ${state.currentFilter} movies in trending right now.`;
        return;
    }
    message.textContent = '';

    for (const movie of moviesToShow) {
        const isInCollection = state.currentUser.collection.some(m => m.imdbID === movie.imdbID);

        const cardHTML = `
            <div class="movie-card ${movie.getGenreClass()}">
                <span class="genre-badge ${movie.getBadgeClass()}">${movie.genre}</span>
                ${movie.poster && movie.poster !== 'N/A'
                ? `<img src="${movie.poster}" alt="${movie.title}" class="movie-poster">`
                : `<div class="movie-poster-placeholder">${movie.getEmoji()}</div>`
            }
                <div class="movie-info">
                    <div class="movie-title">${movie.title}</div>
                    <div class="movie-year">${movie.year} · ${movie.director}</div>
                </div>
                <div class="movie-card-actions">
                    ${isInCollection
                ? '<button class="btn btn-small btn-secondary" disabled>✓ In Vault</button>'
                : `<button class="btn btn-small btn-success add-movie-btn" data-imdbid="${movie.imdbID}">+ Add</button>`
            }
                    <button class="btn btn-small btn-primary view-detail-btn" data-imdbid="${movie.imdbID}">Info</button>
                    <a href="https://www.youtube.com/results?search_query=${encodeURIComponent(movie.title + ' ' + movie.year + ' trailer')}" target="_blank" class="btn btn-small" style="background:#f59e0b;color:#0d0d0d;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;">🎬</a>
                </div>
            </div>
        `;
        grid.innerHTML += cardHTML;
    }

    // Attach "Add" button listeners
    grid.querySelectorAll('.add-movie-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const imdbID = btn.dataset.imdbid;
            const details = await MovieAPI.getById(imdbID);
            if (details) {
                const movie = createMovie(details);
                const result = state.currentUser.addMovie(movie);
                if (result.success) {
                    btn.textContent = '✓ Added';
                    btn.disabled = true;
                    btn.className = 'btn btn-small btn-secondary';
                    renderCollection();
                    updateStats();
                }
            }
        });
    });

    // Attach "Info" button listeners
    grid.querySelectorAll('.view-detail-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const imdbID = btn.dataset.imdbid;
            const details = await MovieAPI.getById(imdbID);
            if (details) {
                const movie = createMovie(details);
                showMovieDetail(movie, false);
            }
        });
    });
}

function updateStats() {
    const stats = state.currentUser.getStats();
    document.getElementById('user-stats').innerHTML = `
        <span class="stat-item">📚 ${stats.totalMovies} movies</span>
        <span class="stat-item">⭐ ${stats.reviewedMovies} reviewed</span>
        <span class="stat-item">🎭 Top: ${stats.topGenre}</span>
    `;
}

// ===== SEARCH =====
async function handleSearch() {
    const query = document.getElementById('search-input').value.trim();
    if (!query) return;

    const searchMessage = document.getElementById('search-message');
    const resultsGrid = document.getElementById('search-results-grid');
    const resultsContainer = document.getElementById('search-results');

    searchMessage.textContent = 'Searching...';
    resultsGrid.innerHTML = '';
    resultsContainer.classList.remove('hidden');

    const results = await MovieAPI.search(query);

    if (results.length === 0) {
        searchMessage.textContent = 'No movies found. Try a different title.';
        return;
    }

    searchMessage.textContent = '';

    // For each search result, get full details and display
    for (const result of results) {
        const details = await MovieAPI.getById(result.imdbID);
        if (!details) continue;

        const movie = createMovie(details);
        const isInCollection = state.currentUser.collection.some(m => m.imdbID === movie.imdbID);

        const cardHTML = `
            <div class="movie-card ${movie.getGenreClass()}">
                <span class="genre-badge ${movie.getBadgeClass()}">${movie.genre}</span>
                ${movie.poster && movie.poster !== 'N/A'
                ? `<img src="${movie.poster}" alt="${movie.title}" class="movie-poster">`
                : `<div class="movie-poster-placeholder">${movie.getEmoji()}</div>`
            }
                <div class="movie-info">
                    <div class="movie-title">${movie.title}</div>
                    <div class="movie-year">${movie.year} · ${movie.director}</div>
                </div>
                <div class="movie-card-actions">
                    ${isInCollection
                ? '<button class="btn btn-small btn-secondary" disabled>✓ In Collection</button>'
                : `<button class="btn btn-small btn-success add-movie-btn" data-imdbid="${movie.imdbID}">+ Add</button>`
            }
                    <button class="btn btn-small btn-primary view-detail-btn" data-imdbid="${movie.imdbID}">Info</button>
                    <a href="https://www.youtube.com/results?search_query=${encodeURIComponent(movie.title + ' ' + movie.year + ' trailer')}" target="_blank" class="btn btn-small" style="background:#f59e0b;color:#0d0d0d;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;">🎬</a>
                </div>
            </div>
        `;
        resultsGrid.innerHTML += cardHTML;
    }

    // Attach event listeners to the "Add" buttons
    resultsGrid.querySelectorAll('.add-movie-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const imdbID = btn.dataset.imdbid;
            const details = await MovieAPI.getById(imdbID);
            if (details) {
                const movie = createMovie(details);
                const result = state.currentUser.addMovie(movie);
                if (result.success) {
                    btn.textContent = '✓ Added';
                    btn.disabled = true;
                    btn.className = 'btn btn-small btn-secondary';
                    renderCollection();
                    updateStats();
                }
            }
        });
    });

    // Attach event listeners to the "Info" buttons
    resultsGrid.querySelectorAll('.view-detail-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const imdbID = btn.dataset.imdbid;
            const details = await MovieAPI.getById(imdbID);
            if (details) {
                const movie = createMovie(details);
                showMovieDetail(movie, false);
            }
        });
    });
}

function closeSearch() {
    document.getElementById('search-results').classList.add('hidden');
    document.getElementById('search-input').value = '';
    document.getElementById('search-results-grid').innerHTML = '';
}

// ===== COLLECTION RENDERING =====
function renderCollection() {
    const movies = state.currentUser.filterByGenre(state.currentFilter);
    const grid = document.getElementById('collection-grid');
    const emptyMsg = document.getElementById('empty-collection');
    const count = document.getElementById('collection-count');

    count.textContent = `(${state.currentUser.collection.length} movies)`;

    if (movies.length === 0) {
        grid.innerHTML = '';
        emptyMsg.classList.remove('hidden');
        emptyMsg.textContent = state.currentFilter === 'all'
            ? 'Your collection is empty. Search for movies to add!'
            : `No ${state.currentFilter} movies in your collection.`;
        return;
    }

    emptyMsg.classList.add('hidden');

    // Use each movie's display() method — THIS IS POLYMORPHISM IN ACTION!
    // ActionMovie.display() uses red styling, ComedyMovie.display() uses yellow, etc.
    grid.innerHTML = movies.map(movie => movie.display()).join('');

    // Click on a card → open detail modal
    grid.querySelectorAll('.movie-card').forEach(card => {
        card.addEventListener('click', () => {
            const imdbID = card.dataset.imdbid;
            const movie = state.currentUser.getMovie(imdbID);
            if (movie) showMovieDetail(movie, true);
        });
    });
}

// ===== MOVIE DETAIL MODAL =====
function showMovieDetail(movie, isInCollection) {
    const modalBody = document.getElementById('modal-body');

    const posterHTML = movie.poster && movie.poster !== 'N/A'
        ? `<img src="${movie.poster}" alt="${movie.title}" class="movie-detail-poster">`
        : `<div class="movie-poster-placeholder" style="height:300px">${movie.getEmoji()}</div>`;

    let reviewsHTML = '';
    if (isInCollection) {
        const existingReviews = movie.reviews.map(r => r.display()).join('');

        reviewsHTML = `
            <div class="reviews-section">
                <h3>⭐ Reviews (${movie.reviews.length})</h3>

                <div class="review-form">
                    <h4>Write a Review</h4>
                    <div class="star-input" id="star-input">
                        <span data-value="1">☆</span>
                        <span data-value="2">☆</span>
                        <span data-value="3">☆</span>
                        <span data-value="4">☆</span>
                        <span data-value="5">☆</span>
                    </div>
                    <div class="form-group">
                        <textarea id="review-text" rows="3" placeholder="What did you think of this movie?"></textarea>
                    </div>
                    <button class="btn btn-primary btn-small" id="submit-review-btn" data-imdbid="${movie.imdbID}">Submit Review</button>
                </div>

                <div id="reviews-list">${existingReviews || '<p class="info-message">No reviews yet. Be the first!</p>'}</div>
            </div>
        `;
    }

    const removeBtn = isInCollection
        ? `<button class="btn btn-danger btn-small" id="remove-movie-btn" data-imdbid="${movie.imdbID}">🗑 Remove from Collection</button>`
        : '';

    modalBody.innerHTML = `
        <div class="movie-detail">
            <div>${posterHTML}</div>
            <div class="movie-detail-info">
                <h2>${movie.title} (${movie.year})</h2>
                <div class="movie-detail-meta">
                    <span class="genre-badge ${movie.getBadgeClass()}">${movie.genre}</span>
                    <span>${movie.getStars()}</span>
                </div>
                <p class="movie-detail-plot">${movie.plot}</p>
                <div class="movie-detail-crew">
                    <p><strong>Director:</strong> ${movie.director}</p>
                    <p><strong>Cast:</strong> ${movie.actors}</p>
                </div>
                <div style="margin-top: 1rem;">
                    <a href="https://www.youtube.com/results?search_query=${encodeURIComponent(movie.title + ' ' + movie.year + ' trailer')}" target="_blank" class="btn btn-primary">🎬 Watch Trailer</a>
                </div>
                ${removeBtn}
            </div>
        </div>
        ${reviewsHTML}
    `;

    showModal();
    state.selectedRating = 0;

    // Set up star input interactivity
    const starInput = document.getElementById('star-input');
    if (starInput) {
        starInput.querySelectorAll('span').forEach(star => {
            star.addEventListener('click', () => {
                state.selectedRating = parseInt(star.dataset.value);
                updateStarDisplay();
            });
            star.addEventListener('mouseenter', () => {
                highlightStars(parseInt(star.dataset.value));
            });
        });
        starInput.addEventListener('mouseleave', () => {
            highlightStars(state.selectedRating);
        });
    }

    // Submit review handler
    const submitBtn = document.getElementById('submit-review-btn');
    if (submitBtn) {
        submitBtn.addEventListener('click', () => {
            handleSubmitReview(movie.imdbID);
        });
    }

    // Remove movie handler
    const removeMovieBtn = document.getElementById('remove-movie-btn');
    if (removeMovieBtn) {
        removeMovieBtn.addEventListener('click', () => {
            const result = state.currentUser.removeMovie(movie.imdbID);
            if (result.success) {
                hideModal();
                renderCollection();
                updateStats();
            }
        });
    }
}

// ===== STAR RATING HELPERS =====
function highlightStars(count) {
    const stars = document.querySelectorAll('#star-input span');
    stars.forEach((star, i) => {
        star.textContent = i < count ? '★' : '☆';
        star.classList.toggle('active', i < count);
    });
}

function updateStarDisplay() {
    highlightStars(state.selectedRating);
}

// ===== REVIEW SUBMISSION =====
function handleSubmitReview(imdbID) {
    const text = document.getElementById('review-text').value.trim();

    if (!text) {
        alert('Please write your review before submitting.');
        return;
    }
    if (state.selectedRating === 0) {
        alert('Please select a star rating.');
        return;
    }

    const movie = state.currentUser.getMovie(imdbID);
    if (!movie) return;

    try {
        const review = new Review(imdbID, state.currentUser.name, text, state.selectedRating);
        movie.addReview(review);
        state.currentUser.saveToStorage();

        // Refresh the modal to show the new review
        showMovieDetail(movie, true);
        renderCollection();
        updateStats();
    } catch (error) {
        alert(error.message);
    }
}

// ===== FILTER HANDLING =====
function handleFilter(genre) {
    state.currentFilter = genre;

    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === genre);
    });

    renderCollection();
    // Also filter the trending section
    if (state.trendingMovies.length > 0) {
        renderTrendingGrid();
    }
}

// ===== EVENT LISTENERS (runs once when the page loads) =====
function initApp() {
    // Auth tab switching
    document.getElementById('login-tab').addEventListener('click', () => {
        document.getElementById('login-tab').classList.add('active');
        document.getElementById('signup-tab').classList.remove('active');
        document.getElementById('login-form').classList.remove('hidden');
        document.getElementById('signup-form').classList.add('hidden');
    });

    document.getElementById('signup-tab').addEventListener('click', () => {
        document.getElementById('signup-tab').classList.add('active');
        document.getElementById('login-tab').classList.remove('active');
        document.getElementById('signup-form').classList.remove('hidden');
        document.getElementById('login-form').classList.add('hidden');
    });

    // Auth form submissions
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('signup-form').addEventListener('submit', handleSignup);

    // Logout
    document.getElementById('logout-btn').addEventListener('click', handleLogout);

    // Search
    document.getElementById('search-btn').addEventListener('click', handleSearch);
    document.getElementById('search-input').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleSearch();
    });
    document.getElementById('close-search-btn').addEventListener('click', closeSearch);

    // Genre filters
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => handleFilter(btn.dataset.filter));
    });

    // Modal close
    document.getElementById('modal-close-btn').addEventListener('click', hideModal);
    document.getElementById('modal-overlay').addEventListener('click', hideModal);

    // Check if user is already logged in (session persistence)
    const existingUser = User.getCurrentUser();
    if (existingUser) {
        state.currentUser = existingUser;
        showDashboard();
    }
}

// Start the app
initApp();