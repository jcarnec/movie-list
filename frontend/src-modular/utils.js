import { get } from "svelte/store";
import { tick } from "svelte";
import {
  firstVisibleIndex,
  startY,
  viewportHeight,
  containerHeight,
  selectedLanguage,
  selectedGenres,
  minReviewCount,
  maxReviewCount,
  minYear,
  runningQuery,
  scrollY,
  itemHeight,
  queryCount,
  selectedPerson,
  currentMinYear,
  selectedTitle,
  lastAppendedID,
  lastPrependedID,
  movieCount,
  selectedViewTypeVerbs
  
} from "./stores";
import { getAllRelevantIDs, history } from "./historyStore.js";
import axios from "axios";
import Movie from "./Movie.js";

export function setPopularityIndexAndColor(movies) {
  movies.sort((a, b) => b.popularity - a.popularity);

  movies.forEach((movie, index) => {
    movie.popularityIndex = index + 1;
  });

  movies.sort((a, b) => a.releaseDate - b.releaseDate);

  movies.forEach((movie, index) => {
    movie.color = getColor(movie.popularityIndex, movies);
    movie.isNewYear =
      index == 0 ||
      new Date(movies[index - 1].releaseDate).getYear() !=
        new Date(movies[index].releaseDate).getYear();
  });

  return movies;
}

export function getColor(popularityIndex, numberOfMovies) {
  const ratio = popularityIndex / numberOfMovies;

  // get color between blue and gold

  let c1 = [0, 0, 255];
  let c2 = [255, 215, 0];

  let color = [
    Math.floor(c2[0] + ratio * (c1[0] - c2[0])),
    Math.floor(c2[1] + ratio * (c1[1] - c2[1])),
    Math.floor(c2[2] + ratio * (c1[2] - c2[2])),
  ];

  return `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
}

export async function queryDatabase(movies, append = "new", date = null) {
  if (get(runningQuery)) {
    return movies;
  }

  runningQuery.set(true);
  let url = "http://localhost:3000/movies";

  let body = {
    originalLanguage: get(selectedLanguage),
    genres: get(selectedGenres),
    minReviewCount: get(minReviewCount),
    maxReviewCount: get(maxReviewCount),
    minYear: get(minYear),
    person: get(selectedPerson),
    type: append,
    title: get(selectedTitle),
  };

  if(get(selectedViewTypeVerbs) && get(selectedViewTypeVerbs).length > 0) {
    body['ids'] = getAllRelevantIDs(get(selectedViewTypeVerbs))
  }

  if (append == "append") {
    body["date"] = date || movies[movies.length - 1].releaseDate;
  } else if (append == "prepend") {
    body["date"] = date || movies[0].releaseDate;
  } else {
    body["date"] = null;
  }

  let res = await axios({
    method: "post",
    url: url,
    data: body,
    headers: {
      "Content-Type": "application/json",
    },
  });

  let movieResponse = res.data.movies;

  if(append == 'new') {
    movieCount.set(res.data.count);
  }

  let newMovies = movieResponse.map((movie) => new Movie(movie));

  runningQuery.set(false);

  return newMovies;
}

export async function handleScroll(event, movies) {
  let movieListDiv = document.querySelector(".movie-list-container");
  let cursorPositionX = event.clientX;
  let cursorPositionY = event.clientY;
  if (movieListDiv) {
    let rect = movieListDiv.getBoundingClientRect();

    if (!(cursorPositionY > rect.top && cursorPositionY < rect.bottom)) {
      return movies;
    } else if (!(cursorPositionX > rect.left && cursorPositionX < rect.right)) {
      return movies;
    }
  }

  const delta = event.deltaY || event.touches[0].clientY - get(startY);
  scrollY.update((n) => Math.max(0, n + delta));

  startY.set(event.touches ? event.touches[0].clientY : startY);

  currentMinYear.set(
    movies.length > 0 && get(firstVisibleIndex) < movies.length
      ? movies[get(firstVisibleIndex)].getReleaseYear().toString()
      : ""
  );

  movies = await checkAppendPrepend(movies);

  event.preventDefault();

  return movies;
}

export function handleTouchStart(event) {
  startY.set(event.touches[0].clientY);
}

export async function append(movies) {
  console.log("appending");
  let newMovies = await queryDatabase(movies, "append");
  movies = [...movies, ...newMovies];
  movies = setPopularityIndexAndColor(movies);
  containerHeight.set(movies.length * get(itemHeight));
  queryCount.update((n) => n + 1);

  return movies;
}

export async function prependAfterFailure() {
  console.log("prepending after failure");
  let prependDate = get(currentMinYear);
  let newMovies = await queryDatabase([], "prepend", prependDate);
  let movies = [...newMovies];
  scrollY.update((n) => (newMovies.length - 1) * get(itemHeight));
  movies = setPopularityIndexAndColor(movies);
  containerHeight.set(movies.length * get(itemHeight));
  queryCount.update((n) => n + 1);

  return movies;
}

export async function prepend(movies) {
  console.log("prepending");
  let prependDate = null;

  if (!movies || movies.length == 0) {
    prependDate = get(currentMinYear);
  }

  let newMovies = await queryDatabase(movies, "prepend", prependDate);
  movies = [...newMovies, ...movies];
  scrollY.update((n) => newMovies.length * get(itemHeight));
  movies = setPopularityIndexAndColor(movies);
  containerHeight.set(movies.length * get(itemHeight));
  queryCount.update((n) => n + 1);

  return movies;
}

export async function checkAppendPrepend(movies) {
  if (
    movies.length > 0 &&
    movies.length - get(firstVisibleIndex) < 20 &&
    !get(runningQuery)
  ) {
    if (
      get(lastAppendedID) == null ||
      movies[movies.length - 1].id != get(lastAppendedID)
    ) {
      lastAppendedID.set(movies[movies.length - 1].id);
      movies = await append(movies);
    }
  }

  if (
    movies.length > 0 &&
    get(firstVisibleIndex) == 0 &&
    !get(runningQuery) &&
    new Date(movies[0].releaseDate) > new Date("12/31/1902")
  ) {
    if (
      get(lastPrependedID) == null ||
      movies[0].id != get(lastPrependedID)
    ) {
      lastPrependedID.set(movies[0].id);
      movies = await prepend(movies);
    }
  }

  return movies;
}

export function getVisibleMovies(movies) {
  const startIndex = Math.floor(get(scrollY) / get(itemHeight));
  const endIndex = Math.min(
    movies.length,
    Math.ceil((get(scrollY) + get(viewportHeight)) / get(itemHeight))
  );
  return movies.slice(startIndex, endIndex);
}

export async function queryMovies(movies) {
  movies = await queryDatabase(movies, "new");
  scrollY.set(0);
  if (movies && movies.length !== 0) {
    currentMinYear.set(
      movies.length > 0 ? movies[0].getReleaseYear().toString() : ""
    );
    movies = setPopularityIndexAndColor(movies);
    containerHeight.set(movies.length * get(itemHeight));
  }
  queryCount.update((n) => n + 1);
  return movies;
}
