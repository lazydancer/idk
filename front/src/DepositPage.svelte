<script>
    // import List from './List.svelte';
  
    // import { onMount } from 'svelte';
  
    // export let navigateTo;
  
    // let items = [];
    // let visibleItems = [];
  
    // onMount(async () => {
    //   const res = await fetch(`http://localhost:8000/api/list`);
    //   items = await res.json();
    //   items.map(item => item.orderCount = 0)
  
    //   visibleItems = items;
    // });
  

    async function deposit() {
        const res = await fetch(`http://localhost:8000/api/deposit`, {
        method: 'POST',
        body: JSON.stringify({station: 0}),
        headers: { 'Content-Type': 'application/json'}
        })
    }
  
  
</script>
  

  <!-- <List items={visibleItems} onItemClick={(clickedItem) => navigateTo('item', clickedItem)}/> -->

<button class="bg-red-700 hover:bg-red-900 text-white py-1 px-3 border-transparent mx-1 my-4" on:click={() => deposit()}>Deposit</button>

  