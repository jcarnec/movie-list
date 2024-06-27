<script>
  import { onMount } from "svelte";
  import { writable } from "svelte/store";

  class Movie {
    constructor(data) {
      this.id = data.id;
      this.title = data.title;
      this.originalTitle = data.original_title;
      this.overview = data.overview;
      this.releaseDate = new Date(data.release_date);
      this.runtime = data.runtime;
      this.voteAverage = data.vote_average;
      this.voteCount = data.vote_count;
      this.popularity = data.popularity;
      this.posterPath = data.poster_path;
      this.backdropPath = data.backdrop_path;
      this.adult = data.adult === "true";
      this.homepage = data.homepage;
      this.imdbId = data.imdb_id;
      this.originalLanguage = data.original_language;
      this.status = data.status;
      this.tagline = data.tagline;
      this.budget = data.budget;
      this.revenue = data.revenue;
      this.belongsToCollection = data.belongs_to_collection;
      this.genres = data.genres.map((genre) => genre.name);
      this.spokenLanguages = data.spoken_languages.map(
        (lang) => lang.english_name
      );
      this.productionCountries = data.production_countries.map(
        (country) => country.name
      );
      this.productionCompanies = data.production_companies.map(
        (company) => company.name
      );
      this.reviews = data.reviews;
      this.videos = data.videos;
      this.similar = data.similar;
      this.images = data.images;
      this.keywords = data.keywords.map(keyword => keyword.name);
    }

    getFormattedReleaseDate() {
      return this.releaseDate.toLocaleDateString();
    }

    getReleaseYear() {
      return this.releaseDate.getFullYear();
    }

    getPosterUrl() {
      return `https://image.tmdb.org/t/p/w500${this.posterPath}`;
    }

    getBackdropUrl() {
      return `https://image.tmdb.org/t/p/w1280${this.backdropPath}`;
    }
  }

  let movies = [];
  let selectedMovie = writable(null);

  onMount(async () => {
    const res = await fetch("http://localhost:3000/movies");
    let movie_response = await res.json();
    movies = movie_response.map((movie) => new Movie(movie));
  });

  function getMaxVoteAverage() {
    return Math.max(...movies.map((movie) => movie.voteAverage));
  }

  function getMaxPopularity() {
    return Math.max(...movies.map((movie) => movie.popularity));
  }

  function getColor(popularity) {
    const maxPopularity = getMaxPopularity();
    const ratio = popularity / maxPopularity;

    const red = Math.floor(255 * ratio);
    const green = 0;
    const blue = Math.floor(255 * (1 - ratio));

    return `rgb(${red}, ${green}, ${blue})`;
  }

  function handleBarClick(movie) {
    console.log(movie);
    selectedMovie.set(movie);
  }
</script>

<main>
  <h1>Movie List</h1>
  <div class="container">
    <div class="list">
      <div class="timeline">
        <!-- timeline goes here  -->
        {#if movies.length > 0}
          <svg width="100px" height="{movies.length * 40}">
            {#each movies as movie, index}
              {#if movies[index - 1]?.getReleaseYear() !== movie.getReleaseYear()} 
                <g transform="translate(0, {(index) * 100})">
                  <rect
                    x="0"
                    y="10"
                    width="100%" 
                    height="20"
                    fill="red"
                    cursor="pointer"
                  />
                  <text x="5" y="25" fill="black">{movie.getReleaseYear()}</text>
                </g>
              {/if}
            {/each}
          </svg>
        {:else}
          <p>Loading...</p>
        {/if}

      </div>
      <div class="timeline">
        <!-- timeline goes here  -->
        {#if movies.length > 0}
          <svg width="80px" height="{movies.length * 100}">
            {#each movies as movie, index}
              <g transform="translate(0, {(index) * 100})">
                <!-- 20px width for every hour of runtime -->
                <rect
                  x="0"
                  y="10"
                  width="{movie.runtime / 60 * 20}"
                  height="20"
                  fill="red"
                  cursor="pointer"
                />
                <text x="5" y="25" fill="black">{Math.floor(movie.runtime / 60)}:{movie.runtime - Math.floor(movie.runtime / 60) * 60} </text>
                <!-- circle with the area representing the budget no fill red ooutline-->
                <circle
                  cx="0"
                  cy="20"
                  r="{Math.sqrt(movie.budget / 1000000) * 2}"
                  fill="none"
                  stroke="red"
                />
                <circle
                  cx="0"
                  cy="20"
                  r="{Math.sqrt(movie.revenue / 1000000) * 2}"
                  fill="none"
                  stroke="green"
                />
              </g>
            {/each}
          </svg>
        {:else}
          <p>Loading...</p>
        {/if}

      </div>
      <div class="movie-list">
        {#if movies.length > 0}
          <svg width="100%" height="{movies.length * 100}">
            {#each movies as movie, index}
              <g transform="translate(0, {(index) * 100})" on:click={() => handleBarClick(movie)}>
                <rect
                  x="0"
                  y="10"
                  width="{(movie.voteAverage / getMaxVoteAverage()) * 100}%" 
                  height="80"
                  fill="{getColor(movie.popularity)}"
                  cursor="pointer"
                />
                <text x="30" y="25" fill="white" font-size="16" >{movie.title}"</text>
                {#if movie.originalLanguage !== "en"}
                  <text x="5" y="50" fill="white" font-size="32" font-weight="bold">{movie.originalLanguage} </text>
                  <text x="30" y="50" fill="white" font-size="16" >{movie.originalTitle}</text>
                {/if}
              </g>
            {/each}
          </svg>
        {:else}
          <p>Loading...</p>
        {/if}
      </div>
    </div>
    <div class="movie-details">
      {#if $selectedMovie}
        <div>
          <img src="{$selectedMovie.getPosterUrl()}" alt="{$selectedMovie.title}" />
          <h2>{$selectedMovie.title}</h2>
          <p><strong>Description:</strong> {$selectedMovie.overview}</p>
          <p><strong>Genre:</strong> {$selectedMovie.genres.join(', ')}</p>
          <p><strong>Keywords:</strong> {$selectedMovie.keywords.join(', ')}</p>
          <p><strong>Release Date:</strong> {$selectedMovie.getFormattedReleaseDate()}</p>
        </div>
      {/if}
    </div>
  </div>
</main>

<style>
  .container {
    display: flex;
    height: 100vh;
  }

  .list {
    flex: 4;
    display: flex;
    padding-right: 20px;
    overflow-y: auto;
  }

  .timeline {
    padding-right: 20px;
  }

  .movie-list {
    flex: 1;
    padding-right: 20px;
  }

  .movie-details {
    flex: 1;
    padding: 20px;
    background: #f4f4f4;
    border-left: 1px solid #ddd;
    overflow-y: auto;
    top: 0;
    right: 0;
    height: 100%;
  }

  svg {
    font-family: Arial, sans-serif;
  }

  text {
    font-size: 14px;
  }

  img {
    max-width: 100%;
    border: 2px solid #333;
    border-radius: 5px;
  }

  .movie-details h2 {
    margin-top: 10px;
  }
</style>
