<script>
  import {
    selectedMovie,
    scrollY,
    itemHeight,
    selectedGenres,
    queryCount,
    selectedLanguage,
  } from "../stores.js";
  import EmojiList from "./EmojiList.svelte";
  import {
    getLanguageColor,
    getLanguageFlag,
    getLanguageName,
  } from "../constants.js";

  export let movie;
  export let index;
  export let barColor;
  export let newYear;

  function handleBarClick() {
    selectedMovie.set(movie);
  }

  $: isEnglish = movie.originalLanguage === "en";
  $: languageColour = getLanguageColor(movie.originalLanguage);
  $: languageFlag = getLanguageFlag(movie.originalLanguage);
  $: languageName = getLanguageName(movie.originalLanguage);
  $: fontWeightDate = `font-weight: ${newYear ? '700' : '400'}`


</script>

<div on:click={handleBarClick}>
  <div
    class="movie-item"
    style="transform: translateY({index * $itemHeight -
      ($scrollY % $itemHeight)}px); height: {$itemHeight}px"
  >
    <div class="border bc-parent">
      <div class="date-container">
        <div class="date" style="{fontWeightDate}">{movie.getReleaseDateString()}</div>
      </div>
      <div class="title-genre-container">
        <div class="title-container">
          {#if movie.originalLanguage != "en"}
            <div class="original-title">
              <div class="flag" on:click={() => {selectedLanguage.set(movie.originalLanguage)}}>{languageFlag}</div> {movie.originalTitle}
            </div>
          {:else}
            <div class="original-title">
              <div class="flag" on:click={() => {selectedLanguage.set(movie.originalLanguage)}}>{languageFlag}</div>
            </div>
          {/if}
          <div class="english-title">
            {#if isEnglish}
              {movie.title}
            {:else}
              {movie.title}
            {/if}
          </div>
        </div>
        <!-- <EmojiList {movie}></EmojiList> -->
      </div>
      <div class="bar-container">
        <div
          class="movie-bar"
          style="width: {movie.voteAverage * 10}%; background-color: {barColor}"
        ></div>
      </div>
      <div class="time-container">
        <div class="time">{movie.generateHourString()}</div>
      </div>
      <div class="movie-name">{movie.title}</div>
    </div>
  </div>
</div>

<style>
  .movie-item {
    position: absolute; /* Position items absolutely within the container */
    width: 100%; /* Ensure items take the full width of the container */
    border: 0.05rem solid #ccc;
    cursor: pointer;
  }

  .bc-parent {
    display: flex;
    height: 100%;
    background-color: white;
  }

  .bar-container {
    flex: 4;
    padding: 0.5rem 0.5rem 0.5rem 0.5rem;
    box-sizing: border-box;
  }

  .title-container {
    flex: 7;
    display: flex;
    flex-direction: column;
  }

  .original-title {
    display: flex;
    align-items: center;
    flex: 1;
  }

  .english-title {
    display: flex;
    align-items: center;
    flex: 1;
    font-size: 150%;
  }

  .title-genre-container {
    flex: 4;
    display: flex;
    flex-direction: column;
  }

  .time-container {
    flex: 0.5;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .date-container {
    flex: 0.7;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .date {
    flex: 1;
    align-items: center;
    display: flex;
  }

  .time {
    flex: 1;
    align-items: center;
    display: flex;
  }
  .movie-bar {
    height: 100%; /* Take up all the available height */
  }


  .flag {
    margin-right: 0.3rem
  }

  .flag:hover {
    transform: scale(1.7); /* Scale the emoji to 1.5 times its size */
    z-index: 1; /* Ensure the emoji appears above other elements */
  }

  .movie-name {
    position: absolute;
    top: 100%; /* Position it below the bar container */
    left: 0;
    width: 100%;
    text-align: center;
    background-color: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 5px;
    transform: translateY(-100%);
    transition: transform 0.3s ease-in-out;
    opacity: 0;
  }

  .bc-parent:hover .movie-name {
    transform: translateY(0);
    opacity: 1;
  }


</style>
