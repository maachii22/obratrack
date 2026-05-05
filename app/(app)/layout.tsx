import { Sidebar } from "@/components/sidebar";
import { StoreProvider } from "@/lib/store";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      <div className="md:flex min-h-screen">
        <Sidebar />
        <main className="flex-1 min-w-0">
          <div className="mx-auto max-w-7xl px-3 py-4 sm:px-5 md:px-8 md:py-8">{children}</div>
        </main>
      </div>
    </StoreProvider>
  );
}
