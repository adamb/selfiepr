<script lang="ts">
	import { goto } from '$app/navigation';
</script>

<svelte:head>
	<title>Selfie — AI Portrait Studio</title>
</svelte:head>

<div class="min-h-screen bg-[#080808] flex flex-col">
	<!-- Header -->
	<header class="flex items-center justify-between px-8 py-6">
		<div class="font-['Cormorant_Garamond'] text-2xl font-bold text-[#F0EBE1]">
			Selfie
		</div>
		<div class="flex gap-4">
			<a
				href="/auth/login"
				class="px-4 py-2 text-[#F0EBE1] hover:text-[#D4A853] transition"
			>
				Sign In
			</a>
			<a
				href="/auth/signup"
				class="px-6 py-2 rounded-lg bg-[#D4A853] text-[#080808] font-semibold hover:bg-[#D4A853]/90 transition"
			>
				Get Started
			</a>
		</div>
	</header>

	<!-- Hero -->
	<main class="flex-1 flex flex-col items-center justify-center px-8 py-16">
		<h1 class="font-['Cormorant_Garamond'] text-5xl md:text-7xl font-bold text-[#F0EBE1] text-center mb-6">
			Your AI Portrait Studio
		</h1>
		<p class="text-[#F0EBE1]/60 text-xl text-center max-w-2xl mb-12">
			Train a personalized AI model on your photos. Generate stunning portraits in any style — cinematic, anime, oil painting, and more.
		</p>
		<div class="flex gap-4">
			<a
				href="/auth/signup"
				class="px-8 py-4 rounded-lg bg-[#D4A853] text-[#080808] font-semibold text-lg hover:bg-[#D4A853]/90 transition"
			>
				Create Your Portrait
			</a>
		</div>

		<!-- Style examples -->
		<div class="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl">
			<div class="aspect-square rounded-lg bg-gradient-to-br from-amber-900/30 to-amber-700/30 flex items-center justify-center">
				<span class="text-[#F0EBE1]/60">Cinematic</span>
			</div>
			<div class="aspect-square rounded-lg bg-gradient-to-br from-purple-900/30 to-pink-700/30 flex items-center justify-center">
				<span class="text-[#F0EBE1]/60">Anime</span>
			</div>
			<div class="aspect-square rounded-lg bg-gradient-to-br from-emerald-900/30 to-teal-700/30 flex items-center justify-center">
				<span class="text-[#F0EBE1]/60">Oil Painting</span>
			</div>
			<div class="aspect-square rounded-lg bg-gradient-to-br from-blue-900/30 to-cyan-700/30 flex items-center justify-center">
				<span class="text-[#F0EBE1]/60">Neon Noir</span>
			</div>
		</div>
	</main>

	<!-- Footer -->
	<footer class="px-8 py-6 text-[#F0EBE1]/30 text-sm text-center">
		AI-powered portraits with Flux LoRA
	</footer>
</div>