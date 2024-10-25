<!-- MovieList.svelte -->
<script>
  import MovieItem from './MovieItem.svelte';
  import { queryCount, scrollY, itemHeight } from '../stores';
  import { getVisibleMovies, getColor } from '../utils';
  export let movies;
</script>

<div class="movie-list relative h-screen overflow-hidden " style="user-select: none; ">
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
