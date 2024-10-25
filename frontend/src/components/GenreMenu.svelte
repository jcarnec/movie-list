<script>
  import { selectedGenres } from "../stores";
  import { onDestroy } from "svelte";

  const genreEmojiDict = {
    Documentary: "📚",
    Adventure: "🧗",
    "Science Fiction": "👽",
    Comedy: "😂",
    Fantasy: "🧙",
    Horror: "👻",
    Drama: "🎭",
    History: "🏰",
    War: "⚔️",
    Romance: "❤️",
    Thriller: "😱",
    Crime: "🔪",
    Action: "💥",
    Mystery: "🕵️‍♂️",
    Music: "🎵",
    Family: "👨‍👩‍👧‍👦",
    Animation: "🎨",
    Western: "🤠",
    "TV Movie": "📺",
  };

  let allGenres = Object.keys(genreEmojiDict);

  let genres = [];
  const unsubscribe = selectedGenres.subscribe((value) => {
    genres = value;
  });

  onDestroy(() => {
    unsubscribe();
  });

  // Compute unselected genres
  $: unselectedGenres = allGenres.filter((genre) => !genres.includes(genre));
</script>

<div class="genre-menu my-3">
  <!-- Selected Genres -->
  {#if genres.length > 0}
    <div>
      <h6 class="text-lg font-semibold mb-2">Selected Genres:</h6>
      <div class="flex flex-wrap gap-2 mb-2">
        {#each genres as genre}
          <div class="group">
            <span
              on:click={() => {
                selectedGenres.update((genres) =>
                  genres.filter((g) => g !== genre)
                );
              }}
              id="badge-dismiss-blue"
              class="inline-flex items-center px-2 py-1 me-2 text-sm font-medium text-blue-800 bg-blue-100 rounded cursor-pointer"
            >
              <span class="text-lg mr-1">{genreEmojiDict[genre]}</span>
              {genre}
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

  <!-- Available Genres -->
  {#if unselectedGenres.length > 0}
    <div>
      <h6 class="text-lg font-semibold mb-2">Available Genres:</h6>
      <div class="flex flex-wrap gap-2">
        {#each unselectedGenres as genre}
          <div>
            <span
              on:click={() => {
                selectedGenres.update(
                  (genres) => (genres = [...genres, genre])
                );
              }}
              id="badge-dark"
              class="inline-flex items-center px-2 py-1 me-2 text-sm font-medium text-black bg-gray-200 hover:bg-gray-300 rounded"
            >
              <span class="text-lg mr-1">{genreEmojiDict[genre]}</span>
              {genre}
            </span>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>
