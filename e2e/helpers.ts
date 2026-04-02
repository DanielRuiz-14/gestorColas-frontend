import { type Page } from "@playwright/test";

const API = "http://localhost:8080";

interface AuthData {
  accessToken: string;
  refreshToken: string;
  restaurantId: string;
  slug: string;
  email: string;
  password: string;
}

let counter = 0;

export async function registerViaApi(): Promise<AuthData> {
  counter++;
  const ts = Date.now();
  const slug = `e2e-${ts}-${counter}`;
  const email = `e2e-${ts}-${counter}@test.com`;
  const password = "testpass123";

  const res = await fetch(`${API}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      restaurantName: `E2E Restaurant ${counter}`,
      restaurantSlug: slug,
      restaurantAddress: "E2E Street 123",
      email,
      password,
      staffName: "E2E Admin",
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Register failed: ${res.status} ${body}`);
  }

  const data = await res.json();
  return { ...data, slug, email, password };
}

export async function createTableViaApi(
  auth: AuthData,
  label: string,
  capacity: number,
): Promise<string> {
  const res = await fetch(`${API}/restaurants/${auth.restaurantId}/tables`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${auth.accessToken}`,
    },
    body: JSON.stringify({ label, capacity }),
  });

  if (!res.ok) throw new Error(`Create table failed: ${res.status}`);
  const data = await res.json();
  return data.id;
}

export async function loginViaUi(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await page.waitForURL("/dashboard");
}
