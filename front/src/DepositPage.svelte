<script>
    import { setCookie, getCookie } from 'svelte-cookie';

    import List from './List.svelte';

    import { authFetch } from './auth.js';
    
    let items = [];
    let station_id = getCookie('idkCookie').station_id


    async function request_station() {
        const res = await authFetch(`http://localhost:8000/api/station`)
        console.log(res, res.station_id)
        station_id = res.station_id;
        setCookie('idkCookie', JSON.stringify({station_id: res.station_id, user_id: res.user_id, token: res.token}))
    }

    async function deposit() {
        const res = await authFetch(`http://localhost:8000/api/deposit`, {
          method: 'POST',
          body: JSON.stringify({station: 0}),
          headers: { 'Content-Type': 'application/json'}
        })
        items = [];
    }
  

</script>

{#if !station_id}
  <h1>Station:  
    <button class="relative bg-red-700 hover:bg-red-900 text-white py-1 px-3 border-transparent my-6" on:click={() => request_station()}>
      Request Station
    </button>
  </h1>

{:else}
  <h1 class="my-7">Station: <b>{station_id}</b></h1>
  
  <button class="bg-red-700 hover:bg-red-900 text-white py-1 px-3 border-transparent my-6" on:click={() => deposit()}>Deposit</button>
{/if}

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