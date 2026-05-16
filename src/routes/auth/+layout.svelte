<script lang="ts">
	let { children } = $props();
</script>

<div class="min-h-screen flex items-center justify-center bg-[#080808]">
	<div class="w-full max-w-md p-8">
		{@render children()}
	</div>
</div>