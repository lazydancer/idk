<script>
  import 'chart.js/auto'

  import { authFetch } from './auth.js';

  export let item_id;

  let item = {
    item: {
      name: "",
      display_name: "",
      metadata: 0,
      nbt: null,
    },
    count: 0,
  };

  let customWithdrawQty = 0;


  import { onMount } from 'svelte';


  onMount(async () => {
    item = await authFetch(`http://localhost:8000/api/item/${item_id}`);
  });


  async function withdraw(count) {
    item.count -= count

    // create new object where count is the order count
    const item_order = Object.assign({}, item, {count: count})

    // remove history from item_order
    delete item_order.history

    const res = await authFetch(`http://localhost:8000/api/withdraw`, {
      method: 'POST',
      body: JSON.stringify([item_order]),
      headers: { 'Content-Type': 'application/json'}
    })
  }

  function withdrawCustom() {
    withdraw(parseInt(customWithdrawQty, 10) || 0);
  }



</script>

<div class="py-6 flex">
  <img src="/static/icons/{item.item.name}.png" style="width:64px; height:64px;" alt={item.item.name} />
  <h2 class="text-lg font-medium pt-4 pl-4">{item.item.display_name}</h2>
</div>
<div class="py-2">
  <p class="text-sm pt-2">Name: {item.item.name}</p>
  {#if item.item.metadata != 0}
      <p class="text-sm pt-2">Metadata: {item.item.metadata}</p>
  {/if}
  {#if item.item.nbt !== null}
  <p class="text-sm pt-4">Nbt:</p>
  <pre class="whitespace-pre-wrap text-sm pt-2">
    nbt:{JSON.stringify(item.item.nbt.value, null, 2)}
  </pre>
  {/if}
  <p class="text-sm pt-4">Count: {item.count}</p>
</div>

<div class="flex">
  <p class="text-sm pt-2">Withdraw:</p>
  <button class="bg-red-700 hover:bg-red-900 text-white py-1 px-2 border-transparent mx-1 {item.count < 1 ? 'opacity-50 cursor-not-allowed' : ''}" on:click={() => withdraw(1)} disabled={item.count < 1}>1</button>
  <button class="bg-red-700 hover:bg-red-900 text-white py-1 px-2 border-transparent mx-1 {item.count < 64 ? 'opacity-50 cursor-not-allowed' : ''}" on:click={() => withdraw(64)} disabled={item.count < 64}>64</button>
  <button class="bg-red-700 hover:bg-red-900 text-white py-1 px-2 border-transparent mx-1 {item.count < 1728 ? 'opacity-50 cursor-not-allowed' : ''}" on:click={() => withdraw(1728)} disabled={item.count < 1728}>1728</button>
  <input type="number" min="0" max="{item.count}" bind:value={customWithdrawQty} class="border px-2 py-1 mr-2" />
  <button class="bg-red-700 hover:bg-red-900 text-white py-1 px-2 border-transparent" on:click={withdrawCustom} disabled={customWithdrawQty < 1 || customWithdrawQty > item.count}>Withdraw Custom</button>
</div>

<!-- <div class="flex pt-4">
  <p class="text-sm pt-2">Order:</p>
  <button class="bg-red-700 hover:bg-red-900 text-white py-1 px-2 border-transparent mx-1" on:click={() => show_order_form = true}>Buy</button>
  <button class="bg-red-700 hover:bg-red-900 text-white py-1 px-2 border-transparent mx-1" on:click={() => show_order_form = true}>Sell</button>
</div>

{#if show_order_form}
  <div class="pt-4" transition:fade>
    <form>
      <div class="flex">
        <label for="price" class="text-sm pr-2">Price:</label>
        <input type="number" id="price" class="border rounded py-1 px-2" bind:value={price}>
      </div>
      <div class="flex pt-2">
        <label for="qty" class="text-sm pr-2">Quantity:</label>
        <input type="number" id="qty" class="border rounded py-1 px-2" bind:value={qty}>
      </div>
      <div class="flex pt-2">
        <label for="total-cost" class="text-sm pr-2">Total Cost:</label>
        <p class="text-sm">{calculateTotalCost()}</p>
      </div>
    <button class="bg-red-700 hover:bg-red-900 text-white py-1 px-2 border-transparent mx-1" on:click={() => show_order_form = true}>Send Order</button>

    </form>
  </div>
{/if}

<div class="pt-4">
  <table class="table-auto border-collapse">
    <thead>
      <tr class="bg-grey-100 border-b">
        <th class="px-4 py-2 text-right font-normal">Qty</th>
        <th class="px-4 py-2 text-right font-normal">Buy</th>
        <th class="border-l px-4 py-2 text-right font-normal">Sell</th>
        <th class="px-4 py-2 text-right font-normal">Qty</th>
      </tr>
    </thead>
    <tbody>
      {#each rows as row}
        <tr>
          <td class="px-4 py-2 text-right">{row.buy_qty}</td>
          <td class="px-4 py-2 text-right text-red-400">{row.buy}</td>
          <td class="border-l px-4 py-2 text-right text-green-400">{row.sell}</td>
          <td class="px-4 py-2 text-right">{row.sell_qty}</td>
        </tr>
      {/each}
    </tbody>
  </table>
</div> 
-->