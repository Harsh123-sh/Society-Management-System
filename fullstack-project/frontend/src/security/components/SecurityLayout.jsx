import SecuritySidebar from "./SecuritySidebar";
import SecurityNavbar from "./SecurityNavbar";
import SecurityChatBot from "./SecurityChatBot";
import { motion } from "framer-motion";

function SecurityLayout({ children }) {
  return (
    <div className="security-shell dashboard-shell flex min-h-screen text-[rgb(var(--app-text-rgb))]">
      {/* Sidebar */}
      <SecuritySidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-64">
        {/* Navbar */}
        <SecurityNavbar />

        {/* Page Content */}
        <main className="security-main flex-1 overflow-auto p-4 lg:mt-20 lg:p-8">
          <motion.div
            className="security-content mx-auto max-w-7xl"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            {children}
          </motion.div>
        </main>
      </div>

      {/* Security Chatbot */}
      <SecurityChatBot />
    </div>
  );
}

export default SecurityLayout;
