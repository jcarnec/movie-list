<script>
  import {
    allowQueryMutex,
    minYear,
    selectedMovie,
    selectedPerson,
    DEFAULT_LANGUAGES,
    DEFAULT_MAX_REVIEWS,
    DEFAULT_MIN_REVIEWS,
    DEFAULT_PERSON,
    DEFAULT_SELECTED_GENRES,
    DEFAULT_TITLE,
    DEFAULT_YEAR,
    selectedTitle,
    minReviewCount,
    maxReviewCount,
    selectedGenres,
    selectedLanguages,
    minPopularity,
    minVoteAverage,
    castAndCrew
  } from "../stores.js";
  import {
    genreEmojiDict,
    getLanguageFlag,
    verbEmojiDict,
  } from "../constants.js";
  import MovieOnHoverDetails from "./MovieOnHoverDetails.svelte";
  import { onMount } from "svelte";
  import { addMovie, getMovieViewedType, history } from "../historyStore.js";
  import { personSelected, personToPersonQuery } from "../utils.js";

  let showModal = false;
  let fullImageUrl = "";

  function getOrSetMovieViewedType(movie) {
    if (movie) {
      let type = null;
      type = getMovieViewedType(movie);
      if (!type) {
        addMovie(movie, "ignored");
        return "ignored";
      } else {
        return type;
      }
    }
  }

  $: selectedButton = getOrSetMovieViewedType($selectedMovie);

  function openImageModal(imageUrl) {
    fullImageUrl = imageUrl;
    showModal = true;
  }

  function closeModal() {
    showModal = false;
  }

  function openYoutubeSearchUrl(title, year) {
    window.open(
      `https://www.youtube.com/results?search_query=${title} (${year}) trailer`
    );
  }

  function handleButtonClick(buttonType) {
    if (buttonType == selectedButton) {
      addMovie($selectedMovie, "ignored");
    } else {
      addMovie($selectedMovie, buttonType);
    }
  }

  history.subscribe((n) => {
    if ($selectedMovie) {
      selectedButton = getMovieViewedType($selectedMovie);
    }
  });

  // if selected movie changes scroll the movie details to the top
  onMount(() => {
    selectedMovie.subscribe((n) => {
      document.getElementById("movie-details-div").scrollTo(0, 0);
    });
  });
</script>

<div
  id="movie-details-div"
  class="h-screen overflow-y-auto container mx-auto p-6 custom-scrollbar leading-8"
