<!-- MovieList.svelte -->
<script>
  import MovieItem from './MovieItem.svelte';
  import { queryCount, scrollY, itemHeight } from '../stores';
  import { getVisibleMovies, getColor } from '../utils';
  import asyncStore from '../loadMoviesAsyncStore';
  export let movies;


  const updateMoviesAsyncRequest = asyncStore.getOperation('update-movies')
  updateMoviesAsyncRequest.subscribe(async (n) => {
    console.log('updateMoviesAsyncRequest', n)
  });
</script>

<div  style="user-select: none; ">
  {#if movies.length > 0}
    {#each getVisibleMovies(movies) as movie, index}
      <MovieItem
        {movie}
        {index}
        barColor={movie.color}
        newYear={movie.isNewYear}
      />
    {/each}
  {:else}
  <div></div>
  {/if}
</div>
