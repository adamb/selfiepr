<script lang="ts">
	import { goto } from '$app/navigation';

	// This page should never be reached - layout redirects based on state
	// But we need a page file for the route to exist
	$effect(() => {
		goto('/app/generate', { replaceState: true });
	});
</script>

<svelte:head>
	<title>Selfie — Redirecting</title>
</svelte:head>

<div class="min-h-screen bg-[#080808] flex items-center justify-center">
	<div class="text-[#F0EBE1]/60">Redirecting...</div>
</div>