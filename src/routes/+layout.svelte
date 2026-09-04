<script lang="ts">
	import { onMount } from 'svelte';
	import favicon from '$lib/assets/favicon.svg';
	import '../app.css';

	let { children } = $props();
	let updateReady = $state(false);

	onMount(() => {
		if (!('serviceWorker' in navigator)) return;
		let disposed = false;
		const watchRegistration = (current: ServiceWorkerRegistration) => {
			if (current.waiting) updateReady = true;
			current.addEventListener('updatefound', () => {
				const installing = current.installing;
				installing?.addEventListener('statechange', () => {
					if (!disposed && installing.state === 'installed' && navigator.serviceWorker.controller)
						updateReady = true;
				});
			});
		};
		void navigator.serviceWorker.ready.then((current) => {
			if (!disposed) watchRegistration(current);
		});
		return () => {
			disposed = true;
		};
	});

	function activateUpdate(): void {
		updateReady = false;
		void navigator.serviceWorker.ready.then((registration) => {
			registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
		});
	}
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<meta name="theme-color" content="#f5f3ef" />
	<meta name="description" content="A local-first festival timetable scheduler." />
</svelte:head>

{@render children()}

{#if updateReady}
	<div class="update-prompt" role="status">
		<span>新しいバージョンがあります。</span>
		<button onclick={activateUpdate}>更新</button>
	</div>
{/if}

<style>
	:global(*) {
		box-sizing: border-box;
	}

	:global(html) {
		background: #f5f3ef;
	}

	:global(body) {
		margin: 0;
		background: #f5f3ef;
		color: #1e293b;
		font-family: 'Noto Sans JP', 'Hiragino Kaku Gothic ProN', 'Yu Gothic', system-ui, sans-serif;
		-webkit-font-smoothing: antialiased;
	}

	:global(button),
	:global(input),
	:global(select),
	:global(textarea) {
		font: inherit;
	}

	:global(button) {
		cursor: pointer;
	}

	:global(:focus-visible) {
		outline: 3px solid #226b72;
		outline-offset: 2px;
	}

	.update-prompt {
		position: fixed;
		right: 16px;
		bottom: 16px;
		z-index: 50;
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 10px 12px 10px 14px;
		border: 1px solid #b6d0cc;
		border-radius: 6px;
		background: #f4fffc;
		color: #173c3b;
		font-size: 12px;
		box-shadow: 0 8px 24px rgba(24, 55, 54, 0.18);
	}

	.update-prompt button {
		padding: 5px 10px;
		border: 0;
		border-radius: 4px;
		background: #226b72;
		color: white;
		font-size: 12px;
		font-weight: 800;
	}
</style>
