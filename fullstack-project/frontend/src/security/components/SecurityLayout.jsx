import SecuritySidebar from "./SecuritySidebar";
import SecurityNavbar from "./SecurityNavbar";
import SecurityChatBot from "./SecurityChatBot";

function SecurityLayout({ children }) {
  return (
    <div className="dashboard-shell flex min-h-screen text-[rgb(var(--app-text-rgb))]">
      {/* Sidebar */}
      <SecuritySidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-64">
        {/* Navbar */}
        <SecurityNavbar />

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4 lg:mt-20 lg:p-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>

      {/* Security Chatbot */}
      <SecurityChatBot />
    </div>
  );
}

export default SecurityLayout;
