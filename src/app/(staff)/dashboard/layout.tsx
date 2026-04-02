"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AuthGuard } from "@/components/auth-guard";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  Users,
  CalendarDays,
  UtensilsCrossed,
  Settings,
  LayoutDashboard,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Panel", icon: LayoutDashboard },
  { href: "/dashboard/queue", label: "Cola", icon: Users },
  { href: "/dashboard/reservations", label: "Reservas", icon: CalendarDays },
  { href: "/dashboard/tables", label: "Mesas", icon: UtensilsCrossed },
  { href: "/dashboard/settings", label: "Configuración", icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { logout } = useAuth();

  return (
    <AuthGuard>
      <div className="flex h-screen">
        {/* Sidebar */}
        <aside className="hidden w-56 flex-shrink-0 border-r bg-muted/30 md:flex md:flex-col">
          <div className="flex h-14 items-center border-b px-4">
            <h1 className="text-lg font-semibold">QueueTable</h1>
          </div>
          <nav className="flex-1 space-y-1 p-2">
            {navItems.map((item) => {
              const isActive =
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="border-t p-2">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-muted-foreground"
              onClick={() => {
                logout();
                window.location.href = "/login";
              }}
            >
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </Button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          <div className="p-6">{children}</div>
        </main>
      </div>
    </AuthGuard>
  );
}
