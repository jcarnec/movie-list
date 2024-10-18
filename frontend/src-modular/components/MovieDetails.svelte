<script>
  import { selectedMovie, selectedPerson } from "../stores.js";
  import { generateHourString } from "../utils.js";

  function openYoutubeSearchUrl(title, year) {
    window.open(
      `https://www.youtube.com/results?search_query=${title} (${year}) trailer`
    );
  }
</script>

<div class="movie-details">
  {#if $selectedMovie}
    <div>
      <div class="top-detail">
        <div class="top-detail-poster">
          <img src={$selectedMovie.getPosterUrl()} alt={$selectedMovie.title} />
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
              <p class="blue-text" on:click={() => selectedPerson.set(cast)}>
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
            >{` ${generateHourString($selectedMovie.runtime)}`}
          </p>
          <p><strong>Description:</strong> {$selectedMovie.overview}</p>
          <p>
            <strong>Crew:</strong>
            {#each $selectedMovie.topNcrew as crew}
              <p class="blue-text" on:click={() => selectedPerson.set(crew)}>
                {crew.name}: {crew.job}
              </p>
            {/each}
          </p>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .movie-details {
    background: #f4f4f4;
    border: 1px solid #ddd;
    overflow-y: auto; /* Allow scrolling for movie details */
    height: 99vh;
  }

  img {
    max-width: 100%;
    border: 2px solid #333;
    border-radius: 5px;
  }

  .movie-details h2 {
    margin-top: 10px;
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
    gap: 20px; /* Adjust the gap between the poster and text as needed */
  }

  .top-detail-poster {
    flex: 1;
  }

  .top-detail-text {
    flex: 1;
  }

</style>
