<script lang="ts">
	let { data } = $props();
</script>

<svelte:head>
	<title>Balance — Selfie</title>
</svelte:head>

<div class="max-w-md mx-auto">
	<h1 class="font-['Cormorant_Garamond'] text-3xl font-bold text-[#F0EBE1] mb-6">
		Add Balance
	</h1>

	<p class="text-[#F0EBE1]/60 mb-8">
		You need balance to train your AI model and generate portraits. Add funds to get started.
	</p>

	<div class="grid grid-cols-2 gap-4">
		<button class="p-6 rounded-lg bg-[#1a1a1a] border border-[#333] hover:border-[#D4A853] transition">
			<div class="text-2xl font-['DM_Mono'] text-[#D4A853] font-bold">$5</div>
			<div class="text-sm text-[#F0EBE1]/50">≈ 50 generations</div>
		</button>
		<button class="p-6 rounded-lg bg-[#1a1a1a] border border-[#333] hover:border-[#D4A853] transition">
			<div class="text-2xl font-['DM_Mono'] text-[#D4A853] font-bold">$10</div>
			<div class="text-sm text-[#F0EBE1]/50">≈ 100 generations</div>
		</button>
		<button class="p-6 rounded-lg bg-[#1a1a1a] border border-[#333] hover:border-[#D4A853] transition">
			<div class="text-2xl font-['DM_Mono'] text-[#D4A853] font-bold">$20</div>
			<div class="text-sm text-[#F0EBE1]/50">≈ 200 generations</div>
		</button>
		<button class="p-6 rounded-lg bg-[#1a1a1a] border border-[#333] hover:border-[#D4A853] transition">
			<div class="text-2xl font-['DM_Mono'] text-[#D4A853] font-bold">$50</div>
			<div class="text-sm text-[#F0EBE1]/50">≈ 500 generations</div>
		</button>
	</div>

	<p class="mt-8 text-sm text-[#F0EBE1]/40">
		You'll be redirected to Stripe to complete payment securely.
	</p>
</div>