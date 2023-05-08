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

<button class="relative bg-red-700 hover:bg-red-900 text-white py-1 px-3 border-transparent my-6" on:click={() => quote()}>
  Quote
  {#if isQuoteInQueue}
    <div class="absolute inset-0 bg-white opacity-75 flex items-center justify-center">
      <div class="loader"></div>
    </div>
  {/if}

</button>
  
<button class="bg-red-700 hover:bg-red-900 text-white py-1 px-3 border-transparent my-6" on:click={() => deposit()}>Deposit</button>

<List items={items} />

<style>
  .loader {
  border: 4px solid rgba(0, 0, 0, 0.2);
  border-top: 4px solid #ffffff;
  border-radius: 50%;
  width: 16px;
  height: 16px;
  animation: spin 2s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>