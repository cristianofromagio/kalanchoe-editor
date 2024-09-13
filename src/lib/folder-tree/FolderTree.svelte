<script lang="ts">
	import type { TreeData } from "./tree-types";

	export let tree_data: TreeData = [];

	function summaryKeyup(event: KeyboardEvent) {
		if (event.key ==  ' ' && document.activeElement?.tagName != 'SUMMARY') {
				event.preventDefault();
		}
	}
</script>

<style>
	/* your styles go here */
</style>

<ul>
	{#each tree_data as item, i}
			<li>
					{#if item.children}

						<details open={!!item.open}>
							<summary on:click={(ev) => {ev.preventDefault(); item.open = !item.open}} class="flex" on:keyup={summaryKeyup} tabindex="0">
									<slot {item} list={tree_data} id={i}>
											{item.name}
									</slot>
							</summary>

							{#if item.children}
									<div class="pl-8">
											<svelte:self tree_data={item.children} let:item let:list={tree_data} let:id={i}>
													<slot {item} list={tree_data} id={i}>{ item.name }</slot>
											</svelte:self>
									</div>
							{/if}
						</details>

					{:else}
							<slot {item} list={tree_data} id={i}>
									{item.name}
							</slot>
					{/if}
			</li>
	{/each}
</ul>
