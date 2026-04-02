import { test, expect } from "@playwright/test";
import { registerViaApi, createTableViaApi, loginViaUi } from "./helpers";

test.describe("Reservation flow", () => {
  test("full lifecycle: create → arrive → seat → complete", async ({ page }) => {
    const auth = await registerViaApi();
    await createTableViaApi(auth, "Mesa Reserva", 4);

    await loginViaUi(page, auth.email, auth.password);

    // Navigate to reservations
    await page.getByRole("link", { name: "Reservas" }).click();
    await page.waitForURL("/dashboard/reservations");

    // Create reservation
    await page.getByText("Nueva reserva").click();
    const dialog = page.locator("[role=dialog]");
    await expect(dialog).toBeVisible();

    const inputs = dialog.locator("input");
    await inputs.nth(0).fill("Reserva E2E"); // Nombre
    await inputs.nth(1).fill("+34 600 000 001"); // Teléfono
    await inputs.nth(2).clear();
    await inputs.nth(2).fill("3"); // Personas

    // Set date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split("T")[0];
    await inputs.nth(3).fill(dateStr); // Fecha
    await inputs.nth(4).fill("20:00"); // Hora
    await dialog.locator("textarea").fill("Mesa junto a la ventana");

    await dialog.getByRole("button", { name: "Crear reserva" }).click();

    // Should appear in list — switch to filter by the correct date
    await page.locator("input[type=date]").first().fill(dateStr);
    await expect(page.getByText("Reserva E2E")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("Reservado")).toBeVisible();
    await expect(page.getByText("Mesa junto a la ventana")).toBeVisible();

    // Mark arrival
    await page.getByTitle("Llegó").click();
    await expect(page.getByText("Llegó")).toBeVisible({ timeout: 5000 });

    // Seat at table
    await page.getByTitle("Sentar").click();
    await expect(page.getByText("Mesa Reserva")).toBeVisible({ timeout: 5000 });
    await page.getByText("Mesa Reserva").click();

    // Should show SEATED
    await expect(page.getByText("Sentado")).toBeVisible({ timeout: 5000 });

    // Complete reservation
    await page.getByTitle("Completar").click();
    await page.reload();

    // Check tables page — mesa should be CLEANING
    await page.getByRole("link", { name: "Mesas" }).click();
    await page.waitForURL("/dashboard/tables");
    await expect(page.getByText("Limpieza")).toBeVisible({ timeout: 5000 });
  });

  test("cancel reservation", async ({ page }) => {
    const auth = await registerViaApi();

    await loginViaUi(page, auth.email, auth.password);
    await page.getByRole("link", { name: "Reservas" }).click();
    await page.waitForURL("/dashboard/reservations");

    // Create
    await page.getByText("Nueva reserva").click();
    const dialog = page.locator("[role=dialog]");
    await expect(dialog).toBeVisible();

    const inputs = dialog.locator("input");
    await inputs.nth(0).fill("Cancel Test"); // Nombre
    await inputs.nth(2).clear();
    await inputs.nth(2).fill("2"); // Personas

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split("T")[0];
    await inputs.nth(3).fill(dateStr);
    await inputs.nth(4).fill("21:00");

    await dialog.getByRole("button", { name: "Crear reserva" }).click();

    // Wait for it to appear
    await page.locator("input[type=date]").first().fill(dateStr);
    await expect(page.getByText("Cancel Test")).toBeVisible({ timeout: 5000 });

    // Cancel it
    await page.getByTitle("Cancelar").click();

    // Verify by filtering cancelled
    await page.getByText("Canceladas").click();
    await expect(page.getByText("Cancel Test")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("Cancelado")).toBeVisible();
  });
});
