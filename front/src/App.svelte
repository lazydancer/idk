<script>
  import {Router, Link, Route} from 'svelte-routing';

  import InventoryPage from './InventoryPage.svelte';
  import ItemPage from './ItemPage.svelte';
  import DepositPage from './DepositPage.svelte';

  export let url = "";

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
<Router url="{url}">


  <header class="max-w-none mx-auto px-8 py-4 border-b border-gray-200 bg-white w-full fixed top-0 left-0 z-50">
    <div class="flex items-center justify-between">
      <Link to="/">
        <h1 class="cursor-pointer mr-20 p-1 w-20 flex-none">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -0.5 9 5" shape-rendering="crispEdges"><path stroke="#c40424" d="M0 0h1m3 0h1m1 0h1M4 1h1m1 0h1M0 2h1m2 0h2m1 0h1m1 0h1M0 3h1m1 0h1m1 0h1m1 0h2M0 4h1m1 0h3m1 0h1m1 0h1"/></svg>
        </h1>
      </Link>
      <nav class="flex">
        <ul class="flex flex-row">
          <Link to="/">Inventory</Link>
          <Link to="/deposit">Deposit</Link>
        </ul>
      </nav>
    </div>
  </header>

    <nav>
      <Link to="/">Inventory</Link>
      <Link to="/deposit">Deposit</Link>
    </nav>

    <main class="pt-20 pb-8 mx-8">

    <Route path="/" component="{InventoryPage}" />
    <Route path="/deposit" component="{DepositPage}" />
    <Route path="/item/:item_id" component="{ItemPage}" />
    
  </main>
  
</Router>


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