<!-- InputWithClear.svelte -->
<script>
  export let id = "";
  export let label = "";
  export let type = "text";
  export let bindValue;
  export let defaultValue = "";
  export let onBlur;
  export let onKeydown;
  export let onClear;
</script>

<div class="relative">
  <input
    id={id}
    class="block rounded-t-lg px-2.5 pb-1.5 pt-4 w-full text-sm text-gray-900 bg-gray-50 dark:bg-gray-700 border-0 border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer pr-8"
    bind:value={bindValue}
    on:blur={onBlur}
    on:keydown={onKeydown}
    placeholder=" "
  />
  <label
    for={id}
    class="absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-3 scale-75 top-3 z-10 origin-[0] start-2.5 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 rtl:peer-focus:translate-x-1/4 rtl:peer-focus:left-auto"
  >
    {label}
  </label>
  {#if bindValue != defaultValue && defaultValue != null}
    <button
      type="button"
      class="absolute inset-y-0 right-2 flex items-center p-0 text-gray-500 hover:text-gray-700 focus:outline-none"
      aria-label="Clear {label}"
      on:click={() => {
        bindValue = defaultValue;
        if (onClear) onClear();
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-5 w-5"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          fill-rule="evenodd"
          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 011.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
          clip-rule="evenodd"
        />
      </svg>
    </button>
  {/if}
</div>
