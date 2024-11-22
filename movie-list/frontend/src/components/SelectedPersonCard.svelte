<script>
    import { selectedPerson } from '../stores.js';

    $: person = $selectedPerson;
</script>
<div class="card">
    {#if person && person.id}
      <div>Movies with: </div>
      <div class="flex items-center p-2 items-center profile-container">
        <img
          src={person.data.profile_path
            ? "https://image.tmdb.org/t/p/w185" + person.data.profile_path
            : "https://via.placeholder.com/48"}
          alt={person.data.name}
          class="rounded-full object-cover"
          style="width: 96px; height: 96px;"
        />
        <div class="ml-2">
          <p class="text-sm font-semibold">
            {person.data.name}
          </p>
          <p class="text-xs text-gray-500">Known for: {person.data.known_for_department}</p>
        </div>
      </div>
    {/if}
</div>
<style>
</style>