import { useState } from "react";

function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: "assistant",
      text: "👋 Hello! I'm your AI Assistant. How can I help you today?",
    },
  ]);
  const [input, setInput] = useState("");

  const quickOptions = [
    { icon: "📋", label: "Show defaulters", action: "defaulters" },
    { icon: "📊", label: "Generate report", action: "report" },
    { icon: "📢", label: "Create notice", action: "notice" },
    { icon: "🔔", label: "Send alert", action: "alert" },
  ];

  const handleQuickOption = (option) => {
    const userMessage = {
      id: messages.length + 1,
      type: "user",
      text: option.label,
    };

    const assistantMessages = {
      defaulters: `I found 5 residents with overdue payments:\n\n1. Rajesh Kumar (A-101) - ₹15,000 (45d overdue)\n2. Priya Singh (B-205) - ₹8,500 (20d overdue)\n3. Amit Patel (C-310) - ₹5,200 (5d overdue)\n\nWould you like me to send payment reminders?`,
      report: `📊 Report generated!\n\nMonthly Summary:\n• Total Collection: ₹24,50,000\n• Total Residents: 1,245\n• New Complaints: 42\n• Collection Rate: 82%\n\nDownload report?`,
      notice: `📢 Notice Creation:\n\nPlease provide:\n1. Notice title\n2. Description\n3. Target residents\n\nI'll draft it for your review.`,
      alert: `🔔 Alert Options:\n\n• Payment Reminder\n• Maintenance Notice\n• Security Alert\n• General Announcement\n\nWhich would you like?`,
    };

    setMessages([
      ...messages,
      userMessage,
      {
        id: messages.length + 2,
        type: "assistant",
        text: assistantMessages[option.action] || "Processing your request...",
      },
    ]);

    setInput("");
  };

  const handleSend = (e) => {
    e.preventDefault();

    if (!input.trim()) return;

    const userMessage = {
      id: messages.length + 1,
      type: "user",
      text: input,
    };

    const assistantMessage = {
      id: messages.length + 2,
      type: "assistant",
      text: "I'm processing your request... This is a demo assistant. Try the quick options above!",
    };

    setMessages([...messages, userMessage, assistantMessage]);
    setInput("");
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-2xl shadow-xl hover:shadow-2xl transition-all hover:scale-110"
      >
        🤖
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-40 w-96 max-w-full rounded-2xl bg-white shadow-2xl flex flex-col h-96 border border-slate-200">
          {/* Header */}
          <div className="border-b border-slate-200 bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-4 rounded-t-2xl text-[var(--text-main)] flex items-center justify-between">
            <div>
              <h3 className="font-bold">AI Assistant</h3>
              <p className="text-xs opacity-90">Always here to help</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-xl opacity-75 hover:opacity-100"
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.type === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-xs rounded-lg px-4 py-2 ${
                    message.type === "user"
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-[var(--text-main)]"
                      : "bg-slate-100 text-slate-900"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Options */}
          <div className="border-t border-slate-200 px-4 py-3 bg-slate-50">
            <p className="text-xs font-semibold text-slate-600 mb-2">Quick actions:</p>
            <div className="grid grid-cols-2 gap-2">
              {quickOptions.map((option) => (
                <button
                  key={option.action}
                  onClick={() => handleQuickOption(option)}
                  className="rounded-lg bg-white border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-purple-400 hover:bg-purple-50 transition-colors"
                >
                  <span>{option.icon}</span> {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="border-t border-slate-200 p-3">
            <form onSubmit={handleSend} className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything..."
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
              />
              <button
                type="submit"
                className="rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2 text-[var(--text-main)] hover:shadow-lg transition-all font-semibold"
              >
                ↓
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default AIAssistant;
