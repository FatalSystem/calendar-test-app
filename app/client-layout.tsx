import { SidebarProvider } from "./store/SidebarContext";
import Sidebar from "./components/sidebar/Sidebar";
import "./globals.css";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="layout">
        <Sidebar />
        <main className="content">{children}</main>
      </div>
    </SidebarProvider>
  );
}
