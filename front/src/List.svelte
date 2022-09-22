<script>
    import { createEventDispatcher } from 'svelte';
    import { Accordion, AccordionItem } from 'svelte-collapsible'


    export let items;
    const dispatch = createEventDispatcher();

    function add_to_order(key, count) {
        console.log("in list", key, count)
        dispatch('order', { key, count })
    }

    let accordian_key = null
</script>

<Accordion bind:key = {accordian_key} >
    {#each items as v_item}
      <AccordionItem key={v_item.key}>
          <div slot='header' class="flex flex-row py-1">
            <div class="mr-4" style="width: 37px; height: 37px; background: #8B8B8B; border: 2px solid; border-color: #373737 #FFF #FFF #373737">
                <img src="static/icons/{v_item.item.name}.png" style="width:32px; height:32px;" alt={v_item.item.name} />
              <!-- <div style="width:32px; height:32px; background-image:url(static/v_items-sprite.webp); background-position: -{v_item.imageLoc[0]}px -{v_item.imageLoc[1]}px"></div> -->
            </div>
            <p class="flex-1 text-sm w-72 pt-2">{ v_item.item.display_name }</p>
            <p class="flex-1 text-sm pt-1.5 pr-2">{v_item.count}</p>
            <p class="flex-1 text-sm pt-1.5 pr-2">{#if v_item.orderCount > 0}{v_item.orderCount}{/if}</p>
                          
          </div>
          
          <div slot='body' class='pl-4 pb-2 flex flex-row'>

            <div class="flex-1">
              <p class="text-gray text-sm">
                name: { v_item.item.name }
              </p>
              <p class="text-gray text-sm">
                metadata: { v_item.item.metadata }
              </p>
              
              <p class="text-gray text-sm">              
                nbt: { JSON.stringify(v_item.item.nbt, null, 2) }
              </p>
            </div>
            <div class="flex-1">
              <div class="flex flex-row float-right pr-2">

                 <button on:click={() => add_to_order(v_item.key, 1)} class="px-4 py-2 border border-transparent shadow-sm text-sm text-white bg-red-700 hover:bg-red-800 focus:outline-none focus:ring-2 
                  focus:ring-offset-2 focus:ring-red-600 my-6 ml-1">+1</button>
                  <button on:click={() => add_to_order(v_item.key, 64)} class="px-4 py-2 border border-transparent shadow-sm text-sm text-white bg-red-700 hover:bg-red-800 focus:outline-none focus:ring-2 
                  focus:ring-offset-2 focus:ring-red-600 my-6 ml-1">+64</button>
                  <form on:submit|preventDefault={()=>add_to_order(v_item.key, v_item.orderTempTextBox)}>

                    <input 
                      type="number"
                      bind:value={v_item.orderTempTextBox}
                      class="focus:ring-indigo-500 focus:border-indigo-500 shadow-sm sm:text-sm border-gray-300 w-16 h-9 pl-2 ml-1 py-2 my-6"
                      placeholder="+x" />
                  </form>


                <button on:click={()=>add_to_order(v_item.key, -v_item.orderCount)} class="ml-2 px-4 py-2 border border-transparent shadow-sm text-sm text-white bg-red-700 hover:bg-red-800 focus:outline-none focus:ring-2 
                  focus:ring-offset-2 focus:ring-red-600 my-6">Clear</button>

              </div>
            </div>
          </div>
      </AccordionItem>
    {/each}
</Accordion>

