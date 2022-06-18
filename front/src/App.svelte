<script>
  import { Accordion, AccordionItem } from 'svelte-collapsible'
  import { onMount } from 'svelte';

  let items = [];

  let group = "All"
  let groups = ["All", "Natural", "Wood", "Mob Drops", "Stone", "Colours", "Combat", "Minerals", "Tools", "Mining", "Brewing", "Nether", "End", "Redstone", "Enchanting", "Server Specific"];


  let displayOrder = false;

  $: visibleItems = items;

  onMount(async () => {
    const res = await fetch(`http://localhost:8000/api/list`);
    items = await res.json();
    items = items.map(v => ({...v, orderTempTextBox: 1, orderCount: 0}))
  });

  function changeGroup(set_group) {
    group = set_group["g"]
    visibleItems = (group !== "All") ?  items.filter(item => item.group == group) : items
    displayOrder = false
  }

  function setOrder() {
    displayOrder = true
    visibleItems = items.filter(item => item.orderCount > 0)
    group = null;
  }

  function addToOrder(key, count) {
    for(let item of items) {
      if(item.key === key) {
        if( item.orderCount + count > 0 ) {
          item.orderCount += count
        } else {
          item.orderCount = 0
        }

        items = items
        return;
      }
    }
  }

  $: orderLength = items.filter(item => item.orderCount > 0).length; 

</script>


<header class="flex flex-row max-w-none mx-auto px-12 py-4 border-b border-gray-300 bg-white sticky top-0">
  <h1 class="flex-1 text-left text-4xl font-extrabold text-red-700">IDK</h1>
</header>


<main class="flex flex-row items-start px-12 py-6 max-w-none mx-auto">
  <ul class="text-gray-900 text-sm visited:text-gray-900 pr-10 h-screen fixed top-30 w-40">

      <li class="border-b border-gray-300 pb-3">
        {#if displayOrder}
          <a class="text-sm text-gray-900 cursor-pointer mt-4 font-bold">Order <p class="float-right pr-2 text-gray-500">{orderLength}</p></a>
        {:else}
          <a on:click={()=>setOrder()} class="text-sm text-gray-900 cursor-pointer mt-4">Order <p class="float-right pr-2 text-gray-500">{orderLength}</p></a>
        {/if}
    </li>
    <div class="h-3"></div>
    {#each groups as g}
      <li>
        {#if g == group}
          <a on:click={() => changeGroup({g})} class="block py-1 cursor-pointer font-bold">{g}</a>
        {:else}
          <a on:click={() => changeGroup({g})} class="block py-1 cursor-pointer">{g}</a>
        {/if}
      </li>
    {/each}

  </ul>
  <div class="flex-1 pl-6 ml-36">
    <Accordion>
      {#each visibleItems as item}
        <AccordionItem key={item.key}>
            <div slot='header' class="flex flex-row py-3">
              <img src="https://picsum.photos/100?random={item.key}" class="flex-none w-8" alt="Cover"/>
              <h2 class="flex-1 px-6 w-72 pt-1">{ item.displayName }</h2>
              {#if item.orderCount > 0}
                <p class="flex-1 text-sm text-gray-500 text-right pt-1.5 pr-2">In order: {item.orderCount}</p>
              {/if}
            </div>
            
            <div slot='body' class='pl-4 pb-2 flex flex-row'>

              <div class="flex-1">
                <p class="text-gray text-sm">
                  name: { item.name }
                </p>
                <p class="text-gray text-sm">
                  metadata: { item.metadata }
                </p>
                
                <p class="text-gray text-sm">              
                  nbt: { JSON.stringify(item.nbt, null, 2) }
                </p>
              </div>
              <div class="flex-1">
                <div class="flex flex-row float-right pr-2">

                  <form on:submit|preventDefault={()=>addToOrder(item.key, item.orderTempTextBox)}>
                    <input 
                      type="number"
                      bind:value={item.orderTempTextBox}
                      class="focus:ring-indigo-500 focus:border-indigo-500 shadow-sm sm:text-sm border-gray-300 rounded-md w-16 h-9 pl-2"/>

                    <button on:click={() => console.log('button clicked')} class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-700 hover:bg-red-800 focus:outline-none focus:ring-2 
                    focus:ring-offset-2 focus:ring-red-600 my-6">Add to Order</button>
                  </form>

                </div>
              </div>
            </div>
        </AccordionItem>
      {/each}
    </Accordion>


  {#if displayOrder}


  <div class="flex flex-row float-right pt-12">
    <input 
      type="text"
      placeholder="Username"
      class="focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md mr-4 pl-4"/>
    <button class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-700 hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-600">
      Withdraw
    </button>
  </div>

  {/if}

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