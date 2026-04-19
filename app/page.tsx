"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, Download, Loader2, Trash2, ArrowUpRight, FileText, Scale, BookOpen, Gavel, Shield, Users, Sparkles, ArrowLeft } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://vakeel-ai-production.up.railway.app";

type Message = { role: "user" | "assistant"; content: string };
type ViewMode = "landing" | "chat" | "feature";

type Feature = {
  id: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  desc: string;
  longDesc: string;
  suggestions: string[];
  placeholder: string;
};

const FEATURES: Feature[] = [
  {
    id: "fir",
    icon: FileText,
    title: "FIR Draft Generator",
    desc: "Generate a professional FIR in the correct Indian police format. Download as PDF instantly.",
    longDesc: "Describe what happened and get a ready-to-file FIR with correct BNS sections, proper format, and legal language. Download as PDF to take directly to the police station.",
    suggestions: [
      "Draft FIR - someone stole my phone in Mumbai",
      "Draft FIR for break-in at my home last night",
      "Draft FIR for online cheating, lost Rs 50,000",
      "Draft FIR for threatening messages from neighbour",
      "Draft FIR for harassment at workplace",
      "Draft FIR for cyberstalking on Instagram",
    ],
    placeholder: "Describe the incident for FIR...",
  },
  {
    id: "bail",
    icon: Shield,
    title: "Bail Eligibility Checker",
    desc: "Will you get bail? Instant analysis with case strength score, grounds to argue, court jurisdiction.",
    longDesc: "Get complete bail analysis: bailable or not, which court, case strength score, grounds to argue, likely conditions, and next steps.",
    suggestions: [
      "Will I get bail for theft case?",
      "Bail eligibility for cheque bounce under Section 138",
      "Can I get anticipatory bail for false dowry case?",
      "Bail chances in cyber fraud case",
      "Will I get bail for assault charges?",
      "Default bail under BNSS 187 eligibility",
    ],
    placeholder: "Describe your charge/arrest situation...",
  },
  {
    id: "caselaw",
    icon: BookOpen,
    title: "Landmark Case Law",
    desc: "Cite actual Supreme Court judgments — Maneka Gandhi, Kesavananda, Puttaswamy, Vishaka, and more.",
    longDesc: "Get landmark Supreme Court judgments relevant to your legal issue. Proper citations, ratio decidendi, and current applicability.",
    suggestions: [
      "Landmark judgments on right to privacy",
      "Supreme Court rulings on free speech",
      "Case law on mandatory FIR registration",
      "Precedents on women's workplace rights",
      "Landmark judgments on arrest procedures",
      "Supreme Court cases on bail principles",
    ],
    placeholder: "What legal issue do you need case law for?",
  },
  {
    id: "explain",
    icon: Gavel,
    title: "Lawyer Analysis Mode",
    desc: "Rigorous legal analysis with primary position, opposing arguments, rebuttals, and case strength score.",
    longDesc: "Professional-grade analysis for lawyers: primary position, opposing counsel's likely argument, rebuttal strategies, case strength score, and practical next steps.",
    suggestions: [
      "As a lawyer, analyze Section 498A dowry harassment",
      "Legal analysis: Can landlord evict without notice?",
      "Explain reasoning for cheque bounce defence",
      "Opposing argument for POSH workplace complaint",
      "Both sides: Consumer complaint for defective product",
      "How to argue anticipatory bail in domestic violence case",
    ],
    placeholder: "Describe the case for lawyer-grade analysis...",
  },
  {
    id: "crossexam",
    icon: Users,
    title: "Cross-Examination Prep",
    desc: "Strategic cross-examination for witnesses. Contradictions, trap questions, objection handling, BSA section references.",
    longDesc: "Professional cross-examination prep with 12 strategic sections: preparatory notes, contradiction tables, opening questions, trap questions, bias attacks, objection handling, and court-craft tips for Indian courts.",
    suggestions: [
      "Prepare cross examination for prosecution witness in cheque bounce case",
      "Cross questions for eye witness in murder case",
      "Cross-examination prep for hostile witness",
      "Cross exam strategy for police witness in theft case",
      "Prepare cross for medical expert in assault case",
      "Witness questioning strategy for false dowry case",
    ],
    placeholder: "Describe the witness and case type...",
  },
  {
    id: "limitation",
    icon: Sparkles,
    title: "Limitation Calculator",
    desc: "Exact deadlines for every legal action — cheque bounce, consumer, RTI, appeals.",
    longDesc: "Verified deadlines from the Limitation Act 1963 and specific statutes.",
    suggestions: [
      "Limitation period for cheque bounce",
      "Deadline to file consumer complaint",
      "Time limit for filing RTI appeal",
      "How long do I have to file a civil suit?",
      "Limitation for motor accident claim",
      "Deadline for SLP in Supreme Court",
    ],
    placeholder: "What legal action do you need the deadline for?",
  },
  {
    id: "sections",
    icon: Scale,
    title: "Section Finder",
    desc: "Find every applicable section across BNS, BNSS, BSA, Constitution, and 10 other major acts.",
    longDesc: "Describe a situation and get a complete table of every applicable section across all 14 Indian laws with punishments and classifications.",
    suggestions: [
      "What sections apply for online fraud?",
      "All sections for workplace sexual harassment",
      "Applicable sections for domestic violence",
      "Which sections for hit and run accident?",
      "Sections for cyber blackmail",
      "All laws for dowry harassment",
    ],
    placeholder: "Describe the incident or situation...",
  },
  {
    id: "ipc-bns",
    icon: Users,
    title: "IPC to BNS Converter",
    desc: "407 mappings between old IPC sections and new Bharatiya Nyaya Sanhita codes.",
    longDesc: "Old IPC section numbers are confusing now. Get the exact BNS equivalent with full section details.",
    suggestions: [
      "Convert IPC 302 to BNS",
      "What is the BNS equivalent of IPC 420?",
      "IPC 498A is now which BNS section?",
      "IPC 376 to BNS mapping",
      "IPC 307 in new BNS",
      "Convert IPC 354 to BNS",
    ],
    placeholder: "Enter IPC section or describe offence...",
  },
  {
    id: "punishment",
    icon: FileText,
    title: "Punishment Calculator",
    desc: "Exact sentences, fines, bail status, cognizability, and court jurisdiction for any offence.",
    longDesc: "Get a complete punishment table: min/max sentence, fine amount, bail status, cognizability, compoundability, and which court tries it.",
    suggestions: [
      "What is the punishment for robbery?",
      "Punishment for cheating and fraud",
      "Sentence for rape under BNS",
      "Penalty for drunk driving",
      "Punishment for cyber crime",
      "Jail term for dowry harassment",
    ],
    placeholder: "Enter offence or crime type...",
  },
];

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
      <rect x="19" y="8" width="2" height="26" rx="1" fill="#0A0E1A" />
      <circle cx="20" cy="8" r="2" fill="#0A0E1A" />
      <rect x="7" y="12" width="26" height="2" rx="1" fill="#0A0E1A" />
      <rect x="11" y="33" width="18" height="2" rx="1" fill="#0A0E1A" />
      <path d="M5 18 Q10 23 15 18" stroke="#0A0E1A" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <line x1="10" y1="13" x2="10" y2="18" stroke="#0A0E1A" strokeWidth="1.5" />
      <path d="M25 18 Q30 23 35 18" stroke="#0A0E1A" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <line x1="30" y1="13" x2="30" y2="18" stroke="#0A0E1A" strokeWidth="1.5" />
    </svg>
  );
}

