<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<div class="recap-scroll">
	<img class="scroll" src="scroll.png" alt="scroll" />
	<h1 class="recapper">{data.recapper}</h1>
</div>

<style>
	.recap-scroll {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100vh;
		font-size: 2em;
	}

	.scroll {
		position: absolute;
		max-width: 95%;
	}

	.recapper {
		position: absolute;
		color: saddlebrown;
	}
</style>
