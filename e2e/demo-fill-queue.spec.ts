import { test } from "@playwright/test";

const SLUG = "restaurante-pepito";
const NAMES = [
  { name: "María García", size: 2 },
  { name: "Carlos López", size: 4 },
  { name: "Ana Martínez", size: 3 },
  { name: "Pedro Sánchez", size: 2 },
  { name: "Laura Fernández", size: 6 },
  { name: "Javier Ruiz", size: 2 },
  { name: "Elena Torres", size: 5 },
  { name: "Miguel Ángel", size: 3 },
];

test("demo: fill queue with clients", async ({ page }) => {
  test.setTimeout(120_000);

  for (const client of NAMES) {
    await page.goto(`/restaurant/${SLUG}`);
    await page.waitForLoadState("networkidle");

    // Click join
    await page.getByText("Unirme a la cola").click();

    // Fill form
    await page.getByLabel("Nombre").fill(client.name);
    await page.getByLabel("Personas").clear();
    await page.getByLabel("Personas").fill(String(client.size));

    // Submit
    await page.getByRole("button", { name: "Confirmar" }).click();

    // Wait for tracking page
    await page.waitForURL(/\/queue\//);

    // Pause so you can see the tracking page
    await page.waitForTimeout(2000);
  }

  // Stay on last client's tracking page so you can see it
  await page.waitForTimeout(60_000);
});
