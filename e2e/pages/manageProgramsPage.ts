import { expect, type Page } from "@playwright/test";
import { ManageProgramEditorPage } from "./manageProgramEditorPage";

export class ManageProgramsPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto("/programs/manage");
  }

  async waitForLoad() {
    await this.page.getByRole("heading", { name: "My Programs" }).waitFor({
      state: "visible",
    });
  }

  async createProgram(
    name: string,
    visibility: "public" | "unlisted" = "public",
  ): Promise<ManageProgramEditorPage> {
    await this.page.getByPlaceholder("Program name").fill(name);
    await this.page.getByLabel("Visibility").selectOption(visibility);
    await this.page.getByRole("button", { name: "Create Program" }).click();
    await this.page.waitForURL(/\/programs\/manage\//);
    return new ManageProgramEditorPage(this.page);
  }

  // ─── Delete confirmation (ConfirmDialog) ───────────────────────────

  private deleteDialog() {
    return this.page.locator(
      'dialog[aria-label="Delete Program Confirmation"]',
    );
  }

  /**
   * Click "Delete" on the row for `name`, opening the confirm dialog.
   */
  async clickDeleteProgram(name: string): Promise<void> {
    await this.programRow(name)
      .getByRole("button", { name: "Delete", exact: true })
      .click();
  }

  async isDeleteDialogVisible(): Promise<boolean> {
    return this.deleteDialog().isVisible();
  }

  /**
   * Confirm the pending program delete and wait for the row to disappear.
   */
  async confirmDeleteProgram(name: string): Promise<void> {
    await this.deleteDialog()
      .getByRole("button", { name: "Delete Program" })
      .click();
    await expect(this.programRow(name)).toHaveCount(0);
  }

  /**
   * Dismiss the pending program delete via the "Cancel" button.
   */
  async cancelDeleteProgram(): Promise<void> {
    await this.deleteDialog().getByRole("button", { name: "Cancel" }).click();
    await expect(this.deleteDialog()).toBeHidden();
  }

  /**
   * The row wrapping a program's name link — the delete button's container.
   */
  private programRow(name: string) {
    return this.page
      .locator("[class*='programRow']")
      .filter({ has: this.page.getByRole("link", { name, exact: true }) });
  }

  async getProgramNames(): Promise<string[]> {
    const links = this.page.locator("a[href*='/programs/manage/']");
    const count = await links.count();
    const names: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = await links.nth(i).textContent();
      if (text && text !== "Edit") {
        names.push(text.trim());
      }
    }
    return names;
  }
}
