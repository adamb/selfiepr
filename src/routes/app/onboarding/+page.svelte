<script lang="ts">
	let { data } = $props();
	let files = $state<File[]>([]);
</script>

<svelte:head>
	<title>Train Your Model — Selfie</title>
</svelte:head>

<div class="max-w-2xl mx-auto">
	<h1 class="font-['Cormorant_Garamond'] text-3xl font-bold text-[#F0EBE1] mb-2">
		Train Your AI Model
	</h1>
	<p class="text-[#F0EBE1]/60 mb-8">
		Upload 5-10 photos of yourself. We'll train a personalized AI model to generate portraits in different styles.
	</p>

	<div class="border-2 border-dashed border-[#333] rounded-lg p-12 text-center hover:border-[#D4A853] transition cursor-pointer">
		<input type="file" accept="image/*" multiple class="hidden" id="photo-upload" />
		<label for="photo-upload" class="cursor-pointer">
			<svg class="w-12 h-12 mx-auto mb-4 text-[#F0EBE1]/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
			</svg>
			<p class="text-[#F0EBE1]/60 mb-2">Drag and drop photos here</p>
			<p class="text-[#F0EBE1]/40 text-sm">or click to browse</p>
		</label>
	</div>

	<p class="mt-4 text-sm text-[#F0EBE1]/50">
		Upload 5-10 clear photos of your face. Different angles and expressions work best. Each photo will be resized to max 1024px.
	</p>

	<button class="mt-6 w-full py-3 rounded-lg bg-[#D4A853] text-[#080808] font-semibold hover:bg-[#D4A853]/90 disabled:opacity-50 disabled:cursor-not-allowed transition">
		Train My Model
	</button>

	<p class="mt-4 text-sm text-[#F0EBE1]/40 text-center">
		Training takes 5-10 minutes. You'll need at least $3.00 in balance.
	</p>
</div>