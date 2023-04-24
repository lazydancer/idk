<script>
    import List from './List.svelte';
    
    export let navigateTo;
    let items = [];
  
    async function quote() {
        const res = await fetch(`http://localhost:8000/api/quote`, {
            method: 'POST',
            body: JSON.stringify({station: 0}),
            headers: { 'Content-Type': 'application/json'}
        })

        items = await res.json();
    }

    async function deposit() {
        const res = await fetch(`http://localhost:8000/api/deposit`, {
        method: 'POST',
        body: JSON.stringify({station: 0}),
        headers: { 'Content-Type': 'application/json'}
        })
    }
  

</script>
  

<button class="bg-red-700 hover:bg-red-900 text-white py-1 px-3 border-transparent my-6" on:click={() => quote()}>List</button>
<button class="bg-red-700 hover:bg-red-900 text-white py-1 px-3 border-transparent my-6" on:click={() => deposit()}>Deposit</button>

<List items={items} />

  