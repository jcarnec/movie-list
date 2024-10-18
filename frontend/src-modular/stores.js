import { writable, derived, get } from 'svelte/store';

export const selectedMovie = writable(null);
export const scrollY = writable(0);
export const containerHeight = writable(0);
export const viewportHeight = writable(1500);
export const startY = writable(0);
export const queryCount = writable(0);
export const runningQuery = writable(false);
export const itemHeight = writable(100);
export const selectedPerson = writable({ name: null, id: null, character: false});
export const firstVisibleIndex = derived(
  [scrollY, itemHeight],
  ([$scrollY, $itemHeight]) => {
    return Math.floor($scrollY / $itemHeight);
  }
);

export const selectedLanguage = writable('all');
export const selectedGenres = writable([]);
export const minYear = writable('1970');
export const minReviewCount = writable(10);
export const maxReviewCount = writable(null);
export const castOrCrewQuery = writable('both');

export const currentSelectedLanguage = writable(get(selectedLanguage));
export const currentSelectedGenres = writable(get(selectedGenres));
export const currentMinYear = writable(get(minYear));
export const currentMinReviewCount = writable(get(minReviewCount));
export const currentMaxReviewCount = writable(get(maxReviewCount));
export const currentCastOrCrewQuery = writable(get(castOrCrewQuery));

selectedLanguage.subscribe(value => currentSelectedLanguage.set(value));
selectedGenres.subscribe(value => currentSelectedGenres.set(value));
minYear.subscribe(value => currentMinYear.set(value));
minReviewCount.subscribe(value => currentMinReviewCount.set(value));
maxReviewCount.subscribe(value => currentMaxReviewCount.set(value));
castOrCrewQuery.subscribe(value => currentCastOrCrewQuery.set(value));

function setCastOrCrewQuery(person) {
  if (person.character) {
    castOrCrewQuery.set('cast');
  } else {
    castOrCrewQuery.set('crew');
  }
}

function logChange(newValue) {
  console.log(newValue);
}

selectedPerson.subscribe(logChange);
selectedPerson.subscribe(setCastOrCrewQuery);