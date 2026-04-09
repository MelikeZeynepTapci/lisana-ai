import Sidebar from "@/components/layout/Sidebar";
import MobileNav from "@/components/layout/MobileNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Sidebar />
      <main className="md:ml-52 min-h-screen pb-20 md:pb-0">
        {children}
      </main>
      <MobileNav />
    </>
  );
}
