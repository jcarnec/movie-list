<script>
  import { selectedGenres } from '../stores';
  import { onDestroy } from 'svelte';

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
  const unsubscribe = selectedGenres.subscribe(value => {
    genres = value;
  });

  onDestroy(() => {
    unsubscribe();
  });

  // Compute unselected genres
  $: unselectedGenres = allGenres.filter(genre => !genres.includes(genre));
</script>

<div class="genre-menu mb-2">
  <label class="form-label">Genre</label>

  <!-- Selected Genres -->
  {#if genres.length > 0}
    <div>
      <h6>Selected Genres:</h6>
      <div class="mb-2">
        {#each genres as genre}
          <span class="badge bg-primary me-1 mb-1">
            {genreEmojiDict[genre]} {genre}
            <button
              type="button"
              class="btn-close btn-close-white btn-sm ms-1"
              aria-label="Remove"
              on:click={() => {
                selectedGenres.update(genres => genres.filter(g => g !== genre));
              }}
            ></button>
          </span>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Available Genres -->
  {#if unselectedGenres.length > 0}
    <div>
      <h6>Available Genres:</h6>
      <div>
        {#each unselectedGenres as genre}
          <span
            class="badge bg-secondary-custom me-1 mb-1"
            style="cursor: pointer;"
            on:click={() => {
              selectedGenres.update(genres => [...genres, genre]);
            }}
          >
            {genreEmojiDict[genre]} {genre}
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
    transition: background-color 0.3s; /* Add this line */
  }
  .badge.bg-secondary-custom:hover {
    background-color: #0d6efd; /* Add this line */
  }
</style>
