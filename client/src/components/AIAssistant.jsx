import { useEffect, useRef, useState } from "react";
import { Bot, Send, X } from "lucide-react";
import ReactMarkdown from "react-markdown";

function AIAssistant({ autoOpen = false, pageMode = false }) {
  const [isOpen, setIsOpen] = useState(autoOpen || pageMode);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hello! 👋 I am **Medicos AI**, your educational medicine information assistant.\n\nAsk me about medicines, side effects, interactions, uses, or precautions.",
    },
  ]);

  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef(null);

  // Keep autoOpen behavior in sync
  useEffect(() => {
    if (autoOpen || pageMode) {
      setIsOpen(true);
    }
  }, [autoOpen, pageMode]);

  // Scroll to newest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading]);

  const handleSend = async () => {
    const trimmedMessage = message.trim();

    if (!trimmedMessage || loading) {
      return;
    }

    // Add user's message immediately
    const userMessage = {
      role: "user",
      content: trimmedMessage,
    };

    setMessages((prev) => [...prev, userMessage]);
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:5000/api/ai/chat",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: trimmedMessage,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to get a response from Medicos AI."
        );
      }

      const answer =
        data.answer ||
        "Sorry, I couldn't generate a response right now.";

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: answer,
        },
      ]);
    } catch (error) {
      console.error("AI Chat Error:", error);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            `Sorry, something went wrong.\n\n**Error:** ${
              error.message ||
              "Unable to connect to the AI assistant."
            }`,
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (event) => {
    // Enter sends the message
    // Shift + Enter creates a new line
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  // Floating button when chat is closed
  if (!isOpen && !autoOpen && !pageMode) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-16 w-16 items-center justify-center rounded-full border border-blue-300/20 bg-blue-600 text-white shadow-[0_0_30px_rgba(59,130,246,0.35)] transition-all duration-300 hover:scale-110 hover:bg-blue-500"
        aria-label="Open AI Assistant"
      >
        <Bot size={28} />
      </button>
    );
  }

  return (
    <div
      className={
        pageMode
          ? "flex h-[650px] w-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl"
          : autoOpen
          ? "flex h-[650px] w-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl"
          : "fixed bottom-6 right-6 z-50 flex h-[500px] w-[360px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-900/95 shadow-2xl backdrop-blur-xl"
      }
    >
      {/* ================= HEADER ================= */}

      <div className="flex items-center justify-between border-b border-white/10 bg-blue-600/10 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white">
            <Bot size={20} />
          </div>

          <div>
            <h3 className="font-semibold text-white">
              Medicos AI
            </h3>

            <p className="text-xs text-green-400">
              ● Online
            </p>
          </div>
        </div>

        {/* Don't show close button on dedicated AI page */}
        {!autoOpen && !pageMode && (
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-400 transition hover:text-white"
            aria-label="Close AI Assistant"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* ================= MESSAGES ================= */}

      <div className="flex-1 space-y-4 overflow-y-auto p-5">
        {messages.map((chatMessage, index) => {
          const isUser =
            chatMessage.role === "user";

          return (
            <div
              key={index}
              className={`flex ${
                isUser
                  ? "justify-end"
                  : "justify-start"
              }`}
            >
              <div
                className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-7 ${
                  isUser
                    ? "rounded-br-none bg-blue-600 text-white"
                    : chatMessage.isError
                    ? "rounded-tl-none border border-red-500/30 bg-red-500/10 text-red-200"
                    : "rounded-tl-none bg-slate-800 text-gray-200"
                }`}
              >
                {/* USER MESSAGE */}
                {isUser ? (
                  <p className="whitespace-pre-wrap">
                    {chatMessage.content}
                  </p>
                ) : (
                  /* AI MESSAGE WITH MARKDOWN SUPPORT */
                  <div className="markdown-content">
                    <ReactMarkdown
                      components={{
                        h1: ({ children }) => (
                          <h1 className="mb-3 mt-2 text-lg font-bold text-white">
                            {children}
                          </h1>
                        ),

                        h2: ({ children }) => (
                          <h2 className="mb-3 mt-4 text-base font-bold text-white">
                            {children}
                          </h2>
                        ),

                        h3: ({ children }) => (
                          <h3 className="mb-2 mt-4 font-semibold text-blue-300">
                            {children}
                          </h3>
                        ),

                        p: ({ children }) => (
                          <p className="mb-3 last:mb-0">
                            {children}
                          </p>
                        ),

                        ul: ({ children }) => (
                          <ul className="mb-3 ml-5 list-disc space-y-1">
                            {children}
                          </ul>
                        ),

                        ol: ({ children }) => (
                          <ol className="mb-3 ml-5 list-decimal space-y-1">
                            {children}
                          </ol>
                        ),

                        li: ({ children }) => (
                          <li className="pl-1">
                            {children}
                          </li>
                        ),

                        strong: ({ children }) => (
                          <strong className="font-bold text-white">
                            {children}
                          </strong>
                        ),

                        em: ({ children }) => (
                          <em className="italic text-slate-300">
                            {children}
                          </em>
                        ),

                        blockquote: ({ children }) => (
                          <blockquote className="my-3 border-l-2 border-blue-400 pl-3 text-slate-300">
                            {children}
                          </blockquote>
                        ),

                        hr: () => (
                          <hr className="my-4 border-white/10" />
                        ),
                      }}
                    >
                      {chatMessage.content}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* ================= LOADING ================= */}

        {loading && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-tl-none bg-slate-800 px-4 py-3">
              <div className="flex gap-1">
                <span className="h-2 w-2 animate-bounce rounded-full bg-blue-400" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-blue-400 [animation-delay:150ms]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-blue-400 [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ================= INPUT ================= */}

      <div className="border-t border-white/10 p-3">
        <div className="flex items-end gap-2 rounded-xl bg-slate-800 px-3">
          <textarea
            value={message}
            onChange={(event) =>
              setMessage(event.target.value)
            }
            onKeyDown={handleKeyDown}
            placeholder="Ask about a medicine..."
            disabled={loading}
            rows={1}
            className="max-h-24 min-h-[48px] flex-1 resize-none bg-transparent py-3 text-sm leading-6 text-white outline-none placeholder:text-gray-500 disabled:cursor-not-allowed disabled:opacity-50"
          />

          <button
            onClick={handleSend}
            disabled={
              loading || !message.trim()
            }
            className="mb-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Send message"
          >
            <Send size={17} />
          </button>
        </div>

        <p className="mt-2 text-center text-[10px] text-slate-500">
          Medicos AI provides educational information, not medical advice.
        </p>
      </div>
    </div>
  );
}

export default AIAssistant;