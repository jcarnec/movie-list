<script>
  import MovieItem from './MovieItem.svelte';
  import {queryCount} from '../stores'
  import {getVisibleMovies, getColor} from '../utils'
  export let movies


</script>

<div class="movie-list">
  {#if movies.length > 0}
      {#each getVisibleMovies(movies) as movie, index}
        <MovieItem {movie} {index} barColor={getColor(movie.popularityIndex, movies.length)} newYear={movie.isNewYear} />
      {/each}
  {:else}
    <p>Loading...</p>
  {/if}
</div>

<style>
  .movie-list {
    position: relative; /* Required for absolute positioning of items */
  }

</style>
