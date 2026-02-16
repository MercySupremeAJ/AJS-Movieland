// ===== USER CLASS =====
// Manages user accounts, authentication, and movie collections.
// Uses PRIVATE FIELDS (#) for sensitive data like passwords and emails.

class User {
    // Private fields — these CANNOT be accessed from outside the class
    #password;
    #email;

    constructor(name, email, password) {
        this.name = name;
        this.#email = email;
        this.#password = password;
        this.collection = [];            // Array of Movie objects
        this.joinDate = new Date().toISOString();
    }

    // Getter — allows reading the email (but not setting it from outside)
    get email() {
        return this.#email;
    }

    // Validate a password attempt (returns true/false, NEVER exposes the password)
    validatePassword(attempt) {
        return attempt === this.#password;
    }

    // Add a movie to the user's collection
    addMovie(movie) {
        // Check if the movie is already in the collection
        const exists = this.collection.some(m => m.imdbID === movie.imdbID);
        if (exists) {
            return { success: false, message: 'Movie is already in your collection!' };
        }
        this.collection.push(movie);
        this.saveToStorage();
        return { success: true, message: `"${movie.title}" added to your collection!` };
    }

    // Remove a movie from the user's collection
    removeMovie(imdbID) {
        const index = this.collection.findIndex(m => m.imdbID === imdbID);
        if (index === -1) {
            return { success: false, message: 'Movie not found in your collection.' };
        }
        const removed = this.collection.splice(index, 1)[0];
        this.saveToStorage();
        return { success: true, message: `"${removed.title}" removed from collection.` };
    }

    // Get a movie from the collection by IMDB ID
    getMovie(imdbID) {
        return this.collection.find(m => m.imdbID === imdbID) || null;
    }

    // Get user statistics
    getStats() {
        const total = this.collection.length;
        const reviewed = this.collection.filter(m => m.reviews.length > 0).length;
        const genres = {};
        this.collection.forEach(m => {
            genres[m.genre] = (genres[m.genre] || 0) + 1;
        });
        const topGenre = Object.entries(genres).sort((a, b) => b[1] - a[1])[0];

        return {
            totalMovies: total,
            reviewedMovies: reviewed,
            topGenre: topGenre ? topGenre[0] : 'None',
            genres: genres
        };
    }

    // Filter collection by genre
    filterByGenre(genre) {
        if (genre === 'all') return this.collection;
        if (genre === 'Other') {
            return this.collection.filter(m =>
                !['Action', 'Comedy', 'Drama', 'Horror'].includes(m.genre)
            );
        }
        return this.collection.filter(m => m.genre === genre);
    }

    // Save user data to localStorage
    saveToStorage() {
        const userData = this.toJSON();
        const allUsers = JSON.parse(localStorage.getItem('movieLibraryUsers') || '{}');
        allUsers[this.#email] = userData;
        localStorage.setItem('movieLibraryUsers', JSON.stringify(allUsers));
        localStorage.setItem('movieLibraryCurrentUser', this.#email);
    }

    // Convert to plain object (for localStorage — private fields need manual export)
    toJSON() {
        return {
            name: this.name,
            email: this.#email,
            password: this.#password,
            collection: this.collection.map(m => m.toJSON()),
            joinDate: this.joinDate
        };
    }

    // ===== STATIC METHODS (called on the class itself, not on instances) =====

    // Sign up a new user
    static signup(name, email, password) {
        const allUsers = JSON.parse(localStorage.getItem('movieLibraryUsers') || '{}');

        if (allUsers[email]) {
            return { success: false, message: 'An account with this email already exists.' };
        }

        const user = new User(name, email, password);
        user.saveToStorage();
        return { success: true, user: user };
    }

    // Log in an existing user
    static login(email, password) {
        const allUsers = JSON.parse(localStorage.getItem('movieLibraryUsers') || '{}');
        const userData = allUsers[email];

        if (!userData) {
            return { success: false, message: 'No account found with this email.' };
        }

        if (userData.password !== password) {
            return { success: false, message: 'Incorrect password.' };
        }

        const user = User.fromJSON(userData);
        localStorage.setItem('movieLibraryCurrentUser', email);
        return { success: true, user: user };
    }

    // Restore user from saved data
    static fromJSON(data) {
        const user = new User(data.name, data.email, data.password);
        user.joinDate = data.joinDate;
        if (data.collection) {
            user.collection = data.collection.map(m => Movie.fromJSON(m));
        }
        return user;
    }

    // Get the currently logged-in user (if any)
    static getCurrentUser() {
        const email = localStorage.getItem('movieLibraryCurrentUser');
        if (!email) return null;

        const allUsers = JSON.parse(localStorage.getItem('movieLibraryUsers') || '{}');
        const userData = allUsers[email];
        if (!userData) return null;

        return User.fromJSON(userData);
    }

    // Log out the current user
    static logout() {
        localStorage.removeItem('movieLibraryCurrentUser');
    }
}