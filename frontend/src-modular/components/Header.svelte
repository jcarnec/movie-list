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
    DEFAULT_LANGUAGE,
    DEFAULT_MAX_REVIEWS,
    DEFAULT_MIN_REVIEWS,
    DEFAULT_PERSON,
    DEFAULT_SELECTED_GENRES,
    DEFAULT_TITLE,
    DEFAULT_YEAR,
    movieCount,
  } from "../stores.js";

  import { LANGUAGEINFO } from "../constants.js";

  import GenreMenu from "./GenreMenu.svelte";

  function handleKeydown(event) {
    if (event.key === "Enter") {
      event.target.blur();
    }
  }

  function resetFilters() {
    selectedLanguage.set(DEFAULT_LANGUAGE);
    selectedGenres.set(DEFAULT_SELECTED_GENRES);
    minYear.set(DEFAULT_YEAR);
    minReviewCount.set(DEFAULT_MIN_REVIEWS);
    maxReviewCount.set(DEFAULT_MAX_REVIEWS);
    selectedPerson.set({ name: '', id: null, castOrCrew: null });
    currentSelectedPerson.set({ name: '', id: null, castOrCrew: null });
    currentSelectedPerson.set({ name: '', id: null, castOrCrew: null });
    currentMinYear.set(DEFAULT_YEAR);
    currentMinReviewCount.set(DEFAULT_MIN_REVIEWS);
    currentMaxReviewCount.set(DEFAULT_MAX_REVIEWS);
    currentSelectedTitle.set(DEFAULT_TITLE);
    selectedTitle.set(DEFAULT_TITLE);
  }
</script>

