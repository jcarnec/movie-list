<script>
  import {
    allowQueryMutex,
    minYear,
    selectedMovie,
    selectedPerson,
    DEFAULT_LANGUAGE,
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
    selectedLanguage,
  } from "../stores.js";
  import { genreEmojiDict, getLanguageFlag } from "../constants.js";
  import MovieOnHoverDetails from "./MovieOnHoverDetails.svelte";
  import { onMount } from "svelte";
  import { addMovie, getMovieViewedType, history } from "../historyStore.js";

  let showModal = false;
  let fullImageUrl = "";

  function getOrSetMovieViewedType(movie) {
    if(movie) {
      let type = null
      type = getMovieViewedType(movie)
      if(!type) {
        addMovie(movie, 'ignored')
        return 'ignored'
      } else {
        return type
      }
    }
  }

  $: selectedButton =  getOrSetMovieViewedType($selectedMovie)

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

  function personSelected(personQuery) {
    allowQueryMutex.set(false);
    selectedPerson.set(personQuery);
    minReviewCount.set(DEFAULT_MIN_REVIEWS);
    maxReviewCount.set(DEFAULT_MAX_REVIEWS);
    minYear.set(DEFAULT_YEAR);
    selectedTitle.set(DEFAULT_TITLE);
    selectedGenres.set(DEFAULT_SELECTED_GENRES);
    selectedLanguage.set(DEFAULT_LANGUAGE);
    allowQueryMutex.set(true);
  }

  function personToPersonQuery(person) {
    return {
      id: person.id,
      name: person.name,
      castOrCrew: person.character ? "cast" : "crew",
    };
  }

  function handleButtonClick(buttonType) {
    addMovie($selectedMovie, buttonType)
  }

  history.subscribe(n => {
    if($selectedMovie) {
      selectedButton = getMovieViewedType($selectedMovie)
    }
  })

</script>

