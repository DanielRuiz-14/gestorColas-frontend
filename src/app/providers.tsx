"use client";

import { SWRConfig } from "swr";
import { AuthProvider } from "@/lib/auth";
import { ApiException } from "@/lib/api";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        onErrorRetry: (error, _key, _config, revalidate, { retryCount }) => {
          // Don't retry on 401/403/404
          if (error instanceof ApiException) {
            if ([401, 403, 404].includes(error.status)) return;
            // Retry on 409 (optimistic lock) up to 3 times
            if (error.status === 409 && retryCount < 3) {
              setTimeout(() => revalidate({ retryCount }), 1000);
              return;
            }
          }
          // Default: retry up to 3 times
          if (retryCount >= 3) return;
          setTimeout(() => revalidate({ retryCount }), 5000);
        },
      }}
    >
      <AuthProvider>{children}</AuthProvider>
    </SWRConfig>
  );
}
