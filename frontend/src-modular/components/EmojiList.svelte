<script>
    import {selectedGenres} from '../stores'

    export let movie;

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

</script>
<div class="emoji-list">
{#each movie.genres as genre }
    <div on:click={() => {
    if($selectedGenres.includes(genre)) {
        selectedGenres.update(genres => genres.filter(g => g !== genre));
    } else {
        selectedGenres.update(genres => [...genres, genre]);
    }
    }} class="emoji">{genreEmojiDict[genre]}</div>
{/each}
</div>
<style>
  .emoji-list {
    flex: 3;
    display: flex;
    flex-direction: row;
    align-items: center; 
    justify-content: flex-start;
  }

  .emoji {
    padding-right: 0.3rem;
  }

  .emoji:hover {
    transform: scale(1.7); /* Scale the emoji to 1.5 times its size */
    z-index: 1; /* Ensure the emoji appears above other elements */
  }

  .emoji-faded {
    opacity: 0.3; /* Faded effect */
  }

</style>