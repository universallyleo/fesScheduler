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
