import { expect, test } from '@playwright/test';

test('opens the bundled timetable and edits an item', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByRole('heading', { name: 'タイムテーブル' })).toBeVisible();

	await page.getByRole('button', { name: '編集を開始' }).click();
	await page.getByRole('button', { name: /I.mew/ }).first().dblclick();
	await expect(page.getByRole('dialog')).toBeVisible();

	await page.getByRole('dialog').getByRole('button', { name: '保存' }).click();
	await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('chooses overlap behavior from the edit panel', async ({ page }) => {
	await page.goto('/');
	await page.getByRole('button', { name: '編集を開始' }).click();
	await page.getByRole('button', { name: '重なり時の動作' }).click();
	const dialog = page.getByRole('dialog');
	await expect(dialog.getByRole('radio', { name: '前後をずらす' })).toBeChecked();
	await dialog.getByRole('radio', { name: '重ねる（警告）' }).check();
	await dialog.getByRole('button', { name: '閉じる' }).click();
	await page.getByRole('button', { name: '重なり時の動作' }).click();
	await expect(page.getByRole('dialog').getByRole('radio', { name: '重ねる（警告）' })).toBeChecked();
});

test('does not delete an item while an editor input has focus', async ({ page }) => {
	await page.goto('/');
	await page.getByRole('button', { name: '編集を開始' }).click();
	await page.getByRole('button', { name: /I.mew/ }).first().dblclick();
	const dialog = page.getByRole('dialog');
	await dialog.getByLabel('アーティスト').press('Delete');
	await expect(dialog).toBeVisible();
	await dialog.focus();
	await dialog.press('Delete');
	await expect(dialog).toHaveCount(0);
});
