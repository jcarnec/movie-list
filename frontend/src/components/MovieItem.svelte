<script>
  import {
    selectedMovie,
    scrollY,
    itemHeight,
    selectedLanguages,
    selectedGenres,
    minPopularity,
    minVoteAverage,
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
    verbEmojiDict,
  } from "../constants.js";
  import { history } from "../historyStore.js";
  import { onMount } from "svelte";
  import { isNarrow } from "../windowStore.js";

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
  $: fontWeightDate = newYear ? "font-bold" : "font-normal";
  $: movieViewedType = getMovieViewedType(movie);

  isNarrow.subscribe((n) => {
    console.log("screen-width", n);
  });

  history.subscribe((n) => {
    movieViewedType = getMovieViewedType(movie);
  });

  function handleViewTypeClick(event) {
    if (event) event.stopPropagation();
    if (movieViewedType == "viewed") {
      addMovie(movie, "interested");
    } else if (movieViewedType == "interested") {
      addMovie(movie, "seen");
    } else if (movieViewedType == "seen") {
      addMovie(movie, "loved");
    } else if (movieViewedType == "loved") {
      addMovie(movie, "ignored");
    } else if (movieViewedType == "ignored") {
      addMovie(movie, "viewed");
    }
  }

  function handleBarClick() {
    if ($selectedMovie && $selectedMovie.id == movie.id) {
      handleViewTypeClick();
    }
    selectedMovie.set(movie);
  }

  const colorDict = {
    viewed: "gray",
    interested: "green",
    seen: "blue",
    loved: "red",
  };
</script>

<div
  class="movie-item flex items-center border-t border-gray-300 overflow-hidden cursor-pointer transition-shadow duration-1000 rounded-md"
  on:click={handleBarClick}
  on:mouseenter={handleMouseEnter}
  on:mouseleave={handleMouseLeave}
  style="transform: translateX(-50%) translateY({index * $itemHeight -
    ($scrollY %
      $itemHeight)}px); height: {$itemHeight}px; position: absolute; left: 50%; width: calc(100% - 2rem);"
  class:selected={$selectedMovie && $selectedMovie.id == movie.id}
>
  <!-- Time Container -->
  <div class="flex-none w-1/12 text-center text-sm">
    {movie.generateHourString()}
  </div>

  <!-- Title Container -->
  <div class="flex flex-col flex-grow w-4/12 py-2 pr-2">
    <!-- Original Title -->
    {#if !isEnglish}
      <div
        class="flex items-center text-gray-500 whitespace-nowrap overflow-hidden overflow-ellipsis"
      >
        <span
          class="flag mx-1 cursor-pointer transition-transform duration-200 hover:scale-150 z-10 text-l"
          on:click={() => selectedLanguages.set([movie.originalLanguage])}
        >
          {languageFlag}
        </span>
        {movie.originalTitle}
      </div>
    {:else}
      <div class="flex items-center">
        <span
          class="flag mx-1 cursor-pointer transition-transform duration-200 hover:scale-150 z-10 text-l"
          on:click={() => selectedLanguages.set([movie.originalLanguage])}
        >
          {languageFlag}
        </span>
      </div>
    {/if}
    <!-- English Title -->
    <div class="flex items-center text-base">
      {movie.title}
    </div>
  </div>

  <!-- Emoji Grid Container -->
  <div class="flex-none w-12">
    <div class="grid grid-cols-2 gap-x-0">
      {#each movie.genres as genre}
        <div
          class="emoji cursor-pointer transition-transform duration-200 hover:scale-150 z-10 text-xl"
          on:click={() => {
            if ($selectedGenres.includes(genre)) {
              selectedGenres.update((genres) =>
                genres.filter((g) => g !== genre)
              );
            } else {
              selectedGenres.update((genres) => [...genres, genre]);
            }
          }}
        >
          {genreEmojiDict[genre]}
        </div>
      {/each}
    </div>
  </div>

  <!-- Custom Bar Container -->
  <div class="flex-grow w-4/12 px-2">
    <div
      class="custom-bar-container relative w-full h-8 bg-gray-200 overflow-hidden rounded-full"
      class:bg-gray-300={movieViewedType && movieViewedType != "ignored"}
    >
      <div
        class="custom-bar h-full rounded-full"
        style="width: {movie.voteAverage * 10}%; background-color: {barColor};"
      ></div>
    </div>
  </div>

  <!-- Info Container -->
  <div class="flex-none w-1/12 text-center flex items-center justify-center">
    {#if movieViewedType && movieViewedType != "ignored"}
      <div
        class="status-button flex items-center justify-center w-8 h-8 text-white rounded cursor-pointer shadow-md text-xl"
        class:bg-gray-500={movieViewedType === "viewed"}
        class:hover:bg-gray-700={movieViewedType === "viewed"}
        class:bg-green-500={movieViewedType === "interested"}
        class:hover:bg-green-700={movieViewedType === "interested"}
        class:bg-blue-500={movieViewedType === "seen"}
        class:hover:bg-blue-700={movieViewedType === "seen"}
        class:bg-red-500={movieViewedType === "loved"}
        class:hover:bg-red-700={movieViewedType === "loved"}
        on:click={(event) => handleViewTypeClick(event)}
      >
        {verbEmojiDict[movieViewedType]}
      </div>
    {:else if isHoveringOver}
      <div class="text-xs text-center">
        <div class="font-bold mb-1 flex flex-row justify-center items-center">
          <div
            on:click={() => {
              minVoteAverage.set(movie.voteAverage.toFixed(1));
            }}
            class="emoji text-md cursor-pointer transition-transform duration-200 hover:scale-150 z-10 mr-1 text-lg"
          >
            ⭐
          </div>
          {movie.voteAverage.toFixed(1)}
        </div>
        <div
          on:click={() => {
            minPopularity.set(movie.popularity.toFixed(0));
          }}
          class="emoji font-bold mr-1 flex flex-row justify-center items-center"
          style="color: {barColor};"
        >
          <div
            class="text-md cursor-pointer transition-transform duration-200 hover:scale-150 z-10 mr-1 text-lg"
          >
            👥
          </div>
          {movie.popularity.toFixed(0)}
        </div>
      </div>
    {/if}
  </div>

  <!-- Date Container -->
  <div class="flex-none mr-3 text-center text-sm {fontWeightDate}">
    {movie.getReleaseDateString()}
  </div>
</div>

<style>
  .movie-item:hover {
    box-shadow: 0 0 15px rgba(0, 123, 255, 0.5);
  }
  .selected {
    background-color: rgba(0, 123, 255, 0.1);
    border: 2px solid;
    border-color: rgba(0, 123, 255, 0.5);
  }
</style>
