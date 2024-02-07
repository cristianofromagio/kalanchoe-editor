<script>
	import "../app.css";
</script>

<style>
	header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem;
	}
</style>

<header>
	<h1>Kalanchoe PlantUML Editor</h1>
	<nav>
		<a href="/">Index</a>
		<a href="/new">New diagram</a>
	</nav>
</header>

<slot />