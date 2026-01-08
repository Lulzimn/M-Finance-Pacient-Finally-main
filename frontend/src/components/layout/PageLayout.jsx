import { Sidebar } from "./Sidebar";
import { Toaster } from "sonner";

export const PageLayout = ({ children, user, setUser, isAdmin = true }) => {
  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar user={user} isAdmin={isAdmin} />
      
      {/* Main content */}
      <div className="md:ml-64">
        <main className="p-4 md:p-8">
          {children}
        </main>
      </div>
      
      <Toaster position="top-right" richColors />
    </div>
  );
};

export default PageLayout;
