<script>
  import { setCookie } from 'svelte-cookie';
  
  const handleSubmit = async (event) => {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const response = await fetch(`http://localhost:8000/api/login`, {
      method: 'POST',
      headers : {
        'Authorization': formData.get('token')
      }
    });
    
    if (response.ok) {
      const res = await response.json();


      setCookie('idkCookie', JSON.stringify({
        token: res.token,
        user: res.user,
        station_id: res.station_id
      }), {
        expires: 1
      });
      location.reload();
    } else {
      console.log("error")
    // Handle login error
    }
  };
</script>

<div class="flex flex-col items-center justify-center h-full">
    <div class="w-32 mb-8">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -0.5 9 5" shape-rendering="crispEdges">
            <path stroke="#c40424" d="M0 0h1m3 0h1m1 0h1M4 1h1m1 0h1M0 2h1m2 0h2m1 0h1m1 0h1M0 3h1m1 0h1m1 0h1m1 0h2M0 4h1m1 0h3m1 0h1m1 0h1" />
        </svg>
    </div>
  
    <form on:submit="{handleSubmit}" class="flex flex-col items-center justify-center">
      <label for="token" class="sr-only">Token</label>
      <input type="text" id="token" name="token" placeholder="Token" class="px-4 py-2 border border-gray-300 mb-4" required />
  
      <button type="submit" class="px-4 py-2 bg-red-600 text-white hover:bg-red-700 transition-colors duration-200">Login</button>
    </form>
  </div>
  
<style>
div {
    display: flex;
    justify-content: center;
    align-items: center;
}
</style>

