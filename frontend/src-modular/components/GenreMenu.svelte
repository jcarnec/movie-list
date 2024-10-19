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

  let genres = [];

  const unsubscribe = selectedGenres.subscribe(value => {
    genres = value;
  });

  onDestroy(() => {
    unsubscribe();
  });
</script>

<div class="genre-menu">
  <label for="genre">Genre:</label>
  <div class="genre-selection">
    {#each Object.keys(genreEmojiDict) as genre}
      <div style="display: flex;">
        <div style="padding-right: 10px">
          <input
            type="checkbox"
            id={genre}
            name={genre}
            value={genre}
            checked={genres.includes(genre)}
            on:change={(e) => {
              if (e.target.checked) {
                selectedGenres.update((genres) => [...genres, genre]);
              } else {
                selectedGenres.update((genres) =>
                  genres.filter((g) => g !== genre)
                );
              }
            }}
          />
        </div>
        <label style="display:inline" for={genre}
          >{genreEmojiDict[genre] + " " + genre}</label
        >
      </div>
    {/each}
  </div>
</div>

<style>
</style>
