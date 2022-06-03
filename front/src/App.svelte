<script>
	export let name;

  import { onMount } from 'svelte';

  let items = [];

  onMount(async () => {
    const res = await fetch(`http://localhost:8000/api/myrocket`);
    items = await res.json();
  });

</script>


<header class="text-center pt-4">
<h1>idk</h1>
</header>


<main class="flex flex-wrap items-start p-12 max-w-none mx-auto">
  <ul class="basis-1/4">
    <li>All</li>
    <li><ul class="pl-5">
      <li>Natural</li>
      <li>Wood</li>
      <li>Mob Drops</li>
      <li>Stone</li>
      <li>Colours</li>
      <li>Combat</li>
      <li>Minerals</li>
      <li>Tools</li>
      <li>Mining</li>
      <li>Brewing</li>
      <li>Nether</li>
      <li>End</li>
      <li>Redstone</li>
      <li>Enchanting</li>
      <li>Server Specific</li>
    </ul></li>
    <li>Cart</li>
  </ul>
  <div class="basis-3/4">
  <label class="relative block">
    <span class="absolute inset-y-0 left-0 flex items-center pl-2">
      <svg class="h-5 w-5 fill-slate-300" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"></path></svg>
    </span>
    <input class="placeholder:italic placeholder:text-slate-400 bg-white w-full rounded-md py-2 pl-9 pr-3 mb-2 focus:outline-none focus:border-sky-500 focus:ring-sky-500 focus:ring-1" placeholder="Search for anything..." type="text" name="search"/>
  </label>
    <table class="w-full border-collapse shadow-sm border text-left">
    <thead>
      <tr>
        <th class="p-2">Name</th>
        <th class="p-2">Available</th>
        <th class="p-2">Add/Remove</th>
        <th class="p-2">Count</th>
      </tr>
    </thead>
    <tbody class="border">
      {#each items as i}
      <tr>
        <td class="border-b p-2">{i.name}</td>
        <td class="border-b p-2">{i.available}</td>
        <td class="border-b p-2"><input class="w-16 mr-2" type="number" placeholder=1/><button class="px-2 bg-blue-500 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 border-0">+</button></td>
        <td class="border-b p-2">{i.cart}</td>
      </tr>
      {/each}
    </tbody>
  </table>
  <button class="float-right py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 mt-4 border-0">Withdraw</button>
  <input type="text" placeholder="username" class="placeholder:italic placeholder:text-slate-400 rounded-md p-2 mt-4 shadow-sm focus:outline-none focus:border-sky-500 focus:ring-sky-500 focus:ring-1 float-right mr-4"/>
</div>
</main>

<style global lang="postcss">
  @tailwind base;
  @tailwind components;
  @tailwind utilities;
</style>