function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <LogoMark size={28} />
      <span className="font-display text-lg sm:text-xl tracking-tight">
        Ask<span className="italic">Vakeel</span>
      </span>
    </div>
  );
}

export default function Home() {
  const [mode, setMode] = useState<ViewMode>("landing");
  const [activeFeature, setActiveFeature] = useState<Feature | null>(null);
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

  const openFeature = (feature: Feature) => {
    setActiveFeature(feature);
    setMode("feature");
    setMessages([]);
    setLastFir(null);
    setInput("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const sendQuery = async (query: string) => {
    if (!query.trim() || loading) return;
    if (mode === "landing") {
      setMode("chat");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    if (mode === "feature") {
      setMode("chat");
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

  const goHome = () => {
    setMode("landing");
    setActiveFeature(null);
    setMessages([]);
    setLastFir(null);
    setInput("");
  };

  if (mode === "feature" && activeFeature) {
    return <FeatureView feature={activeFeature} onSend={sendQuery} onBack={goHome} input={input} setInput={setInput} />;
  }

  if (mode === "chat") {
    return <ChatView
      messages={messages}
      loading={loading}
      lastFir={lastFir}
      onDownload={downloadPdf}
      input={input}
      setInput={setInput}
      onSend={sendQuery}
      onHome={goHome}
      endRef={endRef}
      activeFeature={activeFeature}
    />;
  }

  return <Landing onQuery={sendQuery} input={input} setInput={setInput} onFeature={openFeature} />;
}

function Landing({ onQuery, input, setInput, onFeature }: { onQuery: (q: string) => void; input: string; setInput: (v: string) => void; onFeature: (f: Feature) => void }) {
  const LAW_CHIPS = ["Criminal", "Constitution", "POCSO", "Cyber", "Consumer", "Marriage", "Employment", "Cheque", "Accidents", "POSH", "RTI"];

  return (
    <div className="noise min-h-screen relative overflow-hidden">
      <div className="ambient-glow" style={{ top: "-300px", left: "-200px" }}></div>
      <div className="ambient-glow" style={{ top: "40%", right: "-300px" }}></div>

      <header className="relative z-20 border-b border-[var(--color-ink-line)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between">
          <Logo />
          <nav className="flex items-center gap-4 sm:gap-10 text-sm text-[var(--color-cream-soft)]">
            <a href="#features" className="hidden sm:inline hover:text-[var(--color-cream)] transition-colors">Product</a>
            <a href="#about" className="hidden sm:inline hover:text-[var(--color-cream)] transition-colors">About</a>
            <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 border border-[var(--color-gold-dim)] rounded-full text-[9px] sm:text-[10px] tracking-[0.1em] sm:tracking-[0.15em] uppercase text-[var(--color-gold)]">
              <Sparkles className="w-3 h-3" />
              Free Forever
            </div>
          </nav>
        </div>
      </header>

      <section className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-12 sm:pt-24 pb-12 sm:pb-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="flex items-center gap-2 mb-6 sm:mb-10">
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-gold)]"></div>
            <span className="text-[9px] sm:text-[11px] tracking-[0.15em] sm:tracking-[0.2em] uppercase text-[var(--color-cream-muted)]">
              AI Trained on 14 Indian Laws · BNS · BNSS · Constitution
            </span>
          </div>

          <h1 className="font-display font-light fluid-hero mb-6 sm:mb-8 text-balance">
            Legal clarity.<br />
            <span className="italic gold-gradient font-normal">for every Indian.</span>
          </h1>

          <p className="fluid-lead text-[var(--color-cream-soft)] max-w-2xl mb-10 sm:mb-14 font-light">
            Instant, accurate answers on Indian law. Draft FIRs, find applicable sections, check punishments — all free. In English or Hindi.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-3xl"
        >
          <form
            onSubmit={(e) => { e.preventDefault(); onQuery(input); }}
            className="relative"
          >
            <div className="relative bg-[var(--color-ink-soft)] border border-[var(--color-ink-line)] focus-within:border-[var(--color-gold)] rounded-2xl transition-all shadow-2xl">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a legal question..."
                className="w-full px-5 sm:px-7 py-4 sm:py-6 pr-14 sm:pr-16 bg-transparent outline-none text-base sm:text-lg placeholder:text-[var(--color-cream-muted)]"
                onFocus={(e) => { e.target.placeholder = ""; }}
                onBlur={(e) => { e.target.placeholder = "Ask a legal question..."; }}
              />
              <button
                type="submit"
                disabled={!input.trim()}
                aria-label="Send"
                className="absolute right-2 sm:right-2.5 top-1/2 -translate-y-1/2 w-11 h-11 sm:w-12 sm:h-12 bg-gradient-to-br from-[var(--color-gold-bright)] to-[var(--color-gold)] text-[var(--color-ink)] rounded-xl flex items-center justify-center disabled:opacity-40 hover:opacity-90 transition-opacity"
              >
                <Send className="w-4 h-4" strokeWidth={2.5} />
              </button>
            </div>
          </form>

          <div className="mt-5 sm:mt-6 flex flex-wrap gap-2 items-center">
            <span className="text-xs text-[var(--color-cream-muted)] py-2">Try asking:</span>
            {[
              "Draft FIR for theft",
              "What is Article 21?",
              "Punishment for cheating",
              "Limitation for cheque bounce",
            ].map((ex, i) => (
              <button
                key={i}
                onClick={() => onQuery(ex)}
                className="text-xs px-3 sm:px-3.5 py-1.5 border border-[var(--color-ink-line)] hover:border-[var(--color-gold)] hover:text-[var(--color-gold)] text-[var(--color-cream-soft)] transition-all rounded-full"
              >
                {ex}
              </button>
            ))}
          </div>
        </motion.div>
      </section>

      <section className="relative z-10 border-y border-[var(--color-ink-line)] bg-[var(--color-ink-soft)]/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10 grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-10">
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
              <div className="font-display fluid-stat mb-2 gold-gradient">{stat.num}</div>
              <div className="text-[10px] sm:text-[11px] tracking-[0.12em] sm:tracking-[0.15em] uppercase text-[var(--color-cream-muted)]">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      <section id="features" className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mb-12 sm:mb-20 max-w-3xl"
        >
          <p className="text-[10px] sm:text-[11px] tracking-[0.15em] sm:tracking-[0.2em] uppercase text-[var(--color-gold)] mb-4 sm:mb-5">Capabilities</p>
          <h2 className="font-display fluid-h2 mb-5 sm:mb-6 text-balance">
            Everything you need <span className="italic gold-gradient">to navigate</span> Indian law.
          </h2>
          <p className="text-base sm:text-lg text-[var(--color-cream-soft)] max-w-xl">
            Built for the citizen, not the lawyer. No subscriptions. No ₹5,000 consultations. Just instant answers.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {FEATURES.map((feat, i) => {
            const Icon = feat.icon;
            return (
              <motion.button
                key={feat.id}
                onClick={() => onFeature(feat)}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.06 }}
                className="group hover-lift bg-[var(--color-ink-soft)]/60 border border-[var(--color-ink-line)] hover:border-[var(--color-gold-dim)] p-6 sm:p-8 text-left rounded-2xl backdrop-blur-sm relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-gold)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative">
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[var(--color-ink-elev)] border border-[var(--color-ink-line)] flex items-center justify-center mb-5 sm:mb-6 group-hover:border-[var(--color-gold)] transition-colors">
                    <Icon className="w-5 h-5 text-[var(--color-gold)]" strokeWidth={1.5} />
                  </div>
                  <h3 className="font-display text-xl sm:text-2xl mb-2 sm:mb-3 text-[var(--color-cream)]">{feat.title}</h3>
                  <p className="text-sm text-[var(--color-cream-soft)] leading-relaxed mb-4 sm:mb-6">{feat.desc}</p>
                  <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] tracking-[0.12em] sm:tracking-[0.15em] uppercase text-[var(--color-gold)] opacity-70 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                    Open tool <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={2} />
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </section>

      <section className="relative z-10 border-t border-[var(--color-ink-line)] bg-[var(--color-ink-soft)]/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-24 text-center">
          <p className="text-[10px] sm:text-[11px] tracking-[0.15em] sm:tracking-[0.2em] uppercase text-[var(--color-gold)] mb-4 sm:mb-5">Trained on</p>
          <h3 className="font-display fluid-h3 mb-8 sm:mb-10 text-balance max-w-2xl mx-auto">
            All 14 major Indian laws, <span className="italic gold-gradient">at your fingertips.</span>
          </h3>
          <div className="flex flex-wrap gap-2 sm:gap-3 justify-center max-w-3xl mx-auto">
            {LAW_CHIPS.map((chip, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.03 }}
                className="px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm border border-[var(--color-ink-line)] text-[var(--color-cream-soft)] rounded-full bg-[var(--color-ink)]"
              >
                {chip}
              </motion.span>
            ))}
          </div>
        </div>
      </section>

      <section id="about" className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-32">
        <div className="grid md:grid-cols-5 gap-8 sm:gap-16">
          <div className="md:col-span-2">
            <p className="text-[10px] sm:text-[11px] tracking-[0.15em] sm:tracking-[0.2em] uppercase text-[var(--color-gold)] mb-4 sm:mb-5">Why AskVakeel</p>
            <h2 className="font-display fluid-h3 leading-[1.05] text-balance">
              Built for the <span className="italic gold-gradient">citizen,</span> not the lawyer.
            </h2>
          </div>
          <div className="md:col-span-3 space-y-5 sm:space-y-6 text-[var(--color-cream-soft)] leading-loose text-base sm:text-lg">
            <p>
              Most legal tools are built for lawyers charging ₹5,000 per consultation. AskVakeel is different. It's built for the 1.4 billion Indians who deserve to understand their rights without paying a fee.
            </p>
            <p>
              Trained on all 14 major Indian laws — from the new Bharatiya Nyaya Sanhita (BNS) replacing IPC, to the Constitution, Consumer Protection Act, Domestic Violence Act, POCSO, IT Act, Motor Vehicles Act, and more. Ask anything. Get instant, accurate answers.
            </p>
            <div className="pt-5 sm:pt-6 border-t border-[var(--color-ink-line)] flex items-start gap-3 text-xs sm:text-sm text-[var(--color-cream-muted)]">
              <span className="text-[var(--color-gold)] mt-0.5">⚠</span>
              <p>Legal information only — not legal advice. For specific matters, consult a qualified advocate. Your conversations are not stored.</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="relative z-10 border-t border-[var(--color-ink-line)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo />
          <div className="text-xs sm:text-sm text-[var(--color-cream-muted)] text-center">
            © 2026 · askvakeel.in · Free legal intelligence for India
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureView({ feature, onSend, onBack, input, setInput }: { feature: Feature; onSend: (q: string) => void; onBack: () => void; input: string; setInput: (v: string) => void }) {
  const Icon = feature.icon;

  return (
    <div className="noise min-h-screen relative overflow-hidden">
      <div className="ambient-glow" style={{ top: "-400px", left: "50%", transform: "translateX(-50%)" }}></div>

      <header className="relative z-20 border-b border-[var(--color-ink-line)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between">
          <button onClick={onBack}>
            <Logo />
          </button>
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 text-xs tracking-wider uppercase text-[var(--color-cream-muted)] hover:text-[var(--color-gold)] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.5} />
            Back
          </button>
        </div>
      </header>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[var(--color-ink-elev)] border border-[var(--color-gold-dim)] flex items-center justify-center mb-6 sm:mb-8">
            <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-[var(--color-gold)]" strokeWidth={1.5} />
          </div>

          <h1 className="font-display fluid-h2 mb-5 sm:mb-6 text-balance">
            {feature.title.split(" ").slice(0, -1).join(" ")}{" "}
            <span className="italic gold-gradient">{feature.title.split(" ").slice(-1)}</span>
          </h1>

          <p className="text-base sm:text-lg text-[var(--color-cream-soft)] max-w-2xl leading-relaxed mb-8 sm:mb-12">
            {feature.longDesc}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mb-8 sm:mb-12"
        >
          <form
            onSubmit={(e) => { e.preventDefault(); onSend(input); }}
            className="relative"
          >
            <div className="relative bg-[var(--color-ink-soft)] border border-[var(--color-ink-line)] focus-within:border-[var(--color-gold)] rounded-2xl transition-all shadow-2xl">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={feature.placeholder}
                className="w-full px-5 sm:px-7 py-4 sm:py-6 pr-14 sm:pr-16 bg-transparent outline-none text-base sm:text-lg placeholder:text-[var(--color-cream-muted)]"
                autoFocus
              />
              <button
                type="submit"
                disabled={!input.trim()}
                aria-label="Send"
                className="absolute right-2 sm:right-2.5 top-1/2 -translate-y-1/2 w-11 h-11 sm:w-12 sm:h-12 bg-gradient-to-br from-[var(--color-gold-bright)] to-[var(--color-gold)] text-[var(--color-ink)] rounded-xl flex items-center justify-center disabled:opacity-40 hover:opacity-90 transition-opacity"
              >
                <Send className="w-4 h-4" strokeWidth={2.5} />
              </button>
            </div>
          </form>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <p className="text-[10px] sm:text-[11px] tracking-[0.15em] sm:tracking-[0.2em] uppercase text-[var(--color-gold)] mb-4 sm:mb-5">Example questions</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3">
            {feature.suggestions.map((sug, i) => (
              <motion.button
                key={i}
                onClick={() => onSend(sug)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.4 + i * 0.05 }}
                className="group text-left p-4 sm:p-5 bg-[var(--color-ink-soft)]/60 border border-[var(--color-ink-line)] hover:border-[var(--color-gold-dim)] rounded-xl transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="text-[var(--color-cream-soft)] group-hover:text-[var(--color-cream)] text-sm leading-relaxed">
                    {sug}
                  </span>
                  <ArrowUpRight className="w-4 h-4 text-[var(--color-gold)] opacity-70 sm:opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function ChatView({ messages, loading, lastFir, onDownload, input, setInput, onSend, onHome, endRef, activeFeature }: {
  messages: Message[];
  loading: boolean;
  lastFir: string | null;
  onDownload: () => void;
  input: string;
  setInput: (v: string) => void;
  onSend: (q: string) => void;
  onHome: () => void;
  endRef: React.RefObject<HTMLDivElement | null>;
  activeFeature: Feature | null;
}) {
  return (
    <div className="noise min-h-screen relative">
      <div className="ambient-glow" style={{ top: "-400px", left: "50%", transform: "translateX(-50%)" }}></div>

      <header className="relative z-20 border-b border-[var(--color-ink-line)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between">
          <button onClick={onHome}>
            <Logo />
          </button>
          <div className="flex items-center gap-2">
            {activeFeature && (
              <div className="hidden md:block px-3 py-1.5 text-[10px] tracking-[0.15em] uppercase text-[var(--color-gold)] border border-[var(--color-gold-dim)] rounded-full">
                {activeFeature.title}
              </div>
            )}
            <button
              onClick={onHome}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 text-xs tracking-wider uppercase text-[var(--color-cream-muted)] hover:text-[var(--color-gold)] transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
              Clear
            </button>
          </div>
        </div>
      </header>

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 pb-40 sm:pb-40">
        <div className="space-y-8 sm:space-y-10">
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
              className="inline-flex items-center gap-2.5 px-5 sm:px-6 py-3 bg-gradient-to-br from-[var(--color-gold-bright)] to-[var(--color-gold)] text-[var(--color-ink)] rounded-xl hover:opacity-90 transition-opacity text-sm font-semibold"
            >
              <Download className="w-4 h-4" strokeWidth={2.5} />
              Download FIR as PDF
            </motion.button>
          )}
          <div ref={endRef} />
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-[var(--color-ink)] via-[var(--color-ink)] to-transparent pt-8 sm:pt-10 pb-safe z-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <form onSubmit={(e) => { e.preventDefault(); onSend(input); }} className="relative">
            <div className="relative bg-[var(--color-ink-soft)] border border-[var(--color-ink-line)] focus-within:border-[var(--color-gold)] rounded-2xl transition-all shadow-2xl">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a follow-up question..."
                className="w-full px-5 sm:px-6 py-4 sm:py-5 pr-12 sm:pr-14 bg-transparent outline-none text-base placeholder:text-[var(--color-cream-muted)]"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                aria-label="Send"
                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-gradient-to-br from-[var(--color-gold-bright)] to-[var(--color-gold)] text-[var(--color-ink)] rounded-lg flex items-center justify-center disabled:opacity-30 hover:opacity-90 transition-opacity"
              >
                <Send className="w-4 h-4" strokeWidth={2.5} />
              </button>
            </div>
          </form>
          <p className="text-center text-[9px] sm:text-[10px] tracking-[0.12em] sm:tracking-[0.15em] uppercase text-[var(--color-cream-muted)] mt-2 sm:mt-3">
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
        <div className="text-[9px] sm:text-[10px] tracking-[0.2em] sm:tracking-[0.25em] uppercase text-[var(--color-cream-muted)] mb-2 sm:mb-3 text-right">
          You
        </div>
        <div className="font-display text-base sm:text-xl leading-relaxed text-[var(--color-cream)] border-r-2 border-[var(--color-gold)] pr-4 sm:pr-5 text-right italic">
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
      <div className="flex items-center gap-2 mb-3 sm:mb-4">
        <Logo className="scale-90 sm:scale-75 origin-left" />
      </div>
      <div className="markdown">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {message.content}
        </ReactMarkdown>
      </div>
    </motion.div>
  );
}
