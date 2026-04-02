"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AuthGuard } from "@/components/auth-guard";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Users,
  CalendarDays,
  UtensilsCrossed,
  Settings,
  LayoutDashboard,
  LogOut,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Panel", icon: LayoutDashboard },
  { href: "/dashboard/queue", label: "Cola", icon: Users },
  { href: "/dashboard/reservations", label: "Reservas", icon: CalendarDays },
  { href: "/dashboard/tables", label: "Mesas", icon: UtensilsCrossed },
  { href: "/dashboard/settings", label: "Configuración", icon: Settings },
];

function NavLinks({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <>
      {navItems.map((item) => {
        const isActive =
          item.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
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
    </>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  function handleLogout() {
    logout();
    window.location.href = "/login";
  }

  return (
    <AuthGuard>
      <div className="flex h-screen">
        {/* Desktop sidebar */}
        <aside className="hidden w-56 flex-shrink-0 border-r bg-muted/30 md:flex md:flex-col">
          <div className="flex h-14 items-center border-b px-4">
            <h1 className="text-lg font-semibold">QueueTable</h1>
          </div>
          <nav className="flex-1 space-y-1 p-2">
            <NavLinks pathname={pathname} />
          </nav>
          <div className="border-t p-2">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-muted-foreground"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </Button>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Mobile header */}
          <header className="flex h-14 items-center gap-3 border-b px-4 md:hidden">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger>
                <Menu className="h-5 w-5" />
              </SheetTrigger>
              <SheetContent side="left" className="w-56 p-0">
                <SheetTitle className="flex h-14 items-center border-b px-4 text-lg font-semibold">
                  QueueTable
                </SheetTitle>
                <nav className="flex-1 space-y-1 p-2">
                  <NavLinks
                    pathname={pathname}
                    onNavigate={() => setMobileOpen(false)}
                  />
                </nav>
                <div className="border-t p-2">
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 text-muted-foreground"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4" />
                    Cerrar sesión
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
            <h1 className="text-lg font-semibold">QueueTable</h1>
          </header>

          <main className="flex-1 overflow-auto">
            <div className="p-4 md:p-6">{children}</div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
