<script>
  import { selectedLanguages } from "../stores.js";
  import { LANGUAGEINFO, getLanguageFlag, getLanguageName } from "../constants.js";
  import { writable } from "svelte/store";

  let isDropdownOpen = false;
  let searchQuery = writable("");

  function toggleLanguageSelection(languageCode) {
    if ($selectedLanguages.includes(languageCode)) {
      selectedLanguages.update((languages) =>
        languages.filter((lang) => lang !== languageCode)
      );
    } else {
      selectedLanguages.update((languages) => [...languages, languageCode]);
    }
    setTimeout(() => {
      $searchQuery = "";
    }, 100);
  }

  $: filteredLanguages = Object.keys(LANGUAGEINFO).filter((languageCode) =>
    LANGUAGEINFO[languageCode].name
      .toLowerCase()
      .includes($searchQuery.toLowerCase())
  );
</script>

<div>
  <div class="language-menu my-3">
    <!-- Selected Genres -->
    {#if $selectedLanguages.length > 0}
      <div>
        <h6 class="text-lg font-semibold mb-2">Selected Languages:</h6>
        <div class="flex flex-wrap gap-2 mb-2">
          {#each $selectedLanguages as language}
            <div class="group">
              <span
                on:click={() => {
                  selectedLanguages.update((languages) =>
                    languages.filter((g) => g !== language)
                  );
                }}
                id="badge-dismiss-blue"
                class="inline-flex items-center px-2 py-1 me-2 text-sm font-medium text-blue-800 bg-blue-100 rounded cursor-pointer"
              >
                <span class="text-lg mr-1">{getLanguageFlag(language)}</span>
                {getLanguageName(language)}
                <button
                  type="button"
                  class="inline-flex items-center p-1 ms-2 text-sm text-blue-400 bg-transparent rounded-sm group-hover:bg-blue-200 group-hover:text-blue-900"
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
  </div>

  <button
    class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 inline-flex items-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
    on:click={() => (isDropdownOpen = !isDropdownOpen)}
  >
    Filter By Language
    <svg
      class="w-2.5 h-2.5 ml-3"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 10 6"
    >
      <path
        stroke="currentColor"
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M1 1l4 4 4-4"
      />
    </svg>
  </button>

  {#if isDropdownOpen}
    <!-- Dropdown menu -->
    <div
      class="absolute z-10 mt-2 w-60 bg-white rounded-lg shadow dark:bg-gray-700"
    >
      <div class="p-3">
        <label for="input-group-search" class="sr-only">Search</label>
        <div>
          <input
            type="text"
            id="input-group-search"
            placeholder="Search language"
            bind:value={$searchQuery}
            class="block w-full p-2 text-sm border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
            autocomplete="off"
          />
        </div>
      </div>
      <ul
        class="h-48 px-3 pb-3 overflow-y-auto text-sm text-gray-700 dark:text-gray-200"
      >
        {#each filteredLanguages as languageCode}
          <li>
            <div
              class="flex items-center px-2 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-600"
            >
              <input
                id={"checkbox-" + languageCode}
                type="checkbox"
                class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:bg-gray-600 dark:border-gray-500"
                checked={$selectedLanguages.includes(languageCode)}
                on:change={() => {
                  toggleLanguageSelection(languageCode);
                }}
              />
              <label
                for={"checkbox-" + languageCode}
                class="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300"
              >
                {LANGUAGEINFO[languageCode].name}
              </label>
            </div>
          </li>
        {/each}
      </ul>
    </div>
  {/if}
</div>

<style>
  /* Add your styles here */
</style>
