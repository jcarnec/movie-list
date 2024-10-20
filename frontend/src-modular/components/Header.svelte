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
  } from "../stores.js";

  import { LANGUAGEINFO } from "../constants.js";

  import GenreMenu from "./GenreMenu.svelte";

</script>

<div class="sidebar bg-light p-3">
  <h5 class="mb-4">Filter Options</h5>
  <form>
    <!-- Title Input -->
    <div class="mb-2">
      <label for="title-input" class="form-label">Title</label>
      <div class="input-group">
        <input
          type="text"
          class="form-control"
          id="title-input"
          bind:value={$currentSelectedTitle}
          on:blur={(e) => {
            selectedTitle.set(e.target.value);
          }}
        />
        {#if $selectedTitle !== DEFAULT_TITLE}
          <button
            type="button"
            class="btn btn-outline-secondary reset-button"
            on:click={() => {
              $selectedTitle = DEFAULT_TITLE;
              selectedTitle.set(DEFAULT_TITLE);
            }}
          >
            <!-- SVG Icon -->
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-x" viewBox="0 0 16 16">
              <path d='M.293.293a1 1 0 011.414 0L8 6.586 14.293.293a1 1 0 111.414 1.414L9.414 8l6.293 6.293a1 1 0 01-1.414 1.414L8 9.414l-6.293 6.293a1 1 0 01-1.414-1.414L6.586 8 .293 1.707a1 1 0 010-1.414z'/>
            </svg>
          </button>
        {/if}
      </div>
    </div>

    <!-- Year Input -->
    <div class="mb-2">
      <label for="year-input" class="form-label">Year</label>
      <div class="input-group">
        <input
          type="number"
          class="form-control"
          id="year-input"
          bind:value={$currentMinYear}
          on:blur={(e) => {
            minYear.set(e.target.value);
          }}
        />
      </div>
    </div>

    <!-- Min and Max Review Count -->
    <div class="mb-2">
      <div class="row">
        <div class="col-6">
          <label for="min-review-input" class="form-label">Min Reviews</label>
          <div class="input-group">
            <input
              type="number"
              class="form-control"
              id="min-review-input"
              bind:value={$currentMinReviewCount}
              on:blur={(e) => {
                minReviewCount.set(e.target.value);
              }}
            />
            {#if $currentMinReviewCount !== DEFAULT_MIN_REVIEWS}
              <button
                type="button"
                class="btn btn-outline-secondary reset-button"
                on:click={() => {
                  $currentMinReviewCount = DEFAULT_MIN_REVIEWS;
                  minReviewCount.set(DEFAULT_MIN_REVIEWS);
                }}
              >
                <!-- SVG Icon -->
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-x" viewBox="0 0 16 16">
                  <path d='M.293.293a1 1 0 011.414 0L8 6.586 14.293.293a1 1 0 111.414 1.414L9.414 8l6.293 6.293a1 1 0 01-1.414 1.414L8 9.414l-6.293 6.293a1 1 0 01-1.414-1.414L6.586 8 .293 1.707a1 1 0 010-1.414z'/>
                </svg>
              </button>
            {/if}
          </div>
        </div>
        <div class="col-6">
          <label for="max-review-input" class="form-label">Max Reviews</label>
          <div class="input-group">
            <input
              type="number"
              class="form-control"
              id="max-review-input"
              bind:value={$currentMaxReviewCount}
              on:blur={(e) => {
                maxReviewCount.set(e.target.value);
              }}
            />
            {#if $currentMaxReviewCount !== DEFAULT_MAX_REVIEWS}
              <button
                type="button"
                class="btn btn-outline-secondary reset-button"
                on:click={() => {
                  $currentMaxReviewCount = DEFAULT_MAX_REVIEWS;
                  maxReviewCount.set(DEFAULT_MAX_REVIEWS);
                }}
              >
                <!-- SVG Icon -->
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-x" viewBox="0 0 16 16">
                  <path d='M.293.293a1 1 0 011.414 0L8 6.586 14.293.293a1 1 0 111.414 1.414L9.414 8l6.293 6.293a1 1 0 01-1.414 1.414L8 9.414l-6.293 6.293a1 1 0 01-1.414-1.414L6.586 8 .293 1.707a1 1 0 010-1.414z'/>
                </svg>
              </button>
            {/if}
          </div>
        </div>
      </div>
    </div>

    <!-- Person Input -->
    <div class="mb-2">
      <label for="person-input" class="form-label">Person</label>
      <div class="input-group">
        <input
          type="text"
          class="form-control"
          id="person-input"
          bind:value={$currentSelectedPerson.name}
          on:change={(e) => {
            currentSelectedPerson.set({
              name: e.target.value,
              id: null,
              castOrCrew: null
            });
          }}
          on:blur={() => {
            selectedPerson.set($currentSelectedPerson);
          }}
        />
        {#if $currentSelectedPerson.name !== DEFAULT_PERSON.name}
          <button
            type="button"
            class="btn btn-outline-secondary reset-button"
            on:click={() => {
              currentSelectedPerson.set(DEFAULT_PERSON);
              selectedPerson.set($currentSelectedPerson);
            }}
          >
            <!-- SVG Icon -->
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-x" viewBox="0 0 16 16">
              <path d='M.293.293a1 1 0 011.414 0L8 6.586 14.293.293a1 1 0 111.414 1.414L9.414 8l6.293 6.293a1 1 0 01-1.414 1.414L8 9.414l-6.293 6.293a1 1 0 01-1.414-1.414L6.586 8 .293 1.707a1 1 0 010-1.414z'/>
            </svg>
          </button>
        {/if}
      </div>
    </div>

    <!-- Language Select -->
    <div class="mb-2">
      <label for="language-select" class="form-label">Language</label>
      <div class="input-group">
        <select
          class="form-select"
          id="language-select"
          bind:value={$selectedLanguage}
        >
          {#each Object.keys(LANGUAGEINFO) as languageCode}
            <option value={languageCode}>
              {LANGUAGEINFO[languageCode].name}
            </option>
          {/each}
          <option value="all">All</option>
        </select>
        {#if $selectedLanguage !== DEFAULT_LANGUAGE}
          <button
            type="button"
            class="btn btn-outline-secondary reset-button"
            on:click={() => {
              selectedLanguage.set(DEFAULT_LANGUAGE);
            }}
          >
            <!-- SVG Icon -->
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-x" viewBox="0 0 16 16">
              <path d='M.293.293a1 1 0 011.414 0L8 6.586 14.293.293a1 1 0 111.414 1.414L9.414 8l6.293 6.293a1 1 0 01-1.414 1.414L8 9.414l-6.293 6.293a1 1 0 01-1.414-1.414L6.586 8 .293 1.707a1 1 0 010-1.414z'/>
            </svg>
          </button>
        {/if}
      </div>
    </div>

    <div class="mb-2">
      <GenreMenu />
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

  /* Style for the reset button */
  .reset-button {
    display: flex;
    align-items: center;
  }

  .reset-button svg {
    pointer-events: none;
  }
</style>
