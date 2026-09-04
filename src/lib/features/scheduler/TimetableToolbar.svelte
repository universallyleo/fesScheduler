<script lang="ts">
	import type { Festival, LaneType, UserPreferences } from '$lib/types';
	import type { FavoriteFilter } from '$lib/ui-types';
	import type { SchedulerCopyKey } from './scheduler-copy';

	type ToolbarProps = {
		favoriteFilter?: FavoriteFilter;
		searchQuery?: string;
		settingsOpen?: boolean;
		editMode: boolean;
		addMode: boolean;
		importOpen?: boolean;
		preferences: UserPreferences;
		snapOptions: UserPreferences['snapMinutes'][];
		t: (key: SchedulerCopyKey) => string;
		savePreferences: () => void;
		setFavoriteFilter: (level: FavoriteFilter) => void;
		adjustTimeZoom: (deltaY: number) => void;
		downloadExport: () => void;
		shareExport: () => void | Promise<void>;
		onToggleEdit: () => void;
		openFestivalSettings: () => void;
		undoStack: Festival[];
		redoStack: Festival[];
		undo: () => void;
		redo: () => void;
		startAdd: () => void;
		addLane: (type?: LaneType) => void;
	};

	let {
		favoriteFilter = $bindable<FavoriteFilter>(0),
		searchQuery = $bindable(''),
		settingsOpen = $bindable(false),
		editMode,
		addMode,
		importOpen = $bindable(false),
		preferences,
		snapOptions,
		t,
		savePreferences,
		setFavoriteFilter,
		adjustTimeZoom,
		downloadExport,
		shareExport,
		onToggleEdit,
		openFestivalSettings,
		undoStack,
		redoStack,
		undo,
		redo,
		startAdd,
		addLane
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
							<fieldset class="settings-row settings-radio-fieldset">
								<legend>{t('snap')}</legend>
								<div class="settings-radio-group" aria-label={t('snap')}>
									{#each snapOptions as minutes}
										<label class="settings-radio" class:active={preferences.snapMinutes === minutes}>
											<input
												type="radio"
												name="snap-minutes"
												value={minutes}
												checked={preferences.snapMinutes === minutes}
												onchange={() => {
													preferences.snapMinutes = minutes;
													void savePreferences();
												}}
											/>
											<span>{preferences.language === 'ja' ? `${minutes}分` : `${minutes}min`}</span>
										</label>
									{/each}
								</div>
							</fieldset>
							<label class="settings-row"
								><span>{t('zoom')}</span><div class="settings-range"
									><span aria-hidden="true">↕</span><input
										type="range"
										min="144"
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
				<div class="edit-workspace">
					<button
						class="edit-toggle"
						class:active={editMode}
						aria-pressed={editMode}
						aria-label="タイムテーブルを編集"
						title="タイムテーブルを編集"
						onclick={onToggleEdit}
					>
						<span class="toolbar-label">{t('edit')}</span>
						<span class="edit-toggle-icon" aria-hidden="true">✎</span>
						<span class="edit-toggle-track" aria-hidden="true"><span></span></span>
					</button>
				</div>
				{#if editMode}
					<div class="edit-commands" aria-label={t('editTools')}>
						<span class="edit-workspace-label">{t('editTools')}</span>
						<button class="outline-button" onclick={openFestivalSettings}>フェス設定</button>
						<button
							class="quiet-button history-button"
							aria-label={t('undo')}
							title={t('undo')}
							disabled={!undoStack.length}
							onclick={undo}
						>
							↶
						</button>
						<button
							class="quiet-button history-button"
							aria-label={t('redo')}
							title={t('redo')}
							disabled={!redoStack.length}
							onclick={redo}
						>
							↷
						</button>
						<button class="primary-button" onclick={startAdd}>＋ {t('add')}</button>
						<div class="lane-add-buttons desktop-lane-actions">
							<button class="primary-button" onclick={() => addLane('stage')}>＋ {t('stage')}</button>
							<button class="primary-button" onclick={() => addLane('tokuten')}>＋ {t('tokuten')}</button>
							<button class="primary-button" onclick={() => addLane('event')}>＋ {t('event')}</button>
						</div>
						<button class="primary-button mobile-lane-action" onclick={() => addLane()}>
							＋ {t('addLane')}
						</button>
					</div>
				{/if}
			</section>
