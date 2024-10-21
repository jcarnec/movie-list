<script>
  import { onMount } from "svelte";
  import { tick } from "svelte";
  import Header from "./components/Header.svelte";
  import MovieList from "./components/MovieList.svelte";
  import MovieDetails from "./components/MovieDetails.svelte";
  import { checkAppendPrepend, handleScroll, handleTouchStart, prepend, prependAfterFailure, queryMovies } from "./utils";
  import { queryCount, scrollY, selectedMovie, itemHeight, viewportHeight, minReviewCount, maxReviewCount, selectedPerson, minYear, selectedLanguage, selectedGenres, selectedTitle, currentMinYear, allowQueryMutex } from "./stores.js";


  let movies = [];

// Reactive statement to update movies when selectedPerson, minYear, or castOrCrewQuery changes
  $: updateMovies($minYear, $minReviewCount, $maxReviewCount, $selectedPerson, $selectedLanguage, $selectedGenres, $selectedTitle, $allowQueryMutex);

  async function updateMovies() {
    if($allowQueryMutex) {
      movies = await queryMovies(movies);
      if(!movies || movies.length == 0) {
        movies = await prependAfterFailure(movies)
      } else {
        movies = await prepend(movies)
      }
      await tick(); // Wait for the DOM to update
    } else {
      console.log('query blocked by mutex')
    }
  }

  onMount(async () => {


    document.addEventListener("wheel", async (event) => {
      movies = await handleScroll(event, movies);
    }); // Mouse wheel scroll
    document.addEventListener("touchmove", async (event) => {
      movies = await handleScroll(event, movies);
    }); // Touch scroll
    document.addEventListener("touchstart", (event) => handleTouchStart(event)); // Touch start

    return () => {
      document.addEventListener("wheel", async (event) => {
        movies = await handleScroll(event, movies);
      }); // Mouse wheel scroll
      document.addEventListener("touchmove", async (event) => {
        movies = await handleScroll(event, movies);
      }); // Touch scroll
      document.addEventListener("touchstart", (event) =>
        handleTouchStart(event)
      ); // Touch start
    };
  });
</script>

<main>
  <div class="parent-div">
    <div class="header-body">
      <div class="header-container">
        <Header />
      </div>
      <div class="body">
        <div class="movie-list-container">
          <MovieList {itemHeight} {viewportHeight} {movies} />
        </div>
        <div class="movie-details-container">
          <MovieDetails />
        </div>
      </div>
    </div>
  </div>
</main>

<style>
  :global(body) {
      font-size: 90%;
  } 

  .header-container {
    flex: 1;
    margin-right: 1rem;
    border: 1rem;
  }

  .header-body {
    display: flex;
    flex-direction: row;
  }

  .body {
    overflow: hidden;
    flex: 10;
    flex-direction: row;
    display: flex;
  }

  .movie-list-container {
    flex: 3;
    padding: 0.3rem;
  }

  .movie-details-container {
    flex: 1;
  }
</style>
