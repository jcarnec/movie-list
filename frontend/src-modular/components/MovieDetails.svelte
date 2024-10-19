<script>
  import {selectedMovie, selectedPerson } from "../stores.js";
  import MovieOnHoverDetails from "./MovieOnHoverDetails.svelte";

  function openYoutubeSearchUrl(title, year) {
    window.open(
      `https://www.youtube.com/results?search_query=${title} (${year}) trailer`
    );
  }

  function personToPersonQuery(person) {
    return {id: person.id, name: person.name, castOrCrew: person.character ? 'cast' : 'crew'}
  }
</script>

<div class="movie-details">
  {#if $selectedMovie}
    <div>
      <div class="top-detail">
        <div class="top-detail-poster">
        <img 
            src={$selectedMovie.posterImage ? $selectedMovie.posterImage.src : $selectedMovie.getPosterUrl()} 
            alt={$selectedMovie.title} 
          />
          <h2
            class="link"
            on:click={() =>
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
              on:click={() =>
                openYoutubeSearchUrl(
                  $selectedMovie.originalTitle,
                  $selectedMovie.getReleaseYear()
                )}
            >
              {$selectedMovie.originalTitle}
            </h4>
          {/if}
          <p>
            <strong>Cast:</strong>
            {#each $selectedMovie.topNcast as cast}
              <p class="blue-text" on:click={() => selectedPerson.set(personToPersonQuery(cast))}>
                {cast.name} as {cast.character}
              </p>
            {/each}
          </p>
        </div>
        <div class="top-detail-text">
          <p>
            <strong>Genre:</strong>
            {$selectedMovie.genres.join(", ")}
          </p>
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
            >{` ${$selectedMovie.generateHourString()}`}
          </p>
          <p><strong>Description:</strong> {$selectedMovie.overview}</p>
          <p>
            <strong>Crew:</strong>
            {#each $selectedMovie.topNcrew as crew}
              <p class="blue-text" on:click={() => selectedPerson.set(personToPersonQuery(crew))}>
                {crew.name}: {crew.job}
              </p>
            {/each}
          </p>
        </div>
      </div>
    </div>
  {/if}
<MovieOnHoverDetails></MovieOnHoverDetails>
</div>

<style>
  .movie-details {
    background: #f4f4f4;
    border: 0.1rem solid #ddd;
    overflow-y: auto; /* Allow scrolling for movie details */
    height: 99vh;
  }

  img {
    max-width: 100%;
    border: 0.2rem solid #333;
    border-radius: 0.2rem;
  }

  .movie-details h2 {
    margin-top: 1rem;
  }
  .link {
    cursor: pointer;
    color: blue;
    text-decoration: underline;
  }
  .blue-text {
    color: blue;
    text-decoration: underline;
  }

  .top-detail {
    display: flex;
    gap: 1.5rem; /* Adjust the gap between the poster and text as needed */
  }

  .top-detail-poster {
    flex: 1;
  }

  .top-detail-text {
    flex: 1;
  }

</style>
