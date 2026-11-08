import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import "./AiChat.css";

const STORAGE_KEY = "aiChatHistory";
const MAX_CONTEXT_CHARS = 15000; // keeps the request small
const WELCOME = "Hi! Ask me anything about your assets, inventory or tickets.";

function loadHistory() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY));
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

// Works for both plain lists and paginated responses ({ results: [...] })
function toList(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.results)) return data.results;
  return [];
}

// Get every page of assets (10 per page, up to 10 pages)
async function fetchAllAssets() {
  const first = await api.get("/assets/", { params: { page: 1 } });
  let items = toList(first.data);

  const count = first.data?.count;
  if (typeof count === "number") {
    const pages = Math.min(Math.ceil(count / 10), 10);
    const rest = [];
    for (let p = 2; p <= pages; p++) {
      rest.push(api.get("/assets/", { params: { page: p } }));
    }
    const responses = await Promise.all(rest);
    responses.forEach((r) => {
      items = items.concat(toList(r.data));
    });
  }
  return items;
}


// Collects what the user could see on the other pages
async function collectAppData() {
  const [dash, assets, tickets, inventory] = await Promise.allSettled([
    api.get("/dashboard/"),
    fetchAllAssets(),
    api.get("/tickets/", { params: { page_size: 100 } }),
    api.get("/inventory/", { params: { page_size: 100 } }),
  ]);

  const data = {
    dashboard: dash.status === "fulfilled" ? dash.value.data : null,
    assets:
      assets.status === "fulfilled"
        ? assets.value.map((a) => ({
            name: a.name,
            type: a.type,
            serial_number: a.serial_number,
            status: a.status,
            purchase_date: a.purchase_date,
          }))
        : [],
    tickets: tickets.status === "fulfilled" ? toList(tickets.value.data).slice(0, 100) : [],
    inventory:
      inventory.status === "fulfilled"
        ? toList(inventory.value.data).map((i) => ({
            name: i.item_type,
            category: i.category,
            quantity: i.quantity,
            low_stock_limit: i.threshold,
          }))
        : [],
  };

  return data;
}

function AiChat() {
  const navigate = useNavigate();

  const [messages, setMessages] = useState(loadHistory);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [appData, setAppData] = useState(null); // data the AI can see
  const bottomRef = useRef(null);

  // Load the app data once when the chat page opens
  useEffect(() => {
    let cancelled = false;
    collectAppData().then((data) => {
      if (!cancelled) setAppData(data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    const next = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setError("");
    setLoading(true);

    // Use the latest data; fall back to a fresh load if it was not ready yet
    const data = appData || (await collectAppData());
    if (!appData) setAppData(data);
    const context = JSON.stringify(data).slice(0, MAX_CONTEXT_CHARS);

    try {
      const res = await api.post("/chat/", { messages: next, context });
      setMessages([...next, { role: "assistant", content: res.data.reply }]);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) {
        setError("Your session has expired. Please log in again.");
      } else {
        setError(
          err.response?.data?.error ||
            "The assistant could not answer right now. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function clearChat() {
    setMessages([]);
    setError("");
  }

  return (
    <div className="chat-page">
      <div className="chat-header">
        <h1>Ask AI</h1>
        <div className="chat-header-actions">
          <button type="button" onClick={clearChat} disabled={messages.length === 0}>
            Clear chat
          </button>
          <button type="button" onClick={() => navigate("/dashboard")}>
            Back to dashboard
          </button>
        </div>
      </div>

      <p className="chat-data-note">
        {appData
          ? `The AI can see: ${appData.assets.length} assets, ${appData.inventory.length} inventory items, ${appData.tickets.length} tickets and the dashboard totals.`
          : "Loading your app data..."}
      </p>

      <div className="chat-window" aria-live="polite">
        <div className="chat-bubble assistant">{WELCOME}</div>

        {messages.map((m, i) => (
          <div key={i} className={`chat-bubble ${m.role}`}>
            {m.content}
          </div>
        ))}

        {loading && <div className="chat-bubble assistant typing">Thinking...</div>}
        {error && <div className="chat-error">{error}</div>}

        <div ref={bottomRef} />
      </div>

      <div className="chat-input-row">
        <textarea
          rows="2"
          placeholder="Type your question and press Enter"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
        />
        <button type="button" onClick={sendMessage} disabled={loading || !input.trim()}>
          Send
        </button>
      </div>
    </div>
  );
}

export default AiChat;