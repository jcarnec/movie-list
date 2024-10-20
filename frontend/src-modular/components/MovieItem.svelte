<script>
  import {
    selectedMovie,
    scrollY,
    itemHeight,
    selectedLanguage,
    selectedGenres
  } from "../stores.js";
  import {
    getLanguageColor,
    getLanguageFlag,
    getLanguageName,
    genreEmojiDict
  } from "../constants.js";

  export let movie;
  export let index;
  export let barColor;
  export let newYear;

  function handleBarClick() {
    selectedMovie.set(movie);
  }

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
  $: fontWeightDate = `font-weight: ${newYear ? '700' : '400'}`;
  $: isSelectedMovie = ($selectedMovie && $selectedMovie.id == movie.id);

</script>

<div
  class="movie-item row align-items-center}"
  on:click={handleBarClick}
  on:mouseenter={handleMouseEnter}
  on:mouseleave={handleMouseLeave}
  style="transform: translateY({index * $itemHeight - ($scrollY % $itemHeight)}px); height: {$itemHeight}px; position: absolute; width: 100%;"
>
  <!-- Date Container -->
  <div class="col-1 text-center" style="{fontWeightDate}">
    {movie.getReleaseDateString()}
  </div>

  <!-- Title-Genre Container -->
  <div class="col-4">
    <div class="d-flex flex-column">
      <!-- Original Title -->
      {#if !isEnglish}
        <div class="d-flex align-items-center">
          <span class="flag" on:click={() => selectedLanguage.set(movie.originalLanguage)}>{languageFlag}</span>
          {movie.originalTitle}
        </div>
      {:else}
        <div class="d-flex align-items-center">
          <span class="flag" on:click={() => selectedLanguage.set(movie.originalLanguage)}>{languageFlag}</span>
        </div>
      {/if}
      <!-- English Title -->
      <div class="d-flex align-items-center" style="font-size: 1.5rem;">
        {movie.title}
      </div>
    </div>
  </div>

  <!-- Emoji Grid Container -->
  <div class="col-1">
    <div class="emoji-list">
      {#each movie.genres as genre }
        <div
          on:click={() => {
            if($selectedGenres.includes(genre)) {
              selectedGenres.update(genres => genres.filter(g => g !== genre));
            } else {
              selectedGenres.update(genres => [...genres, genre]);
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
    <div class="custom-bar-container">
      <div
        class="custom-bar"
        style="width: {movie.voteAverage * 10}%; background-color: {barColor};"
      ></div>
    </div>
  </div>

  <!-- Info Container -->
  <div class="info-container col-1 text-center">
    {#if isHoveringOver}
      <div class="row mb-2" style="font-weight: 800; font-size: small">rating: {movie.voteAverage.toFixed(1)}</div>
      <div class="row" style="color: {barColor}; font-weight: 800; font-size: small">popularity: {movie.popularity.toFixed(0)}</div>
    {/if}
  </div>

  <!-- Time Container -->
  <div class="col-1 text-center">
    {movie.generateHourString()}
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
    transition: background-color 1s ease;
    border-radius: 0.5rem;
  }

  .custom-bar {
    height: 100%;
    border-radius: 0.5rem;
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

  .info-container {
    display: block;
    opacity: 0;
    transition: opacity 1s ease;
  }

  .movie-item:hover .info-container {
    display: block;
    opacity: 1;
  }

  .movie-item:hover  {
    box-shadow: 0 0 15px rgba(0, 123, 255, 0.5);
  }


  /* .movie-item:hover  {
    box-shadow: 0 0 15px rgba(0, 123, 255, 0.5);
  } */
</style>
