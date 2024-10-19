<script>
  import {
    selectedLanguage,
    selectedGenres,
    minYear,
    minReviewCount,
    maxReviewCount,
    selectedPerson,
    currentSelectedPerson,
    currentMinYear,
    currentMinReviewCount,
    currentMaxReviewCount,
    currentSelectedTitle,
    selectedTitle,
  } from "../stores.js";

  import {LANGUAGEINFO} from "../constants.js"

  import GenreMenu from "./GenreMenu.svelte";
</script>

<div class="header">
  <div class="form">
    <title-input>
      <textarea
        bind:value={$currentSelectedTitle}
        on:blur={(e) => {
          selectedTitle.set(e.target.value);
        }}
      />
    </title-input>
    <div class="year-input">
      <label for="year">Year:</label>
      <textarea
        bind:value={$currentMinYear}
        on:blur={(e) => {
          minYear.set(e.target.value);
        }}
      ></textarea>
    </div>
    <div class="min-max-input">
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
    <div class="person-input">
      <label for="Person">Person:</label>
      <textarea
        bind:value={$currentSelectedPerson.name}
        on:change={(e) => {
          currentSelectedPerson.set({
            name: e.target.value,
            id: null,
            castOrCrew: null
          });
        }}
        on:blur={(e) => {
          selectedPerson.set($currentSelectedPerson);
        }}
      ></textarea>
    </div>
    <div class="language-input">
      <label for="language">Language:</label>
      <select bind:value={$selectedLanguage}>
        {#each Object.keys(LANGUAGEINFO) as languageCode}
          <option value={languageCode}>{LANGUAGEINFO[languageCode].name}</option>
        {/each}
        <option value="all">All</option>
      </select>
    </div>
  </div>

  <div>
    <GenreMenu />
  </div>
</div>

<style>
  .form {
    flex: 1;
  }

  .header {
    display: flex;
    flex-direction: column;
  }
</style>
