<script>
  import { selectedViewTypeVerbs } from '../stores';
  import { onDestroy } from 'svelte';
  import { verbEmojiDict } from '../constants';

  let allVerbs = Object.keys(verbEmojiDict);

  let verbs = [];
  const unsubscribe = selectedViewTypeVerbs.subscribe((value) => {
    verbs = value;
  });

  onDestroy(() => {
    unsubscribe();
  });

  // Compute unselected verbs
  $: unselectedVerbs = allVerbs.filter((verb) => !verbs.includes(verb));
</script>

<div class="genre-menu my-3">
  <!-- Selected Verbs -->
  {#if verbs.length > 0}
    <div>
      <h6 class="text-lg font-semibold mb-2">Selected Save Types:</h6>
      <div class="flex flex-wrap gap-2 mb-2">
        {#each verbs as verb}
          <div class="group">
            <span
              on:click={() => {
                selectedViewTypeVerbs.update((verbs) =>
                  verbs.filter((v) => v !== verb)
                );
              }}
              id="badge-dismiss-blue"
              class="inline-flex items-center px-2 py-1 me-2 text-sm font-medium text-blue-800 bg-blue-100 rounded cursor-pointer"
            >
              <span class="text-lg mr-1">{verbEmojiDict[verb]}</span>
              {verb}
              <button
                type="button"
                class="inline-flex items-center p-1 ms-2 text-sm text-blue-400 bg-transparent rounded-sm group-hover:bg-blue-200 group-hover:text-blue-900 "
                data-dismiss-target="#badge-dismiss-blue"
                aria-label="Remove"
              >
                <svg
                  class="w-2 h-2"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 14 14"
                >
                  <path
                    stroke="currentColor"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
                  />
                </svg>
                <span class="sr-only">Remove badge</span>
              </button>
            </span>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Available Verbs -->
  {#if unselectedVerbs.length > 0}
    <div>
      <h6 class="text-lg font-semibold mb-2">Available Save Types:</h6>
      <div class="flex flex-wrap gap-2">
        {#each unselectedVerbs as verb}
          <div>
            <span
              on:click={() => {
                selectedViewTypeVerbs.update((verbs) => [...verbs, verb]);
              }}
              id="badge-dark"
              class="inline-flex items-center px-2 py-1 me-2 text-sm font-medium text-black bg-gray-200 hover:bg-gray-300 rounded"
            >
              <span class="text-lg mr-1">{verbEmojiDict[verb]}</span>
              {verb}
            </span>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>