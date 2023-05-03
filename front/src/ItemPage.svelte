<script>
  import { Line } from 'svelte-chartjs'
  import 'chart.js/auto'

  export let item_id;

  let item = {
    item: {
      name: "",
      display_name: "",
      metadata: 0,
      nbt: null,
    },
    count: 0
  };

  import { onMount } from 'svelte';


  onMount(async () => {
    console.log("reqeuest item", item_id, "from api")
    const res = await fetch(`http://localhost:8000/api/item/${item_id}`);
    item = await res.json();
  });


  const itemData = [
    { date: "2022-01-01", volume: 10 },
    { date: "2022-01-02", volume: 8 },
    { date: "2022-01-03", volume: 12 },
    { date: "2022-01-04", volume: 15 },
    { date: "2022-01-05", volume: 11 },
    { date: "2022-01-06", volume: 9 }
  ];

  const data = {
    labels: itemData.map(v => v.date),
    datasets: [
      {
        data: itemData.map(v => v.volume),
        borderColor: "#c53030",
      }
    ],
  };


  async function withdraw(count) {
    item.count -= count

    // create new object where count is the order count
    const item_order = Object.assign({}, item, {count: count})

    const res = await fetch(`http://localhost:8000/api/order`, {
      method: 'POST',
      body: JSON.stringify([item_order]),
      headers: { 'Content-Type': 'application/json'}
    })
  }

  const options = {
    plugins: {
      legend: {
        display: false
      },
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  }


</script>

<div class="py-6 flex">
  <img src="/static/icons/{item.item.name}.png" style="width:64px; height:64px;" alt={item.item.name} />
  <h2 class="text-lg font-medium text-gray-900 pt-4 pl-4">{item.item.display_name}</h2>
</div>
<div class="py-2">
  <p class="text-sm text-gray-500 pt-2">name: {item.item.name}</p>
  {#if item.item.metadata != 0}
      <p class="text-sm text-gray-500 pt-2">metadata: {item.item.metadata}</p>
  {/if}
  {#if item.item.nbt !== null}
  <p class="text-sm text-gray-500 pt-2">nbt:</p>
  <pre class="whitespace-pre-wrap text-gray text-sm pt-2">
    nbt:{JSON.stringify(item.item.nbt.value, null, 2)}
  </pre>
  {/if}
  <p class="text-sm text-gray-500 pt-2">count: {item.count}</p>
</div>
<div class="flex">
  <p class="text-sm text-gray-500 pt-2">withdraw:</p>
  {#if item.count >= 1}
  <button class="bg-red-700 hover:bg-red-900 text-white py-1 px-3 border-transparent mx-1" on:click={() => withdraw(1)}>1</button>
  {/if}
  {#if item.count >= 64}
  <button class="bg-red-700 hover:bg-red-900 text-white py-1 px-3 border-transparent mx-1" on:click={() => withdraw(64)}>64</button>
  {/if}
  {#if item.count >= 1728}
  <button class="bg-red-700 hover:bg-red-900 text-white py-1 px-3 border-transparent mx-1" on:click={() => withdraw(1728)}>1728</button>
  {/if}
</div>
<!-- <input type="number" id="order-count" class="ml-2 border-gray-300 rounded-md shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50" bind:value={item.orderCount} min="0" step="1"> -->

<div class="max-h-sm pt-8">
  <Line {data} options={options} />
</div>
