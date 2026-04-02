import { test, expect } from "@playwright/test";

test.describe("Auth flow", () => {
  const ts = Date.now();
  const slug = `e2e-auth-${ts}`;
  const email = `e2e-auth-${ts}@test.com`;
  const password = "testpass123";

  test("register → dashboard → logout → login → dashboard", async ({ page }) => {
    // 1. Go to register
    await page.goto("/register");
    await expect(page.getByRole("button", { name: "Crear cuenta" })).toBeVisible();

    // 2. Fill registration form
    await page.getByLabel("Nombre del restaurante").fill("E2E Auth Restaurant");
    // Slug auto-generated, but override to be safe
    await page.getByLabel("Slug").clear();
    await page.getByLabel("Slug").fill(slug);
    await page.getByLabel("Dirección").fill("E2E Auth Street 1");
    await page.getByLabel("Tu nombre").fill("E2E Admin");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Contraseña").fill(password);

    // 3. Submit
    await page.getByRole("button", { name: "Crear cuenta" }).click();

    // 4. Should redirect to dashboard
    await page.waitForURL("/dashboard");
    await expect(page.getByText("Panel de control")).toBeVisible();

    // 5. Logout
    await page.getByText("Cerrar sesión").click();
    await page.waitForURL("/login");

    // 6. Login with same credentials
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Contraseña").fill(password);
    await page.getByRole("button", { name: "Iniciar sesión" }).click();

    // 7. Back to dashboard
    await page.waitForURL("/dashboard");
    await expect(page.getByText("Panel de control")).toBeVisible();
  });

  test("login with wrong password shows error", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("nonexistent@test.com");
    await page.getByLabel("Contraseña").fill("wrongpassword");
    await page.getByRole("button", { name: "Iniciar sesión" }).click();

    // Should show error, not redirect
    await expect(page.getByText(/error|invalid|incorrect/i)).toBeVisible({ timeout: 5000 });
    await expect(page).toHaveURL(/login/);
  });

  test("protected route redirects to login", async ({ page }) => {
    // Clear any stored tokens
    await page.goto("/login");
    await page.evaluate(() => localStorage.clear());

    await page.goto("/dashboard");
    // AuthGuard should redirect to login
    await page.waitForURL("/login", { timeout: 5000 });
  });
});
