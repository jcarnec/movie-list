import { writable, derived, get } from 'svelte/store';

export const movieCount = writable(null);

export const selectedMovie = writable(null);
export const scrollY = writable(0);
export const containerHeight = writable(0);
export const viewportHeight = writable(1500);
export const startY = writable(0);
export const queryCount = writable(0);
export const transitionCount = writable(0);
export const runningQuery = writable(false);
export const itemHeight = writable(85);
export const firstVisibleIndex = derived(
  [scrollY, itemHeight],
  ([$scrollY, $itemHeight]) => {
    return Math.floor($scrollY / $itemHeight);
  }
);

export const allowQueryMutex = writable(true)

// Default values
export const DEFAULT_TITLE = '';
export const DEFAULT_YEAR = null;
export const DEFAULT_MIN_REVIEWS = null;
export const DEFAULT_MAX_REVIEWS = null;
export const DEFAULT_PERSON = { name: '', id: null, castOrCrew: null };
export const DEFAULT_LANGUAGE = 'all';
export const DEFAULT_LANGUAGES = [];
export const DEFAULT_SELECTED_GENRES = [];
export const DEFAULT_SELECTED_VIEW_TYPE_VERBS = [];

export const DEFAULT_MIN_POPULARITY = null;
export const DEFAULT_MAX_POPULARITY = null;
export const DEFAULT_MIN_VOTE_AVERAGE = null;
export const DEFAULT_MAX_VOTE_AVERAGE = null;
export const DEFAULT_MIN_RUNTIME = null;
export const DEFAULT_MAX_RUNTIME = null;

export const selectedPerson = writable(DEFAULT_PERSON);
export const selectedLanguages = writable([]);
export const selectedGenres = writable(DEFAULT_SELECTED_GENRES);
export const selectedViewTypeVerbs = writable(DEFAULT_SELECTED_VIEW_TYPE_VERBS);
export const minYear = writable('2014');
export const minReviewCount = writable(50);
export const maxReviewCount = writable(DEFAULT_MAX_REVIEWS);
export const selectedTitle = writable('');

export const minPopularity = writable(DEFAULT_MIN_POPULARITY);
export const maxPopularity = writable(DEFAULT_MAX_POPULARITY);
export const minVoteAverage = writable(DEFAULT_MIN_VOTE_AVERAGE);
export const maxVoteAverage = writable(DEFAULT_MAX_VOTE_AVERAGE);
export const minRuntime = writable(DEFAULT_MIN_RUNTIME);
export const maxRuntime = writable(DEFAULT_MAX_RUNTIME);


export const lastAppendedID = writable(null)
export const lastPrependedID = writable(null)

export const currentSelectedPerson = writable(get(selectedPerson));
export const currentMinYear = writable(get(minYear));
export const currentMinReviewCount = writable(get(minReviewCount));
export const currentMaxReviewCount = writable(get(maxReviewCount));
export const currentSelectedTitle = writable(get(selectedTitle));


export const currentMinPopularity = writable(get(minPopularity));
export const currentMaxPopularity = writable(get(maxPopularity));
export const currentMinVoteAverage = writable(get(minVoteAverage));
export const currentMaxVoteAverage = writable(get(maxVoteAverage));
export const currentMinRuntime = writable(get(minRuntime));
export const currentMaxRuntime = writable(get(maxRuntime));

export const castAndCrew = writable(null);

selectedPerson.subscribe(value => currentSelectedPerson.set(value))
minYear.subscribe(value => currentMinYear.set(value));
minReviewCount.subscribe(value => currentMinReviewCount.set(value));
maxReviewCount.subscribe(value => currentMaxReviewCount.set(value));
minPopularity.subscribe(value => currentMinPopularity.set(value))
maxPopularity.subscribe(value => currentMaxPopularity.set(value))
minVoteAverage.subscribe(value => currentMinVoteAverage.set(value));
maxVoteAverage.subscribe(value => currentMaxVoteAverage.set(value));
minRuntime.subscribe(value => currentMinRuntime.set(value));
maxRuntime.subscribe(value => currentMaxRuntime.set(value));
selectedMovie.subscribe(value => castAndCrew.set(getTopCastAndCrew(value)))

selectedTitle.subscribe(value => currentSelectedTitle.set(value) )

function logChange(newValue) {
  console.log('log change', newValue);
}

selectedPerson.subscribe(logChange);
selectedMovie.subscribe(logChange)


selectedMovie.subscribe((value) => {
  if(value && value.title) {
    currentSelectedTitle.set(value.title)
  }
})

function getTopCastAndCrew(movie, numMembers = 5) {
    const result = {
        director: null,
        cast: [],
        crew: []
    };

    if (!movie) {
        return result;
    }

    // Find the director from the crew
    const director = movie.crew.find(member => member.job === 'Director');
    if (director) {
        result.director = director;
    }

    // Sort cast and crew by popularity
    const sortedCast = movie.cast.sort((a, b) => b.popularity - a.popularity);
    const sortedCrew = movie.crew.sort((a, b) => b.popularity - a.popularity);

    // Get top N cast and crew members (excluding the director if already included)
    result.cast = sortedCast.slice(0, numMembers)
    result.crew = sortedCrew
        .filter(member => member.job !== 'Director' && isInterestingCrewMember(member))
    // must contain writer, producer, music, cinematographer, editor, production designer, costume designer
        .slice(0, numMembers)


    console.log('cast and crew result', result)
    return result;
}

function isInterestingCrewMember(member) {
    const interestingJobs = ['Writer',  'Music', 'Cinematography', 'Editor', 'Production Design', 'Costume Design', 'Novel', 'Photography', 'Screenplay', 'Book', 'Art Direction']
    for (let job of interestingJobs) {
        if (member.job.includes(job)) {
            return true;
        }
    }
    return false;
}

