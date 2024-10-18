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
  castOrCrewQuery,
  currentMinYear,
  selectedTitle,
} from "./stores";
import axios from "axios";
import Movie from "./Movie.js";

export function generateHourString(time) {
  let hours = Math.floor(time / 60);
  let minutes = time % 60;
  return `${hours}h ${minutes}m`;
}

export function setPopularityIndexAndColor(movies) {
  movies.sort((a, b) => b.popularity - a.popularity);

  movies.forEach((movie, index) => {
    movie.popularityIndex = index + 1;
  });

  movies.sort((a, b) => a.releaseDate - b.releaseDate);

  movies.forEach((movie, index) => {
    movie.color = getColor(movie.popularityIndex, movies);
  });

  return movies
}

export function getColor(popularityIndex, movies) {
  const ratio = popularityIndex / movies.length;

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

export async function queryDatabase(movies, append = "new") {

  if (get(runningQuery)) {
    return movies
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
    castOrCrewQuery: get(castOrCrewQuery),
    type: append,
    title: get(selectedTitle)
  };

  if (append == "append") {
    body["date"] = movies[movies.length - 1].releaseDate;
  } else if (append == "prepend") {
    body["date"] = movies[0].releaseDate;
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

  let movieResponse = res.data;

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
  scrollY.update((n) =>
    Math.max(0, Math.min(get(containerHeight) - get(viewportHeight), n + delta))
  );

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

export async function checkAppendPrepend(movies) {

  if (
    movies.length > 0 &&
    movies.length - get(firstVisibleIndex) < 20 &&
    !get(runningQuery)
  ) {
    console.log('appending')
    let newMovies = await queryDatabase(movies, "append");

    movies = [...movies, ...newMovies];

    movies = setPopularityIndexAndColor(movies);
    containerHeight.set(movies.length * get(itemHeight));
    queryCount.update((n) => n + 1);

    return movies;
  }

  if (
    movies.length > 0 &&
    get(firstVisibleIndex) == 0 &&
    !get(runningQuery) &&
    new Date(movies[0].releaseDate) > new Date("12/31/1902")
  ) {
    console.log('prepending')
    let newMovies = await queryDatabase(movies, "prepend");
    movies = [...newMovies, ...movies];
    scrollY.update((n) => n + newMovies.length * get(itemHeight));
    movies = setPopularityIndexAndColor(movies);
    containerHeight.set(movies.length * get(itemHeight));
    queryCount.update((n) => n + 1);

    return movies;
  }

  return movies
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
    currentMinYear.set(movies.length > 0 ? movies[0].getReleaseYear().toString() : "")
    movies = setPopularityIndexAndColor(movies);
    containerHeight.set(movies.length * get(itemHeight));
    queryCount.update((n) => n + 1);
    return movies
}

