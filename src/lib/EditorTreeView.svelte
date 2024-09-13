<script lang="ts">
	import { open } from '@tauri-apps/api/dialog';
	import { appDataDir } from '@tauri-apps/api/path';

	import { readDir, BaseDirectory } from '@tauri-apps/api/fs';
	import FolderTree from '$lib/folder-tree/FolderTree.svelte';
	import type { TreeData, TreeItem } from './folder-tree/tree-types';

	export let onSetFocused = (item: TreeItem) => {};

	let tree_data: TreeData = [
		{
			name: 'teste',
			path: './',
			children: [
				{
					name: 'teste 2',
					path: './teste/teste 2.txt',
				}
			]
		}
	];
	let focusedItem = '';

	async function openDialog() {
		// Open a selection dialog for directories
		const selected = await open({
			directory: true,
			defaultPath: await appDataDir(),
		});

		console.log(selected);

		if (selected && !Array.isArray(selected)) {

			tree_data = [{
				name: selected,
				path: selected,
				open: true,
				children: []
			}];

			// Reads the `$APPDATA/users` directory recursively
			const entries = await readDir(selected, { recursive: true });
			tree_data[0]['children'] = entries;

			console.log(entries);
		}
	}

  function duplicateItem(list: any[], id: number) {
    list.splice(id + 1, 0, JSON.parse(JSON.stringify(list[id])));

    tree_data = tree_data;
  }

	function deleteItem(list: any[], id: number) {
		list.splice(id, 1);

		tree_data = tree_data;
	}

	function setFocusedItem(item: TreeItem) {
		console.log(item);
		focusedItem = item.path;

		onSetFocused(item);
	}

  function addItem(list: any[], id: number) {

    // Ensure that the children array exists
    if (!list[id].children) {
      list[id].children = [];
    }

    list[id].children.splice(id + 1, 0, JSON.parse(JSON.stringify({
      name: "New Item",
    })));

    tree_data = tree_data;
  }

  function renameItem(list: any[], id: number, name: string) {
    list[id].name = name;

    tree_data = tree_data;
  }
</script>

<style>
	/* your styles go here */
</style>

<button on:click={openDialog}>Choose folder</button>

<FolderTree {tree_data} let:item={item} let:list={list} let:id={id}>
	<div tabindex="0" role="button"
		on:keyup={() => console.log('yes')}
		on:click={() => { setFocusedItem(item) }}
		class="flex w-full group border-b border-b-green-900 py-2"
		class:bg-red-200={item.path === focusedItem}>
		<div class="grow flex gap-2">

			{#if item.children && item.children.length > 0}
					📁 <div class="text-neutral-500">{ item.children.length }</div>
			{:else}
					📄
			{/if}

			<!-- <input
					type="text"
					value={item.name}
					class="grow shrink w-full bg-transparent px-1 focus:outline-none focus:ring-0"
					style="width: fit-content;"
					on:input={(ev) => { renameItem(list, id, ev.target?.value) }}> -->

			<span class="grow shrink min-w-fit bg-transparent px-1 focus:outline-none focus:ring-0">{item.name}</span>
			<div class="flex rounded-md overflow-hidden text-xs bg-neutral-900 opacity-0 group-hover:opacity-100 transition-all border border-neutral-700 text-neutral-500">
				<button on:click={() => { addItem(list, id) }} class="transition-all hover:text-green-100/50 hover:bg-green-800/50 px-2 py-1">Add File</button>
				<button on:click={() => { duplicateItem(list, id) }} class="transition-all hover:text-blue-100/50 hover:bg-blue-800/50 px-2 py-1">Duplicate</button>
				<button on:click={() => { deleteItem(list, id) }} class="transition-all hover:text-red-100/50 hover:bg-red-800/50 px-2 py-1">Delete</button>
		</div>
	</div>
</FolderTree>
