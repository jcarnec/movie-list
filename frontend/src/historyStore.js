import { persistentStore } from './persistentStore.js';
import {get} from 'svelte/store'

export const history = persistentStore('history', {
    viewedMoviesDict: {},
});

history.subscribe((n) => {
    console.log('history store',n)
})

export function addMovie(movie, verb = 'seen') {
    history.update(n => {
        n.viewedMoviesDict[movie.id] = verb
        const updatedDict = { ...n.viewedMoviesDict };
        return { ...n, viewedMoviesDict: updatedDict };
    });
}

export function movieIsPresent(movie) {
    return (get(history).viewedMoviesDict[movie.id] || false);
}

export function getMovieViewedType(movie) {
    return get(history).viewedMoviesDict[movie.id] || null;
}

export function getAllRelevantIDs(verbs) {
    const viewedMoviesDict = get(history).viewedMoviesDict;
    return Object.entries(viewedMoviesDict)
        .filter(([id, verb]) => verbs.includes(verb))
        .map(([id]) => id);
}