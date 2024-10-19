<script>
  import { selectedMovie } from "../stores.js";
</script>

<div class="movie-horizontal">
  {#if $selectedMovie}
    <div class="movie-item">
      <img
        src={$selectedMovie.posterImage ? $selectedMovie.posterImage.src : $selectedMovie.getPosterUrl()}
        alt={$selectedMovie.title}
      />
      <div class="movie-info">
        <h2>{$selectedMovie.title}</h2>
        <p>
          <strong>Rating:</strong> {$selectedMovie.voteAverage} ({$selectedMovie.voteCount})
        </p>
        <p>
          <strong>Popularity:</strong> {$selectedMovie.popularity}
        </p>
        <p>
          <strong>Runtime:</strong> {$selectedMovie.generateHourString()}
        </p>
        <p>
          <strong>Description:</strong> {$selectedMovie.overview}
        </p>
      </div>
    </div>
  {/if}
</div>

<style>
  .movie-horizontal {
    background: #f4f4f4;
    border: 0.1rem solid #ddd;
    overflow: auto;
    padding: 1rem;
    max-height: 200px; /* Adjust height as needed */
  }

  .movie-item {
    display: flex;
    align-items: flex-start;
  }

  img {
    max-width: 150px;
    border: 0.2rem solid #333;
    border-radius: 0.2rem;
  }

  .movie-info {
    margin-left: 1rem;
    flex: 1;
  }

  .movie-info h2 {
    margin-top: 0;
  }
</style>