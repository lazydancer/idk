<script>
    import { setCookie, getCookie } from 'svelte-cookie';

    import List from './List.svelte';

    import { authFetch } from './auth.js';
    import { get } from 'svelte/store';
    
    let items = [];
    let cookie = JSON.parse(getCookie('idkCookie'))
    let surveyJobId = null;

    async function request_station() {
        const res = await authFetch(`http://localhost:8000/api/station`)
        console.log(res.user_id)
        cookie = JSON.parse(getCookie('idkCookie'))
        setCookie('idkCookie', JSON.stringify({station_id: res.station_id, ...cookie}))
    }

    async function survey() {
        const res = await authFetch(`http://localhost:8000/api/survey`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json'}        
        })
        console.log("survey", JSON.stringify(res))
        surveyJobId = res.job_id
        startCheckingSurveyStatus()
    }

    function startCheckingSurveyStatus() {
        setInterval(() => {
            if (surveyJobId != null) {
                checkSurvey()
            }
        }, 1000)
    }

    async function checkSurvey() {
        const res = await authFetch(`http://localhost:8000/api/job/${surveyJobId}`)
        console.log("checkSurvery", JSON.stringify(res))
        if (res.job.status == 'completed') {
            items = res.items
            surveyJobId = null
        }
    }

    async function deposit() {
        const res = await authFetch(`http://localhost:8000/api/deposit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json'}
        })
        items = [];
    }
  

</script>

{#if cookie}
  <h1 class="my-7">Station: <b>{cookie.station_id}</b></h1>

  <List items={items} />

  {#if surveyJobId !== null}
    <button class="bg-gray-500 text-white py-1 px-3 my-6" disabled>Survey in Progress...</button>
  {:else}
    <button class="bg-red-700 hover:bg-red-900 text-white py-1 px-3 border-transparent my-6" on:click={() => survey()}>Survey</button>
  {/if}
  <button class="bg-red-700 hover:bg-red-900 text-white py-1 px-3 border-transparent my-6" on:click={() => deposit()}>Deposit</button>

{:else}

  <h1>Station:  
  <button class="relative bg-red-700 hover:bg-red-900 text-white py-1 px-3 border-transparent my-6" on:click={() => request_station()}>
    Request Station
  </button>
  </h1>

{/if}
