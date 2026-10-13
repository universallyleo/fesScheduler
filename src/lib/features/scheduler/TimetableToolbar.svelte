<script lang="ts">
	import type { UserPreferences } from '$lib/types';
	import type { FavoriteFilter } from '$lib/ui-types';
	import type { SchedulerCopyKey } from './scheduler-copy';

	type ToolbarProps = {
		favoriteFilter?: FavoriteFilter;
		searchQuery?: string;
		settingsOpen?: boolean;
		importOpen?: boolean;
		preferences: UserPreferences;
		t: (key: SchedulerCopyKey) => string;
		savePreferences: () => void;
		setFavoriteFilter: (level: FavoriteFilter) => void;
		adjustTimeZoom: (deltaY: number) => void;
		downloadExport: () => void;
		shareExport: () => void | Promise<void>;
	};

	let {
		favoriteFilter = $bindable<FavoriteFilter>(0),
		searchQuery = $bindable(''),
		settingsOpen = $bindable(false),
		importOpen = $bindable(false),
		preferences,
		t,
		savePreferences,
		setFavoriteFilter,
		adjustTimeZoom,
		downloadExport,
		shareExport
	}: ToolbarProps = $props();
</script>
			<section class="toolbar" aria-label="Timetable controls">
				<div class="browse-controls">
					<div class="favorite-control" aria-label={t('favorite')}>
						<span class="filter-label">♥ <span class="toolbar-label">{t('favorite')}</span></span>
						<div class="filter-buttons">
							<button class:active={favoriteFilter === 0} onclick={() => setFavoriteFilter(0)}
								>{t('all')}</button
							><button class:active={favoriteFilter === 1} onclick={() => setFavoriteFilter(1)}
								>♥1+</button
							><button class:active={favoriteFilter === 2} onclick={() => setFavoriteFilter(2)}
								>♥2+</button
							><button class:active={favoriteFilter === 3} onclick={() => setFavoriteFilter(3)}
								>♥3</button
							>
						</div>
						{#if favoriteFilter > 0}<div class="layout-buttons">
								<button
									class:active={!preferences.compactFavorites}
									onclick={() => {
										preferences.compactFavorites = false;
										void savePreferences();
									}}>{t('full')}</button
								><button
									class:active={preferences.compactFavorites}
									onclick={() => {
										preferences.compactFavorites = true;
										void savePreferences();
									}}>{t('compact')}</button
								>
							</div>{/if}
					</div>
					<label class="search-field"
						><span aria-hidden="true">⌕</span><input
							aria-label={t('search')}
							placeholder={t('search')}
							value={searchQuery}
							oninput={(event) => (searchQuery = (event.currentTarget as HTMLInputElement).value)}
						/><kbd>/</kbd></label
					><div class="settings-menu">
						<button
							class="settings-button"
							class:active={settingsOpen}
							aria-expanded={settingsOpen}
							aria-label={t('settings')}
							title={t('settings')}
							onclick={() => (settingsOpen = !settingsOpen)}>⚙ <span class="toolbar-label">{t('settings')}</span></button
						>{#if settingsOpen}<div class="settings-panel">
							<label class="settings-row"
								><span>{t('zoom')}</span><div class="settings-range"
									><span aria-hidden="true">↕</span><input
										type="range"
										min="120"
										max="360"
										step="12"
											aria-label={t('zoom')}
											bind:value={preferences.timeZoom}
											onwheel={(event) => {
												event.preventDefault();
												adjustTimeZoom(event.deltaY);
											}}
											onchange={() => void savePreferences()}
									/><output>{preferences.timeZoom}</output></div
								></label
							><button
								class="settings-choice"
								class:active={preferences.blockColorMode === 'partial'}
								aria-pressed={preferences.blockColorMode === 'partial'}
								onclick={() => {
									preferences.blockColorMode =
										preferences.blockColorMode === 'full' ? 'partial' : 'full';
									void savePreferences();
								}}>◐ <span>{t('colorMode')}</span><strong
									>{preferences.blockColorMode === 'partial' ? '部分' : '全体'}</strong
								></button
							><fieldset class="settings-row settings-radio-fieldset">
								<legend>{t('laneWidth')}</legend>
								<div class="settings-radio-group settings-radio-group-two">
									<label class="settings-radio" class:active={preferences.laneWidthMode === 'type'}
										><input type="radio" name="lane-width-mode" value="type" bind:group={preferences.laneWidthMode} onchange={() => void savePreferences()} />{t('widthByType')}</label
									><label class="settings-radio" class:active={preferences.laneWidthMode === 'individual'}
										><input type="radio" name="lane-width-mode" value="individual" bind:group={preferences.laneWidthMode} onchange={() => void savePreferences()} />{t('widthIndividually')}</label
									>
								</div>
							></fieldset
						></div>{/if}
					</div>
					<div class="transfer-actions">
						<button class="quiet-button" onclick={() => (importOpen = true)}>{t('import')}</button
						><button class="quiet-button" onclick={downloadExport}>{t('export')}</button><button
							class="quiet-button share-button"
							onclick={shareExport}>{t('share')}</button
						>
					</div>
				</div>
			</section>
