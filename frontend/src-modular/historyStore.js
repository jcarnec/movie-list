import { persistentStore } from './persistentStore.js';
import {get} from 'svelte/store'

export const settings = persistentStore('history', {
    viewedMoviesDict: {},
});

settings.subscribe((n) => {
    console.log('history store',n)
})

export function addMovie(movie) {
    settings.update(n => {
        const updatedDict = { ...n.viewedMoviesDict, [movie.id]: true };
        return { ...n, viewedMoviesDict: updatedDict };
    });
}

export function movieIsPresent(movie) {
    return get(settings).viewedMoviesDict[movie.id] || false;
}