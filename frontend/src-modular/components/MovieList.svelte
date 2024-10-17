<script>
  import MovieItem from './MovieItem.svelte';
  import {scrollY, queryCount} from '../stores'
  import {getVisibleMovies} from '../utils'
  export let movies



</script>

<div class="movie-list">
  {$queryCount}
  {movies.length}
  {#if movies.length > 0}
      {#each getVisibleMovies(movies) as movie, index}
        <MovieItem {movie} {index} />
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
