<script lang="ts">
	import { goto } from '$app/navigation';
	import { resizeImage, validateImageFile } from '$lib/images/resize.js';
	import { screenClearFace } from '$lib/images/face-screen.js';
	import { formatCentsAsDollars } from '$lib/stripe/shared.js';

	let { data } = $props();

	type PhotoStatus = 'checking' | 'pass' | 'fail';
	interface PhotoItem {
		id: string;
		file: File;
		preview: string;
		status: PhotoStatus;
		reason?: string;
	}

	let photos = $state<PhotoItem[]>([]);
	let uploading = $state(false);
	let error = $state('');

	const MIN_PHOTOS = 10;
	const MAX_PHOTOS = 20;
	const MIN_BALANCE = 300; // $3.00

	let passedCount = $derived(photos.filter((p) => p.status === 'pass').length);
	let checkingCount = $derived(photos.filter((p) => p.status === 'checking').length);
	let canSubmit = $derived(
		passedCount >= MIN_PHOTOS &&
			checkingCount === 0 &&
			!uploading &&
			(data.balance?.balance_cents ?? 0) >= MIN_BALANCE
	);

	async function screenPhoto(id: string, file: File) {
		const result = await screenClearFace(file);
		photos = photos.map((p) =>
			p.id === id
				? {
						...p,
						status: result.pass ? 'pass' : 'fail',
						reason: result.pass ? undefined : result.reason
					}
				: p
		);
	}

	async function handleFileSelect(event: Event) {
		const input = event.target as HTMLInputElement;
		if (!input.files) return;

		const incoming = Array.from(input.files);
		const room = MAX_PHOTOS - photos.length;
		const batch: PhotoItem[] = [];

		for (const file of incoming) {
			if (batch.length >= room) break;

			const validation = validateImageFile(file);
			if (!validation.valid) {
				error = validation.error ?? 'Invalid file';
				continue;
			}

			batch.push({
				id: crypto.randomUUID(),
				file,
				preview: URL.createObjectURL(file),
				status: 'checking'
			});
		}

		if (batch.length === 0) {
			input.value = '';
			return;
		}

		photos = [...photos, ...batch];
		error = '';
		input.value = '';

		await Promise.all(batch.map((item) => screenPhoto(item.id, item.file)));
	}

	function removePhoto(index: number) {
		URL.revokeObjectURL(photos[index].preview);
		photos = photos.filter((_, i) => i !== index);
	}

	async function handleSubmit() {
		if (!canSubmit) return;

		const passed = photos.filter((p) => p.status === 'pass');
		if (passed.length < MIN_PHOTOS || passed.length > MAX_PHOTOS) {
			error = `Need between ${MIN_PHOTOS} and ${MAX_PHOTOS} clear-face photos.`;
			return;
		}

		uploading = true;
		error = '';

		try {
			const resizedPhotos: { data: ArrayBuffer; contentType: string }[] = [];

			for (const photo of passed) {
				try {
					const resized = await resizeImage(photo.file);
					resizedPhotos.push({ data: resized.data, contentType: resized.contentType });
				} catch {
					error = `Failed to process ${photo.file.name}`;
					uploading = false;
					return;
				}
			}

			const formData = new FormData();
			resizedPhotos.forEach((photo, index) => {
				formData.append(
					'photos',
					new Blob([photo.data], { type: photo.contentType }),
					`photo_${index}.jpg`
				);
			});

			const response = await fetch('/api/train', {
				method: 'POST',
				body: formData
			});

			if (!response.ok) {
				const errorData = (await response.json()) as { message?: string };
				error = errorData.message ?? 'Failed to start training';
				uploading = false;
				return;
			}

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
		Upload at least {MIN_PHOTOS} clear face photos of yourself (up to {MAX_PHOTOS} to leave room for rejects).
		We'll screen each photo for a clear, dominant face, then train a personalized AI model.
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
			class="block border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition {photos.length > 0 ? 'border-[#D4A853]' : 'border-[#333]'} hover:border-[#D4A853]"
		>
			<input
				type="file"
				accept="image/*"
				multiple
				class="hidden"
				onchange={handleFileSelect}
				disabled={photos.length >= MAX_PHOTOS || uploading}
			/>

			<svg class="w-12 h-12 mx-auto mb-4 text-[#F0EBE1]/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
			</svg>

			{#if photos.length >= MAX_PHOTOS}
				<p class="text-[#F0EBE1]/60">Maximum {MAX_PHOTOS} photos in the grid — remove rejects to add more</p>
			{:else}
				<p class="text-[#F0EBE1]/60 mb-2">Drag and drop clear face photos here</p>
				<p class="text-[#F0EBE1]/40 text-sm">
					or click to browse ({photos.length}/{MAX_PHOTOS} slots · {passedCount} passed)
				</p>
			{/if}
		</label>
	</div>

	<!-- Preview grid -->
	{#if photos.length > 0}
		<div class="mb-6">
			<div class="flex items-center justify-between mb-2 gap-2 flex-wrap">
				<span class="text-[#F0EBE1]/80">
					{passedCount} clear face photo{passedCount === 1 ? '' : 's'} ready
					{#if checkingCount > 0}
						<span class="text-[#F0EBE1]/40">· checking {checkingCount}…</span>
					{/if}
				</span>
				{#if passedCount < MIN_PHOTOS}
					<span class="text-yellow-500 text-sm">{MIN_PHOTOS - passedCount} more clear faces needed</span>
				{/if}
			</div>

			<div class="grid grid-cols-3 md:grid-cols-5 gap-3">
				{#each photos as photo, index (photo.id)}
					<div
						class="relative aspect-square rounded-lg overflow-hidden ring-2 {photo.status === 'pass'
							? 'ring-green-600/70'
							: photo.status === 'fail'
								? 'ring-red-700/70'
								: 'ring-[#D4A853]/40'}"
					>
						<img src={photo.preview} alt="Photo {index + 1}" class="w-full h-full object-cover" />

						{#if photo.status === 'checking'}
							<div class="absolute inset-0 bg-black/55 flex items-center justify-center">
								<span class="text-xs text-[#F0EBE1]/90">checking…</span>
							</div>
						{:else if photo.status === 'pass'}
							<div class="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-green-900/85 text-green-200 text-[10px] uppercase tracking-wide">
								pass
							</div>
						{:else}
							<div class="absolute inset-x-0 bottom-0 p-1.5 bg-red-950/85 text-red-200 text-[10px] leading-tight">
								{photo.reason ?? 'failed'}
							</div>
						{/if}

						<button
							class="absolute top-1 right-1 w-6 h-6 bg-red-900/80 rounded-full flex items-center justify-center text-white hover:bg-red-800"
							onclick={() => removePhoto(index)}
							aria-label="Remove photo"
							disabled={uploading}
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
		{:else if checkingCount > 0}
			Checking faces…
		{:else if passedCount < MIN_PHOTOS}
			Need {MIN_PHOTOS} clear face photos ({passedCount}/{MIN_PHOTOS})
		{:else if data.balance && data.balance.balance_cents < MIN_BALANCE}
			Insufficient balance
		{:else}
			Train My Model
		{/if}
	</button>

	<p class="mt-4 text-sm text-[#F0EBE1]/40 text-center">
		Only photos that pass clear-face screening are submitted (max {MAX_PHOTOS}).
		Training takes 5-10 minutes. You'll be redirected when it's ready.
	</p>
</div>
