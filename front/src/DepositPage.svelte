<script>
    import List from './List.svelte';
    
    let items = [];
    let isQuoteInQueue = false;

    async function getJobStatus(job_id) {
        const res = await fetch(`http://localhost:8000/api/job/${job_id}`);
        const job = await res.json();
        return job.status;
    }
  
    async function quote() {
        isQuoteInQueue = true;
        console.log("reqeuest quote from api")
        const res = await fetch(`http://localhost:8000/api/quote/${0}`)

        const { job_id } = await res.json();
        let status = await getJobStatus(job_id);
        while (status !== 'completed') {
            await new Promise(resolve => setTimeout(resolve, 1000));
            status = await getJobStatus(job_id);
        }

        const res2 = await fetch(`http://localhost:8000/api/survey/${job_id}`);
        items = await res2.json();
        isQuoteInQueue = false;
    }

    async function deposit() {
        const res = await fetch(`http://localhost:8000/api/deposit`, {
        method: 'POST',
        body: JSON.stringify({station: 0}),
        headers: { 'Content-Type': 'application/json'}
        })
    }
  

</script>

<button class="bg-red-700 hover:bg-red-900 text-white py-1 px-3 border-transparent my-6" on:click={() => quote()} disabled={isQuoteInQueue}>
  {#if isQuoteInQueue}
    <span class="flex items-center">
      <svg class="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm12 0a8 8 0 100-16v3a5 5 0 015 5h3zM4 12a8 8 0 018 8v4a8 8 0 01-8-8z"></path>
      </svg>
      Loading...
    </span>
  {:else}
    List
  {/if}
</button>
  
<button class="bg-red-700 hover:bg-red-900 text-white py-1 px-3 border-transparent my-6" on:click={() => deposit()}>Deposit</button>

<List items={items} />

