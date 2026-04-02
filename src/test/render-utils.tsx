import { render, type RenderOptions } from "@testing-library/react";
import { AuthProvider } from "@/lib/auth";
import { SWRConfig } from "swr";
import type { ReactElement } from "react";

function AllProviders({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig value={{ provider: () => new Map() }}>
      <AuthProvider>{children}</AuthProvider>
    </SWRConfig>
  );
}

export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
) {
  return render(ui, { wrapper: AllProviders, ...options });
}