<div class="movie-details container-fluid">
  {#if $selectedMovie}
  <!-- Custom Button Group -->
    <div class="custom-btn-group my-3" role="group" aria-label="Status buttons">
      <button
        type="button"
        class="custom-btn viewed"
        class:selected={selectedButton === "viewed"}
        on:click={() => handleButtonClick("viewed")}
      >
        Viewed 📑
      </button>
      <button
        type="button"
        class="custom-btn interested"
        class:selected={selectedButton === "interested"}
        on:click={() => handleButtonClick("interested")}
      >
        Interested 🧐
      </button>
      <button
        type="button"
        class="custom-btn seen"
        class:selected={selectedButton === "seen"}
        on:click={() => handleButtonClick("seen")}
      >
        Seen It 📺
      </button>
      <button
        type="button "
        class="custom-btn loved"
        class:selected={selectedButton === "loved"}
        on:click={() => handleButtonClick("loved")}
      >
        Loved It! 🫶
      </button>
    </div>

    <div class="card mb-3">
      <div class="row no-gutters">
        <div class="row">
          {#if $selectedMovie.posterImage || $selectedMovie.getPosterUrl()}
            <div class="col-auto">
              <img
                src={$selectedMovie.posterImage
                  ? $selectedMovie.posterImage.src
                  : $selectedMovie.getPosterUrl()}
                class="poster img-fluid"
                alt={$selectedMovie.title}
                on:click={() =>
                  openImageModal(
                    $selectedMovie.posterImage
                      ? $selectedMovie.posterImage.src
                      : $selectedMovie.getPosterUrl()
                  )}
                style="cursor: pointer;"
              />
            </div>
          {/if}
        </div>
        <div class="col">
          <div class="card-body">
            <h2
              class="card-title text-primary"
              on:click={() =>
                openYoutubeSearchUrl(
                  $selectedMovie.title,
                  $selectedMovie.getReleaseYear()
                )}
              style="cursor: pointer;"
            >
              {$selectedMovie.title} <i class="fab fa-youtube youtube-icon"></i>
            </h2>
            {#if $selectedMovie.originalLanguage !== "en" && $selectedMovie.originalTitle}
              <div class="d-flex align-items-center mb-2">
                <span
                  class="me-3 flag"
                  on:click={selectedLanguage.set(
                    $selectedMovie.originalLanguage
                  )}>{getLanguageFlag($selectedMovie.originalLanguage)}</span
                >
                <h4
                  class="card-subtitle text-muted my-0"
                  on:click={() =>
                    openYoutubeSearchUrl(
                      $selectedMovie.originalTitle,
                      $selectedMovie.getReleaseYear()
                    )}
                  style="cursor: pointer;"
                >
                  {$selectedMovie.originalTitle}
                </h4>
              </div>
            {/if}
            {#if $selectedMovie.genres && $selectedMovie.genres.length > 0}
              <p class="card-text">
                <strong>Genre:</strong>
                <span class="genre-container">
                  {#each $selectedMovie.genres as genre}
                    <span class="genre-item">
                      <p
                        class="emoji me-1"
                        on:click={() => {
                          if ($selectedGenres.includes(genre)) {
                            selectedGenres.update((genres) =>
                              genres.filter((g) => g !== genre)
                            );
                          } else {
                            selectedGenres.update((genres) => [
                              ...genres,
                              genre,
                            ]);
                          }
                        }}
                      >
                        {genreEmojiDict[genre]}
                      </p>
                      <p>{genre}</p>
                    </span>
                  {/each}
                </span>
              </p>
            {/if}
            <!-- {#if $selectedMovie.keywords && $selectedMovie.keywords.length > 0}
              <p class="card-text">
                <strong>Keywords:</strong> {$selectedMovie.keywords.join(", ")}
              </p>
            {/if} -->
            {#if $selectedMovie.releaseDate}
              <p class="card-text">
                <strong>Release Date:</strong>
                {$selectedMovie.getFormattedReleaseDate()}
              </p>
            {/if}
            {#if $selectedMovie.voteAverage && $selectedMovie.voteCount}
              <p class="card-text">
                <strong>Rating:</strong>
               ⭐ {$selectedMovie.voteAverage.toFixed(1)} ({$selectedMovie.voteCount} reviews)
              </p>
            {/if}
            {#if $selectedMovie.popularity}
              <p class="card-text">
                <strong>Popularity:</strong>
               👥 {$selectedMovie.popularity.toFixed(0)}
              </p>
            {/if}
            {#if $selectedMovie.runtime}
              <p class="card-text">
                <strong>Runtime:</strong>
                {$selectedMovie.generateHourString()}
              </p>
            {/if}
            {#if $selectedMovie.overview}
              <p class="card-text">
                <strong>Description:</strong>
                {$selectedMovie.overview}
              </p>
            {/if}
            {#if $selectedMovie.topNcast && $selectedMovie.topNcast.length > 0}
              <p class="card-text">
                <strong>Cast:</strong>
              </p>
              <ul class="list-group list-group-flush">
                {#each $selectedMovie.topNcast as cast}
                  <li
                    class="list-group-item"
                    on:click={() => {
                      personSelected(personToPersonQuery(cast));
                    }}
                    style="cursor: pointer;"
                  >
                    <span class="text-primary">{cast.name}</span> as {cast.character}
                  </li>
                {/each}
              </ul>
            {/if}
            {#if $selectedMovie.topNcrew && $selectedMovie.topNcrew.length > 0}
              <p class="card-text mt-3">
                <strong>Crew:</strong>
              </p>
              <ul class="list-group list-group-flush">
                {#each $selectedMovie.topNcrew as crew}
                  <li
                    class="list-group-item"
                    on:click={() => {
                      personSelected(personToPersonQuery(crew));
                    }}
                    style="cursor: pointer;"
                  >
                    <span class="text-primary">{crew.name}</span>: {crew.job}
                  </li>
                {/each}
              </ul>
            {/if}
          </div>
        </div>
      </div>
    </div>
  {/if}

  {#if showModal}
    <div class="modal" on:click={closeModal}>
      <div class="modal-content">
        <span class="close" on:click={closeModal}>&times;</span>
        <img src={fullImageUrl} alt="Full Image" />
      </div>
    </div>
  {/if}
  <!-- <MovieOnHoverDetails></MovieOnHoverDetails> -->
</div>

<style>
  .movie-details {
    height: 99vh;
    overflow-y: auto;
    padding-left: 0;
  }

  .poster {
    width: 350px; /* Fixed width for the poster */
    margin: 10px; /* Padding around the image */
    transition: box-shadow 0.2s ease;
  }

  .poster:hover {
    box-shadow: 0 0 20px rgba(0, 123, 255, 0.5);
  }

  .card-title:hover,
  .card-subtitle:hover,
  .text-primary:hover {
    text-decoration: underline;
    transition: color 0.3s;
  }

  .list-group-item:hover {
    background-color: #f8f9fa;
    transition: background-color 0.3s;
  }

  .text-primary {
    cursor: pointer;
  }

  .youtube-icon {
    transition: color 0.3s;
  }
  h2:hover .youtube-icon {
    color: red;
  }

  h4:hover .youtube-icon {
    color: red;
  }

  .modal {
    display: block;
    position: fixed;
    z-index: 1050;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background-color: rgba(0, 0, 0, 0.5);
  }

  .modal-content {
    position: relative;
    margin: auto;
    padding: 0;
    width: 80%;
    max-width: 700px;
  }

  .close {
    position: absolute;
    top: 10px;
    right: 25px;
    color: white;
    font-size: 35px;
    font-weight: bold;
    cursor: pointer;
  }

  .modal img {
    width: 100%;
    height: auto;
  }

  .flag {
    cursor: pointer;
    transition: transform 0.2s;
  }

  .flag:hover {
    transform: scale(1.7); /* Scale the emoji to 1.5 times its size */
    z-index: 1; /* Ensure the emoji appears above other elements */
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

  .genre-container {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
  }

  .genre-item {
    display: flex;
    align-items: center;
    margin-right: 1rem;
  }

  .genre-item p {
    margin: 0;
  }

  .custom-btn-group {
    display: flex;
    gap: 0px;
  }

  .custom-btn {
    padding: 10px 20px;
    border: 1px solid black;
    background-color: white;
    color: grey;
    cursor: pointer;
    font-size: 16px;
    transition: all 0.3s ease;
    box-shadow: none;
  }

  .custom-btn:hover {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    border-color: lightgrey;
  }

  /* Specific colors for each state */
  .custom-btn.selected {
    border-color: #333;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  }

  .custom-btn.selected.viewed {
    background-color: grey;
    color: white;
  }

  .custom-btn.selected.interested {
    background-color: green;
    color: white;
  }

  .custom-btn.selected.seen {
    background-color: blue;
    color: white;
  }

  .custom-btn.selected.loved {
    background-color: red;
    color: white;
  }

  /* Hover effects for each button type */
  .custom-btn.viewed:hover {
    color: white;
    background-color: grey;
    border-color: grey;
  }

  .custom-btn.interested:hover {
    color: white;
    background-color: green;
    border-color: green;
  }

  .custom-btn.seen:hover {
    color: white;
    background-color: blue;
    border-color: blue;
  }

  .custom-btn.loved:hover {
    color: white;
    background-color: red;
    border-color: red;
  }

 .custom-btn:first-child {
    border-top-left-radius: 5px; /* Add border radius to the first button */
    border-bottom-left-radius: 5px;
  }

  .custom-btn:last-child {
    border-top-right-radius: 5px; /* Add border radius to the last button */
    border-bottom-right-radius: 5px;
  }

  .custom-btn:not(:last-child) {
    border-right: none; /* Remove right border for all but the last button */
  }

</style>
