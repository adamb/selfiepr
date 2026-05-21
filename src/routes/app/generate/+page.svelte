<script lang="ts">
	import { goto } from '$app/navigation';
	import { formatCentsAsDollars } from '$lib/stripe/server.js';

	let { data } = $props();

	let selectedStyle = $state<string | null>(null);
	let customPrompt = $state('');
	let generating = $state(false);
	let generationId = $state<string | null>(null);
	let error = $state('');

	const styles = [
		{ id: 'cinematic', name: 'Cinematic', desc: 'Dramatic lighting, film grain' },
		{ id: 'anime', name: 'Anime', desc: 'Vibrant colors, illustration' },
		{ id: 'oil_painting', name: 'Oil Painting', desc: 'Classical art style' },
		{ id: 'neon_noir', name: 'Neon Noir', desc: 'Cyberpunk, moody' },
		{ id: 'professional', name: 'Professional', desc: 'Studio headshot' },
		{ id: 'fantasy', name: 'Fantasy', desc: 'Magical, ethereal' }
	];

	let canGenerate = $derived(
		(selectedStyle || customPrompt.trim()) &&
		!generating &&
		(data.balance?.balance_cents ?? 0) >= 15
	);

	async function handleGenerate() {
		if (!canGenerate) return;

		generating = true;
		error = '';

		try {
			const response = await fetch('/api/generate', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					stylePreset: selectedStyle,
					prompt: customPrompt.trim() || undefined
				})
			});

			if (!response.ok) {
				const errorData = await response.json() as { message?: string };
				error = errorData.message ?? 'Failed to start generation';
				generating = false;
				return;
			}

			const result = await response.json() as { generation_id: string };
			generationId = result.generation_id;

			// Poll for status
			await pollStatus();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Unknown error';
		} finally {
			generating = false;
		}
	}

	async function pollStatus() {
		if (!generationId) return;

		const poll = async (): Promise<void> => {
			const response = await fetch(`/api/generation/${generationId}/status`);
			if (!response.ok) {
				setTimeout(poll, 2000);
				return;
			}

			const result = await response.json() as {
				status: string;
				output_image_url?: string;
				error_message?: string;
			};

			if (result.status === 'succeeded' && result.output_image_url) {
				// Redirect to gallery or show image
				await goto(`/app/gallery?new=${generationId}`);
			} else if (result.status === 'failed') {
				error = result.error_message ?? 'Generation failed';
				generating = false;
			} else {
				// Still processing, poll again
				setTimeout(poll, 2000);
			}
		};

		await poll();
	}
</script>

<svelte:head>
	<title>Generate Portrait — Selfie</title>
</svelte:head>

<div class="max-w-4xl mx-auto">
	<h1 class="font-['Cormorant_Garamond'] text-3xl font-bold text-[#F0EBE1] mb-6">
		Generate Portrait
	</h1>

	<!-- Balance warning -->
	{#if data.balance && data.balance.balance_cents < 50}
		<div class="mb-6 p-4 rounded-lg bg-yellow-900/30 border border-yellow-800 text-yellow-300">
			Your balance is low (${formatCentsAsDollars(data.balance.balance_cents)}).
			<a href="/app/billing" class="underline">Add balance</a>
		</div>
	{/if}

	{#if error}
		<div class="mb-4 p-3 rounded bg-red-900/30 border border-red-800 text-red-300 text-sm">
			{error}
		</div>
	{/if}

	<!-- Style presets -->
	<div class="mb-8">
		<h2 class="text-[#F0EBE1]/80 mb-4">Choose a style</h2>
		<div class="grid grid-cols-2 md:grid-cols-3 gap-4">
			{#each styles as style}
				<button
					class="p-4 rounded-lg border transition text-left {selectedStyle === style.id ? 'border-[#D4A853] bg-[#D4A853]/10' : 'border-[#333] hover:border-[#D4A853]/50'}"
					onclick={() => { selectedStyle = style.id; customPrompt = ''; }}
					disabled={generating}
				>
					<div class="font-semibold text-[#F0EBE1]">{style.name}</div>
					<div class="text-sm text-[#F0EBE1]/50">{style.desc}</div>
				</button>
			{/each}
		</div>
	</div>

	<!-- Custom prompt -->
	<div class="mb-8">
		<h2 class="text-[#F0EBE1]/80 mb-4">Or write a custom prompt</h2>
		<textarea
			bind:value={customPrompt}
			placeholder="Describe your portrait... (must include 'TOK' to activate your model)"
			class="w-full h-32 p-4 rounded-lg bg-[#1a1a1a] border border-[#333] text-[#F0EBE1] placeholder-[#F0EBE1]/30 focus:border-[#D4A853] focus:outline-none resize-none"
			disabled={generating}
			oninput={() => { if (customPrompt) selectedStyle = null; }}
		></textarea>
		<p class="mt-2 text-sm text-[#F0EBE1]/40">
			Custom prompts must include "TOK" to activate your trained model.
		</p>
	</div>

	<!-- Generate button -->
	{#if generating}
		<div class="text-center py-12">
			<div class="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-[#D4A853] to-[#F0EBE1] animate-spin-slow opacity-50 mb-4"></div>
			<p class="text-[#F0EBE1]/60">Generating your portrait...</p>
			<p class="text-sm text-[#F0EBE1]/40 mt-2">This usually takes 10-30 seconds</p>
		</div>
	{:else}
		<button
			class="w-full py-4 rounded-lg bg-[#D4A853] text-[#080808] font-semibold hover:bg-[#D4A853]/90 disabled:opacity-50 disabled:cursor-not-allowed transition"
			disabled={!canGenerate}
			onclick={handleGenerate}
		>
			{#if data.balance && data.balance.balance_cents < 15}
				Insufficient balance
			{:else if !selectedStyle && !customPrompt.trim()}
				Select a style or enter a prompt
			{:else}
				Generate Portrait
			{/if}
		</button>

		<p class="mt-4 text-sm text-[#F0EBE1]/40 text-center">
			Estimated cost: ${formatCentsAsDollars(data.estimate.minCents)} - ${formatCentsAsDollars(data.estimate.maxCents)} · Balance: ${formatCentsAsDollars(data.balance?.balance_cents ?? 0)}
		</p>
	{/if}
</div>

<style>
	@keyframes spin-slow {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}
	.animate-spin-slow {
		animation: spin-slow 3s linear infinite;
	}
</style>