import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import AIAssistant from "./AIAssistant";

function AdminLayout({ children }) {
  return (
    <div className="flex h-screen bg-slate-100">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-64">
        {/* Navbar */}
        <Navbar />

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>

      {/* AI Assistant Chatbot */}
      <AIAssistant />
    </div>
  );
}

export default AdminLayout;
