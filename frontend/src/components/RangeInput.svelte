<script>
  export let id = "";
  export let labelStart = "";
  export let labelEnd = "";
  export let bindValueStart;
  export let bindValueEnd;
  export let defaultValueStart = "";
  export let defaultValueEnd = "";
  export let onBlurStart;
  export let onBlurEnd;
  export let onKeydownStart;
  export let onKeydownEnd;
  export let onClearStart;
  export let onClearEnd;
</script>

<div class="flex items-center space-x-4">
  <div class="relative w-full">
    <input
      id={`${id}-start`}
      type="number"
      bind:value={bindValueStart}
      on:blur={onBlurStart}
      on:keydown={onKeydownStart}
      placeholder=" "
      class="block w-full px-2.5 pb-1.5 pt-4 text-sm text-gray-900 bg-gray-50 border-0 border-b-2 border-gray-300 rounded-t-lg appearance-none dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-0 focus:border-blue-600 peer pr-8"
    />
    <label
      for={`${id}-start`}
      class="absolute top-3 left-2.5 z-10 text-sm text-gray-500 origin-[0] scale-75 transform -translate-y-3 duration-300 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-blue-600 dark:text-gray-400 dark:peer-focus:text-blue-500"
    >
      {labelStart}
    </label>
    {#if bindValueStart != defaultValueStart && defaultValueStart != null}
      <button
        type="button"
        class="absolute inset-y-0 right-2 flex items-center text-gray-500 hover:text-gray-700 focus:outline-none"
        aria-label="Clear {labelStart}"
        on:click={() => {
          bindValueStart = defaultValueStart;
          if (onClearStart) onClearStart();
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="w-5 h-5"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fill-rule="evenodd"
            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
            clip-rule="evenodd"
          />
        </svg>
      </button>
    {/if}
  </div>

  <span class="text-gray-500">to</span>

  <div class="relative w-full">
    <input
      id={`${id}-end`}
      type="number"
      bind:value={bindValueEnd}
      on:blur={onBlurEnd}
      on:keydown={onKeydownEnd}
      placeholder=" "
      class="block w-full px-2.5 pb-1.5 pt-4 text-sm text-gray-900 bg-gray-50 border-0 border-b-2 border-gray-300 rounded-t-lg appearance-none dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-0 focus:border-blue-600 peer pr-8"
    />
    <label
      for={`${id}-end`}
      class="absolute top-3 left-2.5 z-10 text-sm text-gray-500 origin-[0] scale-75 transform -translate-y-3 duration-300 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-blue-600 dark:text-gray-400 dark:peer-focus:text-blue-500"
    >
      {labelEnd}
    </label>
    {#if bindValueEnd != defaultValueEnd && defaultValueEnd != null}
      <button
        type="button"
        class="absolute inset-y-0 right-2 flex items-center text-gray-500 hover:text-gray-700 focus:outline-none"
        aria-label="Clear {labelEnd}"
        on:click={() => {
          bindValueEnd = defaultValueEnd;
          if (onClearEnd) onClearEnd();
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="w-5 h-5"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fill-rule="evenodd"
            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
            clip-rule="evenodd"
          />
        </svg>
      </button>
    {/if}
  </div>
</div>