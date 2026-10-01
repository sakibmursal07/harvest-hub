import { useState, useRef, useEffect } from "react";
import Link from "next/link";

const SUGGESTIONS = [
  "🍎 What fresh fruits are in stock?",
  "🥕 Show available vegetables",
  "🌾 What grains or rice do you have?",
  "👨‍🌾 How do I list produce as a farmer?",
];

// Helper to format text with clickable markdown-style links [text](url)
function FormattedMessage({ text }) {
  if (!text) return null;

  // Regex to match [Link Title](url)
  const linkRegex = /\[(.*?)\]\((.*?)\)/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = linkRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const [_, title, href] = match;
    parts.push(
      <Link
        key={match.index}
        href={href}
        className="inline-flex items-center gap-1 font-semibold text-emerald-800 bg-emerald-100/80 hover:bg-emerald-200 px-2 py-0.5 rounded transition text-xs mx-0.5 underline decoration-emerald-500"
      >
        <span>🌾</span>
        <span>{title}</span>
        <span>→</span>
      </Link>
    );
    lastIndex = linkRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return (
    <div className="whitespace-pre-wrap leading-relaxed">
      {parts.map((p, idx) => (typeof p === "string" ? <span key={idx}>{p}</span> : p))}
    </div>
  );
}

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hi! Welcome to Harvest Hub 🌾 How can I help you find farm-fresh local produce today?",
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
  }, [messages, isOpen, loading]);

  const sendQuery = async (queryText) => {
    if (!queryText.trim() || loading) return;

    const userMessage = queryText.trim();
    setInput("");
    const newHistory = [...messages, { role: "user", text: userMessage }];
    setMessages(newHistory);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          history: messages,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Server error (${res.status})`);
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: data.reply || "Sorry, I had trouble finding an answer for that.",
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: `⚠️ ${err.message || "Connection error. Please try asking again in a moment."}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    sendQuery(input);
  };

  const clearChat = () => {
    setMessages([
      {
        role: "assistant",
        text: "Hi! Welcome to Harvest Hub 🌾 How can I help you find farm-fresh local produce today?",
      },
    ]);
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 font-sans">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-emerald-700 hover:bg-emerald-800 text-white p-3.5 sm:p-4 rounded-full shadow-2xl flex items-center gap-2.5 transition duration-200 transform hover:scale-105 active:scale-95 border-2 border-emerald-600"
        >
          <span className="text-xl animate-bounce">🌾</span>
          <span className="font-semibold text-sm pr-1">Ask Harvest Hub</span>
        </button>
      )}

      {isOpen && (
        <div className="w-[92vw] sm:w-96 h-[500px] max-h-[85vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200">
          {/* Header */}
          <div className="bg-emerald-800 text-white px-4 py-3 flex justify-between items-center shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-emerald-700 flex items-center justify-center text-lg">
                🌾
              </div>
              <div>
                <h3 className="font-bold text-sm leading-tight flex items-center gap-1.5">
                  Harvest Assistant
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" />
                </h3>
                <span className="text-[11px] text-emerald-200">Live Inventory • AI Powered</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={clearChat}
                title="Clear Conversation"
                className="text-xs text-emerald-200 hover:text-white px-2 py-1 rounded hover:bg-emerald-700 transition"
              >
                Clear
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:text-gray-200 text-lg px-2 rounded hover:bg-emerald-700 transition"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-gray-50 text-sm">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                    m.role === "user"
                      ? "bg-emerald-700 text-white rounded-br-none shadow-sm"
                      : "bg-white text-gray-800 shadow-sm border border-gray-200 rounded-bl-none"
                  }`}
                >
                  <FormattedMessage text={m.text} />
                </div>
              </div>
            ))}

            {/* Quick Suggestion Chips (when only 1 or 2 messages) */}
            {messages.length <= 2 && !loading && (
              <div className="pt-2">
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Suggested Questions:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {SUGGESTIONS.map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => sendQuery(s)}
                      className="text-xs bg-white hover:bg-emerald-50 text-emerald-900 border border-emerald-200 px-3 py-1.5 rounded-full transition shadow-2xs hover:border-emerald-400 text-left"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-white text-gray-500 shadow-sm border border-gray-200 rounded-2xl rounded-bl-none px-4 py-2.5 text-xs flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce [animation-delay:0.4s]" />
                  <span className="italic ml-1">Harvest Assistant is checking live harvest...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <form
            onSubmit={handleSend}
            className="p-3 bg-white border-t border-gray-200 flex gap-2"
          >
            <input
              type="text"
              placeholder="Ask about fresh fruits, vegetables, orders..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 border border-gray-300 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-emerald-800 disabled:opacity-40 transition shadow-sm"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
}