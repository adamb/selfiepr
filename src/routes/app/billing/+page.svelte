<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { TOP_UP_AMOUNTS, formatCentsAsDollars } from '$lib/stripe/server.js';

	let { data } = $props();
	let loading = $state<number | null>(null);

	async function handleTopUp(amountCents: number) {
		loading = amountCents;
		try {
			const response = await fetch('/api/billing/checkout', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ amountCents })
			});

			if (!response.ok) {
				const errorData = await response.json() as { message?: string };
				alert(errorData.message || 'Failed to create checkout session');
				return;
			}

			const { url } = await response.json() as { url?: string };
			if (url) {
				window.location.href = url;
			}
		} catch (err) {
			console.error('Top-up failed:', err);
			alert('Failed to initiate payment. Please try again.');
		} finally {
			loading = null;
		}
	}
</script>

<svelte:head>
	<title>Balance — Selfie</title>
</svelte:head>

<div class="max-w-md mx-auto">
	<h1 class="font-['Cormorant_Garamond'] text-3xl font-bold text-[#F0EBE1] mb-6">
		{#if data.balance && data.balance.balance_cents > 0}
			Your Balance
		{:else}
			Add Balance
		{/if}
	</h1>

	{#if data.topupSuccess}
		<div class="mb-6 p-4 rounded-lg bg-green-900/30 border border-green-800 text-green-300">
			Payment successful! Your balance has been updated.
		</div>
	{/if}

	{#if data.topupCancel}
		<div class="mb-6 p-4 rounded-lg bg-yellow-900/30 border border-yellow-800 text-yellow-300">
			Payment was cancelled. Your balance was not changed.
		</div>
	{/if}

	<!-- Current Balance -->
	<div class="mb-8 p-6 rounded-lg bg-[#1a1a1a] border border-[#333]">
		<div class="text-[#F0EBE1]/60 text-sm mb-1">Current Balance</div>
		<div class="font-['DM_Mono'] text-4xl font-bold text-[#D4A853]">
			{data.balance ? formatCentsAsDollars(data.balance.balance_cents) : '$0.00'}
		</div>
	</div>

	<!-- Top-up buttons -->
	<div class="mb-8">
		<h2 class="text-[#F0EBE1]/80 mb-4">Add Balance</h2>
		<div class="grid grid-cols-2 gap-4">
			{#each TOP_UP_AMOUNTS as amount}
				<button
					class="p-6 rounded-lg bg-[#1a1a1a] border border-[#333] hover:border-[#D4A853] transition disabled:opacity-50 disabled:cursor-not-allowed"
					disabled={loading !== null}
					onclick={() => handleTopUp(amount)}
				>
					<div class="text-2xl font-['DM_Mono'] text-[#D4A853] font-bold">
						${formatCentsAsDollars(amount)}
					</div>
					{#if amount === 500}
						<div class="text-sm text-[#F0EBE1]/50">≈ 50 generations</div>
					{:else if amount === 1000}
						<div class="text-sm text-[#F0EBE1]/50">≈ 100 generations</div>
					{:else if amount === 2000}
						<div class="text-sm text-[#F0EBE1]/50">≈ 200 generations</div>
					{:else}
						<div class="text-sm text-[#F0EBE1]/50">≈ 500 generations</div>
					{/if}
					{#if loading === amount}
						<div class="mt-2 text-sm text-[#D4A853]">Processing...</div>
					{/if}
				</button>
			{/each}
		</div>
	</div>

	<p class="text-sm text-[#F0EBE1]/40 mb-8">
		You'll be redirected to Stripe to complete payment securely.
	</p>

	<!-- Purchase History -->
	{#if data.purchases && data.purchases.length > 0}
		<div>
			<h2 class="text-[#F0EBE1]/80 mb-4">Purchase History</h2>
			<div class="space-y-2">
				{#each data.purchases as purchase}
					<div class="p-4 rounded-lg bg-[#1a1a1a] border border-[#333] flex justify-between items-center">
						<div>
							<div class="text-[#F0EBE1] font-semibold">
								${formatCentsAsDollars(purchase.amount_cents)}
							</div>
							<div class="text-sm text-[#F0EBE1]/50">
								{new Date(purchase.created_at).toLocaleDateString()}
							</div>
						</div>
						<div class="text-sm text-green-500">
							Completed
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>