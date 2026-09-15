import { useState, useRef, useEffect } from "react";

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hi! Welcome to Harvest Hub 🌾 How can I help you find fresh local produce today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: userMessage }]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Server error (${res.status})`);
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: data.reply || "Sorry, I had trouble answering that.",
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: `⚠️ ${err.message || "Connection error. Please try again."}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 font-sans">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-emerald-700 hover:bg-emerald-800 text-white p-4 rounded-full shadow-lg flex items-center gap-2 transition duration-200"
        >
          <span className="text-xl">🌾</span>
          <span className="font-semibold text-sm">Ask Harvest Hub</span>
        </button>
      )}

      {isOpen && (
        <div className="w-80 sm:w-96 h-[460px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200">
          <div className="bg-emerald-700 text-white px-4 py-3 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-xl">🌾</span>
              <div>
                <h3 className="font-bold text-sm leading-tight">Harvest Assistant</h3>
                <span className="text-xs text-emerald-200">Online • AI Powered</span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-gray-200 text-lg px-2"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-gray-50 text-sm">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${
                  m.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-3.5 py-2 ${
                    m.role === "user"
                      ? "bg-emerald-700 text-white rounded-br-none"
                      : "bg-white text-gray-800 shadow-sm border border-gray-200 rounded-bl-none"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="text-xs text-gray-500 italic">
                Harvest Assistant is thinking...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form
            onSubmit={handleSend}
            className="p-3 bg-white border-t border-gray-200 flex gap-2"
          >
            <input
              type="text"
              placeholder="Ask about fresh produce, farming..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-emerald-700"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-emerald-800 disabled:opacity-50"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
}