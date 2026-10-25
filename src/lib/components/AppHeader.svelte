<script lang="ts">
	import type { Festival, UserPreferences } from '$lib/types';
	import type { SchedulerCopyKey } from '$lib/features/scheduler/scheduler-copy';

	let {
		festival, bundledFestivals, savedFestivals, selectedSampleId, timetableLabel, savedLabel, preferences,
		searchQuery = $bindable(''), settingsOpen = $bindable(false), importOpen = $bindable(false), t,
		onToggleTheme, onToggleLanguage, onSelectSample, onOpenSaved, onDeleteSaved, onNewFestival, onResetFestival,
		savePreferences, adjustTimeZoom, downloadExport, shareExport
	}: {
		festival: Festival; bundledFestivals: Festival[]; savedFestivals: Festival[]; selectedSampleId: string;
		timetableLabel: string; savedLabel: string; preferences: UserPreferences; searchQuery?: string;
		settingsOpen?: boolean; importOpen?: boolean; t: (key: SchedulerCopyKey) => string;
		onToggleTheme: () => void; onToggleLanguage: () => void; onSelectSample: (id: string) => void;
		onOpenSaved: (id: string) => void; onDeleteSaved: (id: string, title: string) => void; onNewFestival: () => void; onResetFestival: () => void;
		savePreferences: () => void; adjustTimeZoom: (deltaY: number) => void; downloadExport: () => void;
		shareExport: () => void | Promise<void>;
	} = $props();
	let menuOpen = $state(false);
</script>

<header class="app-header">
	<div class="brand-lockup"><div class="brand-mark">L/F</div><div><p class="eyebrow">LIVE-FES</p><h1>{timetableLabel}</h1></div></div>
	<div class="festival-identity"><h2>{festival.title}</h2><p class="eyebrow">LOCAL TIMETABLE · {festival.timezone}</p></div>
	<label class="search-field header-search"><span aria-hidden="true">⌕</span><input aria-label={t('search')} placeholder={t('search')} value={searchQuery} oninput={(event) => (searchQuery = (event.currentTarget as HTMLInputElement).value)} /><kbd>/</kbd></label>
	<div class="header-action-tray">
		<div class="header-menu"><button class="header-action-button header-action-primary" aria-expanded={menuOpen} onclick={() => (menuOpen = !menuOpen)}>⋯ 他のフェス・シェア</button>{#if menuOpen}<div class="header-menu-panel">
			<button onclick={() => { onNewFestival(); menuOpen = false; }}>＋ {t('newFestival')}</button><button onclick={() => { importOpen = true; menuOpen = false; }}>{t('import')}</button><button onclick={() => { downloadExport(); menuOpen = false; }}>{t('export')}</button><button onclick={() => { void shareExport(); menuOpen = false; }}>{t('share')}</button><button onclick={() => { onResetFestival(); menuOpen = false; }}>↻ リセット</button>
			<details open><summary>サンプルを開く</summary>{#each bundledFestivals as bundledFestival (bundledFestival.id)}<button class:active={selectedSampleId === bundledFestival.id} onclick={() => { onSelectSample(bundledFestival.id); menuOpen = false; }}>{bundledFestival.title}</button>{/each}</details>
			{#if savedFestivals.length}<details open><summary>この端末に保存したタイムテーブルを開く</summary>{#each savedFestivals as savedFestival (savedFestival.id)}<div class="saved-festival-menu-entry"><button class:active={savedFestival.id === festival.id} onclick={() => { onOpenSaved(savedFestival.id); menuOpen = false; }}>{savedFestival.title}</button><button class="saved-festival-delete" aria-label={`${savedFestival.title}を削除`} title="ローカルから削除" onclick={() => onDeleteSaved(savedFestival.id, savedFestival.title)}>削除</button></div>{/each}</details>{/if}
		</div>{/if}</div>
		<button class="header-action-button header-icon-button" aria-label={preferences.theme === 'dark' ? t('lightTheme') : t('theme')} title={preferences.theme === 'dark' ? t('lightTheme') : t('theme')} onclick={onToggleTheme}>{preferences.theme === 'dark' ? '☀' : '◐'}</button>
		<div class="settings-menu"><button class="header-action-button" class:active={settingsOpen} aria-expanded={settingsOpen} onclick={() => (settingsOpen = !settingsOpen)}>⚙ {t('settings')}</button>{#if settingsOpen}<div class="settings-panel header-settings-panel">
			<label class="settings-row"><span>{t('zoom')}</span><div class="settings-range"><span aria-hidden="true">↕</span><input type="range" min="120" max="360" step="12" aria-label={t('zoom')} bind:value={preferences.timeZoom} onwheel={(event) => { event.preventDefault(); adjustTimeZoom(event.deltaY); }} onchange={() => void savePreferences()} /><output>{preferences.timeZoom}</output></div></label>
			<button class="settings-choice" class:active={preferences.blockColorMode === 'partial'} aria-pressed={preferences.blockColorMode === 'partial'} onclick={() => { preferences.blockColorMode = preferences.blockColorMode === 'full' ? 'partial' : 'full'; void savePreferences(); }}>◐ <span>{t('colorMode')}</span><strong>{preferences.blockColorMode === 'partial' ? '部分' : '全体'}</strong></button>
			<fieldset class="settings-row settings-radio-fieldset"><legend>{t('laneWidth')}</legend><div class="settings-radio-group settings-radio-group-two"><label class="settings-radio" class:active={preferences.laneWidthMode === 'type'}><input type="radio" name="lane-width-mode" value="type" bind:group={preferences.laneWidthMode} onchange={() => void savePreferences()} />{t('widthByType')}</label><label class="settings-radio" class:active={preferences.laneWidthMode === 'individual'}><input type="radio" name="lane-width-mode" value="individual" bind:group={preferences.laneWidthMode} onchange={() => void savePreferences()} />{t('widthIndividually')}</label></div></fieldset>
		</div>{/if}</div>
		<button class="header-action-button header-icon-button" aria-label="日本語 / English" onclick={onToggleLanguage}>文</button>
	</div>
	<span class="save-state"><span class="save-dot"></span>{savedLabel}</span>
</header>
