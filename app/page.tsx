"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, Download, Loader2, Trash2, ArrowUpRight, FileText, Scale, BookOpen, Gavel, Shield, Users, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://vakeel-ai-production.up.railway.app";

type Message = { role: "user" | "assistant"; content: string };

const FEATURES = [
  { icon: FileText, title: "FIR Draft Generator", desc: "Generate a professional FIR in the correct Indian police format. Download as PDF instantly.", query: "Draft FIR - someone stole my phone" },
  { icon: Shield, title: "Bail Eligibility Checker", desc: "Will you get bail? Instant analysis with case strength score, grounds to argue, court jurisdiction.", query: "Will I get bail for theft case?" },
  { icon: BookOpen, title: "Landmark Case Law", desc: "Cite actual Supreme Court judgments — Maneka Gandhi, Kesavananda, Puttaswamy, Vishaka, and more.", query: "Landmark judgments on right to privacy" },
  { icon: Gavel, title: "Lawyer Analysis Mode", desc: "Rigorous legal analysis with primary position, opposing arguments, rebuttals, and case strength score.", query: "As a lawyer, legal analysis of dowry harassment under BNS 85" },
  { icon: Sparkles, title: "Limitation Calculator", desc: "Exact deadlines for every legal action — cheque bounce, consumer, RTI, appeals. Zero hallucination.", query: "Limitation period for cheque bounce" },
  { icon: Scale, title: "Section Finder", desc: "Find every applicable section across BNS, BNSS, BSA, Constitution, and 10 other major acts.", query: "What sections apply for online fraud?" },
  { icon: Users, title: "IPC to BNS Converter", desc: "407 mappings between old IPC sections and new Bharatiya Nyaya Sanhita codes.", query: "Convert IPC 302 to BNS" },
  { icon: FileText, title: "Punishment Calculator", desc: "Exact sentences, fines, bail status, cognizability, and court jurisdiction for any offence.", query: "What is the punishment for robbery?" },
];

const LAW_CHIPS = [
  "Criminal", "Constitution", "POCSO", "Cyber", "Consumer",
  "Marriage", "Employment", "Cheque", "Accidents", "POSH", "RTI",
];

// Premium monogram logo
function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} fill="none">
      <defs>
        <linearGradient id="logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F0C896" />
          <stop offset="100%" stopColor="#B8824F" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="38" height="38" rx="9" fill="url(#logo-grad)" />
      {/* Vertical staff */}
      <rect x="19" y="8" width="2" height="26" rx="1" fill="#0A0E1A" />
      {/* Top cap */}
      <circle cx="20" cy="8" r="2" fill="#0A0E1A" />
      {/* Horizontal beam */}
      <rect x="7" y="12" width="26" height="2" rx="1" fill="#0A0E1A" />
      {/* Base platform */}
      <rect x="11" y="33" width="18" height="2" rx="1" fill="#0A0E1A" />
      {/* Left pan */}
      <path d="M5 18 Q10 23 15 18" stroke="#0A0E1A" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <line x1="10" y1="13" x2="10" y2="18" stroke="#0A0E1A" strokeWidth="1.5" />
      {/* Right pan */}
      <path d="M25 18 Q30 23 35 18" stroke="#0A0E1A" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <line x1="30" y1="13" x2="30" y2="18" stroke="#0A0E1A" strokeWidth="1.5" />
    </svg>
  );
}

