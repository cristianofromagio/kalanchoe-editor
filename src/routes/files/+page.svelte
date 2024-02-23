<script lang="ts">
	import { open } from '@tauri-apps/api/dialog';
	import { appDataDir } from '@tauri-apps/api/path';

	import { readDir, BaseDirectory } from '@tauri-apps/api/fs';

	async function openDialog() {
		// Open a selection dialog for directories
		const selected = await open({
			directory: true,
			defaultPath: await appDataDir(),
		});

		console.log(selected);

		if (selected && !Array.isArray(selected)) {
			// Reads the `$APPDATA/users` directory recursively
			const entries = await readDir(selected, { recursive: true });

			console.log(entries);
		}
	}
</script>

<style>
	/* your styles go here */
</style>

<button on:click={openDialog}>Open directory</button>
