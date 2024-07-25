<script>
  import { onMount, tick } from "svelte";
  import { writable } from "svelte/store";
  import axios from "axios";

  let width = 100; // Default width
  let scrollY = writable(0); // Scroll position
  let containerHeight = 0; // Height of the scroll container

  const itemHeight = 100; // Height of each movie item
  const viewportHeight = 1000; // Adjust based on your viewport

  let movieColumn;

  let selectedLanguage = writable("all");

  let selectedGenres = writable([]);

  let year = writable("");

  let minReviewCount = writable(10);
  let maxReviewCount = writable(100);

  let minYear = writable(10);
  let maxYear = writable(100);

  $: $year =
    movies.length > 0 && getFirstVisibleIndex($scrollY) < movies.length
      ? movies[getFirstVisibleIndex($scrollY)].getReleaseYear().toString()
      : "";

  $: queryDatabase($selectedLanguage, $selectedGenres, $minReviewCount, $maxReviewCount, $minYear, $maxYear);

  async function queryDatabase() {
    // re-query the database based on the selected language
    let url = "http://localhost:3000/movies";
    // selected language in the body of the request

    let body = { original_language: $selectedLanguage, genres: $selectedGenres, minReviewCount: parseInt($minReviewCount), maxReviewCount: parseInt($maxReviewCount), minYear: parseInt($minYear), maxYear: parseInt($maxYear)};

    let res = await axios({
      method: "post",
      url: url,
      data: body, // Non-standard, ensure the server supports it
      headers: {
        "Content-Type": "application/json",
      },
    });

    let movie_response = res.data;

    movies = movie_response.map((movie) => new Movie(movie));
    getPopularityIndex(movies);
    containerHeight = movies.length * itemHeight; // Set container height based on the number of movies
  }

  function openYoutubeSearchUrl(title, year) {
    console.log("opening_window");
    window.open(
      `https://www.youtube.com/results?search_query=${title} (${year}) trailer`
    );
  }

  function getPopularityIndex(movies) {
    // create a new field in the movie object called popularity_index which is the rank of the movie based on popularity

    movies.sort((a, b) => b.popularity - a.popularity);

    movies.forEach((movie, index) => {
      movie.popularity_index = index + 1;
    });

    movies.sort((a, b) => a.releaseDate - b.releaseDate);
  }

  // Function to update width
  function updateWidth() {
    // width = window.innerWidth;
    // get width of movie-column div
    width = document.querySelector(".movie-bar").clientWidth;
  }

  function generateHourString(time) {
    let hours = Math.floor(time / 60);
    let minutes = time % 60;
    return `${hours}:${minutes}`;
  }

  // Function to handle scroll event
  function handleScroll(event) {
    // check that movie list div is not at cursor position

    let movie_list_div = document.querySelector(".movie-list");
    let cursor_position_x = event.clientX;
    let cursor_position_y = event.clientY;
    let rect = movie_list_div.getBoundingClientRect();

    if (!(cursor_position_y > rect.top && cursor_position_y < rect.bottom)) {
      return;
    } else if (
      !(cursor_position_x > rect.left && cursor_position_x < rect.right)
    ) {
      return;
    }

    const delta = event.deltaY || event.touches[0].clientY - startY;
    scrollY.update((n) =>
      Math.max(0, Math.min(containerHeight - viewportHeight, n + delta))
    );

    startY = event.touches ? event.touches[0].clientY : startY;

    $year =
      movies.length > 0 && getFirstVisibleIndex($scrollY) < movies.length
        ? movies[getFirstVisibleIndex($scrollY)].getReleaseYear().toString()
        : "";

    event.preventDefault();
  }

  let startY = 0;
  function handleTouchStart(event) {
    startY = event.touches[0].clientY;
  }

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

  $: console.log($selectedMovie)

  onMount(async () => {
    // axios
    await queryDatabase();

    await tick(); // Wait for the DOM to update

    if (movieColumn) {
      updateWidth();
    }

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

  function getMaxVoteAverage() {
    return Math.max(...movies.map((movie) => movie.voteAverage));
  }

  function getMaxPopularity() {
    return Math.max(...movies.map((movie) => movie.popularity));
  }

  function getColor(popularity_index) {
    const ratio = popularity_index / movies.length;

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
        <!-- <div class="title">
          <h1>Movie List</h1>
        </div> -->
        <div class="form">
          <div class="year-input">
            <!-- have a text box that shows the year of the first visible movie -->
            {#if movies.length > 0 && getFirstVisibleIndex($scrollY) < movies.length && movies[getFirstVisibleIndex($scrollY)]}
              <!-- {console.log(movies[getFirstVisibleIndex($scrollY)])} -->

              <label for="year">Year:</label>
              <textarea bind:value={$year} on:change={(e) => scrollToYear(e)}
              ></textarea>
            {/if}
          </div>
          <div class="min-max">
            <div class="minReviewCount-input">
                <label for="minReviewCount">Min number of reviews:</label>
                <textarea bind:value={$minReviewCount}></textarea>
            </div>
            <div class="maxReviewCount-input">
                <label for="maxReviewCount">Max number of reviews:</label>
                <textarea bind:value={$maxReviewCount}></textarea>
            </div>
          </div>
          <div class="min-max">
            <div class="minYear-input">
                <label for="minYear">Min release year:</label>
                <textarea bind:value={$minYear}></textarea>
            </div>
            <div class="maxYear-input">
                <label for="maxYear">Max release year:</label>
                <textarea bind:value={$maxYear}></textarea>
            </div>
          </div>
          <div class="language-input">
            <!-- select which of the available languages to filter by (e.g. English, French, Spanish, German, Japanese, Italian) using a drop down -->
            <label for="language">Language:</label>
            <select bind:value={$selectedLanguage}>
              <option value="en">English</option>
              <option value="fr">French</option>
              <option value="es">Spanish</option>
              <option value="de">German</option>
              <option value="ja">Japanese</option>
              <option value="it">Italian</option>
              <option value="all">All</option>
            </select>
          </div>
          </div>

          <div class="genre-menu">
            <!-- checkbox for each genre -->
            <label for="genre">Genre:</label>
            <div class="genre-selection">
              {#each Object.keys(genre_emoji_dict) as genre, index}
              <div style="display: flex;">
                <div style="padding-right: 10px" >
                <input
                  type="checkbox"
                  id={genre}
                  name={genre}
                  value={genre}
                  on:change={(e) => 
                    {
                      if (e.target.checked) {
                        selectedGenres.update((genres) => [...genres, genre]);
                      } else {
                        selectedGenres.update((genres) =>
                          genres.filter((g) => g !== genre)
                        );
                      }
                  }
                }
                />
                </div>
                <label style="display:inline" for={genre}
                  >{genre_emoji_dict[genre] + ' ' + genre}</label >
              </div>
              {/each}
            </div>

        </div>
      </div>
      <div class="body">
        <div class="movie-list">
          {#if movies.length > 0}
            <div class="movie-column" bind:this={movieColumn}>
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
                        x="0"
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
              <div class="movie-bar">
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
                        width={width * (movie.voteAverage / 10)}
                      >
                        <div style="display: flex; height: 100%">
                          <div
                            style="background-color: {getColor(
                              movie.popularity_index
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
              <div class="genre-column">
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
              <div class="year-column">
                <svg width="100%" height={containerHeight}>
                  {#each getVisibleMovies($scrollY, viewportHeight) as movie, index}
                    <g
                      transform="translate(0, {index * itemHeight -
                        ($scrollY % itemHeight)})"
                      on:click={() => handleBarClick(movie)}
                    >
                      <!-- display the release year of the movie -->

                      {#if getVisibleMovies($scrollY, viewportHeight)[index - 1] && getVisibleMovies($scrollY, viewportHeight)[index - 1].getReleaseYear() !== movie.getReleaseYear()}
                        <text x="10" y="50" font-size="12"
                          >{movie.getReleaseYear()}</text
                        >
                      {/if}
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
              <h2
                class="link"
                on:click={(e) =>
                  openYoutubeSearchUrl(
                    $selectedMovie.title,
                    $selectedMovie.getReleaseYear()
                  )}
              >
                {$selectedMovie.title}
              </h2>

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
  }

  .title {
    flex: 1;
  }

  .form {
  }

  .body {
    display: flex;
    height: 100vh;
    flex-direction: row;
  }

  .movie-column {
    display: flex;
    flex-direction: row;
  }

  .movie-bar {
    flex: 10;
  }

  .genre-column {
    flex: 5;
  }

  .year-column {
    flex: 1;
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

  .genre-selection {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 30px 10px;
  }

  .genre-menu {
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

  .link {
    cursor: pointer;
    color: blue;
    /* underline on hover */
    text-decoration: underline;
  }

  .year-input {
  }

  .language-input {
  }

  .min-max {
    display: flex;
    flex-direction: row;
  }
</style>
