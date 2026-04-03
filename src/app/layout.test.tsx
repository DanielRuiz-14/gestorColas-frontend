import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { ReactNode } from "react";

vi.mock("next/font/google", () => ({
  Geist: () => ({ variable: "font-geist-sans" }),
  Geist_Mono: () => ({ variable: "font-geist-mono" }),
  IBM_Plex_Sans: () => ({ variable: "font-ibm-plex-sans" }),
  IBM_Plex_Mono: () => ({ variable: "font-ibm-plex-mono" }),
}));

vi.mock("./providers", () => ({
  Providers: ({ children }: { children: ReactNode }) => children,
}));

vi.mock("@/components/ui/sonner", () => ({
  Toaster: () => null,
}));

import RootLayout from "./layout";

describe("RootLayout", () => {
  it("uses IBM Plex as the app font family", () => {
    const html = renderToStaticMarkup(
      <RootLayout>
        <div>QueueTable</div>
      </RootLayout>,
    );

    expect(html).toContain("font-ibm-plex-sans");
    expect(html).toContain("font-ibm-plex-mono");
    expect(html).not.toContain("font-geist-sans");
  });
});
