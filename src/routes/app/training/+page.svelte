<script lang="ts">
	let { data } = $props();
</script>

<svelte:head>
	<title>Training in Progress — Selfie</title>
</svelte:head>

<div class="max-w-md mx-auto text-center">
	<h1 class="font-['Cormorant_Garamond'] text-3xl font-bold text-[#F0EBE1] mb-4">
		Training Your Model
	</h1>

	<div class="mb-8">
		<div class="w-24 h-24 mx-auto rounded-full bg-gradient-to-r from-[#D4A853] to-[#F0EBE1] animate-spin-slow opacity-50"></div>
	</div>

	<p class="text-[#F0EBE1]/60 mb-4">
		This usually takes 5-10 minutes. We'll redirect you when it's ready.
	</p>

	<div class="font-['DM_Mono'] text-[#D4A853] text-2xl">
		00:00:00
	</div>

	<p class="mt-8 text-sm text-[#F0EBE1]/40">
		You can close this page. We'll send you an email when training completes.
	</p>
</div>