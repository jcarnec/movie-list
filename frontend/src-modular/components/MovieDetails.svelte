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

  let showModal = false;
  let fullImageUrl = "";

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

  function handlePosterLoad() {
    const rect = posterDiv.getBoundingClientRect();
    const topLeft = { x: rect.left, y: rect.top };
    const topRight = { x: rect.right, y: rect.top };
    console.log('Top Left:', topLeft);
    console.log('Top Right:', topRight);
  }

</script>

<div class="movie-details container-fluid">
  {#if $selectedMovie}
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
                on:load={handlePosterLoad}
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
                <span class="me-3 flag" on:click={console.log("hello")}
                  >{getLanguageFlag($selectedMovie.originalLanguage)}</span
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
                {$selectedMovie.voteAverage.toFixed(1)} ({$selectedMovie.voteCount})
              </p>
            {/if}
            {#if $selectedMovie.popularity}
              <p class="card-text">
                <strong>Popularity:</strong>
                {$selectedMovie.popularity.toFixed(0)}
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
</style>
