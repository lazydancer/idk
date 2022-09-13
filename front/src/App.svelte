<script>
  import { Accordion, AccordionItem } from 'svelte-collapsible'
  import { onMount } from 'svelte';

  let items = [];

  let group = "All"
  let groups = ["All", "Natural", "Wood", "Mob Drops", "Stone", "Colours", "Combat", "Minerals", "Tools", "Mining", "Brewing", "Nether", "End", "Redstone", "Enchanting", "Server Specific"];

  let accordian_key = null

  let displayOrder = false;

  let visibleItems = [];

  onMount(async () => {
    const res = await fetch(`http://localhost:8000/api/list`);
    items = await res.json();

    items = items.map(v => ({...v, orderTempTextBox: 1, orderCount: 0}))
    items.forEach((item, i) => {item.key = i + 1;});

    visibleItems = items;

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
    accordian_key = null;
  }


  function addToOrder(key, count) {
    console.log(count)

    for(let item of items) {
      if(item.key === key) {
        if( item.orderCount + count > 0 ) {
          item.orderCount += count
        } else {
          item.orderCount = 0
        }

        if( item.orderCount > item.count ) {
          item.orderCount = item.count
        }

        items = items
        visibleItems = visibleItems
        return;
      }
    }
  }

  let ordered = false
  let ordered_message = ""

  async function submitOrder() {
    let order_item_list = items.filter(it => it.orderCount > 0).map(({count, key, orderTempTextBox, ...keepAttrs}) => keepAttrs)
    order_item_list = order_item_list.map(({orderCount, ...rest}) => ({...rest, count: orderCount}) )
    
    console.log(order_item_list);

    const res = await fetch(`http://localhost:8000/api/order`, {
      method: 'POST',
      body: JSON.stringify(order_item_list),
      headers: { 'Content-Type': 'application/json'}
    })

    ordered = true
    ordered_message = "Preparing items at Chest 1"
  }


  async function deposit() {
    const res = await fetch(`http://localhost:8000/api/deposit`, {
      method: 'POST',
      body: JSON.stringify({station: 2}),
      headers: { 'Content-Type': 'application/json'}
    })
  }
  


</script>

<svelte:head>
	<title>Storage</title>
  <link rel="icon" href="static/favicon.png" type="image/png">
  <meta name="robots" content="noindex nofollow" />
	<html lang="en" />
</svelte:head>

<header class="max-w-none mx-auto px-12 py-4 border-b border-gray-300 bg-white fixed top-0 w-full">
  <div class="flex flex-row flex-nowrap">
    <h1 on:click={() => changeGroup({"g": "All"})} class="flex-1 text-left text-4xl font-extrabold text-red-700 cursor-pointer mr-20 p-1 w-20 flex-none">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -0.5 9 5" shape-rendering="crispEdges"><path stroke="#c40424" d="M0 0h1m3 0h1m1 0h1M4 1h1m1 0h1M0 2h1m2 0h2m1 0h1m1 0h1M0 3h1m1 0h1m1 0h1m1 0h2M0 4h1m1 0h3m1 0h1m1 0h1"/></svg>
    
    </h1>
    
    <form class="items-center flex-1">   
      <label for="simple-search" class="sr-only">Search</label>
      <div class="relative w-full">
          <div class="flex absolute inset-y-0 left-0 items-center pl-3 pointer-events-none">
              <svg aria-hidden="true" class="w-5 h-5 text-gray-500 dark:text-gray-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"></path></svg>
          </div>
          <input type="text" id="simple-search" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="Search" required>
      </div>
    </form>


    <div class="mx-5 mt-1 flex-1">
      <button on:click={()=>setOrder()} class="ml-2 px-4 py-2 border border-none shadow-sm text-sm  text-white bg-red-700 hover:bg-red-800 focus:outline-none focus:ring-2 
      focus:ring-offset-2 focus:ring-red-600 float-right">Withdraw</button>
      <button on:click={()=>deposit()} class="ml-2 px-4 py-2 border border-none shadow-sm text-sm  text-white bg-red-700 hover:bg-red-800 focus:outline-none focus:ring-2 
        focus:ring-offset-2 focus:ring-red-600 float-right">Deposit</button>
    </div>
  </div>
</header>

<main class="flex flex-row items-start px-12 py-6 max-w-none mx-auto mt-20">
  <ul class="text-gray-900 text-sm visited:text-gray-900 pr-10 h-screen fixed top-30 w-40">
    <div class="h-3"></div>
    {#each groups as g}
      <li>
        {#if g == group}
          <p on:click={() => changeGroup({g})} class="block pb-3 cursor-pointer font-bold text-sm">{g}</p>
        {:else}
          <p on:click={() => changeGroup({g})} class="block pb-3 cursor-pointer text-sm">{g}</p>
        {/if}
      </li>
    {/each}

  </ul>
  <div class="flex-1 pl-6 ml-36">
    <Accordion bind:key = {accordian_key} >
      {#each visibleItems as v_item}
        <AccordionItem key={v_item.key}>
            <div slot='header' class="flex flex-row py-1">
              <div class="mr-4" style="width: 37px; height: 37px; background: #8B8B8B; border: 2px solid; border-color: #373737 #FFF #FFF #373737">
                  <img src="static/icons/{v_item.item.name}.png" style="width:32px; height:32px;" alt={v_item.item.name} />
                <!-- <div style="width:32px; height:32px; background-image:url(static/v_items-sprite.webp); background-position: -{v_item.imageLoc[0]}px -{v_item.imageLoc[1]}px"></div> -->
              </div>
              <p class="flex-1 text-sm w-72 pt-2">{ v_item.item.display_name }</p>
              <p class="flex-1 text-sm pt-1.5 pr-2">{v_item.count}</p>
              <p class="flex-1 text-sm pt-1.5 pr-2">{#if v_item.orderCount > 0}{v_item.orderCount}{/if}</p>
                            
            </div>
            
            <div slot='body' class='pl-4 pb-2 flex flex-row'>

              <div class="flex-1">
                <p class="text-gray text-sm">
                  name: { v_item.item.name }
                </p>
                <p class="text-gray text-sm">
                  metadata: { v_item.item.metadata }
                </p>
                
                <p class="text-gray text-sm">              
                  nbt: { JSON.stringify(v_item.item.nbt, null, 2) }
                </p>
              </div>
              <div class="flex-1">
                <div class="flex flex-row float-right pr-2">

                   <button on:click={() => addToOrder(v_item.key, 1)} class="px-4 py-2 border border-transparent shadow-sm text-sm text-white bg-red-700 hover:bg-red-800 focus:outline-none focus:ring-2 
                    focus:ring-offset-2 focus:ring-red-600 my-6 ml-1">+1</button>
                    <button on:click={() => addToOrder(v_item.key, 64)} class="px-4 py-2 border border-transparent shadow-sm text-sm text-white bg-red-700 hover:bg-red-800 focus:outline-none focus:ring-2 
                    focus:ring-offset-2 focus:ring-red-600 my-6 ml-1">+64</button>
                    <form on:submit|preventDefault={()=>addToOrder(v_item.key, v_item.orderTempTextBox)}>

                      <input 
                        type="number"
                        bind:value={v_item.orderTempTextBox}
                        class="focus:ring-indigo-500 focus:border-indigo-500 shadow-sm sm:text-sm border-gray-300 w-16 h-9 pl-2 ml-1 py-2 my-6"
                        placeholder="+x" />
                    </form>


                  <button on:click={()=>addToOrder(v_item.key, -v_item.orderCount)} class="ml-2 px-4 py-2 border border-transparent shadow-sm text-sm text-white bg-red-700 hover:bg-red-800 focus:outline-none focus:ring-2 
                    focus:ring-offset-2 focus:ring-red-600 my-6">Clear</button>

                </div>
              </div>
            </div>
        </AccordionItem>
      {/each}
    </Accordion>


    {#if displayOrder}
      {#if !ordered}
        <div class="flex flex-row pt-12">
          <input 
            type="text"
            placeholder="Username"
            class="focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 mr-4 pl-4"/>

            <button on:click={()=>submitOrder()} class="px-4 py-2 border border-transparent shadow-sm text-sm text-white bg-red-700 hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-600">
              Withdraw
            </button>
        </div>
    {:else} 
        <div class="flex flex-row pt-12">
          <input 
            type="text"
            placeholder="Username"
            class="focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 mr-4 pl-4"/>

            <button class="px-4 py-2 border border-transparent shadow-sm text-sm text-white bg-red-700" disabled>
              Ordered
            </button>
        </div>
          <p class="float-right text-l font-bold py-4 px-2">{ordered_message}!</p>
    {/if}
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