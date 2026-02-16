const MovieAPI = {
    API_KEY: '9100700c',
    BASE_URL: 'https://www.omdbapi.com',

    // Search for movies by title (returns a list of results)
    async search(query) {
        if (!query.trim()) return [];

        try {
            const url = `${this.BASE_URL}/?apikey=${this.API_KEY}&s=${encodeURIComponent(query)}&type=movie`;
            const response = await fetch(url);
            const data = await response.json();

            if (data.Response === 'False') {
                return [];  // No results found
            }

            // Return basic search results (title, year, poster, imdbID)
            return data.Search || [];

        } catch (error) {
            console.warn('API search failed:', error);
            return [];
        }
    },

    // Get detailed info for ONE movie by its IMDB ID
    async getById(imdbID) {
        try {
            const url = `${this.BASE_URL}/?apikey=${this.API_KEY}&i=${imdbID}&plot=full`;
            const response = await fetch(url);
            const data = await response.json();

            if (data.Response === 'False') {
                return null;
            }

            return data;  // Full movie details (title, year, genre, plot, director, actors, etc.)

        } catch (error) {
            console.warn('API getById failed:', error);
            return null;
        }
    }
};