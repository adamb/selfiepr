<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	let { data } = $props();

	let elapsedSeconds = $state(data.elapsedSeconds ?? 0);
	let status = $state(data.model?.status ?? 'training');
	let error = $state(data.model?.error_message ?? '');
	let modelId = $state(data.model?.id ?? null);

	// Format elapsed time as HH:MM:SS
	function formatTime(seconds: number): string {
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		const secs = seconds % 60;
		return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
	}

	// Poll for status updates
	async function pollStatus() {
		if (!modelId) return;

		try {
			const response = await fetch(`/api/model/${modelId}/status`);
			if (!response.ok) return;

			const result = await response.json() as {
				status: string;
				elapsedSeconds?: number;
				error?: string;
			};

			status = result.status;
			if (result.elapsedSeconds) {
				elapsedSeconds = result.elapsedSeconds;
			}
			if (result.error) {
				error = result.error;
			}

			// Redirect on success
			if (status === 'succeeded') {
				await goto('/app/generate');
			}
		} catch (err) {
			console.error('Failed to poll status:', err);
		}
	}

	onMount(() => {
		// Update elapsed time every second
		const timer = setInterval(() => {
			elapsedSeconds += 1;
		}, 1000);

		// Poll for status every 15 seconds
		const poller = setInterval(pollStatus, 15000);

		// Initial poll
		pollStatus();

		return () => {
			clearInterval(timer);
			clearInterval(poller);
		};
	});
</script>

<svelte:head>
	<title>Training in Progress — Selfie</title>
</svelte:head>

<div class="max-w-md mx-auto text-center">
	<h1 class="font-['Cormorant_Garamond'] text-3xl font-bold text-[#F0EBE1] mb-4">
		{#if status === 'failed'}
			Training Failed
		{:else}
			Training Your Model
		{/if}
	</h1>

	{#if status === 'failed'}
		<div class="mb-8">
			<div class="w-24 h-24 mx-auto rounded-full bg-red-900/50 flex items-center justify-center">
				<svg class="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</div>
		</div>

		<p class="text-[#F0EBE1]/60 mb-4">
			{error || 'Training failed. Please try again.'}
		</p>

		<a href="/app/onboarding?retry=1" class="inline-block px-6 py-3 rounded-lg bg-[#D4A853] text-[#080808] font-semibold hover:bg-[#D4A853]/90 transition">
			Try Again
		</a>
	{:else}
		<div class="mb-8">
			<div class="w-24 h-24 mx-auto rounded-full bg-gradient-to-r from-[#D4A853] to-[#F0EBE1] animate-spin-slow opacity-50"></div>
		</div>

		<p class="text-[#F0EBE1]/60 mb-4">
			This usually takes 5-10 minutes. We'll redirect you when it's ready.
		</p>

		<div class="font-['DM_Mono'] text-[#D4A853] text-2xl mb-4">
			{formatTime(elapsedSeconds)}
		</div>

		<p class="text-sm text-[#F0EBE1]/40">
			You can close this page. Check back later or we'll redirect you when ready.
		</p>
	{/if}
</div>

<style>
	@keyframes spin-slow {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	.animate-spin-slow {
		animation: spin-slow 3s linear infinite;
	}
</style>