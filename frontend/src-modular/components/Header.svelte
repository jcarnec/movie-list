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
            placeholder="Title"
          />
          <label for="title-input">Title</label>
        </div>
        {#if $selectedTitle !== DEFAULT_TITLE}
          <button
            type="button"
            class="btn btn-outline-secondary reset-button ms-2"
            on:click={() => {
              $selectedTitle = DEFAULT_TITLE;
              selectedTitle.set(DEFAULT_TITLE);
            }}
          >
            <!-- SVG Icon -->
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="currentColor"
              class="bi bi-x"
              viewBox="0 0 16 16"
            >
              <path
                d="M.293.293a1 1 0 011.414 0L8 6.586 14.293.293a1 1 0 111.414 1.414L9.414 8l6.293
                6.293a1 1 0 01-1.414 1.414L8
                9.414l-6.293
                6.293a1 1 0 01-1.414-1.414L6.586
                8 .293 1.707a1 1 0 010-1.414z"
              />
            </svg>
          </button>
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
              if(e.target.value) {
                minReviewCount.set(e.target.value);
              }
            }}
            placeholder="Min Reviews"
          />
          <label for="min-review-input">Min Reviews</label>
        </div>
        {#if $currentMinReviewCount !== DEFAULT_MIN_REVIEWS}
          <button
            type="button"
            class="btn btn-outline-secondary reset-button ms-2"
            on:click={() => {
              $currentMinReviewCount = DEFAULT_MIN_REVIEWS;
              minReviewCount.set(DEFAULT_MIN_REVIEWS);
            }}
          >
            <!-- SVG Icon -->
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="currentColor"
              class="bi bi-x"
              viewBox="0 0 16 16"
            >
              <path
                d="M.293.293a1 1 0 011.414 0L8 6.586 14.293.293a1 1 0
                111.414 1.414L9.414 8l6.293
                6.293a1 1 0 01-1.414 1.414L8
                9.414l-6.293
                6.293a1 1 0 01-1.414-1.414L6.586
                8 .293 1.707a1 1 0 010-1.414z"
              />
            </svg>
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
              if(e.target.value) {
                maxReviewCount.set(e.target.value);
              }
            }}
            placeholder="Max Reviews"
          />
          <label for="max-review-input">Max Reviews</label>
        </div>
        {#if $currentMaxReviewCount !== DEFAULT_MAX_REVIEWS}
          <button
            type="button"
            class="btn btn-outline-secondary reset-button ms-2"
            on:click={() => {
              $currentMaxReviewCount = DEFAULT_MAX_REVIEWS;
              maxReviewCount.set(DEFAULT_MAX_REVIEWS);
            }}
          >
            <!-- SVG Icon -->
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="currentColor"
              class="bi bi-x"
              viewBox="0 0 16 16"
            >
              <path
                d="M.293.293a1 1 0 011.414 0L8 6.586 14.293.293a1 1 0
                111.414 1.414L9.414 8l6.293
                6.293a1 1 0 01-1.414 1.414L8
                9.414l-6.293
                6.293a1 1 0 01-1.414-1.414L6.586
                8 .293 1.707a1 1 0 010-1.414z"
              />
            </svg>
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
              console.log($selectedPerson)
            }}
            placeholder="Person"
          />
          <label for="person-input">Person</label>
        </div>
        {#if $selectedPerson.name != ''}

          <button
            type="button"
            class="btn btn-outline-secondary reset-button ms-2"
            on:click={() => {
              console.log('log change', DEFAULT_PERSON)
              selectedPerson.set({ name: '', id: null, castOrCrew: null });
            }}
          >
            <!-- SVG Icon -->
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="currentColor"
              class="bi bi-x"
              viewBox="0 0 16 16"
            >
              <path
                d="M.293.293a1 1 0 011.414 0L8 6.586 14.293.293a1 1 0
                111.414 1.414L9.414 8l6.293
                6.293a1 1 0 01-1.414 1.414L8
                9.414l-6.293
                6.293a1 1 0 01-1.414-1.414L6.586
                8 .293 1.707a1 1 0 010-1.414z"
              />
            </svg>
          </button>
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
          <button
            type="button"
            class="btn btn-outline-secondary reset-button ms-2"
            on:click={() => {
              selectedLanguage.set(DEFAULT_LANGUAGE);
            }}
          >
            <!-- SVG Icon -->
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="currentColor"
              class="bi bi-x"
              viewBox="0 0 16 16"
            >
              <path
                d="M.293.293a1 1 0 011.414 0L8 6.586 14.293.293a1 1 0
                111.414 1.414L9.414 8l6.293
                6.293a1 1 0 01-1.414 1.414L8
                9.414l-6.293
                6.293a1 1 0 01-1.414-1.414L6.586
                8 .293 1.707a1 1 0 010-1.414z"
              />
            </svg>
          </button>
        {/if}
      </div>
    </div>

    <!-- Genre Menu -->
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
