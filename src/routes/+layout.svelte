<script>
	import Header from '$lib/Header.svelte';
	import '../app.css';
</script>

<div class="root">
	<div class="navbar">
		<Header />
	</div>
	<div class="main -mt-14 rounded bg-white mx-5 mb-5 p-1 shadow">
		<slot />
	</div>
</div>

<style>
	.root {
		display: grid;
		grid-template-areas:
			'navbar'
			'main';
		grid-template-rows: auto 1fr;
		width: 100vw;
		height: 100vh;
	}

	.navbar {
		grid-area: navbar;
		min-height: 120px;
	}
	.main {
		grid-area: main;
		overflow: auto;
	}
</style>
