<script lang="ts">
	import { goto } from '$app/navigation';
	import { resizeImage, validateImageFile } from '$lib/images/resize.js';
	import { formatCentsAsDollars } from '$lib/stripe/server.js';

	let { data } = $props();
	let files = $state<File[]>([]);
	let previews = $state<string[]>([]);
	let uploading = $state(false);
	let error = $state('');

	const MIN_PHOTOS = 5;
	const MAX_PHOTOS = 10;
	const MIN_BALANCE = 300; // $3.00

	let canSubmit = $derived(files.length >= MIN_PHOTOS && !uploading && (data.balance?.balance_cents ?? 0) >= MIN_BALANCE);

	async function handleFileSelect(event: Event) {
		const input = event.target as HTMLInputElement;
		if (!input.files) return;

		const newFiles: File[] = [];
		const newPreviews: string[] = [];

		for (const file of Array.from(input.files)) {
			if (files.length + newFiles.length >= MAX_PHOTOS) break;

			const validation = validateImageFile(file);
			if (!validation.valid) {
				error = validation.error ?? 'Invalid file';
				continue;
			}

			newFiles.push(file);
			newPreviews.push(URL.createObjectURL(file));
		}

		files = [...files, ...newFiles];
		previews = [...previews, ...newPreviews];
		error = '';
	}

	function removePhoto(index: number) {
		URL.revokeObjectURL(previews[index]);
		files = files.filter((_, i) => i !== index);
		previews = previews.filter((_, i) => i !== index);
	}

	async function handleSubmit() {
		if (!canSubmit) return;

		uploading = true;
		error = '';

		try {
			// Resize all photos
			const resizedPhotos: { data: ArrayBuffer; contentType: string }[] = [];

			for (const file of files) {
				try {
					const resized = await resizeImage(file);
					resizedPhotos.push({ data: resized.data, contentType: resized.contentType });
				} catch (err) {
					error = `Failed to process ${file.name}`;
					uploading = false;
					return;
				}
			}

			// Create form data
			const formData = new FormData();
			resizedPhotos.forEach((photo, index) => {
				formData.append('photos', new Blob([photo.data], { type: photo.contentType }), `photo_${index}.jpg`);
			});

			// Submit to API
			const response = await fetch('/api/train', {
				method: 'POST',
				body: formData
			});

			if (!response.ok) {
				const errorData = await response.json() as { message?: string };
				error = errorData.message ?? 'Failed to start training';
				uploading = false;
				return;
			}

			// Redirect to training wait page
			await goto('/app/training');
		} catch (err) {
			error = err instanceof Error ? err.message : 'Unknown error';
		} finally {
			uploading = false;
		}
	}
</script>

<svelte:head>
	<title>Train Your Model — Selfie</title>
</svelte:head>

<div class="max-w-2xl mx-auto">
	<h1 class="font-['Cormorant_Garamond'] text-3xl font-bold text-[#F0EBE1] mb-2">
		{#if data.isRetry}
			Retry Training
		{:else}
			Train Your AI Model
		{/if}
	</h1>

	<p class="text-[#F0EBE1]/60 mb-8">
		Upload {MIN_PHOTOS}-{MAX_PHOTOS} photos of yourself. We'll train a personalized AI model to generate portraits in different styles.
	</p>

	{#if data.balance && data.balance.balance_cents < MIN_BALANCE}
		<div class="mb-6 p-4 rounded-lg bg-yellow-900/30 border border-yellow-800 text-yellow-300">
			You need at least ${formatCentsAsDollars(MIN_BALANCE)} in balance to train your model.
			<a href="/app/billing" class="underline">Add balance</a>
		</div>
	{/if}

	{#if error}
		<div class="mb-4 p-3 rounded bg-red-900/30 border border-red-800 text-red-300 text-sm">
			{error}
		</div>
	{/if}

	<!-- Upload zone -->
	<div class="mb-6">
		<label
			class="block border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition {files.length > 0 ? 'border-[#D4A853]' : 'border-[#333]'} hover:border-[#D4A853]"
		>
			<input
				type="file"
				accept="image/*"
				multiple
				class="hidden"
				onchange={handleFileSelect}
				disabled={files.length >= MAX_PHOTOS}
			/>

			<svg class="w-12 h-12 mx-auto mb-4 text-[#F0EBE1]/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
			</svg>

			{#if files.length >= MAX_PHOTOS}
				<p class="text-[#F0EBE1]/60">Maximum {MAX_PHOTOS} photos uploaded</p>
			{:else}
				<p class="text-[#F0EBE1]/60 mb-2">Drag and drop photos here</p>
				<p class="text-[#F0EBE1]/40 text-sm">or click to browse ({files.length}/{MAX_PHOTOS})</p>
			{/if}
		</label>
	</div>

	<!-- Preview grid -->
	{#if previews.length > 0}
		<div class="mb-6">
			<div class="flex items-center justify-between mb-2">
				<span class="text-[#F0EBE1]/80">{files.length} photos selected</span>
				{#if files.length < MIN_PHOTOS}
					<span class="text-yellow-500 text-sm">{MIN_PHOTOS - files.length} more needed</span>
				{/if}
			</div>

			<div class="grid grid-cols-3 md:grid-cols-5 gap-3">
				{#each previews as preview, index}
					<div class="relative aspect-square">
						<img src={preview} alt="Photo {index + 1}" class="w-full h-full object-cover rounded-lg" />
						<button
							class="absolute top-1 right-1 w-6 h-6 bg-red-900/80 rounded-full flex items-center justify-center text-white hover:bg-red-800"
							onclick={() => removePhoto(index)}
							aria-label="Remove photo"
						>
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Submit button -->
	<button
		class="w-full py-3 rounded-lg bg-[#D4A853] text-[#080808] font-semibold hover:bg-[#D4A853]/90 disabled:opacity-50 disabled:cursor-not-allowed transition"
		disabled={!canSubmit}
		onclick={handleSubmit}
	>
		{#if uploading}
			Processing...
		{:else if files.length < MIN_PHOTOS}
			Upload at least {MIN_PHOTOS} photos
		{:else if data.balance && data.balance.balance_cents < MIN_BALANCE}
			Insufficient balance
		{:else}
			Train My Model
		{/if}
	</button>

	<p class="mt-4 text-sm text-[#F0EBE1]/40 text-center">
		Training takes 5-10 minutes. You'll be redirected when it's ready.
	</p>
</div>