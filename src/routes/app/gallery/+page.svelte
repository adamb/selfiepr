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

	{#if data.newGenerationId}
		<div class="mb-6 p-4 rounded-lg bg-green-900/30 border border-green-800 text-green-300">
			Your portrait has been generated! Check your balance for the deduction.
		</div>
	{/if}

	{#if data.generations.length === 0}
		<div class="text-center py-16">
			<svg class="w-16 h-16 mx-auto mb-4 text-[#F0EBE1]/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
			</svg>
			<p class="text-[#F0EBE1]/40 mb-4">
				No portraits yet. Generate your first one to get started.
			</p>
			<a href="/app/generate" class="inline-block px-6 py-3 rounded-lg bg-[#D4A853] text-[#080808] font-semibold hover:bg-[#D4A853]/90 transition">
				Generate Portrait
			</a>
		</div>
	{:else}
		<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
			{#each data.generations as generation}
				<div class="relative aspect-square rounded-lg overflow-hidden bg-[#1a1a1a] border border-[#333] group">
					{#if generation.output_image_url}
						<img
							src={generation.output_image_url}
							alt="Generated portrait"
							class="w-full h-full object-cover"
						/>
						<div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
							<a
								href={generation.output_image_url}
								download
								class="px-4 py-2 rounded bg-[#D4A853] text-[#080808] font-semibold hover:bg-[#D4A853]/90 transition"
							>
								Download
							</a>
						</div>
					{:else}
						<div class="w-full h-full flex items-center justify-center text-[#F0EBE1]/30">
							No image
						</div>
					{/if}

					<!-- Style badge -->
					{#if generation.style_preset}
						<div class="absolute top-2 left-2 px-2 py-1 rounded bg-black/70 text-xs text-[#F0EBE1]/80">
							{generation.style_preset}
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>