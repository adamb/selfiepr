<script lang="ts">
	let { data } = $props();
	let prompt = $state('');
	let selectedStyle = $state<string | null>(null);

	const styles = [
		{ id: 'cinematic', name: 'Cinematic', prompt: 'TOK, cinematic portrait, dramatic lighting, film grain' },
		{ id: 'anime', name: 'Anime', prompt: 'TOK, anime style portrait, vibrant colors, detailed illustration' },
		{ id: 'oil_painting', name: 'Oil Painting', prompt: 'TOK, oil painting portrait, classical art style, brushstrokes visible' },
		{ id: 'neon_noir', name: 'Neon Noir', prompt: 'TOK, neon noir portrait, cyberpunk lighting, moody atmosphere' },
		{ id: 'professional', name: 'Professional', prompt: 'TOK, professional headshot, studio lighting, clean background' },
		{ id: 'fantasy', name: 'Fantasy', prompt: 'TOK, fantasy portrait, magical atmosphere, ethereal lighting' }
	];
</script>

<svelte:head>
	<title>Generate Portrait — Selfie</title>
</svelte:head>

<div class="max-w-4xl mx-auto">
	<h1 class="font-['Cormorant_Garamond'] text-3xl font-bold text-[#F0EBE1] mb-6">
		Generate Portrait
	</h1>

	<!-- Style presets -->
	<div class="mb-8">
		<h2 class="text-[#F0EBE1]/80 mb-4">Choose a style</h2>
		<div class="grid grid-cols-2 md:grid-cols-3 gap-4">
			{#each styles as style}
				<button
					class="p-4 rounded-lg border transition {selectedStyle === style.id ? 'border-[#D4A853] bg-[#D4A853]/10' : 'border-[#333] hover:border-[#D4A853]/50'}"
					onclick={() => selectedStyle = style.id}
				>
					<div class="font-semibold text-[#F0EBE1]">{style.name}</div>
				</button>
			{/each}
		</div>
	</div>

	<!-- Custom prompt -->
	<div class="mb-8">
		<h2 class="text-[#F0EBE1]/80 mb-4">Or write a custom prompt</h2>
		<textarea
			bind:value={prompt}
			placeholder="Describe your portrait... (must include 'TOK')"
			class="w-full h-32 p-4 rounded-lg bg-[#1a1a1a] border border-[#333] text-[#F0EBE1] placeholder-[#F0EBE1]/30 focus:border-[#D4A853] focus:outline-none resize-none"
		></textarea>
		<p class="mt-2 text-sm text-[#F0EBE1]/40">
			Custom prompts must include 'TOK' to activate your trained model.
		</p>
	</div>

	<!-- Generate button -->
	<button
		class="w-full py-4 rounded-lg bg-[#D4A853] text-[#080808] font-semibold hover:bg-[#D4A853]/90 disabled:opacity-50 disabled:cursor-not-allowed transition"
		disabled={!selectedStyle && !prompt}
	>
		Generate Portrait
	</button>

	<p class="mt-4 text-sm text-[#F0EBE1]/40 text-center">
		Generation costs ~$0.15. Balance: $0.00
	</p>
</div>