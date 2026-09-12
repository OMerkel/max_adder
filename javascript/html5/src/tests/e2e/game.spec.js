import { expect, test } from "@playwright/test";

const waitForHumanTurn = (page) =>
	page.waitForFunction(
		() =>
			[...document.querySelectorAll("#board svg rect[data-row][data-col]")]
				.some((element) => element.style.cursor === "pointer"),
		{ timeout: 10_000 },
	);

const clickCell = async (page, row, col) => {
	await page.locator(`#board svg rect[data-row="${row}"][data-col="${col}"]`).click();
};

test.describe("Page load", () => {
	test("shows the Max Adder identity and board", async ({ page }) => {
		await page.goto("/");
		await expect(page).toHaveTitle(/Max Adder/i);
		await expect(page.locator("#view-game")).toBeVisible();
		await expect(page.locator("#board svg")).toHaveAttribute("aria-label", "Max Adder board");
		await expect(page.locator("#app-header-title")).toHaveText("Max Adder");
		await expect(page.locator("#app-score-badge")).toHaveText(
			/[🧑🤖][▼▲]0 - 0[🧑🤖][▼▲]/u,
		);
		await expect(page.locator("#board-status")).toHaveText(
			/[🧑🤖][▼▲]: place marker/u,
		);
	});
});

test.describe("Navigation and options", () => {
	test("rules, options and about views open", async ({ page }) => {
		await page.goto("/");
		await page.locator("#btn-menu").click();
		await page.locator("#nav-rules").click();
		await expect(page.locator("#view-rules")).toBeVisible();
		await expect(page.locator("#view-rules")).toContainText("Max Adder");
		await page.locator("#btn-menu").click();
		await page.locator("#nav-options").click();
		await expect(page.locator("#view-options")).toBeVisible();
		await expect(page.locator('input[name="horizontalplayer"]')).toHaveCount(2);
		await expect(page.locator('input[name="verticalplayer"]')).toHaveCount(2);
		await page.locator("#btn-options-cancel").click();
		await expect(page.locator("#view-game")).toBeVisible();
		await expect(page.locator(".view:visible")).toHaveCount(1);
		await page.locator("#btn-menu").click();
		await page.locator("#nav-about").click();
		await expect(page.locator("#view-about")).toContainText("About Max Adder");
	});

	test("options update the active-player badge", async ({ page }) => {
		await page.goto("/");
		await page.locator("#btn-menu").click();
		await page.locator("#nav-options").click();
		await page.locator('input[name="horizontalplayer"][value="AI"]').check();
		await page.locator('input[name="difficultyhorizontal"][value="Hard"]').check();
		await page.locator("#btn-options-ok").click();
		await expect(page.locator("#app-header-badge")).toHaveText(/[🧑🤖][▼▲]/u);
		await expect(page.locator("#app-header-badge")).toHaveAttribute(
			"aria-label",
			/Active (human|AI) player (South|North)/,
		);
		await expect(page.locator("#app-score-badge")).toHaveAttribute(
			"aria-label",
			"Scores: 0 to 0",
		);
	});
});

test.describe("Max Adder gameplay", () => {
	test("human can place the opening marker and allocate its score", async ({ page }) => {
		await page.goto("/");
		await waitForHumanTurn(page);
		await clickCell(page, 0, 0);
		await expect(page.locator("#opening-choice")).toBeVisible();
		await expect(page.locator("#opening-assign-placer")).toHaveText(
			/Give opening score to[🧑🤖][▼▲]/u,
		);
		await expect(page.locator("#opening-assign-decider")).toHaveText(
			/Give opening score to[🧑🤖][▼▲]/u,
		);
		await page.locator("#opening-assign-placer").click();
		await expect(page.locator("#opening-choice")).toBeHidden();
		await expect
			.poll(async () => page.locator('#board svg rect[style*="cursor: pointer"]').count())
			.toBeGreaterThan(0);
	});

});
