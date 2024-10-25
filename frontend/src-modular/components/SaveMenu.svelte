<script>
  import { selectedViewTypeVerbs } from '../stores';
  import { onDestroy } from 'svelte';
  import { verbEmojiDict } from '../constants';



  let allVerbs = Object.keys(verbEmojiDict);

  let verbs = [];
  const unsubscribe = selectedViewTypeVerbs.subscribe(value => {
    verbs = value;
  });

  onDestroy(() => {
    unsubscribe();
  });

  // Compute unselected genres
  $: unselectedVerbs = allVerbs.filter(genre => !verbs.includes(genre));
</script>

<div class="genre-menu my-3">

  <!-- Selected Genres -->
  {#if verbs.length > 0}
    <div>
      <h6>Selected save type:</h6>
      <div class="mb-2">
        {#each verbs as verb}
          <span class="badge bg-primary me-1 mb-1">
            {verbEmojiDict[verb]} {verb}
            <button
              type="button"
              class="btn-close btn-close-white btn-sm ms-1"
              aria-label="Remove"
              on:click={() => {
                selectedViewTypeVerbs.update(verbs => verbs.filter(g => g !== verb));
              }}
            ></button>
          </span>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Available Genres -->
  {#if unselectedVerbs.length > 0}
    <div>
      <h6>Available save types:</h6>
      <div>
        {#each unselectedVerbs as verb}
          <span
            class="badge bg-secondary-custom me-1 mb-1"
            style="cursor: pointer;"
            on:click={() => {
              selectedViewTypeVerbs.update(v => [...v, verb]);
            }}
          >
            {verbEmojiDict[verb]} {verb}
          </span>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  .badge {
    font-size: 1em;
    display: inline-flex;
    align-items: center;
    padding-right: 0.5em;
  }
  .badge .btn-close {
    margin-left: 0.5em;
  }
  .badge.bg-primary {
    background-color: #0d6efd;
  }

 .badge.bg-secondary-custom {
    background-color: #6c757d;
    transition: background-color 0.2s; /* Add this line */
  }
  .badge.bg-secondary-custom:hover {
    background-color: #0d6efd; /* Add this line */
  }
</style>
