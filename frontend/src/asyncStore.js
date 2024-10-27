import { writable, derived } from 'svelte/store';

function createAsyncStore() {
  const store = writable({});
  const { subscribe, update } = store;

  async function load(key, asyncFunction, ...args) {
    if (typeof asyncFunction !== 'function') {
      throw new Error('Provided asyncFunction is not a function');
    }

    if (!key) {
      throw new Error('A unique key must be provided for each operation');
    }

    // Prevent duplicate operations
    update((state) => {
      if (state[key]?.status === 'loading') {
        throw new Error(`Operation with key "${key}" is already in progress`);
      }
      return state;
    });

    // Initialize the state for this operation
    update((state) => ({
      ...state,
      [key]: { status: 'loading', error: null, data: null },
    }));

    try {
      const data = await asyncFunction(...args);
      // Update the state with the data
      update((state) => ({
        ...state,
        [key]: { status: 'success', error: null, data },
      }));
    } catch (error) {
      // Update the state with the error
      update((state) => ({
        ...state,
        [key]: { status: 'error', error, data: null },
      }));
    }
  }

  function remove(key) {
    update((state) => {
      const { [key]: _, ...rest } = state;
      return rest;
    });
  }

  function getOperation(key) {
    let previous = {};
    return derived(
      store,
      ($store, set) => {
        const current = $store[key] || { status: null, error: null, data: null };

        // Only update if any of the values have changed
        if (
          current.status !== previous.status ||
          current.error !== previous.error ||
          current.data !== previous.data
        ) {
          previous = { ...current };
          set(current);
        }
      },
      { status: null, error: null, data: null } // Initial value
    );
  }

  return {
    subscribe,
    load,
    remove,
    getOperation,
  };
}

export default createAsyncStore;
