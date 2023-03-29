<script>
  import { Line } from 'svelte-chartjs'
  import 'chart.js/auto'

  export let item;
  export let close;

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

<div class="fixed z-50 inset-0 overflow-y-auto">
    <div class="flex items-center justify-center min-h-screen px-4">
    <div class="fixed inset-0 transition-opacity" aria-hidden="true">
        <div class="absolute inset-0 bg-gray-500 opacity-75" on:click={close}></div>
    </div>
    <div class="bg-white overflow-hidden shadow-xl transform transition-all sm:max-w-lg sm:w-full">
        <div class="px-4 py-2 bg-gray-100 flex justify-between">
          <h2 class="text-lg font-medium text-gray-900">{item.item.display_name}</h2>
          <button class="text-gray-700 border-none hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500" on:click={close}>
              <svg class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
          </button>
        </div>
        <div class="px-4 py-5 sm:p-6">
        <img src="static/icons/{item.item.name}.png" style="width:64px; height:64px;" alt={item.item.name} />
        <button on:click={item.orderCount += 1}>+1</button>
        <p class="text-sm text-gray-500 pt-2">name: {item.item.name}</p>
        {#if item.item.metadata != 0}
            <p class="text-sm text-gray-500 pt-2">metadata: {item.item.metadata}</p>
        {/if}
        
        {#if item.item.nbt !== null}
            <pre class="whitespace-pre-wrap text-gray text-sm pt-2">nbt:{JSON.stringify(item.item.nbt, null, 2)}</pre>
        {/if}
        <p class="text-sm text-gray-500 pt-2">count: {item.count}</p>
        <p class="text-sm text-gray-500 pt-2">order: {item.orderCount}</p>
        <Line {data} options={options}/>
        </div>
    </div>
    </div>
</div>
