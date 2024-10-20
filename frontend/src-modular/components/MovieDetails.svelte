<script>
  import { allowQueryMutex, minYear, selectedMovie, selectedPerson, DEFAULT_LANGUAGE, DEFAULT_MAX_REVIEWS, DEFAULT_MIN_REVIEWS, DEFAULT_PERSON, DEFAULT_SELECTED_GENRES, DEFAULT_TITLE, DEFAULT_YEAR, selectedTitle, minReviewCount, maxReviewCount, selectedGenres, selectedLanguage } from "../stores.js";
  import MovieOnHoverDetails from "./MovieOnHoverDetails.svelte";

  function openYoutubeSearchUrl(title, year) {
    window.open(
      `https://www.youtube.com/results?search_query=${title} (${year}) trailer`
    );
  }

  function personSelected(personQuery) {
    allowQueryMutex.set(false);
    selectedPerson.set(personQuery)
    minReviewCount.set(DEFAULT_MIN_REVIEWS)
    maxReviewCount.set(DEFAULT_MAX_REVIEWS)
    minYear.set(DEFAULT_YEAR)
    selectedTitle.set(DEFAULT_TITLE)
    selectedGenres.set(DEFAULT_SELECTED_GENRES)
    selectedLanguage.set(DEFAULT_LANGUAGE)
    allowQueryMutex.set(true);
  }

  function personToPersonQuery(person) {
    return {
      id: person.id,
      name: person.name,
      castOrCrew: person.character ? "cast" : "crew",
    };
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
              <h4
                class="card-subtitle mb-2 text-muted"
                on:click={() =>
                  openYoutubeSearchUrl(
                    $selectedMovie.originalTitle,
                    $selectedMovie.getReleaseYear()
                  )}
                style="cursor: pointer;"
              >
                {$selectedMovie.originalTitle} 
              </h4>
            {/if}
            {#if $selectedMovie.genres && $selectedMovie.genres.length > 0}
              <p class="card-text">
                <strong>Genre:</strong>
                {$selectedMovie.genres.join(", ")}
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
                {$selectedMovie.voteAverage} ({$selectedMovie.voteCount})
              </p>
            {/if}
            {#if $selectedMovie.popularity}
              <p class="card-text">
                <strong>Popularity:</strong>
                {$selectedMovie.popularity}
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
                    on:click={() =>
                      {personSelected(personToPersonQuery(cast))}}
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
                    on:click={() =>
                      {personSelected(personToPersonQuery(crew))}}
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
  <!-- <MovieOnHoverDetails></MovieOnHoverDetails> -->
</div>

<style>
  .movie-details {
    height: 100vh;
    overflow-y: auto;
  }

  .poster {
    width: 300px; /* Fixed width for the poster */
    padding: 10px; /* Padding around the image */
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
</style>
