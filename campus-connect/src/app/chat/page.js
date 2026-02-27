import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, addDoc, onSnapshot, query, where, orderBy, serverTimestamp, doc } from "firebase/firestore";

export default function ChatPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [chatTime, setChatTime] = useState(0);
  const [showReport, setShowReport] = useState(false);
  const [showIcebreakers, setShowIcebreakers] = useState(true);
  const [activeChatId, setActiveChatId] = useState(null);
  const [partnerInfo, setPartnerInfo] = useState({
    name: "Partner",
    college: "Verified College",
    branch: "Student",
    year: "2nd Year",
    interests: ["💻 Coding", "🚀 Startups"],
    karma: 320,
    verified: true,
  });
  const chatEndRef = useRef(null);

  // Load active chat and partner from profile
  useEffect(() => {
    if (profile?.activeChatId) {
      setActiveChatId(profile.activeChatId);
    }
    if (profile?.partnerName) {
      setPartnerInfo(prev => ({ ...prev, name: profile.partnerName }));
    }
  }, [profile]);

  // Real-time message sync
  useEffect(() => {
    if (!activeChatId || !user) return;

    const msgsRef = collection(db, "calls", activeChatId, "messages");
    const q = query(msgsRef, orderBy("createdAt", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        sender: doc.data().senderId === user.uid ? "me" : "partner",
        time: doc.data().createdAt?.toDate().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) || "..."
      }));
      setMessages(newMessages);
      if (newMessages.length > 0) setShowIcebreakers(false);
    });

    return () => unsubscribe();
  }, [activeChatId, user?.uid]);

  const icebreakers = [
    "🎯 What project are you working on right now?",
    "🚀 If you could build any startup, what would it be?",
    "📚 What's the best course you've taken this semester?",
    "🎮 What do you do when you're not studying?",
    "💡 What's one skill you wish your college taught better?",
  ];

  // Chat timer
  useEffect(() => {
    const timer = setInterval(() => setChatTime((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || !activeChatId || !user) return;

    const msgText = input.trim();
    setInput("");
    setShowIcebreakers(false);

    try {
      await addDoc(collection(db, "calls", activeChatId, "messages"), {
        text: msgText,
        senderId: user.uid,
        createdAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  const sendIcebreaker = async (text) => {
    if (!activeChatId || !user) return;
    setShowIcebreakers(false);

    try {
      await addDoc(collection(db, "calls", activeChatId, "messages"), {
        text: text,
        senderId: user.uid,
        createdAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Error sending icebreaker:", err);
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="chat-layout">
      {/* Chat Sidebar / Partner Info */}
      <aside className="chat-sidebar">
        <div className="cs-header">
          <button className="btn btn-ghost" onClick={() => router.push("/dashboard")} id="back-dashboard">
            ← Back
          </button>
        </div>

        <div className="partner-card">
          <div className="avatar avatar-lg">
            {partnerInfo.name[0]}
          </div>
          <h3 className="partner-name">{partnerInfo.name}</h3>
          <div className="partner-college">
            <span className="badge badge-verified">✅ Verified</span>
            <span>{partnerInfo.college}</span>
          </div>
          <div className="partner-details">
            <span>{partnerInfo.branch} · {partnerInfo.year}</span>
          </div>
          <div className="partner-interests">
            {partnerInfo.interests.map((i) => (
              <span key={i} className="tag">{i}</span>
            ))}
          </div>
          <div className="partner-karma">
            <span>⭐ {partnerInfo.karma} Karma</span>
          </div>
        </div>

        <div className="chat-timer">
          <span className="timer-label">Chat Duration</span>
          <span className="timer-value">{formatTime(chatTime)}</span>
        </div>

        <div className="chat-actions">
          <button
            className="btn btn-danger btn-sm"
            onClick={() => setShowReport(true)}
            id="report-btn"
          >
            🚨 Report
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => router.push("/dashboard")}
            id="next-match"
          >
            ⏭️ Next Match
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => router.push("/dashboard")}
            id="end-chat"
          >
            End Chat
          </button>
        </div>
      </aside>

      {/* Chat Area */}
      <main className="chat-main">
        <header className="chat-header">
          <div className="ch-left">
            <div className="avatar avatar-sm">{partnerInfo.name[0]}</div>
            <div>
              <div className="ch-name">{partnerInfo.name}</div>
              <div className="ch-status">
                <span className="online-dot" />
                {isTyping ? "typing..." : "Online"}
              </div>
            </div>
          </div>
          <div className="ch-right">
            <span className="ch-timer">{formatTime(chatTime)}</span>
            <span className="badge badge-verified">✅</span>
          </div>
        </header>

        {/* Messages */}
        <div className="chat-messages" id="chat-messages">
          <div className="system-message">
            <div className="system-msg-content">
              🛡️ This chat is moderated by AI for your safety.
              <br />
              Be respectful and follow community guidelines.
            </div>
          </div>

          <div className="system-message">
            <div className="system-msg-content">
              🎉 You matched with <strong>{partnerInfo.name}</strong> from{" "}
              <strong>{partnerInfo.college}</strong>! Say hi 👋
            </div>
          </div>

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`message ${msg.sender === "me" ? "msg-me" : "msg-partner"}`}
            >
              <div className="msg-bubble">
                <p>{msg.text}</p>
                <span className="msg-time">{msg.time}</span>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="message msg-partner">
              <div className="msg-bubble typing-bubble">
                <div className="typing-dots">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Icebreakers */}
        {showIcebreakers && messages.length === 0 && (
          <div className="icebreakers">
            <div className="ice-header">
              <span className="ice-icon">🧠</span>
              <span>AI Icebreaker Suggestions</span>
            </div>
            <div className="ice-list">
              {icebreakers.map((ice, i) => (
                <button
                  key={i}
                  className="ice-btn"
                  onClick={() => sendIcebreaker(ice)}
                  id={`icebreaker-${i}`}
                >
                  {ice}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <form className="chat-input-bar" onSubmit={sendMessage}>
          <button type="button" className="btn btn-icon btn-ghost" id="attach-btn">
            📎
          </button>
          <input
            type="text"
            className="chat-input"
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            id="chat-input"
          />
          <button
            type="submit"
            className={`btn btn-primary btn-icon send-btn ${!input.trim() ? "disabled" : ""}`}
            disabled={!input.trim()}
            id="send-btn"
          >
            →
          </button>
        </form>
      </main>

      {/* Report Modal */}
      {showReport && (
        <div className="modal-overlay" onClick={() => setShowReport(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>🚨 Report User</h3>
            <p style={{ color: "var(--text-secondary)", margin: "0.5rem 0 1rem", fontSize: "0.9rem" }}>
              Help us keep CampusConnect safe. Select a reason:
            </p>
            <div className="report-options">
              {[
                "Inappropriate content",
                "Harassment or bullying",
                "Spam or fake profile",
                "NSFW content",
                "Threatening behavior",
                "Other",
              ].map((reason) => (
                <button key={reason} className="report-option" onClick={() => setShowReport(false)}>
                  {reason}
                </button>
              ))}
            </div>
            <button className="btn btn-ghost" onClick={() => setShowReport(false)} style={{ marginTop: "1rem", width: "100%" }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .chat-layout {
          display: flex;
          height: 100vh;
          background: var(--bg-primary);
        }

        /* ── Sidebar ────────────────── */
        .chat-sidebar {
          width: 280px;
          background: var(--bg-secondary);
          border-right: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          padding: 1rem;
          gap: 1.5rem;
        }

        .cs-header {
          display: flex;
          justify-content: flex-start;
        }

        .partner-card {
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
        }

        .partner-name {
          font-size: 1.25rem;
          font-weight: 700;
        }

        .partner-college {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.85rem;
          color: var(--text-secondary);
        }

        .partner-details {
          font-size: 0.8rem;
          color: var(--text-muted);
        }

        .partner-interests {
          display: flex;
          gap: 0.35rem;
          flex-wrap: wrap;
          justify-content: center;
        }

        .partner-karma {
          font-size: 0.85rem;
          color: var(--warning);
          font-weight: 600;
        }

        .chat-timer {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.25rem;
          padding: 1rem;
          background: var(--bg-elevated);
          border-radius: var(--radius-md);
          border: 1px solid var(--border);
        }

        .timer-label {
          font-size: 0.7rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .timer-value {
          font-size: 1.75rem;
          font-weight: 800;
          font-family: var(--font-mono);
          background: var(--gradient-text);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .chat-actions {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-top: auto;
        }

        /* ── Main Chat ──────────────── */
        .chat-main {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .chat-header {
          padding: 0.85rem 1.5rem;
          border-bottom: 1px solid var(--border);
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: var(--bg-secondary);
        }

        .ch-left {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .ch-name {
          font-weight: 600;
          font-size: 0.95rem;
        }

        .ch-status {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.75rem;
          color: var(--success);
        }

        .online-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--success);
        }

        .ch-right {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .ch-timer {
          font-family: var(--font-mono);
          font-size: 0.85rem;
          color: var(--text-muted);
        }

        /* ── Messages ───────────────── */
        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .system-message {
          text-align: center;
          margin: 0.5rem 0;
        }

        .system-msg-content {
          display: inline-block;
          padding: 0.6rem 1.25rem;
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          border-radius: var(--radius-full);
          font-size: 0.8rem;
          color: var(--text-secondary);
          line-height: 1.5;
        }

        .message {
          display: flex;
          max-width: 70%;
          animation: fadeInUp 0.3s ease-out;
        }

        .msg-me {
          align-self: flex-end;
          justify-content: flex-end;
        }

        .msg-partner {
          align-self: flex-start;
        }

        .msg-bubble {
          padding: 0.75rem 1.15rem;
          border-radius: var(--radius-lg);
          font-size: 0.9rem;
          line-height: 1.5;
          position: relative;
        }

        .msg-me .msg-bubble {
          background: var(--primary);
          color: white;
          border-bottom-right-radius: 4px;
        }

        .msg-partner .msg-bubble {
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          border-bottom-left-radius: 4px;
        }

        .msg-time {
          display: block;
          font-size: 0.65rem;
          opacity: 0.6;
          margin-top: 0.25rem;
          text-align: right;
        }

        /* Typing */
        .typing-bubble {
          padding: 0.75rem 1.25rem;
        }

        .typing-dots {
          display: flex;
          gap: 4px;
        }

        .typing-dots span {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--text-muted);
          animation: typingDot 1.4s ease-in-out infinite;
        }

        .typing-dots span:nth-child(2) {
          animation-delay: 0.2s;
        }

        .typing-dots span:nth-child(3) {
          animation-delay: 0.4s;
        }

        @keyframes typingDot {
          0%, 60%, 100% {
            transform: translateY(0);
            opacity: 0.4;
          }
          30% {
            transform: translateY(-8px);
            opacity: 1;
          }
        }

        /* ── Icebreakers ────────────── */
        .icebreakers {
          padding: 0 1.5rem 0.5rem;
        }

        .ice-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-secondary);
          margin-bottom: 0.65rem;
        }

        .ice-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .ice-btn {
          padding: 0.5rem 1rem;
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          border-radius: var(--radius-full);
          font-size: 0.8rem;
          color: var(--text-secondary);
          transition: var(--transition-fast);
          cursor: pointer;
        }

        .ice-btn:hover {
          border-color: var(--primary);
          color: var(--primary-light);
          background: rgba(108, 92, 231, 0.05);
        }

        /* ── Input Bar ──────────────── */
        .chat-input-bar {
          padding: 1rem 1.5rem;
          border-top: 1px solid var(--border);
          display: flex;
          gap: 0.65rem;
          align-items: center;
          background: var(--bg-secondary);
        }

        .chat-input {
          flex: 1;
          padding: 0.85rem 1.25rem;
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          border-radius: var(--radius-full);
          color: var(--text-primary);
          font-size: 0.9rem;
          transition: var(--transition-base);
        }

        .chat-input:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(108, 92, 231, 0.1);
        }

        .chat-input::placeholder {
          color: var(--text-muted);
        }

        .send-btn {
          font-size: 1.25rem;
          width: 44px;
          height: 44px;
        }

        .send-btn.disabled {
          opacity: 0.3;
        }

        /* ── Report Modal ───────────── */
        .report-options {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .report-option {
          padding: 0.75rem 1rem;
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          color: var(--text-primary);
          font-size: 0.9rem;
          text-align: left;
          cursor: pointer;
          transition: var(--transition-fast);
        }

        .report-option:hover {
          border-color: var(--danger);
          background: rgba(225, 112, 85, 0.05);
        }

        /* ── Responsive ─────────────── */
        @media (max-width: 768px) {
          .chat-sidebar {
            display: none;
          }

          .chat-messages {
            padding: 1rem;
          }

          .message {
            max-width: 85%;
          }

          .icebreakers {
            padding: 0 1rem 0.5rem;
          }

          .chat-input-bar {
            padding: 0.75rem 1rem;
          }
        }
      `}</style>
    </div>
  );
}
