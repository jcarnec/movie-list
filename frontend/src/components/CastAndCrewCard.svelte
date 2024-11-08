<script>
  import { castAndCrew } from "../stores.js";
  import { get } from "svelte/store";

  $: castList = $castAndCrew.cast;
  $: crewList = $castAndCrew.crew;
  $: director = $castAndCrew.director;
</script>

<div class="flex flex-row">
  <div class="flex w-3/4 flex-col overflow-y-auto" style="height: 100%;">
    <!-- Cast Column -->
    <div
      id="should-be-half-the-height"
      class="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 flex-1 flex flex-row"
    >
      {#each castList as person}
        <div class="flex-1 flex items-center p-2">
          <img
            src={person.profile_path
              ? "https://image.tmdb.org/t/p/w185" + person.profile_path
              : "https://via.placeholder.com/48"}
            alt={person.name}
            class="rounded-full object-cover"
            style="width: 48px; height: 48px;"
          />
          <div class="ml-2">
            <p class="text-sm font-semibold">{person.name}</p>
            <p class="text-xs text-gray-500">{person.character}</p>
          </div>
        </div>
      {/each}
    </div>

    <!-- Crew Column -->
    <div
      class="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 flex-1 flex flex-row justify-center align-middle"
    >
      {#each crewList as person}
        <div class="flex-1 flex items-center p-2">
          <img
            src={person.profile_path
              ? "https://image.tmdb.org/t/p/w185" + person.profile_path
              : "https://via.placeholder.com/48"}
            alt={person.name}
            class="rounded-full object-cover"
            style="width: 48px; height: 48px;"
          />
          <div class="ml-2">
            <p class="text-sm font-semibold">{person.name}</p>
            <p class="text-xs text-gray-500">{person.job}</p>
          </div>
        </div>
      {/each}
    </div>
  </div>
  <div class="w-1/4">
    <!-- show director profile -->
    {#if director}
    <div class="flex items-center p-2">
      <img
        src={director.profile_path
          ? "https://image.tmdb.org/t/p/w185" + director.profile_path
          : "https://via.placeholder.com/48"}
        alt={director.name}
        class="rounded-full object-cover"
        style="width: 96px; height: 96px;"
      />
      <div class="ml-2">
        <p class="text-sm font-semibold">
          {director.name}
        </p>
        <p class="text-xs text-gray-500">Director</p>
      </div>
    </div>
    {/if}
  </div>
</div>

<style>
  /* Custom scrollbar styles */
  .scrollbar-thin::-webkit-scrollbar {
    width: 6px;
  }
  .scrollbar-thin::-webkit-scrollbar-track {
    background: #f1f1f1;
  }
  .scrollbar-thin::-webkit-scrollbar-thumb {
    background-color: #c1c1c1;
    border-radius: 3px;
  }
</style>
