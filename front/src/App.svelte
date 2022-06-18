<script>

	export let name;

  import { Accordion, AccordionItem } from 'svelte-collapsible'
  import { onMount } from 'svelte';

  let displayOrder = false;

  let items = [];
  let order = [];

  let groups = ["All", "Natural", "Wood", "Mob Drops", "Stone", "Colours", "Combat", "Minerals", "Tools", "Mining", "Brewing", "Nether", "End", "Redstone", "Enchanting", "Server Specific"];

  let group = "All"

  $: visibleItems = (group !== "All") ?
    items.filter(item => {
      return item.group == group
    }) : items

  onMount(async () => {
    const res = await fetch(`http://localhost:8000/api/list`);
    items = await res.json();
  });

  function changeGroup(set_group) {
    group = set_group["g"]
  }

  function addToOrder(key, count) {
    console.log(key, count)
    console.log(order)
    for(let item of order) {
      if(item.key === key) {
        item.count += 1
        order = order;
        return;
      }
    }
    let sel_item = items.filter(it => it["key"] == key)[0]

    console.log(sel_item)

    order = [...order, {...sel_item, count}]
  }

  $: orderLength = order.length; 

  function toggleOrder() {
    console.log(displayOrder)
    displayOrder = !displayOrder
  }

</script>


<header class="flex flex-row max-w-none mx-auto px-12 py-4 border-b border-gray-300 bg-white sticky top-0">
  <h1 class="flex-1 text-left text-4xl font-extrabold text-red-700">IDK</h1>
  <div class="flex-1 align-middle">
  {#if displayOrder}
    <p class="text-right pt-2"><a on:click={()=>toggleOrder()} class="text-sm text-gray-900 cursor-pointer mt-4 font-bold">Order {orderLength}</a></p>
  {:else}
    <p class="text-right pt-2"><a on:click={()=>toggleOrder()} class="text-sm text-gray-900 cursor-pointer mt-4">Order {orderLength}</a></p>
  {/if}

  </div>
</header>

{#if displayOrder}
  <main class="items-start px-12 py-6 max-w-none mx-auto">
    <div class="w-full">
      {#each order as item}
        <div class="flex flex-row py-3 border-b border-gray-300">
          <img src="https://picsum.photos/100?random={item.key}" width="32px" alt="Cover"/>
          <h2 class="px-6 w-72 pt-1.5">{ item.displayName }</h2>
          <p class="text-sm w-32 pt-2">Count: { item.count }</p>
        </div>
      {/each}
    </div>

    <div class="flex flex-row float-right pt-12">
      <input 
        type="text"
        placeholder="Username"
        class="focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md mr-4 pl-4"/>
      <button class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-700 hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-600">
        Withdraw
      </button>
    </div>

  </main>



{:else}
  <main class="flex flex-row items-start px-12 py-6 max-w-none mx-auto">
    <ul class="text-gray-900 text-sm visited:text-gray-900 pr-10 h-screen fixed top-30 w-40">

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
                <img src="https://picsum.photos/100?random={item.key}" width="32px" alt="Cover"/>
                <h2 class="px-6 w-72 pt-1">{ item.displayName }</h2>
                <!--<p class="text-sm w-32">Count: { item.metadata }</p>-->
              </div>
              
              <div slot='body' class='px-4 pb-2 flex flex-row'>

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
                  <div class="flex flex-row float-right">
                    <input 
                      type="number"
                      placeholder=1
                      class="focus:ring-indigo-500 focus:border-indigo-500 shadow-sm sm:text-sm border-gray-300 rounded-md w-16 my-6 mx-2 pl-2"/>

                    <button on:click={()=>addToOrder(item.key, 1)} class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-700 hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-600 my-6">Add to Order</button>
                  </div>
                </div>
              </div>
          </AccordionItem>
        {/each}
      </Accordion>
  </div>
  </main>
{/if}

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