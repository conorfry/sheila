import { redirect } from "next/navigation";
import Link from "next/link";
import { Home, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "./sign-out-button";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="hidden w-64 flex-col border-r bg-white md:flex">
        <div className="flex h-16 items-center px-6">
          <Link href="/" className="font-serif text-xl font-semibold text-foreground">
            Sheila
          </Link>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <Home className="h-4 w-4" />
            Home
          </Link>
        </nav>

        <div className="border-t px-4 py-4">
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          <div className="mt-2">
            <SignOutButton />
          </div>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b bg-white px-4 md:hidden">
          <Link href="/" className="font-serif text-lg font-semibold">
            Sheila
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">{user.email}</span>
            <SignOutButton />
          </div>
        </header>

        <main className="flex-1 p-6 md:p-10">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
