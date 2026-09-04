<script lang="ts">
	import type { Festival, UserPreferences } from '$lib/types';

	let {
		bundledFestivals,
		selectedSampleId,
		timetableLabel,
		savedLabel,
		themeLabel,
		lightThemeLabel,
		openSampleLabel,
		preferences,
		onToggleTheme,
		onToggleLanguage,
		onSelectSample
	}: {
		bundledFestivals: Festival[];
		selectedSampleId: string;
		timetableLabel: string;
		savedLabel: string;
		themeLabel: string;
		lightThemeLabel: string;
		openSampleLabel: string;
		preferences: UserPreferences;
		onToggleTheme: () => void;
		onToggleLanguage: () => void;
		onSelectSample: (id: string) => void;
	} = $props();
</script>

<header class="app-header">
	<div class="brand-lockup">
		<div class="brand-mark">L/F</div>
		<div><p class="eyebrow">LIVE-FES</p><h1>{timetableLabel}</h1></div>
	</div>
	<div class="header-actions">
		<span class="save-state"><span class="save-dot"></span>{savedLabel}</span>
		<button
			class="icon-button theme-toggle"
			class:active={preferences.theme === 'dark'}
			aria-pressed={preferences.theme === 'dark'}
			aria-label={preferences.theme === 'dark' ? lightThemeLabel : themeLabel}
			title={preferences.theme === 'dark' ? lightThemeLabel : themeLabel}
			onclick={onToggleTheme}
		>
			{preferences.theme === 'dark' ? '☀' : '◐'}
			<span>{preferences.theme === 'dark' ? lightThemeLabel : themeLabel}</span>
		</button>
		<button class="icon-button" aria-label="日本語 / English" onclick={onToggleLanguage}>文 / EN</button>
		<label class="sample-picker">
			<span>{openSampleLabel}</span>
			<select value={selectedSampleId} onchange={(event) => onSelectSample((event.currentTarget as HTMLSelectElement).value)}>
				{#each bundledFestivals as bundledFestival (bundledFestival.id)}
					<option value={bundledFestival.id}>{bundledFestival.title}</option>
				{/each}
			</select>
		</label>
	</div>
</header>
