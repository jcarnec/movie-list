<script>
  import {
    selectedLanguages,
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
    DEFAULT_LANGUAGES,
    DEFAULT_MAX_REVIEWS,
    DEFAULT_MIN_REVIEWS,
    DEFAULT_PERSON,
    DEFAULT_SELECTED_GENRES,
    DEFAULT_TITLE,
    DEFAULT_YEAR,
    movieCount,
  } from "../stores.js";

  import { LANGUAGEINFO } from "../constants.js";
  import InputWithClear from "../components/InputWithClear.svelte";

  import GenreMenu from "./GenreMenu.svelte";
  import SaveMenu from "./SaveMenu.svelte";
  import LanguageSelect from "./LanguageSelect.svelte";

  function handleKeydown(event) {
    if (event.key === "Enter") {
      event.target.blur();
    }
  }

  function resetFilters() {
    selectedLanguages.set(DEFAULT_LANGUAGES);
    selectedGenres.set(DEFAULT_SELECTED_GENRES);
    minYear.set(DEFAULT_YEAR);
    minReviewCount.set(DEFAULT_MIN_REVIEWS);
    maxReviewCount.set(DEFAULT_MAX_REVIEWS);
    selectedPerson.set({ name: "", id: null, castOrCrew: null });
    currentSelectedPerson.set({ name: "", id: null, castOrCrew: null });
    currentMinYear.set(DEFAULT_YEAR);
    currentMinReviewCount.set(DEFAULT_MIN_REVIEWS);
    currentMaxReviewCount.set(DEFAULT_MAX_REVIEWS);
    currentSelectedTitle.set(DEFAULT_TITLE);
    selectedTitle.set(DEFAULT_TITLE);
  }
</script>

<div class="h-screen overflow-y-auto custom-scrollbar">
<div class="card w-80 bg-base-200 shadow-xl m-10 ">
  <div class="card-body">
    <h5 class="text-xl font-bold mb-2">Filter Options</h5>
    <form class="space-y-4">
      <!-- Title Input -->
      <div class="form-control">
        <InputWithClear
          id="title-input"
          label="Title"
          bind:bindValue={$currentSelectedTitle}
          defaultValue={DEFAULT_TITLE}
          onBlur={(e) => selectedTitle.set(e.target.value)}
          onKeydown={handleKeydown}
          onClear={() => {
            $currentSelectedTitle = DEFAULT_TITLE;
            selectedTitle.set(DEFAULT_TITLE);
          }}
        />
      </div>

      <!-- Year Input -->
      <div class="form-control">
        <InputWithClear
          id="year-input"
          label="Year"
          bind:bindValue={$currentMinYear}
          defaultValue={null}
          onBlur={(e) => minYear.set(e.target.value)}
          onKeydown={handleKeydown}
          onClear={null}
        />
      </div>

      <!-- input with clear -->
      <div>
        <InputWithClear
          id="title-input"
          label="Min Reviews"
          bind:bindValue={$currentMinReviewCount}
          defaultValue={DEFAULT_MIN_REVIEWS}
          onBlur={(e) => minReviewCount.set(e.target.value)}
          onKeydown={handleKeydown}
          onClear={() => {
            $currentMinReviewCount = DEFAULT_MIN_REVIEWS;
            minReviewCount.set(DEFAULT_MIN_REVIEWS);
          }}
        />
      </div>

      <!-- Max Review Count -->
      <div class="form-control">
        <InputWithClear
          id="title-input"
          label="Max Reviews"
          bind:bindValue={$currentMaxReviewCount}
          defaultValue={DEFAULT_MAX_REVIEWS}
          onBlur={(e) => maxReviewCount.set(e.target.value)}
          onKeydown={handleKeydown}
          onClear={() => {
            $currentMaxReviewCount = DEFAULT_MAX_REVIEWS;
            maxReviewCount.set(DEFAULT_MAX_REVIEWS);
          }}
        />
      </div>

      <!-- person input with clear -->
      <div>
        <InputWithClear
          id="title-input"
          label="Person"
          bind:bindValue={$currentSelectedPerson.name}
          defaultValue={""}
          onBlur={(e) =>
            selectedPerson.set({
              name: e.target.value,
              id: null,
              castOrCrew: null,
            })}
          onKeydown={handleKeydown}
          onClear={() => {
            selectedPerson.set({ name: "", id: null, castOrCrew: null });
            currentSelectedPerson.set({ name: "", id: null, castOrCrew: null });
          }}
        />
      </div>

      <div>
        <LanguageSelect></LanguageSelect>
      </div>

      <!-- Genre Menu -->
      <div>
        <GenreMenu />
      </div>

      <!-- Save Menu -->
      <div>
        <SaveMenu />
      </div>

      <!-- Reset Button -->
      <div class="mt-6 text-center">
        <h3 class="font-semibold">
          {#if $movieCount > 0}
            {$movieCount} movies!
          {:else}
            No movies!
          {/if}
        </h3>
        <button
          type="button"
          class="btn btn-primary mt-2"
          on:click={resetFilters}
        >
          Reset Filters
        </button>
      </div>
    </form>
  </div>
</div>
</div>

<style>
  /* Customize the scrollbar if necessary */
  .card-body {
    overflow-y: auto;
  }


  /* Hide scrollbar for WebKit browsers (Chrome, Safari) */
  .custom-scrollbar::-webkit-scrollbar {
    width: 0;
    height: 0;
  }

  /* Hide scrollbar for Firefox */
  .custom-scrollbar {
    scrollbar-width: none; /* Firefox */
  }
</style>
