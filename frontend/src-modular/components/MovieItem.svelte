<script>
  import {
    selectedMovie,
    scrollY,
    itemHeight,
    selectedLanguage,
    selectedGenres,
  } from "../stores.js";
  import {
    addMovie,
    getMovieViewedType,
    movieIsPresent,
  } from "../historyStore.js";
  import {
    getLanguageColor,
    getLanguageFlag,
    getLanguageName,
    genreEmojiDict,
  } from "../constants.js";
  import { history } from "../historyStore.js";
  import { onMount } from "svelte";

  export let movie;
  export let index;
  export let barColor;
  export let newYear;

  let isHoveringOver = false;

  function handleMouseEnter() {
    isHoveringOver = true;
  }

  function handleMouseLeave() {
    isHoveringOver = false;
  }

  $: isEnglish = movie.originalLanguage === "en";
  $: languageColor = getLanguageColor(movie.originalLanguage);
  $: languageFlag = getLanguageFlag(movie.originalLanguage);
  $: languageName = getLanguageName(movie.originalLanguage);
  $: fontWeightDate = `font-weight: ${newYear ? "700" : "400"}`;
  $: movieViewedType = getMovieViewedType(movie);

  history.subscribe((n) => {
    movieViewedType = getMovieViewedType(movie);
  });

  function handleViewTypeClick() {
    if ($selectedMovie && $selectedMovie.id == movie.id) {
      if (movieViewedType == "viewed") {
        addMovie($selectedMovie, "interested");
      } else if (movieViewedType == "interested") {
        addMovie($selectedMovie, "seen");
      } else if (movieViewedType == "seen") {
        addMovie($selectedMovie, "loved");
      } else if (movieViewedType == "loved") {
        addMovie($selectedMovie, "ignored");
      } else if (movieViewedType == "ignored") {
        addMovie($selectedMovie, "viewed");
      }
    }
  }

  // should not be on first click

  function handleBarClick() {
    if ($selectedMovie && $selectedMovie.id == movie.id) {
      handleViewTypeClick();
    }
    selectedMovie.set(movie);
  }

  const colorDict = {
    viewed: "grey",
    interested: "green",
    seen: "blue",
    loved: "red",
  };

  const emojiDict = {
    viewed: "📑",
    interested: "🧐",
    seen: "📺",
    loved: "🫶",
  };
</script>

<div
  class="movie-item row align-items-center"
  on:click={handleBarClick}
  on:mouseenter={handleMouseEnter}
  on:mouseleave={handleMouseLeave}
  style="transform: translateY({index * $itemHeight -
    ($scrollY %
      $itemHeight)}px); height: {$itemHeight}px; position: absolute; width: 100%;"
>
  <!-- Time Container -->
  <div class="col-1 text-center">
    {movie.generateHourString()}
  </div>

  <!-- Title-Genre Container -->
  <div class="col-4">
    <div class="d-flex flex-column">
      <!-- Original Title -->
      {#if !isEnglish}
        <div class="d-flex align-items-center">
          <span
            class="flag"
            on:click={() => selectedLanguage.set(movie.originalLanguage)}
            >{languageFlag}</span
          >
          {movie.originalTitle}
        </div>
      {:else}
        <div class="d-flex align-items-center">
          <span
            class="flag"
            on:click={() => selectedLanguage.set(movie.originalLanguage)}
            >{languageFlag}</span
          >
        </div>
      {/if}
      <!-- English Title -->
      <div class="d-flex align-items-center" style="font-size: 1.3rem;">
        {movie.title}
      </div>
    </div>
  </div>

  <!-- Emoji Grid Container -->
  <div class="col-1">
    <div class="emoji-list">
      {#each movie.genres as genre}
        <div
          on:click={() => {
            if ($selectedGenres.includes(genre)) {
              selectedGenres.update((genres) =>
                genres.filter((g) => g !== genre)
              );
            } else {
              selectedGenres.update((genres) => [...genres, genre]);
            }
          }}
          class="emoji"
        >
          {genreEmojiDict[genre]}
        </div>
      {/each}
    </div>
  </div>

  <!-- Custom Bar Container -->
  <div class="col-4">
    <div
      class="custom-bar-container"
      style={movieViewedType && movieViewedType != "ignored"
        ? "background-color: #ccc"
        : ""}
    >
      <div
        class="custom-bar"
        style="width: {movie.voteAverage * 10}%; background-color: {barColor};"
      ></div>
    </div>
  </div>

  <!-- Info Container -->
  <div class="info-container col-1 text-center">
    {#if movieViewedType && movieViewedType != "ignored"}
      <div
        class="status-button {movieViewedType}"
      >
        {movieViewedType ? emojiDict[movieViewedType] : ""}
      </div>
    {:else if isHoveringOver}
      <div class="row mb-2" style="font-weight: 800;">
        ⭐ {movie.voteAverage.toFixed(1)}
      </div>
      <div class="row" style="color: {barColor}; font-weight: 800;">
        👥 {movie.popularity.toFixed(0)}
      </div>
    {/if}
  </div>

  <!-- Date Container -->
  <div class="col-1 text-center" style={fontWeightDate}>
    {movie.getReleaseDateString()}
  </div>
</div>

<style>
  .movie-item {
    border-top: 1px solid #ccc;
    overflow: hidden;
    cursor: pointer;
    transition: box-shadow 1s;
    border-radius: 0.5rem;
  }

  .flag {
    margin-right: 0.3rem;
    cursor: pointer;
    transition: transform 0.2s;
  }

  .flag:hover {
    transform: scale(1.7);
    z-index: 1;
  }

  /* Custom Bar Styles */
  .custom-bar-container {
    width: 100%;
    height: 40px;
    background-color: white;
    position: relative;
    overflow: hidden;
    border-radius:1em;
  }

  .custom-bar {
    height: 100%;
    background-color: var(--bar-color, #007bff);
    border-radius: 1rem;
  }

  /* Emoji List Styles */
  .emoji-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(20px, 1fr));
    grid-gap: 5px;
    justify-items: center;
    align-items: center;
  }

  .emoji {
    font-size: 1.2rem;
    cursor: pointer;
    transition: transform 0.2s;
  }

  .emoji:hover {
    transform: scale(1.7);
    z-index: 1;
  }

  .movie-item:hover .info-container {
    opacity: 1;
  }

  .movie-item:hover .custom-bar-container {
    background-color: #ccc;
  }

  .movie-item:hover {
    box-shadow: 0 0 15px rgba(0, 123, 255, 0.5);
  }

  /* Status Button Styles */
  .status-button {
    color: white; /* Always white text */
    border: 1px solid transparent; /* Default border */
    width: 60px; /* Set width */
    height: 50px; /* Set height */
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.5rem;
    border-radius: 0.25rem;
    cursor: pointer;
    box-shadow: none;
  }

  .status-button:hover {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.5); /* Add box shadow on hover */
    border-color: black; /* Add a light grey border on hover */
  }

  /* Specific styles for each movie view state */
  .status-button.viewed {
    background-color: grey;
  }

  .status-button.interested {
    background-color: green;
  }

  .status-button.seen {
    background-color: blue;
  }

  .status-button.loved {
    background-color: red;
  }
</style>
