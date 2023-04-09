<script>
  import List from './List.svelte';
  import Item from './Item.svelte';

  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  const duration = 100; // duration of the fade effect in milliseconds

  let items = [];
  let selectedItem = null;

  let visibleItems = [];
  let order_item_list = items.filter(item => item.orderCount > 0);

  onMount(async () => {
    const res = await fetch(`http://localhost:8000/api/list`);
    items = await res.json();

    items = items.map(v => ({...v, orderTempTextBox: 1, orderCount: 0}))
    items.forEach((item, i) => {item.key = i + 1;});

    visibleItems = items;
  });

  function handleOverlayClose() {
      console.log("handleOverlayClose")
      order_item_list = items.filter(item => item.orderCount > 0)
      selectedItem = null;
  }

  function add_to_order(event) {
    const key = event.detail.key
    const count = event.detail.count

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

  async function withdraw() {
    let order_item_list = items.filter(it => it.orderCount > 0).map(({count, key, orderTempTextBox, ...keepAttrs}) => keepAttrs)
    order_item_list = order_item_list.map(({orderCount, ...rest}) => ({...rest, count: orderCount}) )
    
    console.log("order", order_item_list)

    const res = await fetch(`http://localhost:8000/api/order`, {
      method: 'POST',
      body: JSON.stringify(order_item_list),
      headers: { 'Content-Type': 'application/json'}
    })

    ordered = true
    ordered_message = "Preparing items at Chest 0"
  }


  async function deposit() {
    const res = await fetch(`http://localhost:8000/api/deposit`, {
      method: 'POST',
      body: JSON.stringify({station: 0}),
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

  <header class="max-w-none mx-auto px-12 py-4 border-b border-gray-200 bg-white w-full">
    <div class="flex flex-row flex-nowrap">
      <h1 class="flex-1 text-left text-4xl font-extrabold text-red-700 cursor-pointer mr-20 p-1 w-20 flex-none">
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
    </div>
  </header>

  <main class="flex flex-row items-start px-12 pt-6 max-w-none mx-auto">
    {#if selectedItem}
    <div transition:fade={{ duration }}>
      <Item item={selectedItem} close={handleOverlayClose} />
    </div>
    {/if}
    <div class="w-1/2 px-2">
      <h3 class="text-gray-900 dark:text-gray-100 pb-4">Inventory</h3>
      <div class="overflow-y-auto max-h-[85vh] pr-2">
        <List items={visibleItems} onItemClick={(clickedItem) => selectedItem = clickedItem}/>
      </div>
    </div>
    <div class="w-1/2 px-2">
      <h3 class="text-gray-900 dark:text-gray-100 pb-4">Station 00</h3>
      <div class="overflow-y-auto max-h-[85vh] pr-2">
        <List items={order_item_list} onItemClick={(clickedItem) => selectedItem = clickedItem} countProp="orderCount"/>
      </div>
      <div class="flex justify-left mt-4">
        {#if order_item_list.length > 0}
          <button class="px-4 py-2 bg-red-600 hover:bg-red-900 text-white text-sm" on:click={withdraw}>Withdraw</button>
        {:else}
          <button class="px-4 py-2 mr-2 bg-red-600 hover:bg-red-900 text-white text-sm" on:click={deposit}>Deposit</button>
        {/if}
      </div>
    </div>
  </main>


<style global lang="postcss">
  @tailwind base;
  @tailwind components;
  @tailwind utilities;


  body {
    padding: 0;
    height: 100%;
  }

  :global(.accordion-item) {
    border-bottom: 1px solid rgb(209 213 219);
  }

</style>