<script>
  import { onMount } from "svelte";
  import { tick } from "svelte";
  import Header from "./components/Header.svelte";
  import MovieList from "./components/MovieList.svelte";
  import MovieDetails from "./components/MovieDetails.svelte";
  import "./styles/global.css";
  import {
    checkAppendPrepend,
    handleScroll,
    handleTouchStart,
    prepend,
    prependAfterFailure,
    queryMovies,
    setVoteCountIndexAndColor,
  } from "./utils";
  import {
    queryCount,
    scrollY,
    selectedMovie,
    itemHeight,
    viewportHeight,
    minReviewCount,
    maxReviewCount,
    maxRuntime,
    minRuntime,
    selectedPerson,
    minYear,
    selectedLanguages,
    selectedGenres,
    selectedTitle,
    currentMinYear,
    allowQueryMutex,
    selectedViewTypeVerbs,
    minPopularity,
    maxPopularity,
    minVoteAverage,
    maxVoteAverage,
    transitionCount,
  } from "./stores.js";
  import asyncStore from "./loadMoviesAsyncStore";
  import CastAndCrewCard from "./components/CastAndCrewCard.svelte";

  let movies = [];

  // Reactive statement to update movies when selectedPerson, minYear, or castOrCrewQuery changes
  $: asyncStore.load(
    "update-movies",
    updateMovies,
    ($minYear,
    $minReviewCount,
    $maxReviewCount,
    $selectedPerson,
    $selectedLanguages,
    $selectedGenres,
    $selectedTitle,
    $allowQueryMutex,
    $selectedViewTypeVerbs,
    $minRuntime,
    $maxRuntime,
    $minPopularity,
    $maxPopularity,
    $minVoteAverage,
    $maxVoteAverage)
  );

  async function updateMovies() {
    if ($allowQueryMutex) {
      transitionCount.update((n) => n + 1);
      let new_movies = await queryMovies(movies);
      new_movies = await queryMovies(new_movies);
      if (!new_movies || new_movies.length == 0) {
        new_movies = await prependAfterFailure(new_movies);
      } else {
        new_movies = await prepend(new_movies);
      }
      console.log("new_movies", new_movies);
      new_movies = setVoteCountIndexAndColor(new_movies);
      console.log("new_movies 2", new_movies);
      movies = [...new_movies];
    } else {
      console.log("query blocked by mutex");
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
    window.addEventListener("resize", handleResize);
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
      window.removeEventListener("resize", handleResize);
    };
  });

  let showLeftSidebar = false;
  let showRightSidebar = false;
  let smallScreen = true;

  function handleResize() {
    smallScreen = window.matchMedia("(max-width: 639px)").matches;
    if (!smallScreen) {
      showLeftSidebar = true;
      showRightSidebar = true;
    } else {
      showLeftSidebar = false;
      showRightSidebar = false;
    }
  }

  // New reactive variable to control slide-in
  let showSlidingDiv = false;

  onMount(() => {
    // Trigger the slide-in after the component mounts
    showSlidingDiv = true;
  });
</script>

<main class="flex">
  <div class="flex-shrink-0 basis-[10%]">
    <Header />
  </div>
  <div class="movie-list flex-grow basis-[80%] h-screen relative overflow-hidden">
    <div class="sliding-div bg-base-200 rounded-b-lg" class:slide-in={showSlidingDiv}>
      <!-- Content for the sliding div goes here -->
      <CastAndCrewCard></CastAndCrewCard>
    </div>
    <MovieList {itemHeight} {viewportHeight} {movies} />
  </div>
  <div class="flex-shrink-0 basis-[10%]">
    <MovieDetails />
  </div>
</main>

<style>
  /* Position the sliding div off-screen at first */
  .sliding-div {
    position: relative;
    top: -150px; /* Starting position off-screen */
    left: 0;
    height: 150px; /* Adjust height as needed */
    display: flex;
    align-items: center;
    justify-content: center;
    transition: top 0.5s ease; /* Smooth slide effect */
    z-index: 1000;
  }

  /* Add class to slide in */
  .slide-in {
    top: 0; /* Position at the top of the viewport */
  }

</style>
