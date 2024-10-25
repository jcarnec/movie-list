<script>
  import { onMount } from "svelte";
  import { tick } from "svelte";
  import Header from "./components/Header.svelte";
  import MovieList from "./components/MovieList.svelte";
  import MovieDetails from "./components/MovieDetails.svelte";
  import './styles/global.css'
  import { checkAppendPrepend, handleScroll, handleTouchStart, prepend, prependAfterFailure, queryMovies } from "./utils";
  import { queryCount, scrollY, selectedMovie, itemHeight, viewportHeight, minReviewCount, maxReviewCount, selectedPerson, minYear, selectedLanguages, selectedGenres, selectedTitle, currentMinYear, allowQueryMutex, selectedViewTypeVerbs } from "./stores.js";


  let movies = [];

// Reactive statement to update movies when selectedPerson, minYear, or castOrCrewQuery changes
  $: updateMovies($minYear, $minReviewCount, $maxReviewCount, $selectedPerson, $selectedLanguages, $selectedGenres, $selectedTitle, $allowQueryMutex, $selectedViewTypeVerbs);

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
    handleResize();
    window.addEventListener('resize', handleResize);
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
      window.removeEventListener('resize', handleResize);
    };
  });

  let showLeftSidebar = false;
  let showRightSidebar = false;
  let smallScreen = true;

  function handleResize() {
    smallScreen = window.matchMedia('(max-width: 639px)').matches;
    if (!smallScreen) {
      showLeftSidebar = true;
      showRightSidebar = true;
    } else {
      showLeftSidebar = false;
      showRightSidebar = false;
    }
  }

</script>

<main class="flex">
    <div class="flex-shrink-0 basis-[15%]">
      <Header />
    </div>
    <div class="flex-grow basis-[70%]">
      <MovieList {itemHeight} {viewportHeight} {movies} />
    </div>
    <div class="flex-shrink-0 basis-[15%]">
      <MovieDetails />
    </div>
</main>
