<script lang="ts">
	import { enhance } from '$app/forms';

	let { data } = $props();
	let email = $state('');
	let password = $state('');
	let loading = $state(false);
	let errorMessage = $state('');
</script>

<svelte:head>
	<title>Log In — Selfie</title>
</svelte:head>

<div class="text-center mb-8">
	<h1 class="font-['Cormorant_Garamond'] text-4xl font-bold text-[#F0EBE1]">Welcome Back</h1>
	<p class="mt-2 text-[#F0EBE1]/60">Log in to your Selfie account</p>
</div>

{#if data.error || errorMessage}
	<div class="mb-4 p-3 rounded bg-red-900/30 border border-red-800 text-red-300 text-sm">
		{data.error || errorMessage}
	</div>
{/if}

{#if data.message}
	<div class="mb-4 p-3 rounded bg-green-900/30 border border-green-800 text-green-300 text-sm">
		{data.message}
	</div>
{/if}

<form method="POST" use:enhance={() => { loading = true; return () => { loading = false; }; }}>
	<div class="space-y-4">
		<div>
			<label for="email" class="block text-sm font-medium text-[#F0EBE1]/80 mb-1">Email</label>
			<input
				id="email"
				name="email"
				type="email"
				bind:value={email}
				required
				class="w-full px-4 py-3 rounded-lg bg-[#1a1a1a] border border-[#333] text-[#F0EBE1] placeholder-[#F0EBE1]/30 focus:border-[#D4A853] focus:outline-none"
				placeholder="you@example.com"
			/>
		</div>

		<div>
			<label for="password" class="block text-sm font-medium text-[#F0EBE1]/80 mb-1">Password</label>
			<input
				id="password"
				name="password"
				type="password"
				bind:value={password}
				required
				class="w-full px-4 py-3 rounded-lg bg-[#1a1a1a] border border-[#333] text-[#F0EBE1] placeholder-[#F0EBE1]/30 focus:border-[#D4A853] focus:outline-none"
				placeholder="Enter your password"
			/>
		</div>

		<button
			type="submit"
			disabled={loading}
			class="w-full py-3 rounded-lg bg-[#D4A853] text-[#080808] font-semibold hover:bg-[#D4A853]/90 disabled:opacity-50 transition"
		>
			{loading ? 'Logging in...' : 'Log In'}
		</button>
	</div>
</form>

<div class="mt-6 text-center text-sm text-[#F0EBE1]/60">
	Don't have an account?
	<a href="/auth/signup" class="text-[#D4A853] hover:underline">Sign up</a>
</div>

<div class="mt-4">
	<div class="relative">
		<div class="absolute inset-0 flex items-center">
			<div class="w-full border-t border-[#333]"></div>
		</div>
		<div class="relative flex justify-center text-sm">
			<span class="px-4 bg-[#080808] text-[#F0EBE1]/40">or</span>
		</div>
	</div>

	<form method="POST" use:enhance={() => { loading = true; return () => { loading = false; }; }}>
		<input type="hidden" name="provider" value="google" />
		<button
			type="submit"
			class="w-full py-3 rounded-lg bg-[#1a1a1a] border border-[#333] text-[#F0EBE1] hover:bg-[#222] transition flex items-center justify-center gap-3"
		>
			<svg class="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
			Continue with Google
		</button>
	</form>
</div>