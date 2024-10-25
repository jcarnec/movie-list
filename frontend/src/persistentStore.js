// src/stores/persistentStore.js
import { writable } from 'svelte/store';

export function persistentStore(key, initialValue) {
    if (typeof localStorage === 'undefined') {
        return writable(initialValue);
    }

    const storedValue = localStorage.getItem(key);
    const data = storedValue ? JSON.parse(storedValue) : initialValue;

    const store = writable(data);

    store.subscribe((value) => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.error(`Error setting localStorage key "${key}":`, e);
        }
    });

    return store;
}
