<script>
  import InventoryPage from './InventoryPage.svelte';
  import ItemPage from './ItemPage.svelte';
  import DepositPage from './DepositPage.svelte';

  let currentPage = "inventory"
  let selectedItem = null;

  function setPage(page, data) {
    console.log(page, data)
    currentPage = page;
    if (data) {
      selectedItem = data;
    }
  }

</script>

<svelte:head>
	<title>Inventory</title>
  <link rel="icon" href="static/favicon.png" type="image/png">
  <meta name="robots" content="noindex nofollow" />
	<html lang="en" />
</svelte:head>

  <header class="max-w-none mx-auto px-8 py-4 border-b border-gray-200 bg-white w-full fixed top-0 left-0 z-50">
    <div class="flex items-center justify-between">
      <h1 class="cursor-pointer mr-20 p-1 w-20 flex-none" on:click|preventDefault={() => currentPage = 'inventory'}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -0.5 9 5" shape-rendering="crispEdges"><path stroke="#c40424" d="M0 0h1m3 0h1m1 0h1M4 1h1m1 0h1M0 2h1m2 0h2m1 0h1m1 0h1M0 3h1m1 0h1m1 0h1m1 0h2M0 4h1m1 0h3m1 0h1m1 0h1"/></svg>
      </h1>
      <nav class="flex">
        <ul class="flex flex-row">
          <li class="mr-6">
            <a href="#" class={currentPage === 'inventory' ? 'text-gray-900' : 'text-gray-600 hover:text-gray-900'} on:click|preventDefault={() => currentPage = 'inventory'}>Inventory</a>
          </li>
          <li>
            <a href="#" class={currentPage === 'deposit' ? 'text-gray-900' : 'text-gray-600 hover:text-gray-900'} on:click|preventDefault={() => currentPage = 'deposit'}>Deposit</a>
          </li>
        </ul>
      </nav>
    </div>
  </header>

  <main class="pt-20 pb-8 mx-8">
    {#if currentPage === 'inventory'}
      <InventoryPage navigateTo={setPage}/>
    {:else if currentPage === 'deposit'}
      <DepositPage  navigateTo={setPage} />
    {:else if currentPage === 'item'}
      <ItemPage item={selectedItem} navigateTo={setPage}/>
    {/if}
  </main>



<style global lang="postcss">
  @tailwind base;
  @tailwind components;
  @tailwind utilities;


  body {
    padding: 0;
    height: 100%;
  }

  button {
    border: 0;
  }
</style>