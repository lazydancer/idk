<script>

	export let name;

  import { Accordion, AccordionItem } from 'svelte-collapsible'
  import { onMount } from 'svelte';

  let items = [];
  let group = undefined;

  $: visibleItems = group ?
    items.filter(item => {
      return item.group == group
    }) : items

  onMount(async () => {
    const res = await fetch(`http://localhost:8000/api/list`);
    items = await res.json();
  });

  function changeGroup(set_group) {
    group = set_group
  }

</script>


<header class="flex flex-row max-w-none mx-auto px-12 py-4 border-b border-gray-300 bg-white sticky top-0">
  <h1 class="flex-1 text-left text-4xl font-extrabold text-red-700">IDK</h1>
  <p class="flex-1 text-right font-medium text-gray-900">order</p>
</header>


<main class="flex flex-row items-start px-12 py-6 max-w-none mx-auto">
  <ul class="font-medium text-gray-900 text-sm visited:text-gray-900 pr-10 h-screen fixed top-30 w-40">
    <li>
      <a on:click={() => changeGroup(undefined)} class="block py-1 cursor-pointer">All</a>
    </li>
    <li>
      <a on:click={() => changeGroup("Natural")} class="block py-1 cursor-pointer">Natural</a>
    </li>
    <li>
      <a on:click={() => changeGroup("Wood")} class="block py-1 cursor-pointer">Wood</a>
    </li>
    <li>
      <a on:click={() => changeGroup("Mob Drops")} class="block py-1 cursor-pointer">Mob Drops</a>
    </li>
    <li>
      <a on:click={() => changeGroup("Stone")} class="block py-1 cursor-pointer">Stone</a>
    </li>
    <li>
      <a on:click={() => changeGroup("Colours")} class="block py-1 cursor-pointer">Colours</a>
    </li>
    <li>
      <a on:click={() => changeGroup("Combat")} class="block py-1 cursor-pointer">Combat</a>
    </li>
    <li>
      <a on:click={() => changeGroup("Minerals")} class="block py-1 cursor-pointer">Minerals</a>
    </li>
    <li>
      <a on:click={() => changeGroup("Tools")} class="block py-1 cursor-pointer">Tools</a>
    </li>
    <li>
      <a on:click={() => changeGroup("Mining")} class="block py-1 cursor-pointer">Mining</a>
    </li>
    <li>
      <a on:click={() => changeGroup("Brewing")} class="block py-1 cursor-pointer">Brewing</a>
    </li>
    <li>
      <a on:click={() => changeGroup("Nether")} class="block py-1 cursor-pointer">Nether</a>
    </li>
    <li>
      <a on:click={() => changeGroup("End")} class="block py-1 cursor-pointer">End</a>
    </li>
    <li>
      <a on:click={() => changeGroup("Redstone")} class="block py-1 cursor-pointer">Redstone</a>
    </li>
    <li>
      <a on:click={() => changeGroup("Enchanting")} class="block py-1 cursor-pointer">Enchanting</a>
    </li>
    <li>
      <a on:click={() => changeGroup("Server Specific")} class="block py-1 cursor-pointer">Server Specific</a>
    </li>
  </ul>
  <div class="flex-1 px-6 ml-36">
    <Accordion>
      {#each visibleItems as item}
        <AccordionItem key={item.key}>
            <div slot='header' class="flex flex-row py-3">
              <img src="https://picsum.photos/100?random={item.key}" width="32px" alt="Cover"/>
              <h2 class="px-6">{ item.displayName }</h2>
              <p>{ item.metadata }</p>
            </div>
            
            <div slot='body' class='px-4 pb-2'>
              <p class="text-gray text-sm">
                name: { item.name }
              </p>
              <p class="text-gray text-sm">
                metadata: { item.metadata }
              </p>
              
              <p class="text-gray text-sm">              
                nbt: { item.nbt }
              </p>
            
            </div>
        </AccordionItem>
      {/each}
    </Accordion>
</div>
</main>

<style global lang="postcss">
  @tailwind base;
  @tailwind components;
  @tailwind utilities;


  body {
    padding: 0;
  }

  :global(.accordion-item) {
    border-bottom: 1px solid rgb(209 213 219);
  }

</style>