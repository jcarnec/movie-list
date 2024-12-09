import { get } from "svelte/store";

import { tick } from "svelte";
import {
  firstVisibleIndex,
  startY,
  viewportHeight,
  containerHeight,
  selectedLanguages,
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
  selectedViewTypeVerbs,
  minRuntime,
  maxRuntime,
  minPopularity,
  maxPopularity,
  minVoteAverage,
  maxVoteAverage,
} from "./stores.js";
import { allowQueryMutex, DEFAULT_MIN_REVIEWS, DEFAULT_MAX_REVIEWS, DEFAULT_YEAR, DEFAULT_TITLE, DEFAULT_SELECTED_GENRES, DEFAULT_LANGUAGES } from "./stores.js";
import { getAllRelevantIDs, history } from "./historyStore.js";
import axios from "axios";
import Movie from "./Movie.js";

export function setVoteCountIndexAndColor(movies) {
  movies.sort((a, b) => b.voteCount - a.voteCount);

  movies.forEach((movie, index) => {
    movie.voteCountIndex = index + 1;
  });

  movies.sort((a, b) => a.releaseDate - b.releaseDate);

  movies.forEach((movie, index) => {
    movie.color = getColor(movie.voteCountIndex, movies.length);
    movie.isNewYear =
      index == 0 ||
      new Date(movies[index - 1].releaseDate).getYear() !=
        new Date(movies[index].releaseDate).getYear();
  });

  return movies;
}

export function getColor(voteCountIndex, numberOfMovies) {
  let gradients = [
    // grey
    // red
    [255, 0, 0],
    [169, 169, 169],
  ];

  const numGradients = gradients.length - 1;

  // Safely calculate the ratio
  let ratio = 0;
  if (numberOfMovies > 0) {
    ratio = voteCountIndex / numberOfMovies;
  }

  // Clamp the ratio between 0 and 1
  const ratioClamped = Math.min(Math.max(ratio, 0), 1);

  // Determine which two colors to blend based on the ratio
  const scaledRatio = ratioClamped * numGradients;
  const gradientIndex = Math.min(Math.floor(scaledRatio), numGradients - 1);
  const localRatio = scaledRatio - gradientIndex;

  // Get colors for blending
  const c1 = gradients[gradientIndex];
  const c2 = gradients[gradientIndex + 1];

  // Interpolate between c1 and c2
  const color = [
    Math.floor(c1[0] + localRatio * (c2[0] - c1[0])),
    Math.floor(c1[1] + localRatio * (c2[1] - c1[1])),
    Math.floor(c1[2] + localRatio * (c2[2] - c1[2])),
  ];

  return `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
}

export async function queryDatabase(movies, append = "new", date = null) {
  if (get(runningQuery)) {
    return movies;
  }

  runningQuery.set(true);

  let target = '13.60.6.138'
  
  let url = `http://${target}:3000/movies`;
  console.log(url);

  let body = {
    originalLanguages: get(selectedLanguages),
    genres: get(selectedGenres),
    minReviewCount: get(minReviewCount),
    maxReviewCount: get(maxReviewCount),
    minRuntime: get(minRuntime),
    maxRuntime: get(maxRuntime),
    minPopularity: get(minPopularity),
    maxPopularity: get(maxPopularity),
    minVoteAverage: get(minVoteAverage),
    maxVoteAverage: get(maxVoteAverage),
    minYear: get(minYear),
    person: get(selectedPerson),
    type: append,
    title: get(selectedTitle),
  };

  if (get(selectedViewTypeVerbs) && get(selectedViewTypeVerbs).length > 0) {
    body["ids"] = getAllRelevantIDs(get(selectedViewTypeVerbs));
  }

  if (append == "append") {
    body["date"] = date || movies[movies.length - 1].releaseDate;
  } else if (append == "prepend") {
    body["date"] = date || movies[0].releaseDate;
  } else {
    body["date"] = null;
  }

  console.log('getting result')
  let res = await axios({
    method: "post",
    url: url,
    data: body,
    headers: {
      "Content-Type": "application/json",
    },
  });

  console.log('res', res)

  let movieResponse = res.data.movies;

  if (append == "new") {
    movieCount.set(res.data.count);
  }

  let newMovies = movieResponse.map((movie) => new Movie(movie));

  runningQuery.set(false);

  return newMovies;
}

export async function handleScroll(event, movies) {
  let movieListDiv = document.querySelector(".movie-list");
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

  movies = setVoteCountIndexAndColor(movies);

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
  containerHeight.set(movies.length * get(itemHeight));
  queryCount.update((n) => n + 1);

  return movies;
}

export async function prependAfterFailure() {
  console.log("prepending after failure");
  let prependDate = get(minYear);
  let newMovies = await queryDatabase([], "prepend", prependDate);
  let movies = [...newMovies];
  scrollY.update((n) => (newMovies.length - 1) * get(itemHeight));
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
  containerHeight.set(movies.length * get(itemHeight));
  queryCount.update((n) => n + 1);

  return movies;
}

export async function checkAppendPrepend(movies) {
  if (
    movies.length > 0 &&
    movies.length - get(firstVisibleIndex) < 30 &&
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
    if (get(lastPrependedID) == null || movies[0].id != get(lastPrependedID)) {
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
    movies = setVoteCountIndexAndColor(movies);
    containerHeight.set(movies.length * get(itemHeight));
  }
  queryCount.update((n) => n + 1);
  return movies;
}

export function personSelected(personQuery) {
  allowQueryMutex.set(false);
  selectedPerson.set(personQuery);
  minReviewCount.set(DEFAULT_MIN_REVIEWS);
  maxReviewCount.set(DEFAULT_MAX_REVIEWS);
  minYear.set(DEFAULT_YEAR);
  selectedTitle.set(DEFAULT_TITLE);
  selectedGenres.set(DEFAULT_SELECTED_GENRES);
  selectedLanguages.set(DEFAULT_LANGUAGES);
  allowQueryMutex.set(true);
}

export function personToPersonQuery(person) {
  return {
    id: person.id,
    name: person.name,
    castOrCrew: person.character ? "cast" : "crew",
    data: person,
  };
}
