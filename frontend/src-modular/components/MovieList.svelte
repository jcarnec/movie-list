<!-- MovieList.svelte -->
<script>
  import MovieItem from './MovieItem.svelte';
  import { queryCount, scrollY, itemHeight } from '../stores';
  import { getVisibleMovies, getColor } from '../utils';
  export let movies;
</script>

<div class="movie-list" style="position: relative; margin:24px">
  {#if movies.length > 0}
    {#each getVisibleMovies(movies) as movie, index}
      <MovieItem
        {movie}
        {index}
        barColor={getColor(movie.popularityIndex, movies.length)}
        newYear={movie.isNewYear}
      />
    {/each}
  {:else}
    <p>Loading...</p>
  {/if}
</div>
