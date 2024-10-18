<script>
  import { onMount } from "svelte";
  import { tick } from "svelte";
  import Header from "./components/Header.svelte";
  import MovieList from "./components/MovieList.svelte";
  import MovieDetails from "./components/MovieDetails.svelte";
  import { handleScroll, handleTouchStart, queryMovies } from "./utils";
  import { queryCount, scrollY, selectedMovie, itemHeight, viewportHeight, castOrCrewQuery, minReviewCount, maxReviewCount, selectedPerson, minYear, selectedLanguage } from "./stores.js";

  let movies = [];

// Reactive statement to update movies when selectedPerson, minYear, or castOrCrewQuery changes
  $: updateMovies($castOrCrewQuery, $minYear, $minReviewCount, $maxReviewCount, $selectedPerson, $selectedLanguage);

  $: console.log($selectedMovie)

  async function updateMovies() {
    movies = await queryMovies(movies);
    await tick(); // Wait for the DOM to update

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
  .header-container {
    flex: 1;
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
    flex: 1;
    padding: 5px;
  }

  .movie-details-container {
    flex: 1;
  }
</style>
