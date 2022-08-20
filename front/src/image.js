// image_name -> (x, y)

const sprite_map = {"air": [0, 0], "stone": [32, 64], "grass": [416, 416], "dirt": [288, 576], "cobblestone": [32, 736], "planks": [800, 352], "sapling": [64, 800], "bedrock": [416, 800], "flowing_water": [768, 800], "water": [832, 288], "flowing_lava": [64, 64], "lava": [128, 96], "sand": [32, 160], "gravel": [224, 96], "gold_ore": [256, 0], "iron_ore": [96, 256], "coal_ore": [320, 96], "log": [128, 352], "leaves": [416, 96], "sponge": [64, 416], "glass": [448, 0], "lapis_ore": [448, 352], "lapis_block": [256, 448], "dispenser": [32, 480], "sandstone": [448, 480], "noteblock": [512, 288], "bed": [672, 288], "golden_rail": [320, 544], "detector_rail": [576, 96], "sticky_piston": [576, 448], "web": [320, 576], "tallgrass": [608, 128], "deadbush": [608, 480], "piston": [256, 608], "piston_head": [608, 608], "wool": [0, 640], "yellow_flower": [96, 672], "red_flower": [704, 0], "brown_mushroom": [736, 256], "red_mushroom": [64, 736], "gold_block": [416, 736], "iron_block": [768, 0], "double_stone_slab": [768, 576], "stone_slab": [384, 768], "brick_block": [736, 768], "tnt": [800, 64], "bookshelf": [800, 96], "mossy_cobblestone": [800, 128], "obsidian": [800, 160], "torch": [800, 384], "fire": [800, 416], "mob_spawner": [800, 448], "oak_stairs": [800, 480], "chest": [800, 512], "redstone_wire": [800, 544], "diamond_ore": [800, 576], "diamond_block": [800, 608], "crafting_table": [800, 640], "wheat": [96, 576], "farmland": [96, 800], "furnace": [128, 800], "lit_furnace": [160, 800], "standing_sign": [192, 800], "wooden_door": [64, 608], "ladder": [256, 800], "rail": [288, 800], "stone_stairs": [320, 800], "wall_sign": [352, 800], "lever": [384, 800], "stone_pressure_plate": [448, 800], "iron_door": [288, 608], "wooden_pressure_plate": [512, 800], "redstone_ore": [544, 800], "lit_redstone_ore": [576, 800], "unlit_redstone_torch": [608, 800], "redstone_torch": [640, 800], "stone_button": [672, 800], "snow_layer": [704, 800], "ice": [736, 800], "snow": [800, 800], "cactus": [832, 0], "clay": [832, 32], "reeds": [544, 608], "jukebox": [832, 96], "fence": [832, 128], "pumpkin": [832, 160], "netherrack": [832, 192], "soul_sand": [832, 224], "glowstone": [832, 256], "portal": [832, 320], "lit_pumpkin": [832, 352], "cake": [672, 256], "unpowered_repeater": [832, 416], "powered_repeater": [832, 448], "stained_glass": [832, 704], "trapdoor": [160, 832], "monster_egg": [352, 832], "stonebrick": [480, 832], "brown_mushroom_block": [512, 832], "red_mushroom_block": [96, 0], "iron_bars": [96, 32], "glass_pane": [96, 64], "melon_block": [0, 96], "pumpkin_stem": [32, 96], "melon_stem": [64, 96], "vine": [96, 96], "fence_gate": [128, 0], "brick_stairs": [128, 32], "stone_brick_stairs": [128, 64], "mycelium": [0, 128], "waterlily": [32, 128], "nether_brick": [64, 128], "nether_brick_fence": [96, 128], "nether_brick_stairs": [128, 128], "nether_wart": [192, 672], "enchanting_table": [160, 32], "brewing_stand": [416, 672], "cauldron": [704, 32], "end_portal": [160, 128], "end_portal_frame": [64, 160], "end_stone": [96, 160], "dragon_egg": [128, 160], "redstone_lamp": [160, 160], "lit_redstone_lamp": [192, 0], "double_wooden_slab": [0, 192], "wooden_slab": [192, 192], "cocoa": [224, 0], "sandstone_stairs": [224, 32], "emerald_ore": [224, 64], "ender_chest": [224, 128], "tripwire_hook": [224, 192], "emerald_block": [0, 224], "spruce_stairs": [32, 224], "birch_stairs": [64, 224], "jungle_stairs": [96, 224], "command_block": [128, 224], "beacon": [160, 224], "cobblestone_wall": [224, 224], "flower_pot": [736, 288], "carrots": [256, 64], "potatoes": [256, 96], "wooden_button": [256, 128], "skull": [736, 672], "anvil": [256, 192], "trapped_chest": [256, 224], "light_weighted_pressure_plate": [0, 256], "heavy_weighted_pressure_plate": [32, 256], "unpowered_comparator": [64, 256], "powered_comparator": [128, 256], "daylight_detector": [160, 256], "redstone_block": [192, 256], "quartz_ore": [224, 256], "hopper": [256, 256], "quartz_block": [288, 64], "quartz_stairs": [288, 96], "activator_rail": [288, 128], "dropper": [288, 160], "stained_hardened_clay": [128, 288], "stained_glass_pane": [32, 320], "leaves2": [352, 0], "log2": [352, 64], "acacia_stairs": [352, 96], "dark_oak_stairs": [352, 128], "slime": [352, 160], "barrier": [352, 192], "iron_trapdoor": [352, 224], "prismarine": [352, 320], "sea_lantern": [0, 352], "hay_block": [160, 352], "carpet": [384, 32], "hardened_clay": [384, 320], "coal_block": [384, 352], "packed_ice": [0, 384], "double_plant": [192, 384], "standing_banner": [224, 384], "wall_banner": [256, 384], "daylight_detector_inverted": [288, 384], "red_sandstone": [384, 384], "red_sandstone_stairs": [416, 128], "double_stone_slab2": [416, 160], "stone_slab2": [416, 192], "spruce_fence_gate": [416, 224], "birch_fence_gate": [416, 256], "jungle_fence_gate": [416, 288], "dark_oak_fence_gate": [416, 320], "acacia_fence_gate": [416, 352], "spruce_fence": [416, 384], "birch_fence": [0, 416], "jungle_fence": [96, 416], "dark_oak_fence": [128, 416], "acacia_fence": [160, 416], "spruce_door": [768, 256], "birch_door": [768, 288], "jungle_door": [768, 320], "acacia_door": [768, 608], "dark_oak_door": [768, 640], "end_rod": [352, 416], "chorus_plant": [384, 416], "chorus_flower": [448, 32], "purpur_block": [448, 64], "purpur_pillar": [448, 96], "purpur_stairs": [448, 128], "purpur_double_slab": [448, 160], "purpur_slab": [448, 192], "end_bricks": [448, 224], "beetroots": [448, 256], "grass_path": [448, 288], "end_gateway": [448, 320], "repeating_command_block": [448, 384], "chain_command_block": [448, 416], "frosted_ice": [0, 448], "magma": [32, 448], "nether_wart_block": [64, 448], "red_nether_brick": [96, 448], "bone_block": [128, 448], "structure_void": [160, 448], "observer": [192, 448], "white_shulker_box": [224, 448], "orange_shulker_box": [288, 448], "magenta_shulker_box": [320, 448], "light_blue_shulker_box": [352, 448], "yellow_shulker_box": [384, 448], "lime_shulker_box": [416, 448], "pink_shulker_box": [448, 448], "gray_shulker_box": [480, 128], "silver_shulker_box": [480, 416], "cyan_shulker_box": [480, 448], "purple_shulker_box": [0, 480], "blue_shulker_box": [64, 480], "brown_shulker_box": [96, 480], "green_shulker_box": [128, 480], "red_shulker_box": [160, 480], "black_shulker_box": [192, 480], "white_glazed_terracotta": [224, 480], "orange_glazed_terracotta": [256, 480], "magenta_glazed_terracotta": [288, 480], "light_blue_glazed_terracotta": [320, 480], "yellow_glazed_terracotta": [352, 480], "lime_glazed_terracotta": [480, 480], "pink_glazed_terracotta": [512, 0], "gray_glazed_terracotta": [512, 32], "light_gray_glazed_terracotta": [512, 64], "cyan_glazed_terracotta": [512, 96], "purple_glazed_terracotta": [512, 128], "blue_glazed_terracotta": [512, 160], "brown_glazed_terracotta": [512, 192], "green_glazed_terracotta": [512, 224], "red_glazed_terracotta": [512, 256], "black_glazed_terracotta": [512, 320], "concrete": [64, 512], "concrete_powder": [544, 32], "structure_block": [544, 320], "iron_shovel": [544, 352], "iron_pickaxe": [544, 384], "iron_axe": [544, 416], "flint_and_steel": [544, 448], "apple": [544, 512], "bow": [0, 544], "arrow": [32, 544], "coal": [96, 544], "diamond": [128, 544], "iron_ingot": [160, 544], "gold_ingot": [192, 544], "iron_sword": [224, 544], "wooden_sword": [256, 544], "wooden_shovel": [288, 544], "wooden_pickaxe": [352, 544], "wooden_axe": [384, 544], "stone_sword": [416, 544], "stone_shovel": [448, 544], "stone_pickaxe": [480, 544], "stone_axe": [512, 544], "diamond_sword": [544, 544], "diamond_shovel": [576, 0], "diamond_pickaxe": [576, 32], "diamond_axe": [576, 64], "stick": [576, 128], "bowl": [576, 160], "mushroom_stew": [576, 192], "golden_sword": [576, 224], "golden_shovel": [576, 256], "golden_pickaxe": [576, 288], "golden_axe": [576, 320], "string": [576, 352], "feather": [576, 384], "gunpowder": [576, 416], "wooden_hoe": [576, 480], "stone_hoe": [576, 512], "iron_hoe": [576, 544], "diamond_hoe": [0, 576], "golden_hoe": [32, 576], "wheat_seeds": [64, 576], "bread": [128, 576], "leather_helmet": [160, 576], "leather_chestplate": [192, 576], "leather_leggings": [352, 576], "leather_boots": [384, 576], "chainmail_helmet": [416, 576], "chainmail_chestplate": [448, 576], "chainmail_leggings": [480, 576], "chainmail_boots": [512, 576], "iron_helmet": [544, 576], "iron_chestplate": [576, 576], "iron_leggings": [608, 0], "iron_boots": [608, 32], "diamond_helmet": [608, 160], "diamond_chestplate": [608, 192], "diamond_leggings": [608, 224], "diamond_boots": [608, 256], "golden_helmet": [608, 288], "golden_chestplate": [608, 320], "golden_leggings": [608, 352], "golden_boots": [608, 384], "flint": [608, 416], "porkchop": [608, 448], "cooked_porkchop": [608, 512], "painting": [608, 544], "golden_apple": [0, 608], "sign": [32, 608], "bucket": [96, 608], "water_bucket": [128, 608], "lava_bucket": [160, 608], "minecart": [192, 608], "saddle": [224, 608], "redstone": [320, 608], "snowball": [352, 608], "boat": [384, 608], "leather": [416, 608], "milk_bucket": [448, 608], "brick": [480, 608], "clay_ball": [512, 608], "paper": [576, 608], "book": [640, 0], "slime_ball": [640, 32], "chest_minecart": [640, 64], "furnace_minecart": [640, 96], "egg": [640, 128], "compass": [640, 160], "fishing_rod": [640, 192], "clock": [640, 224], "glowstone_dust": [640, 256], "fish": [640, 384], "cooked_fish": [320, 640], "dye": [576, 640], "bone": [672, 192], "sugar": [672, 224], "repeater": [672, 320], "cookie": [672, 352], "filled_map": [672, 384], "shears": [672, 416], "melon": [672, 448], "pumpkin_seeds": [672, 480], "melon_seeds": [672, 512], "beef": [672, 544], "cooked_beef": [672, 576], "chicken": [672, 608], "cooked_chicken": [672, 640], "rotten_flesh": [0, 672], "ender_pearl": [32, 672], "blaze_rod": [64, 672], "ghast_tear": [128, 672], "gold_nugget": [160, 672], "potion": [224, 672], "glass_bottle": [256, 672], "spider_eye": [288, 672], "fermented_spider_eye": [320, 672], "blaze_powder": [352, 672], "magma_cream": [384, 672], "ender_eye": [704, 64], "speckled_melon": [704, 96], "spawn_egg": [704, 288], "experience_bottle": [736, 64], "fire_charge": [736, 96], "writable_book": [736, 128], "written_book": [736, 160], "emerald": [736, 192], "item_frame": [736, 224], "carrot": [736, 320], "potato": [736, 352], "baked_potato": [736, 384], "poisonous_potato": [736, 416], "map": [736, 448], "golden_carrot": [736, 480], "carrot_on_a_stick": [736, 704], "nether_star": [0, 736], "pumpkin_pie": [96, 736], "fireworks": [128, 736], "firework_charge": [160, 736], "enchanted_book": [192, 736], "comparator": [224, 736], "netherbrick": [256, 736], "quartz": [288, 736], "tnt_minecart": [320, 736], "hopper_minecart": [352, 736], "prismarine_shard": [384, 736], "prismarine_crystals": [448, 736], "rabbit": [480, 736], "cooked_rabbit": [512, 736], "rabbit_stew": [544, 736], "rabbit_foot": [576, 736], "rabbit_hide": [608, 736], "armor_stand": [640, 736], "iron_horse_armor": [672, 736], "golden_horse_armor": [704, 736], "diamond_horse_armor": [736, 736], "lead": [768, 32], "name_tag": [768, 64], "command_block_minecart": [768, 96], "mutton": [768, 128], "cooked_mutton": [768, 160], "banner": [768, 192], "end_crystal": [768, 224], "chorus_fruit": [768, 672], "popped_chorus_fruit": [768, 704], "beetroot": [768, 736], "beetroot_seeds": [0, 768], "beetroot_soup": [32, 768], "dragon_breath": [64, 768], "splash_potion": [96, 768], "spectral_arrow": [128, 768], "tipped_arrow": [416, 768], "lingering_potion": [448, 768], "shield": [480, 768], "elytra": [512, 768], "spruce_boat": [544, 768], "birch_boat": [576, 768], "jungle_boat": [608, 768], "acacia_boat": [640, 768], "dark_oak_boat": [672, 768], "totem_of_undying": [704, 768], "shulker_shell": [768, 768], "iron_nugget": [800, 0], "knowledge_book": [800, 32], "record_13": [480, 0], "record_cat": [480, 32], "record_blocks": [480, 64], "record_chirp": [480, 96], "record_far": [480, 160], "record_mall": [480, 192], "record_mellohi": [480, 224], "record_stal": [480, 256], "record_strad": [480, 288], "record_ward": [480, 320], "record_11": [480, 352], "record_wait": [480, 384]}

export function get_image(image_name) {
    return sprite_map[image_name] ?? [0, 0]
}