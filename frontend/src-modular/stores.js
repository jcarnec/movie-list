import { writable, derived, get } from 'svelte/store';

export const selectedMovie = writable(null);
export const scrollY = writable(0);
export const containerHeight = writable(0);
export const viewportHeight = writable(1500);
export const startY = writable(0);
export const queryCount = writable(0);
export const runningQuery = writable(false);
export const itemHeight = writable(85);
export const firstVisibleIndex = derived(
  [scrollY, itemHeight],
  ([$scrollY, $itemHeight]) => {
    return Math.floor($scrollY / $itemHeight);
  }
);

export const selectedPerson = writable({ name: '', id: null, castOrCrew: null});
export const selectedLanguage = writable('all');
export const selectedGenres = writable([]);
export const minYear = writable('2014');
export const minReviewCount = writable(10);
export const maxReviewCount = writable(null);
export const selectedTitle = writable('');

export const lastAppendedID = writable(null)
export const lastPrependedID = writable(null)

export const currentSelectedPerson = writable(get(selectedPerson));
export const currentMinYear = writable(get(minYear));
export const currentMinReviewCount = writable(get(minReviewCount));
export const currentMaxReviewCount = writable(get(maxReviewCount));
export const currentSelectedTitle = writable(get(selectedTitle));


selectedPerson.subscribe(value => currentSelectedPerson.set(value))
minYear.subscribe(value => currentMinYear.set(value));
minReviewCount.subscribe(value => currentMinReviewCount.set(value));
maxReviewCount.subscribe(value => currentMaxReviewCount.set(value));
selectedTitle.subscribe(value => currentSelectedTitle.set(value) )

function logChange(newValue) {
  console.log(newValue);
}
selectedPerson.subscribe(logChange);
selectedMovie.subscribe(logChange)


selectedMovie.subscribe((value) => {
  if(value && value.title) {
    currentSelectedTitle.set(value.title)
  }
})