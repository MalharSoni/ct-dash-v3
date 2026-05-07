import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { MobileNav } from "./MobileNav";
import { LiveRefresh } from "@/components/system/LiveRefresh";

interface AppShellProps {
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export function AppShell({ title, children, actions }: AppShellProps) {
  return (
    <>
      <LiveRefresh />
      <div className="min-h-dvh md:grid md:[grid-template-columns:var(--sidebar-width)_1fr] md:[grid-template-rows:var(--topbar-height)_1fr] md:[grid-template-areas:'sidebar_topbar''sidebar_main']">
        <aside
          style={{ gridArea: "sidebar" }}
          className="bg-sidebar text-sidebar-foreground sticky top-0 h-dvh overflow-y-auto hidden md:block"
        >
          <Sidebar />
        </aside>

        <header
          style={{ gridArea: "topbar" }}
          className="bg-card border-b border-border sticky top-0 z-40 h-[var(--topbar-height)]"
        >
          <div className="md:hidden">
            <MobileNav title={title} actions={actions} />
          </div>
          <div className="hidden md:block h-full">
            <Topbar title={title} actions={actions} />
          </div>
        </header>

        <main
          style={{ gridArea: "main" }}
          className="p-4 md:p-6 lg:p-8 max-w-[1600px] w-full"
        >
          {children}
        </main>
      </div>
    </>
  );
}