>
  {#if $selectedMovie}
    <div class="bg-base-200 card shadow-lg mb-4">
      <!-- Custom Button Group -->
      <div
        class="flex justify-center p-4"
        role="group"
        aria-label="Status buttons"
      >
        <!-- Viewed Button -->
        <button
          type="button"
          class="py-2.5 px-5 text-sm font-medium focus:outline-none border rounded-l-lg"
          class:border-gray-200={selectedButton !== "viewed"}
          class:text-gray-900={selectedButton !== "viewed"}
          class:bg-white={selectedButton !== "viewed"}
          class:hover:bg-gray-100={selectedButton !== "viewed"}
          class:hover:text-blue-700={selectedButton !== "viewed"}
          class:focus:ring-4={selectedButton !== "viewed"}
          class:focus:ring-gray-100={selectedButton !== "viewed"}
          class:bg-gray-500={selectedButton === "viewed"}
          class:text-white={selectedButton === "viewed"}
          class:border-gray-500={selectedButton === "viewed"}
          class:hover:bg-gray-600={selectedButton === "viewed"}
          class:focus:ring-gray-300={selectedButton === "viewed"}
          class:shadow-md={selectedButton === "viewed"}
          on:click={() => handleButtonClick("viewed")}
        >
          Viewed {verbEmojiDict["viewed"]}
        </button>

        <!-- Interested Button -->
        <button
          type="button"
          class="py-2.5 px-5 text-sm font-medium focus:outline-none border border-l-0 rounded-none"
          class:border-gray-200={selectedButton !== "interested"}
          class:text-gray-900={selectedButton !== "interested"}
          class:bg-white={selectedButton !== "interested"}
          class:hover:bg-gray-100={selectedButton !== "interested"}
          class:hover:text-blue-700={selectedButton !== "interested"}
          class:focus:ring-4={selectedButton !== "interested"}
          class:focus:ring-gray-100={selectedButton !== "interested"}
          class:bg-green-500={selectedButton === "interested"}
          class:text-white={selectedButton === "interested"}
          class:border-green-500={selectedButton === "interested"}
          class:hover:bg-green-600={selectedButton === "interested"}
          class:focus:ring-green-300={selectedButton === "interested"}
          class:shadow-md={selectedButton === "interested"}
          on:click={() => handleButtonClick("interested")}
        >
          Interested {verbEmojiDict["interested"]}
        </button>

        <!-- Seen It Button -->
        <button
          type="button"
          class="py-2.5 px-5 text-sm font-medium focus:outline-none border border-l-0 rounded-none"
          class:border-gray-200={selectedButton !== "seen"}
          class:text-gray-900={selectedButton !== "seen"}
          class:bg-white={selectedButton !== "seen"}
          class:hover:bg-gray-100={selectedButton !== "seen"}
          class:hover:text-blue-700={selectedButton !== "seen"}
          class:focus:ring-4={selectedButton !== "seen"}
          class:focus:ring-gray-100={selectedButton !== "seen"}
          class:bg-blue-500={selectedButton === "seen"}
          class:text-white={selectedButton === "seen"}
          class:border-blue-500={selectedButton === "seen"}
          class:hover:bg-blue-600={selectedButton === "seen"}
          class:focus:ring-blue-300={selectedButton === "seen"}
          class:shadow-md={selectedButton === "seen"}
          on:click={() => handleButtonClick("seen")}
        >
          Seen It {verbEmojiDict["seen"]}
        </button>

        <!-- Loved It Button -->
        <button
          type="button"
          class="py-2.5 px-5 text-sm font-medium focus:outline-none border border-l-0 rounded-r-lg"
          class:border-gray-200={selectedButton !== "loved"}
          class:text-gray-900={selectedButton !== "loved"}
          class:bg-white={selectedButton !== "loved"}
          class:hover:bg-gray-100={selectedButton !== "loved"}
          class:hover:text-blue-700={selectedButton !== "loved"}
          class:focus:ring-4={selectedButton !== "loved"}
          class:focus:ring-gray-100={selectedButton !== "loved"}
          class:bg-red-500={selectedButton === "loved"}
          class:text-white={selectedButton === "loved"}
          class:border-red-500={selectedButton === "loved"}
          class:hover:bg-red-600={selectedButton === "loved"}
          class:focus:ring-red-300={selectedButton === "loved"}
          class:shadow-md={selectedButton === "loved"}
          on:click={() => handleButtonClick("loved")}
        >
          Loved It! {verbEmojiDict["loved"]}
        </button>
      </div>

      <div class="flex flex-col items-center">
        {#if $selectedMovie.posterImage || $selectedMovie.getPosterUrl()}
          <div class="flex-shrink-0 poster m-2.5">
            <img
              src={$selectedMovie.posterImage
                ? $selectedMovie.posterImage.src
                : $selectedMovie.getPosterUrl()}
              class="w-[350px] transition-shadow duration-200 ease-in-out cursor-pointer blue-glow"
              alt={$selectedMovie.title}
              on:click={() =>
                openImageModal(
                  $selectedMovie.posterImage
                    ? $selectedMovie.posterImage.src
                    : $selectedMovie.getPosterUrl()
                )}
            />
          </div>
        {/if}
        <div class="p-6">
          <h2
            class="text-2xl font-bold text-blue-600 cursor-pointer group"
            on:click={() =>
              openYoutubeSearchUrl(
                $selectedMovie.title,
                $selectedMovie.getReleaseYear()
              )}
          >
            {$selectedMovie.title}
            <i
              class="fab fa-youtube youtube-icon transition-colors duration-300 group-hover:text-red-500"
            ></i>
          </h2>
          {#if $selectedMovie.originalLanguage !== "en" && $selectedMovie.originalTitle}
            <div class="flex items-center mb-2">
              <span
                class="mx-2 cursor-pointer transition-transform duration-200 hover:scale-150 z-10 text-2xl"
                on:click={() =>
                  selectedLanguages.set([$selectedMovie.originalLanguage])}
              >
                {getLanguageFlag($selectedMovie.originalLanguage)}
              </span>
              <h4
                class="text-lg text-gray-500 cursor-pointer group"
                on:click={() =>
                  openYoutubeSearchUrl(
                    $selectedMovie.originalTitle,
                    $selectedMovie.getReleaseYear()
                  )}
              >
                {$selectedMovie.originalTitle}
                <i
                  class="fab fa-youtube youtube-icon transition-colors duration-300 group-hover:text-red-500"
                ></i>
              </h4>
            </div>
          {/if}
          {#if $selectedMovie.genres && $selectedMovie.genres.length > 0}
            <p>
              <strong>Genre:</strong>
              <span class="flex items-center flex-wrap">
                {#each $selectedMovie.genres as genre}
                  <span class="flex items-center mr-4">
                    <p
                      class="text-xl cursor-pointer transition-transform duration-200 mr-1 hover:scale-150 z-10"
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
                    </p>
                    <p class="m-0">{genre}</p>
                  </span>
                {/each}
              </span>
            </p>
          {/if}
          {#if $selectedMovie.releaseDate}
            <p>
              <strong>Release Date:</strong>
              {$selectedMovie.getFormattedReleaseDate()}
            </p>
          {/if}
          {#if $selectedMovie.voteAverage && $selectedMovie.voteCount}
            <div class="flex flex-row">
              <strong>Rating:</strong>
              <div
                on:click={() => {
                  minVoteAverage.set($selectedMovie.voteAverage.toFixed(1));
                }}
                class="emoji text-lg cursor-pointer transition-transform duration-200 hover:scale-150 z-10 mx-1"
              >
                ⭐
              </div>
              {$selectedMovie.voteAverage.toFixed(1)} / 10
            </div>
          {/if}
          {#if $selectedMovie.popularity}
            <div class="flex flex-row">
              <strong>Review Count:</strong>

              <div
                on:click={() => {
                  minReviewCount.set($selectedMovie.voteCount);
                }}
                class="emoji text-lg cursor-pointer transition-transform duration-200 hover:scale-150 z-10 mx-1"
              >
                👥
              </div>

              {$selectedMovie.voteCount} reviews
            </div>
          {/if}
          {#if $selectedMovie.runtime}
            <p>
              <strong>Runtime:</strong>
              {$selectedMovie.generateHourString()}
            </p>
          {/if}
          {#if $selectedMovie.overview}
            <p>
              <strong>Description:</strong>
              {$selectedMovie.overview}
            </p>
          {/if}
          {#if $castAndCrew}
            {#if $castAndCrew.cast && $castAndCrew.cast.length > 0}
              <p class="mt-4">
                <strong>Cast:</strong>
              </p>
              <ul>
                {#each $castAndCrew.cast as cast}
                  <li
                    class="cursor-pointer hover:bg-gray-100 p-2 transition-colors duration-200 flex space-x-2"
                    on:click={() => {
                      personSelected(personToPersonQuery(cast));
                    }}
                  >
                    <img
                      src={cast.profile_path
                        ? "https://image.tmdb.org/t/p/w185" + cast.profile_path
                        : "https://via.placeholder.com/48"}
                      alt={cast.name}
                      class="rounded-full object-cover"
                      style="width: 32px; height: 32px;"
                    />
                    <span class="text-blue-600 pr-1">{cast.name}</span>as {cast.character}
                  </li>
                {/each}
              </ul>
            {/if}
            {#if $castAndCrew.crew && $castAndCrew.crew.length > 0}
              <p class="mt-4">
                <strong>Crew:</strong>
              </p>
              <ul>
                {#each $castAndCrew.crew as crew}
                  <li
                    class="cursor-pointer hover:bg-gray-100 p-2 transition-colors duration-200 flex space-x-2"
                    on:click={() => {
                      personSelected(personToPersonQuery(crew));
                    }}
                  >
                    <img
                      src={crew.profile_path
                        ? "https://image.tmdb.org/t/p/w185" + crew.profile_path
                        : "https://via.placeholder.com/48"}
                      alt={crew.name}
                      class="rounded-full object-cover"
                      style="width: 32px; height: 32px;"
                    />
                    <span class="text-blue-600">{crew.name}</span>: {crew.job}
                  </li>
                {/each}
              </ul>
            {/if}
          {/if}
        </div>
      </div>
    </div>
  {/if}

  {#if showModal}
    <div
      class="fixed inset-0 z-50 overflow-hidden bg-black bg-opacity-50 flex items-center justify-center"
      on:click={closeModal}
    >
      <div class="relative w-4/5 max-w-xl">
        <span
          class="absolute top-2 right-6 text-white text-3xl font-bold cursor-pointer"
          on:click={closeModal}>&times;</span
        >
        <img src={fullImageUrl} alt="Full Image" class="w-full h-auto" />
      </div>
    </div>
  {/if}
  <!-- <MovieOnHoverDetails></MovieOnHoverDetails> -->
</div>

<style>
  /* Additional custom styles if needed */
  .blueglow {
    /* whatever it was before */
  }

  /* Hide scrollbar for WebKit browsers (Chrome, Safari) */
  .custom-scrollbar::-webkit-scrollbar {
    width: 0;
    height: 0;
  }

  /* Hide scrollbar for Firefox */
  .custom-scrollbar {
    scrollbar-width: none; /* Firefox */
  }

  .poster:hover {
    box-shadow: 0 0 15px rgba(0, 123, 255, 0.5);
  }
</style>
