import type { Page } from "@playwright/test";

export class LoginPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto("/login");
  }

  async waitForLoad() {
    await this.page.getByRole("heading", { name: "login" }).waitFor({
      state: "visible",
    });
  }

  async clickGitHub() {
    await this.page
      .getByRole("button", { name: /continue with github/i })
      .click();
  }

  async clickGoogle() {
    await this.page
      .getByRole("button", { name: /continue with google/i })
      .click();
  }
}
