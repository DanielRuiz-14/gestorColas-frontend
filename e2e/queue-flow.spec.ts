import { test, expect } from "@playwright/test";
import { registerViaApi, createTableViaApi, loginViaUi } from "./helpers";

test.describe("Queue QR flow", () => {
  test("full lifecycle: join → notify → confirm → seat", async ({ page, context }) => {
    // Setup: register restaurant + create table via API
    const auth = await registerViaApi();
    await createTableViaApi(auth, "Mesa E2E", 4);

    // === STAFF: login and go to queue page ===
    await loginViaUi(page, auth.email, auth.password);
    await page.getByRole("link", { name: "Cola" }).click();
    await page.waitForURL("/dashboard/queue");

    // Queue should be empty
    await expect(page.getByText("No hay entradas en la cola")).toBeVisible();

    // === CLIENT: open restaurant page in new tab ===
    const clientPage = await context.newPage();
    await clientPage.goto(`/restaurant/${auth.slug}`);

    // Should see restaurant name
    await expect(clientPage.getByText(`E2E Restaurant`)).toBeVisible({ timeout: 10000 });

    // Should see queue status
    await expect(clientPage.getByText("en espera")).toBeVisible();
    await expect(clientPage.getByText("Abierta")).toBeVisible();

    // Join queue
    await clientPage.getByText("Unirme a la cola").click();
    await clientPage.getByLabel("Nombre").fill("Cliente E2E");
    await clientPage.getByLabel("Personas").clear();
    await clientPage.getByLabel("Personas").fill("2");
    await clientPage.getByRole("button", { name: "Confirmar" }).click();

    // Should redirect to tracking page
    await clientPage.waitForURL(/\/queue\//);
    await expect(clientPage.getByText("Cliente E2E")).toBeVisible();
    await expect(clientPage.getByText("En espera")).toBeVisible();

    // === STAFF: should see the entry in queue ===
    // Reload to pick up the new entry (or wait for WebSocket)
    await page.reload();
    await expect(page.getByText("Cliente E2E")).toBeVisible({ timeout: 10000 });

    // Staff notifies
    await page.getByTitle("Notificar").click();

    // Wait for status to update
    await expect(page.getByText("Notificado")).toBeVisible({ timeout: 5000 });

    // === CLIENT: should see NOTIFIED and confirm button ===
    await clientPage.reload();
    await expect(clientPage.getByText("Tu turno", { exact: true })).toBeVisible({ timeout: 5000 });
    await clientPage.getByText("Confirmar asistencia").click();

    // === STAFF: seat the client ===
    await page.reload();
    await page.getByTitle("Sentar").click();

    // Should see available tables dialog
    await expect(page.getByText("Mesa E2E")).toBeVisible({ timeout: 5000 });
    await page.getByText("Mesa E2E").click();

    // Queue should be empty now (entry is SEATED)
    await page.reload();
    await expect(page.getByText("No hay entradas en la cola")).toBeVisible({ timeout: 5000 });

    // === CLIENT: should see SEATED ===
    await clientPage.reload();
    await expect(clientPage.getByText("Sentado")).toBeVisible({ timeout: 5000 });
    await expect(clientPage.getByText(/mesa asignada/i)).toBeVisible();

    await clientPage.close();
  });

  test("walk-in flow: staff adds → seat directly", async ({ page }) => {
    const auth = await registerViaApi();
    await createTableViaApi(auth, "Mesa Walk", 6);

    await loginViaUi(page, auth.email, auth.password);
    await page.getByRole("link", { name: "Cola" }).click();
    await page.waitForURL("/dashboard/queue");

    // Add walk-in
    await page.getByText("Walk-in").click();
    await expect(page.getByText("Agregar walk-in")).toBeVisible();

    const walkDialog = page.locator("[role=dialog]");
    await walkDialog.locator("input").first().fill("Walk-in Test");
    await walkDialog.locator("input[type=number]").clear();
    await walkDialog.locator("input[type=number]").fill("3");
    await walkDialog.getByRole("button", { name: "Agregar a la cola" }).click();

    // Should appear in queue
    await expect(page.getByText("Walk-in Test")).toBeVisible({ timeout: 5000 });

    // Seat directly
    await page.getByTitle("Sentar").click();
    await expect(page.getByText("Mesa Walk")).toBeVisible({ timeout: 5000 });
    await page.getByText("Mesa Walk").click();

    // Queue empty
    await page.reload();
    await expect(page.getByText("No hay entradas en la cola")).toBeVisible({ timeout: 5000 });
  });
});
