// src/stores/windowWidthStore.js
import { writable, derived } from 'svelte/store';

function createWindowWidthStore() {
  // Initialize the store with the current window width or a default value
  const isClient = typeof window !== 'undefined';
  const initialWidth = isClient ? window.innerWidth : 0;
  const { subscribe, set } = writable(initialWidth);

  // Update the store whenever the window is resized
  if (isClient) {
    const handleResize = () => {
      console.log('handling resize', window.innerWidth)
      set(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);

    // Optionally, update the store on initial load
    handleResize();

    // Clean up the event listener when no longer needed
    // Note: In a real application, you might want to handle cleanup differently
    // depending on your store's lifecycle requirements.
  }

  return {
    subscribe,
  };
}

export const windowWidth = createWindowWidthStore();

export const isNarrow = derived(windowWidth, ($windowWidth) => $windowWidth <= 1300);