function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <LogoMark size={32} />
      <span className="font-display text-xl tracking-tight">
        Ask<span className="italic">Vakeel</span>
      </span>
    </div>
  );
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastFir, setLastFir] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const isFirRequest = (q: string) => {
    const kw = ["draft fir", "file fir", "fir draft", "generate fir", "write fir", "lodge fir"];
    return kw.some(k => q.toLowerCase().includes(k));
  };

  const sendQuery = async (query: string) => {
    if (!query.trim() || loading) return;
    // Scroll to top when first query is sent
    if (messages.length === 0) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    setMessages(prev => [...prev, { role: "user", content: query }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      const response = data.response || "Sorry, I couldn't process that.";
      setMessages(prev => [...prev, { role: "assistant", content: response }]);
      if (isFirRequest(query) && !response.toLowerCase().includes("error")) setLastFir(query);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Connection error. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  const downloadPdf = async () => {
    if (!lastFir) return;
    try {
      const res = await fetch(`${API_URL}/fir-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: lastFir }),
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "FIR_Draft_AskVakeel.pdf";
      a.click();
      URL.revokeObjectURL(url);
    } catch { alert("PDF download failed"); }
  };

  const clearChat = () => { setMessages([]); setLastFir(null); };

  if (messages.length > 0) {
    return <ChatView
      messages={messages}
      loading={loading}
      lastFir={lastFir}
      onDownload={downloadPdf}
      input={input}
      setInput={setInput}
      onSend={sendQuery}
      onClear={clearChat}
      endRef={endRef}
    />;
  }

  return (
    <div className="noise min-h-screen relative overflow-hidden">
      {/* Ambient glows */}
      <div className="ambient-glow" style={{ top: "-300px", left: "-200px" }}></div>
      <div className="ambient-glow" style={{ top: "40%", right: "-300px" }}></div>

      {/* Header */}
      <header className="relative z-20 border-b border-[var(--color-ink-line)]">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <Logo />
          <nav className="hidden md:flex items-center gap-10 text-sm text-[var(--color-cream-soft)]">
            <a href="#features" className="hover:text-[var(--color-cream)] transition-colors">Product</a>
            <a href="#about" className="hover:text-[var(--color-cream)] transition-colors">About</a>
            <div className="flex items-center gap-2 px-3 py-1.5 border border-[var(--color-gold-dim)] rounded-full text-[10px] tracking-[0.15em] uppercase text-[var(--color-gold)]">
              <Sparkles className="w-3 h-3" />
              Free Forever
            </div>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pt-24 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="flex items-center gap-2 mb-10">
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-gold)]"></div>
            <span className="text-[11px] tracking-[0.2em] uppercase text-[var(--color-cream-muted)]">
              AI Trained on 14 Indian Laws · BNS · BNSS · Constitution
            </span>
          </div>

          <h1 className="font-display font-light text-[64px] md:text-[96px] lg:text-[112px] leading-[0.95] tracking-[-0.03em] mb-8 text-balance">
            Legal clarity.<br />
            <span className="italic gold-gradient font-normal">for every Indian.</span>
          </h1>

          <p className="text-xl md:text-2xl text-[var(--color-cream-soft)] max-w-2xl leading-relaxed mb-14 font-light">
            Instant, accurate answers on Indian law. Draft FIRs, find applicable sections, check punishments — all free. In English or Hindi.
          </p>
        </motion.div>

        {/* Search input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-3xl"
        >
          <form
            onSubmit={(e) => { e.preventDefault(); sendQuery(input); }}
            className="relative"
          >
            <div className="relative bg-[var(--color-ink-soft)] border border-[var(--color-ink-line)] focus-within:border-[var(--color-gold)] rounded-2xl transition-all shadow-2xl">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a legal question in English or Hindi..."
                className="w-full px-7 py-6 pr-16 bg-transparent outline-none text-lg placeholder:text-[var(--color-cream-muted)]"
              />
              <button
                type="submit"
                disabled={!input.trim()}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-12 h-12 bg-gradient-to-br from-[var(--color-gold-bright)] to-[var(--color-gold)] text-[var(--color-ink)] rounded-xl flex items-center justify-center disabled:opacity-40 hover:opacity-90 transition-opacity"
              >
                <Send className="w-4 h-4" strokeWidth={2.5} />
              </button>
            </div>
          </form>

          {/* Quick suggestions */}
          <div className="mt-6 flex flex-wrap gap-2">
            <span className="text-xs text-[var(--color-cream-muted)] py-2">Try asking:</span>
            {[
              "Draft FIR for theft",
              "What is Article 21?",
              "Punishment for cheating",
              "Convert IPC 302 to BNS",
            ].map((ex, i) => (
              <button
                key={i}
                onClick={() => sendQuery(ex)}
                className="text-xs px-3.5 py-1.5 border border-[var(--color-ink-line)] hover:border-[var(--color-gold)] hover:text-[var(--color-gold)] text-[var(--color-cream-soft)] transition-all rounded-full"
              >
                {ex}
              </button>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Stats strip */}
      <section className="relative z-10 border-y border-[var(--color-ink-line)] bg-[var(--color-ink-soft)]/30">
        <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-10">
          {[
            { num: "14", label: "Indian Laws" },
            { num: "3,474", label: "Legal Sections" },
            { num: "407", label: "IPC → BNS Maps" },
            { num: "₹0", label: "Always Free" },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
            >
              <div className="font-display text-5xl md:text-6xl mb-2 gold-gradient">{stat.num}</div>
              <div className="text-[11px] tracking-[0.15em] uppercase text-[var(--color-cream-muted)]">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 max-w-6xl mx-auto px-6 py-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mb-20 max-w-3xl"
        >
          <p className="text-[11px] tracking-[0.2em] uppercase text-[var(--color-gold)] mb-5">Capabilities</p>
          <h2 className="font-display text-5xl md:text-7xl leading-[0.95] mb-6 text-balance">
            Everything you need <span className="italic gold-gradient">to navigate</span> Indian law.
          </h2>
          <p className="text-lg text-[var(--color-cream-soft)] max-w-xl">
            Built for the citizen, not the lawyer. No subscriptions. No ₹5,000 consultations. Just instant answers.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((feat, i) => {
            const Icon = feat.icon;
            return (
              <motion.button
                key={i}
                onClick={() => sendQuery(feat.query)}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.06 }}
                className="group hover-lift bg-[var(--color-ink-soft)]/60 border border-[var(--color-ink-line)] hover:border-[var(--color-gold-dim)] p-8 text-left rounded-2xl backdrop-blur-sm relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-gold)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative">
                  <div className="w-12 h-12 rounded-xl bg-[var(--color-ink-elev)] border border-[var(--color-ink-line)] flex items-center justify-center mb-6 group-hover:border-[var(--color-gold)] transition-colors">
                    <Icon className="w-5 h-5 text-[var(--color-gold)]" strokeWidth={1.5} />
                  </div>
                  <h3 className="font-display text-2xl mb-3 text-[var(--color-cream)]">{feat.title}</h3>
                  <p className="text-sm text-[var(--color-cream-soft)] leading-relaxed mb-6">{feat.desc}</p>
                  <div className="flex items-center gap-1.5 text-[11px] tracking-[0.15em] uppercase text-[var(--color-gold)] opacity-0 group-hover:opacity-100 transition-opacity">
                    Try it now <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={2} />
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </section>

      {/* Laws covered */}
      <section className="relative z-10 border-t border-[var(--color-ink-line)] bg-[var(--color-ink-soft)]/40">
        <div className="max-w-6xl mx-auto px-6 py-24 text-center">
          <p className="text-[11px] tracking-[0.2em] uppercase text-[var(--color-gold)] mb-5">Trained on</p>
          <h3 className="font-display text-3xl md:text-4xl mb-10 text-balance max-w-2xl mx-auto">
            All 14 major Indian laws, <span className="italic gold-gradient">at your fingertips.</span>
          </h3>
          <div className="flex flex-wrap gap-3 justify-center max-w-3xl mx-auto">
            {LAW_CHIPS.map((chip, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.03 }}
                className="px-5 py-2.5 text-sm border border-[var(--color-ink-line)] text-[var(--color-cream-soft)] rounded-full bg-[var(--color-ink)]"
              >
                {chip}
              </motion.span>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="relative z-10 max-w-6xl mx-auto px-6 py-32">
        <div className="grid md:grid-cols-5 gap-16">
          <div className="md:col-span-2">
            <p className="text-[11px] tracking-[0.2em] uppercase text-[var(--color-gold)] mb-5">Why AskVakeel</p>
            <h2 className="font-display text-4xl md:text-5xl leading-[1.05] text-balance">
              Built for the <span className="italic gold-gradient">citizen,</span> not the lawyer.
            </h2>
          </div>
          <div className="md:col-span-3 space-y-6 text-[var(--color-cream-soft)] leading-loose text-lg">
            <p>
              Most legal tools are built for lawyers charging ₹5,000 per consultation. AskVakeel is different. It's built for the 1.4 billion Indians who deserve to understand their rights without paying a fee.
            </p>
            <p>
              Trained on all 14 major Indian laws — from the new Bharatiya Nyaya Sanhita (BNS) replacing IPC, to the Constitution, Consumer Protection Act, Domestic Violence Act, POCSO, IT Act, Motor Vehicles Act, and more. Ask anything. Get instant, accurate answers.
            </p>
            <div className="pt-6 border-t border-[var(--color-ink-line)] flex items-start gap-3 text-sm text-[var(--color-cream-muted)]">
              <span className="text-[var(--color-gold)] mt-0.5">⚠</span>
              <p>Legal information only — not legal advice. For specific matters, consult a qualified advocate. Your conversations are not stored.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[var(--color-ink-line)]">
        <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <Logo />
          <div className="text-sm text-[var(--color-cream-muted)]">
            © 2026 · askvakeel.in · Free legal intelligence for India
          </div>
        </div>
      </footer>
    </div>
  );
}

function ChatView({ messages, loading, lastFir, onDownload, input, setInput, onSend, onClear, endRef }: {
  messages: Message[];
  loading: boolean;
  lastFir: string | null;
  onDownload: () => void;
  input: string;
  setInput: (v: string) => void;
  onSend: (q: string) => void;
  onClear: () => void;
  endRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <div className="noise min-h-screen relative">
      <div className="ambient-glow" style={{ top: "-400px", left: "50%", transform: "translateX(-50%)" }}></div>

      <header className="relative z-20 border-b border-[var(--color-ink-line)]">
        <div className="max-w-4xl mx-auto px-6 py-5 flex items-center justify-between">
          <button onClick={onClear}>
            <Logo />
          </button>
          <button
            onClick={onClear}
            className="flex items-center gap-2 px-4 py-2 text-xs tracking-wider uppercase text-[var(--color-cream-muted)] hover:text-[var(--color-gold)] transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
            Clear
          </button>
        </div>
      </header>

      <div className="relative z-10 max-w-3xl mx-auto px-6 py-12 pb-40">
        <div className="space-y-10">
          {messages.map((msg, i) => (
            <MessageBlock key={i} message={msg} />
          ))}
          {loading && (
            <div className="flex items-center gap-3 text-[var(--color-cream-muted)]">
              <Loader2 className="w-4 h-4 animate-spin text-[var(--color-gold)]" strokeWidth={1.5} />
              <span className="font-display italic">Consulting the law…</span>
            </div>
          )}
          {lastFir && !loading && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={onDownload}
              className="inline-flex items-center gap-2.5 px-6 py-3 bg-gradient-to-br from-[var(--color-gold-bright)] to-[var(--color-gold)] text-[var(--color-ink)] rounded-xl hover:opacity-90 transition-opacity text-sm font-semibold"
            >
              <Download className="w-4 h-4" strokeWidth={2.5} />
              Download FIR as PDF
            </motion.button>
          )}
          <div ref={endRef} />
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-[var(--color-ink)] via-[var(--color-ink)] to-transparent pt-10 pb-6 z-20">
        <div className="max-w-3xl mx-auto px-6">
          <form onSubmit={(e) => { e.preventDefault(); onSend(input); }} className="relative">
            <div className="relative bg-[var(--color-ink-soft)] border border-[var(--color-ink-line)] focus-within:border-[var(--color-gold)] rounded-2xl transition-all shadow-2xl">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a follow-up question..."
                className="w-full px-6 py-5 pr-14 bg-transparent outline-none placeholder:text-[var(--color-cream-muted)]"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-gradient-to-br from-[var(--color-gold-bright)] to-[var(--color-gold)] text-[var(--color-ink)] rounded-lg flex items-center justify-center disabled:opacity-30 hover:opacity-90 transition-opacity"
              >
                <Send className="w-4 h-4" strokeWidth={2.5} />
              </button>
            </div>
          </form>
          <p className="text-center text-[10px] tracking-[0.15em] uppercase text-[var(--color-cream-muted)] mt-3">
            Legal Information · Not Legal Advice · Consult an Advocate
          </p>
        </div>
      </div>
    </div>
  );
}

function MessageBlock({ message }: { message: Message }) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-2xl ml-auto"
      >
        <div className="text-[10px] tracking-[0.25em] uppercase text-[var(--color-cream-muted)] mb-3 text-right">
          You
        </div>
        <div className="font-display text-xl leading-relaxed text-[var(--color-cream)] border-r-2 border-[var(--color-gold)] pr-5 text-right italic">
          {message.content}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Logo className="scale-75 origin-left" />
      </div>
      <div className="markdown">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {message.content}
        </ReactMarkdown>
      </div>
    </motion.div>
  );
}