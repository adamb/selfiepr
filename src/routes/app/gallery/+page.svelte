<script lang="ts">
	let { data } = $props();
</script>

<svelte:head>
	<title>Gallery — Selfie</title>
</svelte:head>

<div class="max-w-6xl mx-auto">
	<h1 class="font-['Cormorant_Garamond'] text-3xl font-bold text-[#F0EBE1] mb-6">
		Your Gallery
	</h1>

	<div class="text-center py-16">
		<svg class="w-16 h-16 mx-auto mb-4 text-[#F0EBE1]/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
		</svg>
		<p class="text-[#F0EBE1]/40">
			No portraits yet. Generate your first one to get started.
		</p>
		<a href="/app/generate" class="inline-block mt-4 px-6 py-3 rounded-lg bg-[#D4A853] text-[#080808] font-semibold hover:bg-[#D4A853]/90 transition">
			Generate Portrait
		</a>
	</div>
</div>