<div class="sidebar bg-light p-3">
  <h5 class="mb-4">Filter Options</h5>
  <form>
    <!-- Title Input -->
    <div class="mb-2">
      <div class="d-flex align-items-center">
        <div class="form-floating flex-grow-1">
          <input
            type="text"
            class="form-control"
            id="title-input"
            bind:value={$currentSelectedTitle}
            on:blur={(e) => {
              selectedTitle.set(e.target.value);
            }}
            on:keydown={handleKeydown}
            placeholder="Title"
          />
          <label for="title-input">Title</label>
        </div>
        {#if $selectedTitle !== DEFAULT_TITLE}
          <button type="button" class="btn-close ms-1 border-4" aria-label="Close"
            on:click={() => {
              $selectedTitle = DEFAULT_TITLE;
              selectedTitle.set(DEFAULT_TITLE);
            }}
          ></button>
          
        {/if}
      </div>
    </div>

    <!-- Year Input -->
    <div class="mb-2">
      <div class="form-floating">
        <input
          type="number"
          class="form-control"
          id="year-input"
          bind:value={$currentMinYear}
          on:blur={(e) => {
            minYear.set(e.target.value);
          }}
          placeholder="Year"
          on:keydown={handleKeydown}
        />
        <label for="year-input">Year</label>
      </div>
    </div>

    <!-- Min Review Count -->
    <div class="mb-2">
      <div class="d-flex align-items-center">
        <div class="form-floating flex-grow-1">
          <input
            type="number"
            class="form-control"
            id="min-review-input"
            bind:value={$currentMinReviewCount}
            on:blur={(e) => {
              if (e.target.value) {
                minReviewCount.set(e.target.value);
              }
            }}
            placeholder="Min Reviews"
            on:keydown={handleKeydown}
          />
          <label for="min-review-input">Min Reviews</label>
        </div>
        {#if $currentMinReviewCount !== DEFAULT_MIN_REVIEWS}


          <button type="button" class="btn-close ms-1 border-4" aria-label="Close"
            on:click={() => {
              $currentMinReviewCount = DEFAULT_MIN_REVIEWS;
              minReviewCount.set(DEFAULT_MIN_REVIEWS);
            }}
          >
          </button>
        {/if}
      </div>
    </div>

    <!-- Max Review Count -->
    <div class="mb-2">
      <div class="d-flex align-items-center">
        <div class="form-floating flex-grow-1">
          <input
            type="number"
            class="form-control"
            id="max-review-input"
            bind:value={$currentMaxReviewCount}
            on:blur={(e) => {
              if (e.target.value) {
                maxReviewCount.set(e.target.value);
              }
            }}
            placeholder="Max Reviews"
            on:keydown={handleKeydown}
          />
          <label for="max-review-input">Max Reviews</label>
        </div>
        {#if $currentMaxReviewCount !== DEFAULT_MAX_REVIEWS}
          <button type="button" class="btn-close ms-1 border-4" aria-label="Close"
            on:click={() => {
              $currentMinReviewCount = DEFAULT_MAX_REVIEWS;
              minReviewCount.set(DEFAULT_MAX_REVIEWS);
            }}
          >
          </button>
        {/if}
      </div>
    </div>

    <!-- Person Input -->
    <div class="mb-2">
      <div class="d-flex align-items-center">
        <div class="form-floating flex-grow-1">
          <input
            type="text"
            class="form-control"
            id="person-input"
            bind:value={$currentSelectedPerson.name}
            on:change={(e) => {
              currentSelectedPerson.set({
                name: e.target.value,
                id: null,
                castOrCrew: null,
              });
            }}
            on:blur={() => {
              selectedPerson.set($currentSelectedPerson);
              console.log($selectedPerson);
            }}
            placeholder="Person"
            on:keydown={handleKeydown}
          />

          <label for="person-input">Person</label>
        </div>
        {#if $selectedPerson.name != ""}
          <button type="button" class="btn-close ms-1 border-4" aria-label="Close"
            on:click={() => {
              selectedPerson.set({ name: "", id: null, castOrCrew: null });
            }}
          ></button>
        {/if}
      </div>
    </div>

    <!-- Language Select -->
    <div class="mb-2">
      <div class="d-flex align-items-center">
        <div class="form-floating flex-grow-1">
          <select
            class="form-select"
            id="language-select"
            bind:value={$selectedLanguage}
            placeholder="Language"
          >
            {#each Object.keys(LANGUAGEINFO) as languageCode}
              <option value={languageCode}>
                {LANGUAGEINFO[languageCode].name}
              </option>
            {/each}
            <option value="all">All</option>
          </select>
          <label for="language-select">Language</label>
        </div>
        {#if $selectedLanguage !== DEFAULT_LANGUAGE}
          <button type="button" class="btn-close ms-1 border-4" aria-label="Close"
            on:click={() => {
              selectedLanguage.set(DEFAULT_LANGUAGE);
            }}
          >
          </button>
        {/if}
      </div>
    </div>

    <!-- Genre Menu -->
    <div class="mb-2">
      <GenreMenu />
    </div>

    <!-- Reset Button -->
    <div class="mb-2">
      <h3>{$movieCount > 0 ? $movieCount : 'No'} movies! </h3>
      <button type="button" class="btn btn-primary btn-lg " on:click={resetFilters}>
        Reset Filters
      </button>
    </div>
  </form>
</div>

<style>
  .sidebar {
    width: 300px;
    overflow-y: auto;
  }

  /* Remove arrows from number inputs */
  /* For Chrome, Safari, Edge, Opera */
  input[type="number"]::-webkit-inner-spin-button,
  input[type="number"]::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  /* For Firefox */
  input[type="number"] {
    -moz-appearance: textfield;
  }

  /* Add transition for smooth effect */
  input.form-control,
  select.form-select,
  textarea.form-control {
    transition: box-shadow 0.2s ease;
  }

  /* Blue glow effect on hover */
  input.form-control:hover,
  select.form-select:hover,
  textarea.form-control:hover {
    box-shadow: 0 0 8px rgba(0, 123, 255, 0.5);
  }

</style>
