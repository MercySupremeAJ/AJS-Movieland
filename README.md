# 🍿 AJS Movie Land

A modern, feature-rich movie library web application built with vanilla JavaScript showcasing Object-Oriented Programming principles. Browse trending movies, build your personal collection, rate films, and watch trailers—all with a sleek glassmorphism design.

## Table of contents

- [Overview](#overview)
  - [The Project](#the-project)
  - [Links](#links)
- [Features](#features)
- [My Process](#my-process)
  - [Built With](#built-with)
  - [What I Learned](#what-i-learned)
  - [Code Highlights](#code-highlights)
- [Getting Started](#getting-started)
- [API Reference](#api-reference)
- [Author](#author)

## Overview

### The Project

AJS Movie Land is a personal movie library manager where users can:

- 🎬 **Browse trending movies** loaded automatically from OMDB API
- 🔍 **Search for any movie** by title with real-time results
- 📚 **Build a personal collection** with add/remove functionality
- ⭐ **Rate and review movies** with a 5-star rating system
- 🎭 **Filter by genre** (Action, Comedy, Drama, Horror, Other)
- 🎥 **Watch trailers** via YouTube integration
- 💾 **Persist data** using localStorage (no backend needed)
- 🔐 **User authentication** with sign up/login system


### Links

- Repository: [https://github.com/MercySupremeAJ/AJS-Movieland](https://github.com/MercySupremeAJ/AJS-Movieland)
- Live Demo: [https://ajs-movieland.vercel.app](https://ajs-movieland.vercel.app)

## Features

### 🎨 Modern UI Design
- **Glassmorphism aesthetic** with blurred, semi-transparent surfaces
- **Amber/Gold color palette** (`#f59e0b`) on charcoal black (`#0d0d0d`)
- **Pill-shaped buttons** and smooth micro-animations
- **Responsive layout** that works on all devices
- **Dynamic genre badges** with color-coded categories

### 🧑‍💻 OOP Principles Demonstrated
- **Encapsulation**: Private fields (`#rating`, `#password`, `#email`)
- **Inheritance**: Genre-specific movie subclasses (`ActionMovie`, `ComedyMovie`, etc.)
- **Polymorphism**: Overridden `display()` methods for different genres
- **Factory Pattern**: `createMovie()` function for dynamic object creation
- **Static Methods**: User authentication via `User.login()`, `User.signup()`

### 🎬 Core Functionality
- Auto-loads 20+ trending movies on login (sorted newest first)
- Genre filtering affects both trending and personal collection
- YouTube trailer integration via search links
- Review system with star ratings and text feedback
- Collection statistics: total movies, reviews, favorite genre

## My Process

### Built With

- **Semantic HTML5** markup with data attributes
- **CSS custom properties** (CSS variables) for theming
- **Vanilla JavaScript** (ES6+)
  - Classes and private fields
  - Async/await for API calls
  - Template literals for dynamic HTML
  - LocalStorage API for persistence
- **[OMDB API](https://www.omdbapi.com/)** - Movie database
- **[Google Fonts - Poppins](https://fonts.google.com/specimen/Poppins)** - Typography
- **Modular architecture** - Separate files for classes and logic

### What I Learned

This project deepened my understanding of Object-Oriented JavaScript and modern design patterns:

#### 1. **Private Fields for Encapsulation**
```js
class Movie {
    #userRating; // Private field - can't be accessed outside the class
    
    set rating(value) {
        if (value < 0 || value > 5) throw new Error('Rating must be between 0 and 5');
        this.#userRating = Math.round(value);
    }
}
```

#### 2. **Inheritance and Polymorphism**
```js
class ActionMovie extends Movie {
    getGenreClass() { return 'action-card'; } // Overrides parent method
    getBadgeClass() { return 'action'; }
    getEmoji() { return '🔥'; }
}

// Factory function selects the right subclass
function createMovie(data) {
    const genre = data.Genre.split(',')[0].trim();
    switch (genre) {
        case 'Action': return new ActionMovie(...);
        case 'Comedy': return new ComedyMovie(...);
        // ...
    }
}
```

#### 3. **Static Methods for Utility Functions**
```js
class User {
    static login(email, password) {
        // Access localStorage without creating an instance
        const allUsers = JSON.parse(localStorage.getItem('movieLibraryUsers') || '{}');
        // ...
    }
}

// Usage: User.login('mercy@test.com', 'password')
```

#### 4. **Async/Await with Error Handling**
```js
async function loadTrendingMovies() {
    for (const term of picks) {
        const results = await MovieAPI.search(term);
        if (results.length > 0) {
            allResults = allResults.concat(results.slice(0, 5));
        }
    }
    // Sort newest first
    allResults.sort((a, b) => parseInt(b.Year) - parseInt(a.Year));
}
```

### Code Highlights

**File Structure:**
```
MovieLand/
├── index.html              # Main HTML structure
├── css/
│   └── style.css          # Glassmorphism design system
├── javascript/
│   ├── Review.js          # Review class (encapsulation)
│   ├── Movie.js           # Movie + genre subclasses (inheritance)
│   ├── User.js            # User class with authentication
│   ├── api.js             # OMDB API wrapper
│   └── app.js             # Main application logic
└── README.md
```

**Key Technical Decisions:**
- Used **localStorage** instead of a backend for simplicity and faster load times
- Implemented **genre filtering on both trending and collection** for better UX
- Added **YouTube trailer links** via URL encoding for instant access
- **Sorted movies by year** (newest first) to prioritize recent releases
- Used **inline styling for dynamic elements** to avoid CSS class explosion

## Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/MercySupremeAJ/AJS-Movieland.git
   cd AJS-Movieland
   ```

2. **Open `index.html` in your browser**
   ```bash
   # No build process needed!
   open index.html
   # or just double-click the file
   ```

3. **Sign up for an account**
   - Enter your name, email, and password
   - Your data is stored locally in your browser

4. **Start browsing!**
   - Trending movies load automatically
   - Use the search bar to find specific titles
   - Add movies to your collection and rate them

## API Reference

This project uses the **OMDB API** (Open Movie Database):

- **Base URL**: `https://www.omdbapi.com`
- **API Key**: Included in `javascript/api.js` (free tier)
- **Endpoints used**:
  - `?s={query}` - Search movies by title
  - `?i={imdbID}` - Get full movie details by IMDB ID

## Author

**Mercy Ajoke Supreme**

- GitHub: [@MercySupremeAJ](https://github.com/MercySupremeAJ)

---

*Built with ❤️ as a deep dive into Object-Oriented JavaScript*
