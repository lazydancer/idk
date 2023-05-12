<script>
  export let items;
  export let onItemClick;
  export let countProp = 'count';
  
  function handleClick(item) {
      onItemClick(item);
  }

  function handleKeyDown(event, item) {
    if (event.key === 'Enter' || event.key === ' ') {
      handleClick(item);
    }
  }
</script>

{#each items as v_item}
  <div class="flex flex-row border-b border-gray-100 {onItemClick ? 'hover:bg-gray-200 cursor-pointer' : ''}" on:click={() => handleClick(v_item)} on:keydown={(event) => handleKeyDown(event, v_item)}>
      <div class="mr-4" style="width: 37px; height: 37px; background: #8B8B8B; border: 2px solid; border-color: #373737 #FFF #FFF #373737">
          <img src="static/icons/{v_item.item.name}.png" style="width:32px; height:32px;" alt={v_item.item.name} />
      </div>
      <p class="flex-2 text-sm w-72 pt-2 overflow-hidden">{ v_item.item.display_name }</p>

      {#if v_item.item.nbt !== null}
      <p class="text-gray text-sm pt-2" title={ JSON.stringify(v_item.item.nbt, null, 2) }> 
        nbt             
      </p>
      {/if}
      <p class="flex-1 text-sm pr-2 pt-2 text-right">{v_item[countProp]}</p>                         
  </div>
{/each}