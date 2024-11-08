<script>
  import { castAndCrew } from "../stores.js";
  import { get } from "svelte/store";

  $: castList = $castAndCrew.cast;
  $: crewList = $castAndCrew.crew;
  $: director = $castAndCrew.director;
</script>

<div class="flex flex-row justify-evenly w-full">

  <div style="flex: 1;align-content: center">
    <!-- show director profile -->
    {#if director}
      <div class="flex items-center p-2 items-center profile-container">
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
  <div class="grid grid-cols-5 gap-2" style="flex: 4">
    {#each castList as person}
      <div>
        <!-- Cast Profile -->
        <div class="flex items-center p-2 profile-container">
          <img
            src={person.profile_path
              ? "https://image.tmdb.org/t/p/w185" + person.profile_path
              : "https://via.placeholder.com/48"}
            alt={person.name}
            class="rounded-full object-cover"
            style="width: 48px; height: 48px;"
          />
          <div class="ml-2" style="width: 50%;">
            <p class="text-sm font-semibold truncate">{person.name}</p>
            <p class="text-xs text-gray-500 truncate">{person.character}</p>
          </div>
        </div>
      </div>
    {/each}

    {#each crewList as person}
      <div>
        <!-- Crew Profile -->
        <div class="flex items-center p-2 profile-container">
          <img
            src={person.profile_path
              ? "https://image.tmdb.org/t/p/w185" + person.profile_path
              : "https://via.placeholder.com/48"}
            alt={person.name}
            class="rounded-full object-cover"
            style="width: 48px; height: 48px;"
          />
          <div class="ml-2" style="width: 50%;">
            <p class="text-sm font-semibold truncate">{person.name}</p>
            <p class="text-xs text-gray-500 truncate">{person.job}</p>
          </div>
        </div>
      </div>
    {/each}
  </div>
</div>

<style>
  /* Custom scrollbar styles if needed */
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

  /* Profile container style */
  .profile-container {
    transition: background-color 0.3s ease, box-shadow 0.3s ease;
    border-radius: 40px;
  }

  .profile-container:hover {
    box-shadow: 0 0px 15px rgba(0, 123, 255, 0.5); /* Blue shadow on hover */
  }
</style>
