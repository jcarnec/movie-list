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

  let minYear = writable("");
  let year = writable("");

  let minReviewCount = writable(10);
  let maxReviewCount = writable();

  let queryCount = writable(0);

  let crewId = writable(0);
  let castId = writable(0);

  let selectedPerson = writable(null);
  let selectedPersonName = writable(null);

  let firstVisibleIndex = writable(0);

  let runningQuery = writable(false);

  $: $selectedPersonName = $selectedPerson?.name;

  $: queryDatabase(
    "new",
    null,
    $selectedLanguage,
    $selectedGenres,
    $minReviewCount,
    $maxReviewCount,
    $minYear,
    $crewId,
    $castId
  );

  $: console.log($firstVisibleIndex);

  function setCrew(p) {
    castId.set(0);
    crewId.set(p.id);
    console.log(p.id);
    selectedPerson.set(p);
  }

  function setCast(p) {
    crewId.set(0);
    castId.set(p.id);
    console.log(p.id);
    selectedPerson.set(p);
  }

  async function queryDatabase(append = false, date = null) {
    console.log(append);
    runningQuery.set(true);
    let url = "http://localhost:3000/movies";

    let body = {
      originalLanguage: $selectedLanguage,
      genres: $selectedGenres,
      minReviewCount: parseInt($minReviewCount),
      maxReviewCount: parseInt($maxReviewCount),
      minYear: parseInt($minYear),
      crewId: parseInt($crewId),
      castId: parseInt($castId),
      type: append,
      date: date,
    };

    let res = await axios({
      method: "post",
      url: url,
      data: body,
      headers: {
        "Content-Type": "application/json",
      },
    });

    let movieResponse = res.data;

    let newMovies = movieResponse.map((movie) => new Movie(movie));
    if (append == "append") {
      movies = [...movies, ...newMovies];
    } else if (append == "prepend") {
      movies = [...newMovies, ...movies];
      scrollY.update((n) => n + newMovies.length * itemHeight);
    } else if (append == "new") {
      movies = newMovies;
      scrollY.update((n) => 0);
      $year = movies.length > 0 ? movies[0].getReleaseYear().toString() : "";
      await checkAppendPrepend();
    }
    getPopularityIndexAndColor(movies);
    containerHeight = movies.length * itemHeight;
    queryCount.update((n) => n + 1);
    runningQuery.set(false);
  }

  function openYoutubeSearchUrl(title, year) {
    console.log("opening_window");
    window.open(
      `https://www.youtube.com/results?search_query=${title} (${year}) trailer`
    );
  }

  function getPopularityIndexAndColor(movies) {
    movies.sort((a, b) => b.popularity - a.popularity);

    movies.forEach((movie, index) => {
      movie.popularityIndex = index + 1;
    });

    movies.sort((a, b) => a.releaseDate - b.releaseDate);

    movies.forEach((movie, index) => {
      movie.color = getColor(movie.popularityIndex);
    });
  }

  function updateWidth() {
    width = document.querySelector(".movie-bar").clientWidth;
  }

  function generateHourString(time) {
    let hours = Math.floor(time / 60);
    let minutes = time % 60;
    return `${hours}:${minutes}`;
  }

  async function checkAppendPrepend() {
    if (
      movies.length > 0 &&
      movies.length - $firstVisibleIndex < 15 &&
      !$runningQuery
    ) {
      await queryDatabase(
        "append",
        movies[movies.length - 1].releaseDate,
        $selectedLanguage,
        $selectedGenres,
        $minReviewCount,
        $maxReviewCount,
        $minYear,
        $crewId,
        $castId
      );
    }

    if (
      movies.length > 0 &&
      $firstVisibleIndex == 0 &&
      !$runningQuery &&
      new Date(movies[0].releaseDate) > new Date("12/31/1902")
    ) {
      console.log("hello");
      await queryDatabase(
        "prepend",
        movies[0].releaseDate,
        $selectedLanguage,
        $selectedGenres,
        $minReviewCount,
        $maxReviewCount,
        $minYear,
        $crewId,
        $castId
      );
    }
  }

  async function handleScroll(event) {
    let movieListDiv = document.querySelector(".movie-list");
    let cursorPositionX = event.clientX;
    let cursorPositionY = event.clientY;
    let rect = movieListDiv.getBoundingClientRect();

    if (!(cursorPositionY > rect.top && cursorPositionY < rect.bottom)) {
      return;
    } else if (!(cursorPositionX > rect.left && cursorPositionX < rect.right)) {
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

    await checkAppendPrepend();

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
      this.keywords = data?.keywords[0]?.keywords.map(
        (keyword) => keyword.name
      );
      this.cast = data?.credits?.cast;
      this.topNcast = data?.credits?.cast
        .sort((a, b) => b.popularity - a.popularity)
        .slice(0, 10);

      this.crew = data?.credits?.crew;
      this.topNcrew = data?.credits?.crew
        .sort((a, b) => {
          if (a.job === "Director") {
            return -1;
          } else if (b.job === "Director") {
            return 1;
          }
          return b.popularity - a.popularity;
        })
        .slice(0, 10);
    }

    getFormattedReleaseDate() {
      return this.releaseDate.toLocaleDateString();
    }

    getFormattedMonthYear() {
      return this.releaseDate.toLocaleString("default", {
        month: "numeric",
        year: "numeric",
      });
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

  let genreEmojiDict = {
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

  $: console.log($selectedMovie);

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

  function getColor(popularityIndex) {
    const ratio = popularityIndex / movies.length;

    // get color between blue and gold

    let c1 = [0, 0, 255];
    let c2 = [255, 215, 0];

    let color = [
      Math.floor(c2[0] + ratio * (c1[0] - c2[0])),
      Math.floor(c2[1] + ratio * (c1[1] - c2[1])),
      Math.floor(c2[2] + ratio * (c1[2] - c2[2])),
    ];

    return `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
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

  function getVisibleMovies(queryCount, scrollY, viewportHeight) {
    const startIndex = Math.floor(scrollY / itemHeight);
    const endIndex = Math.min(
      movies.length,
      Math.ceil((scrollY + viewportHeight) / itemHeight)
    );
    return movies.slice(startIndex, endIndex);
  }

  function getFirstVisibleIndex(scrollY) {
    let fvi = Math.floor(scrollY / itemHeight);
    firstVisibleIndex.set(fvi);
    return Math.floor(fvi);
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
              <textarea
                bind:value={$year}
                on:change={(e) => {
                  minYear.set(e.target.value);
                  console.log("in here");
                }}
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
          <div>
            <label for="Person">Person:</label>
            <textarea bind:value={$selectedPersonName}></textarea>
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
            {#each Object.keys(genreEmojiDict) as genre, index}
              <div style="display: flex;">
                <div style="padding-right: 10px">
                  <input
                    type="checkbox"
                    id={genre}
                    name={genre}
                    value={genre}
                    on:change={(e) => {
                      if (e.target.checked) {
                        selectedGenres.update((genres) => [...genres, genre]);
                      } else {
                        selectedGenres.update((genres) =>
                          genres.filter((g) => g !== genre)
                        );
                      }
                    }}
                  />
                </div>
                <label style="display:inline" for={genre}
                  >{genreEmojiDict[genre] + " " + genre}</label
                >
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
                  {#each getVisibleMovies($queryCount, $scrollY, viewportHeight) as movie, index}
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
                    </g>
                  {/each}
                </svg>
              </div>
              <div style="flex: 1">
                <svg width="100%" height={containerHeight}>
                  {#each getVisibleMovies($queryCount, $scrollY, viewportHeight) as movie, index}
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
                  {#each getVisibleMovies($queryCount, $scrollY, viewportHeight) as movie, index}
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
                            style="background-color: {movie.color};"
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
                    </g>
                  {/each}
                </svg>
              </div>
              <div class="genre-column">
                <svg width="100%" height={containerHeight}>
                  {#each getVisibleMovies($queryCount, $scrollY, viewportHeight) as movie, index}
                    <g
                      transform="translate(0, {index * itemHeight -
                        ($scrollY % itemHeight)})"
                      on:click={() => handleBarClick(movie)}
                    >
                      {#each Object.keys(genreEmojiDict) as genre, index}
                        {#if movie.genres.includes(genre)}
                          <text x={16 * (index + 1)} y={50} font-size="13"
                            >{genreEmojiDict[genre]}</text
                          >
                        {:else}
                          <!-- faint emoji with alpha-->
                          <text
                            x={16 * (index + 1)}
                            y={50}
                            font-size="13"
                            fill="gray"
                            opacity="0.2">{genreEmojiDict[genre]}</text
                          >
                        {/if}
                      {/each}
                    </g>
                  {/each}
                </svg>
              </div>
              <div class="year-column">
                <svg width="100%" height={containerHeight}>
                  {#each getVisibleMovies($queryCount, $scrollY, viewportHeight) as movie, index}
                    <g
                      transform="translate(0, {index * itemHeight -
                        ($scrollY % itemHeight)})"
                      on:click={() => handleBarClick(movie)}
                    >
                      <!-- display the release year of the movie -->

                      {#if getVisibleMovies($queryCount, $scrollY, viewportHeight)[index - 1] && getVisibleMovies($queryCount, $scrollY, viewportHeight)[index - 1].getReleaseYear() !== movie.getReleaseYear()}
                        <text x="10" y="50" font-size="18" font-style="bold"
                          >{movie.getFormattedMonthYear()}</text
                        >
                      {:else}
                        <text x="10" y="50" font-size="10"
                          >{movie.getFormattedMonthYear()}</text
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
              {#if $selectedMovie.originalLanguage !== "en"}
                <h4
                  class="link"
                  on:click={(e) =>
                    openYoutubeSearchUrl(
                      $selectedMovie.originalTitle,
                      $selectedMovie.getReleaseYear()
                    )}
                >
                  {$selectedMovie.originalTitle}
                </h4>
              {/if}
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
              <p>
                <strong>Cast:</strong>
                {#each $selectedMovie.topNcast as cast}
                  <p class="blue-text" on:click={() => setCast(cast)}>
                    {cast.name} as {cast.character}
                  </p>
                {/each}
              </p>
              <p>
                <strong>Crew:</strong>
                {#each $selectedMovie.topNcrew as crew}
                  <p class="blue-text" on:click={() => setCrew(crew)}>
                    {crew.name}: {crew.job}
                  </p>
                {/each}
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
    height: 100vh; /* Ensure it takes the full viewport height */
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
    flex: 1; /* Allow the body to grow and fill available space */
    flex-direction: row;
    overflow: hidden; /* Prevent overflow from disrupting layout */
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
    padding: 20px;
    background: #f4f4f4;
    border-left: 1px solid #ddd;
    overflow-y: auto; /* Allow scrolling for movie details */
    flex: 1;
    max-height: 100%; /* Ensure it respects parent height */
    box-sizing: border-box; /* Include padding and borders in height calculations */
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
    overflow: hidden;
    height: 100vh; /* Ensure parent div takes full height */
  }

  .link {
    cursor: pointer;
    color: blue;
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

  .blue-text {
    color: blue;
    text-decoration: underline;
  }

  body {
    font-family: "Arial", "Helvetica", sans-serif;
  }
</style>
