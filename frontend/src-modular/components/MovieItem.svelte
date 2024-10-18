<script>
  import { selectedMovie, scrollY, itemHeight, queryCount } from '../stores.js';

  export let movie;
  export let index;

  function handleBarClick() {
    selectedMovie.set(movie);
  }

</script>

<div on:click={handleBarClick}>
  <div
    class="movie-item"
    style="transform: translateY({index * $itemHeight - ($scrollY % $itemHeight)}px); height: {$itemHeight}px"
  >
  {movie.releaseDate}
  </div>
</div>

<style>
  .movie-item {
    position: absolute; /* Position items absolutely within the container */
    width: 100%; /* Ensure items take the full width of the container */
    border: 1px solid #ccc;
    cursor: pointer;
  }
</style>
