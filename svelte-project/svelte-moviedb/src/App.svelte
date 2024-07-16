<script>
  import { onMount } from "svelte";
  import { writable } from "svelte/store";

  let width = 0; // Default width
  let scrollY = writable(0); // Scroll position
  let containerHeight = 0; // Height of the scroll container

  const itemHeight = 100; // Height of each movie item
  const viewportHeight = 1000; // Adjust based on your viewport

  // Function to update width
  function updateWidth() {
    width = window.innerWidth;
  }

  function generateHourString(time) {
    let hours = Math.floor(time / 60);
    let minutes = time % 60;
    return `${hours}:${minutes}`;
  }

  // Function to handle scroll event
  function handleScroll(event) {
    // todo check if mouse if over the movie-list div
    const delta = event.deltaY || event.touches[0].clientY - startY;
    scrollY.update((n) =>
      Math.max(0, Math.min(containerHeight - viewportHeight, n + delta))
    );
    startY = event.touches ? event.touches[0].clientY : startY;
    event.preventDefault();
  }

  let startY = 0;
  function handleTouchStart(event) {
    startY = event.touches[0].clientY;
  }

  onMount(() => {
    updateWidth(); // Set initial width
    window.addEventListener("resize", updateWidth); // Update on resize
    document.addEventListener("wheel", handleScroll); // Mouse wheel scroll
    document.addEventListener("touchmove", handleScroll); // Touch scroll
    document.addEventListener("touchstart", handleTouchStart); // Touch start

    return () => {
      window.removeEventListener("resize", updateWidth); // Cleanup on component destroy
      document.removeEventListener("wheel", handleScroll);
      document.removeEventListener("touchmove", handleScroll);
      document.removeEventListener("touchstart", handleTouchStart);
    };
  });

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
      this.keywords = data.keywords.map((keyword) => keyword.name);
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
  let genres = {};

  let genre_emoji_dict = {
    Documentary: "📚",
    Adventure: "🧗",
    "Science Fiction": "👽",
    Comedy: "😂",
    Fantasy: "🧙",
    Horror: "👻",
    Drama: "🎭",
    History: "🏰",
    War: "⚔️",
    Romance: "❤️",
    Thriller: "😱",
    Crime: "🔪",
    Action: "💥",
    Mystery: "🕵️‍♂️",
    Music: "🎵",
    Family: "👨‍👩‍👧‍👦",
    Animation: "🎨",
    Western: "🤠",
    "TV Movie": "📺",
  };

  let selectedMovie = writable(null);

  onMount(async () => {
    const res = await fetch("http://localhost:3000/movies");
    let movie_response = await res.json();
    movies = movie_response.map((movie) => new Movie(movie));
    // get full list of genres

    // movies.forEach(movie => {
    //   movie.genres.forEach(genre => {
    //     genres[genre] = true;
    //   })
    // })

    // console.log(genres);

    // {
    //   "Documentary": true,
    //   "Adventure": true,
    //   "Science Fiction": true,
    //   "Comedy": true,
    //   "Fantasy": true,
    //   "Horror": true,
    //   "Drama": true,
    //   "History": true,
    //   "War": true,
    //   "Romance": true,
    //   "Thriller": true,
    //   "Crime": true,
    //   "Action": true,
    //   "Mystery": true,
    //   "Music": true,
    //   "Family": true,
    //   "Animation": true,
    //   "Western": true,
    //   "TV Movie": true
    // }

    containerHeight = movies.length * itemHeight; // Set container height based on the number of movies
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

  function getColorCountry(language) {
    if (language === "en") {
      return "blue";
    } else if (language === "fr") {
      return "red";
    } else if (language === "es") {
      return "yellow";
    } else if (language === "de") {
      return "green";
    } else if (language === "ja") {
      return "purple";
    } else if (language === "it") {
      return "orange";
    } else {
      return "black";
    }
  }

  function handleBarClick(movie) {
    console.log(movie);
    selectedMovie.set(movie);
  }

  function getVisibleMovies(scrollY, viewportHeight) {
    const startIndex = Math.floor(scrollY / itemHeight);
    const endIndex = Math.min(
      movies.length,
      Math.ceil((scrollY + viewportHeight) / itemHeight)
    );
    return movies.slice(startIndex, endIndex);
  }

  function getFirstVisibleIndex(scrollY) {
    return Math.floor(scrollY / itemHeight);
  }

  function scrollToYear(e) {
    console.log(e.target.value);
    const year = e.target.value;
    const index = movies.findIndex(
      (movie) => movie.getReleaseYear() === parseInt(year)
    );
    if (index !== -1) {
      scrollY.update(() => index * itemHeight);
    }
  }
</script>

<main>
  <div class="parent-div">
    <div class="header-body">
      <div class="header">
        <h1>Movie List</h1>
        <!-- have a text box that shows the year of the first visible movie -->
        {#if movies.length > 0 && getFirstVisibleIndex($scrollY) < movies.length && movies[getFirstVisibleIndex($scrollY)]}
          <!-- {console.log(movies[getFirstVisibleIndex($scrollY)])} -->

          <textarea rows="1" cols="10" on:change={(e) => scrollToYear(e)}
            >{movies[getFirstVisibleIndex($scrollY)].getReleaseYear()}</textarea
          >
        {/if}
      </div>
      <div class="body">
        <div class="movie-list">
          {#if movies.length > 0}
            <div class="movie-bar">
              <div style="flex: 1">
                <svg width="100%" height={containerHeight}>
                  {#each getVisibleMovies($scrollY, viewportHeight) as movie, index}
                    <g
                      transform="translate(0, {index * itemHeight -
                        ($scrollY % itemHeight)})"
                      on:click={() => handleBarClick(movie)}
                    >
                      <!-- 20px width for every hour of runtime -->
                      <circle
                        cx="0"
                        cy="50"
                        r={Math.sqrt(movie.budget / 1000000) * 2}
                        fill="none"
                        stroke="red"
                      />
                      <circle
                        cx="0"
                        cy="50"
                        r={Math.sqrt(movie.revenue / 1000000) * 2}
                        fill="none"
                        stroke="green"
                      />

                      <!-- map movie.genre to row of emojis -->

                      <!-- {#each movie.genres as genre, index}
                    <text x={((width * (movie.voteAverage / 10) * 0.75) - ((movie.genres.length * 25) - 10)) + (35 * index)} y="{50}" font-size="20">{genre_emoji_dict[genre]}</text>
                  {/each} -->
                    </g>
                  {/each}
                </svg>
              </div>
              <div style="flex: 1">
                <svg width="100%" height={containerHeight}>
                  {#each getVisibleMovies($scrollY, viewportHeight) as movie, index}
                    <g
                      transform="translate(0, {index * itemHeight -
                        ($scrollY % itemHeight)})"
                      on:click={() => handleBarClick(movie)}
                    >
                      <!-- full length of screen -->
                      <foreignObject
                        x="40"
                        y="0"
                        height="100"
                        width={(10 * movie.runtime) / 60}
                      >
                        <div style="display: flex; height: 100%">
                          <div
                            style="background-color: {getColorCountry(
                              movie.originalLanguage
                            )};"
                            xmlns="http://www.w3.org/1999/xhtml"
                            class="bar-div"
                          ></div>
                        </div>
                      </foreignObject>
                    </g>
                  {/each}
                </svg>
              </div>
              <div style="flex: 10">
                <svg width="100%" height={containerHeight}>
                  {#each getVisibleMovies($scrollY, viewportHeight) as movie, index}
                    <g
                      transform="translate(0, {index * itemHeight -
                        ($scrollY % itemHeight)})"
                      on:click={() => handleBarClick(movie)}
                    >
                      <foreignObject
                        x="0"
                        y="0"
                        height="100"
                        width={width * (movie.voteAverage / 10) * 0.4}
                      >
                        <div style="display: flex; height: 100%">
                          <div
                            style="background-color: {getColor(
                              movie.popularity
                            )};"
                            xmlns="http://www.w3.org/1999/xhtml"
                            class="bar-div"
                          >
                            <p>{movie.title}</p>
                            {#if movie.originalLanguage !== "en"}
                              <p>
                                <span
                                  style="font-weight: bold; font-size: 25px; padding-right: 10px"
                                  >{movie.originalLanguage}</span
                                >{movie.originalTitle}
                              </p>
                            {/if}
                          </div>
                        </div>
                      </foreignObject>
                      <!-- 20px width for every hour of runtime -->
                    </g>
                  {/each}
                </svg>
              </div>
              <div style="flex: 4">
                <svg width="100%" height={containerHeight}>
                  {#each getVisibleMovies($scrollY, viewportHeight) as movie, index}
                    <g
                      transform="translate(0, {index * itemHeight -
                        ($scrollY % itemHeight)})"
                      on:click={() => handleBarClick(movie)}
                    >
                      {#each Object.keys(genre_emoji_dict) as genre, index}
                        {#if movie.genres.includes(genre)}
                          <text x={16 * (index + 1)} y={50} font-size="13"
                            >{genre_emoji_dict[genre]}</text
                          >
                        {:else}
                          <!-- faint emoji with alpha-->
                          <text
                            x={16 * (index + 1)}
                            y={50}
                            font-size="13"
                            fill="gray"
                            opacity="0.2">{genre_emoji_dict[genre]}</text
                          >
                        {/if}
                      {/each}
                    </g>
                  {/each}
                </svg>
              </div>
            </div>
          {:else}
            <p>Loading...</p>
          {/if}
        </div>
        <div class="movie-details">
          {#if $selectedMovie}
            <div>
              <img
                src={$selectedMovie.getPosterUrl()}
                alt={$selectedMovie.title}
              />
              <h2>{$selectedMovie.title}</h2>
              <p><strong>Description:</strong> {$selectedMovie.overview}</p>
              <p><strong>Genre:</strong> {$selectedMovie.genres.join(", ")}</p>
              <p>
                <strong>Keywords:</strong>
                {$selectedMovie.keywords.join(", ")}
              </p>
              <p>
                <strong>Release Date:</strong>
                {$selectedMovie.getFormattedReleaseDate()}
              </p>
              <p>
                <strong>Rating:</strong
                >{` ${$selectedMovie.voteAverage} (${$selectedMovie.voteCount})`}
              </p>
              <p>
                <strong>Popularity:</strong>{` ${$selectedMovie.popularity}`}
              </p>
              <p>
                <strong>Runtime:</strong
                >{` ${generateHourString($selectedMovie.runtime)}`}
              </p>
            </div>
          {/if}
        </div>
      </div>
    </div>
  </div>
</main>

<style>
  .header-body {
    display: flex;
    height: 99vh;
    flex-direction: column;
  }

  .header {
    display: flex;
    flex-direction: row;
  }

  .body {
    display: flex;
    height: 100vh;
    flex-direction: row;
  }

  .movie-bar {
    display: flex;
    flex-direction: row;
  }

  .movie-list {
    padding-right: 20px;
    flex: 3;
  }

  .movie-details {
    padding: 100px;
    background: #f4f4f4;
    border-left: 1px solid #ddd;
    overflow-y: auto;
    flex: 1;
  }

  svg {
    font-family: Arial, sans-serif;
  }

  img {
    max-width: 100%;
    border: 2px solid #333;
    border-radius: 5px;
  }

  .movie-details h2 {
    margin-top: 10px;
  }

  .bar-div {
    width: 100%;
    height: 100%;
    display: block;
    justify-content: left;
    align-items: center;
    padding: 10px;
    border: 1px solid #333;
  }

  .parent-div {
    /* no scroll  */
    overflow: hidden;
  }
</style>
