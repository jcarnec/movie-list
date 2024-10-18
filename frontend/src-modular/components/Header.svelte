<script>
  import {
    selectedLanguage,
    selectedGenres,
    minYear,
    minReviewCount,
    maxReviewCount,
    selectedPerson,
    currentMinYear,
    currentCastOrCrewQuery,
    currentMinReviewCount,
    currentMaxReviewCount,
    currentSelectedGenres,
    currentSelectedLanguage,
  } from "../stores.js";

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

<div class="header">
  <div class="form">
    <!-- <title-input>
      <button on:click={toggleTitleType}>
        Toggle to {get(titleType) === "english"
          ? "Original Title"
          : "English Title"}
      </button>
      <textarea bind:value={$selectedTitle} />
    </title-input> -->
    <div class="year-input">
      <label for="year">Year:</label>
      <textarea
        bind:value={$currentMinYear}
        on:blur={(e) => {
          minYear.set(e.target.value);
        }}
      ></textarea>
    </div>
    <div class="min-max">
      <div class="minReviewCount-input">
        <label for="minReviewCount">Min number of reviews:</label>
        <textarea
          bind:value={$currentMinReviewCount}
          on:blur={(e) => {
            minReviewCount.set(e.target.value);
          }}
        ></textarea>
      </div>
      <div class="maxReviewCount-input">
        <label for="maxReviewCount">Max number of reviews:</label>
        <textarea
          bind:value={$currentMaxReviewCount}
          on:blur={(e) => {
            maxReviewCount.set(e.target.value);
          }}
        ></textarea>
      </div>
    </div>
    <div>
      <label for="Person">Person:</label>
      <textarea bind:value={$selectedPerson.name}></textarea>
    </div>
    <div class="language-input">
      <label for="language">Language:</label>
      <select bind:value={$selectedLanguage}>
        <option value="en">English</option>
        <option value="fr">French</option>
        <option value="es">Spanish</option>
        <option value="de">German</option>
        <option value="ja">Japanese</option>
        <option value="it">Italian</option>
        <option value="all">All</option>
      </select>
    </div>
  </div>

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
</div>

<style>
  .genre-menu {
    flex: 1;
  }

  .form {
    flex: 1;
  }

  .genre-selection {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 30px 10px;
  }

  .header {
    display: flex;
    flex-direction: column;
  }
</style>
