<script lang="ts">
	import '../app.css';

	let { data, children } = $props();
</script>

<svelte:head>
	<title>Selfie — AI Portraits</title>
</svelte:head>

<div class="min-h-screen bg-[#080808] text-[#F0EBE1]">
	<header class="border-b border-[#333] px-6 py-4">
		<div class="max-w-6xl mx-auto flex items-center justify-between">
			<a href="/app/generate" class="font-['Cormorant_Garamond'] text-2xl font-bold text-[#F0EBE1]">
				Selfie
			</a>

			<nav class="flex items-center gap-6">
				<a href="/app/generate" class="text-[#F0EBE1]/70 hover:text-[#F0EBE1] transition">Generate</a>
				<a href="/app/gallery" class="text-[#F0EBE1]/70 hover:text-[#F0EBE1] transition">Gallery</a>

				{#if data.balance}
					<div class="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1a1a1a] border border-[#333]">
						<span class="text-[#F0EBE1]/60 text-sm">Balance</span>
						<span class="font-['DM_Mono'] text-[#D4A853] font-semibold">
							${(data.balance.balance_cents / 100).toFixed(2)}
						</span>
					</div>
				{/if}

				<form method="POST" action="/auth/logout">
					<button type="submit" class="text-[#F0EBE1]/50 hover:text-[#F0EBE1] transition text-sm">
						Log out
					</button>
				</form>
			</nav>
		</div>
	</header>

	<main class="max-w-6xl mx-auto px-6 py-8">
		{@render children()}
	</main>
</div>