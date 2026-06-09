import { useState } from "react";

function SecurityChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: "assistant",
      text: "👮 Security AI Assistant. How can I help you?",
    },
  ]);
  const [input, setInput] = useState("");

  const quickCommands = [
    { icon: "👥", label: "Who is inside now?", cmd: "inside" },
    { icon: "📋", label: "Show today's visitors", cmd: "today" },
    { icon: "🚨", label: "Any alerts?", cmd: "alerts" },
    { icon: "📦", label: "Delivery peak time", cmd: "delivery-peak" },
  ];

  const handleQuickCommand = (cmd, label) => {
    const responses = {
      inside: "Currently inside: 9 visitors and 3 workers. Wing C has the highest activity.",
      today: "Today's visitors: 26 total. Check-ins 26, check-outs 17, currently inside 9.",
      alerts: "2 active alerts: one unauthorized entry and one suspicious repeat visitor pattern.",
      "delivery-peak": "Predicted delivery peak: 12:45 PM to 2:15 PM. Keep one guard dedicated at Gate-1.",
    };

    setMessages((prev) => [
      ...prev,
      { id: prev.length + 1, type: "user", text: label },
      {
        id: prev.length + 2,
        type: "assistant",
        text: responses[cmd] || "Processing...",
      },
    ]);
    setInput("");
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { id: messages.length + 1, type: "user", text: input };
    const assistantMessage = {
      id: messages.length + 2,
      type: "assistant",
      text: "Processing your request... Use quick commands above for faster results!",
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setInput("");
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-2xl shadow-xl hover:shadow-2xl transition-all hover:scale-110"
      >
        🤖
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-40 w-96 max-w-full rounded-2xl bg-white shadow-2xl flex flex-col h-96 border-2 border-blue-500">
          {/* Header */}
          <div className="border-b border-slate-200 bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 rounded-t-2xl text-[var(--text-main)] flex items-center justify-between">
            <div>
              <h3 className="font-bold">Security AI</h3>
              <p className="text-xs opacity-90">Fast assistance for guards</p>
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
                      ? "bg-blue-500 text-[var(--text-main)]"
                      : "bg-slate-100 text-slate-900"
                  }`}
                >
                  <p className="text-sm">{message.text}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Commands */}
          <div className="border-t border-slate-200 px-4 py-3 bg-slate-50">
            <p className="text-xs font-semibold text-slate-600 mb-2">Quick Commands:</p>
            <div className="grid grid-cols-2 gap-2">
              {quickCommands.map((cmd) => (
                <button
                  key={cmd.cmd}
                  onClick={() => handleQuickCommand(cmd.cmd, cmd.label)}
                  className="rounded-lg bg-white border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-blue-400 hover:bg-blue-50 transition-colors"
                >
                  <span>{cmd.icon}</span> {cmd.label}
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
                placeholder="Ask me..."
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
              <button
                type="submit"
                className="rounded-lg bg-blue-500 px-3 py-2 text-[var(--text-main)] hover:bg-blue-600 transition-colors font-semibold"
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

export default SecurityChatBot;
