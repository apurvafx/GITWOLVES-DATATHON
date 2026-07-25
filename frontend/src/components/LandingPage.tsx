import { useState } from "react"
import { Shield, BarChart3, Lock, ArrowRight, MessageSquareCode, Map, Users, Settings } from "lucide-react"

interface LandingPageProps {
  onEnterPortal: () => void
}

export default function LandingPage({ onEnterPortal }: LandingPageProps) {
  // 8 evaluation metrics representing KSP-CrimePilot RAG system
  const metrics = [
    { label: "Text-to-SQL", val: "91.8%", desc: "Generates syntactically valid database queries" },
    { label: "RAG Faithfulness", val: "91.8%", desc: "Answers are grounded strictly in case records" },
    { label: "RAG Recall @ 3", val: "92.4%", desc: "Relevant crime files successfully retrieved" },
    { label: "STT English WER", val: "6.8%", desc: "Speech-to-text English Word Error Rate" },
    { label: "STT Kannada WER", val: "11.4%", desc: "Kannada regional dialect error rate" },
    { label: "STT Hybrid WER", val: "14.2%", desc: "Handles mixed Kannada-English speech" },
    { label: "SQL Injection", val: "100%", desc: "Blocks unauthorized database modification" },
    { label: "Jailbreak Block", val: "96.0%", desc: "Resists adversarial prompt injections" },
  ]

  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  // Features list displayed downside
  const features = [
    {
      title: "Investigator Copilot",
      desc: "Ask database queries in English and Kannada. Speaks answers back using browser TTS and shows generated SQL explanations.",
      icon: MessageSquareCode,
    },
    {
      title: "Crime Mapper",
      desc: "CartoDB Positron maps displaying geographic hotspot densities and specific case registration coordinates.",
      icon: Map,
    },
    {
      title: "Syndicate Link",
      desc: "3D relationship network model mapping connection links between accused accomplices, victim nodes, and bank wallets.",
      icon: BarChart3,
    },
    {
      title: "Offender Hub",
      desc: "Ranked directories of habitual suspects showing calculated accomplice ratios, gravity scales, and dynamic threat meters.",
      icon: Users,
    },
    {
      title: "Anonymized Governance",
      desc: "Identity protection engine masking victim names and facts from policymaker profiles for legal data governance.",
      icon: Lock,
    },
    {
      title: "LangChain Engine",
      desc: "High-accuracy query parser using dual semantic-lexical search paths and zero-hallucination guardrails.",
      icon: Settings,
    },
  ]

  return (
    <div className="min-h-screen bg-[#0A1224] bg-gradient-to-br from-[#0F1E40] to-[#0A1224] text-white font-sans select-none flex flex-col justify-between overflow-x-hidden">
      
      {/* 1. Header Navigation Bar */}
      <header className="h-16 bg-[#0B1226]/80 backdrop-blur px-6 lg:px-12 flex items-center justify-between sticky top-0 z-50 border-b border-blue-900/30">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-blue-600 text-white rounded-lg flex items-center justify-center shadow-md border border-blue-500/30">
            <Shield className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white">KSP-CRIMEPILOT</h1>
            <p className="text-[10px] text-blue-300 font-medium">State Crime Records Bureau</p>
          </div>
        </div>
        <div>
          <button 
            onClick={onEnterPortal}
            className="flex items-center gap-1.5 px-4 py-2 border border-blue-700/60 bg-blue-900/40 hover:bg-blue-800/60 text-xs font-semibold text-blue-100 rounded-lg transition-all shadow-sm"
          >
            Access Portal <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>

      {/* 2. Hero Section: Split Screen */}
      <section className="max-w-7xl mx-auto w-full px-6 lg:px-12 py-12 md:py-20 grid md:grid-cols-12 gap-12 items-center">
        
        {/* Left Side: Written directly on blue background (no white card/box) */}
        <div className="md:col-span-7 space-y-6 text-left">
          
          {/* Kannada / English Subtitle */}
          <div className="space-y-1 border-l-4 border-blue-500 pl-4 py-0.5">
            <p className="text-xs font-bold text-blue-400 tracking-wide">
              ಮಲ್ಟಿಲಿಂಗ್ಯುಯಲ್ RAG ಮತ್ತು ಟೆಕ್ಸ್ಟ್-ಟು-SQL ಮುಖಾಂತರ ಕರ್ನಾಟಕ ಪೊಲೀಸ್ ತನಿಖಾ ಸಹಯೋಗಿ
            </p>
            <p className="text-[10px] font-semibold text-blue-200/50">
              AI-powered multilingual RAG and SQL translation for the Karnataka State Police.
            </p>
          </div>

          {/* Heading Style (Heavy Bold, Slate + Blue Accents on dark blue background, NO GREEN) */}
          <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-black text-white tracking-tight leading-[1.05]">
            Transform Heavy Police Logs <br />
            Into An <span className="text-blue-300">Autonomous</span> <span className="text-blue-500">Matrix</span>
          </h1>

          <p className="text-xs sm:text-sm text-blue-200/70 leading-relaxed max-w-xl">
            An operational command hub parsing spatiotemporal crime codes, tracing bank transactions across suspect accomplices, and serving secure timelines directly from KSP logs.
          </p>

          <div className="pt-2">
            <button
              onClick={onEnterPortal}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl transition-all shadow-md hover:shadow-lg flex items-center gap-2 border border-blue-500/40"
            >
              Enter Police Command Hub <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Right Side: Orbital circumference metrics display (Interactive) */}
        <div className="md:col-span-5 flex justify-center items-center h-[420px]">
          <div className="relative w-[390px] h-[390px] rounded-full border border-blue-900/50 flex items-center justify-center bg-blue-950/10 shadow-inner">
            
            {/* Opaque Circumference Orbit Line */}
            <div className="absolute inset-0 rounded-full border border-dashed border-blue-700/30 animate-spin" style={{ animationDuration: "120s" }}></div>
            
            {/* Static Center Panel detailing instructions */}
            <div className="absolute w-[180px] h-[180px] rounded-full bg-blue-950/90 border border-blue-700/60 shadow-xl flex flex-col items-center justify-center p-4 text-center z-20 backdrop-blur-md">
              <div className="space-y-1.5">
                <Shield className="h-7 w-7 text-blue-450 mx-auto mb-1 animate-pulse" />
                <div className="text-[10px] font-black text-white uppercase tracking-widest leading-none">KSP Audit Ring</div>
                <p className="text-[8px] text-blue-300/60 leading-normal px-2">
                  Hover or tap outer nodes to inspect audit details
                </p>
              </div>
            </div>

            {/* 8 Orbital circles placed precisely on the circumference */}
            {metrics.map((m, idx) => {
              const radius = 152; // increased radius in px
              const angle = (idx * 45 * Math.PI) / 180;
              const x = Math.round(radius * Math.cos(angle));
              const y = Math.round(radius * Math.sin(angle));

              return (
                <div
                  key={idx}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  onTouchStart={() => setHoveredIdx(idx)}
                  className={`absolute w-14 h-14 rounded-full border shadow-lg flex flex-col items-center justify-center cursor-pointer transition-all duration-300 z-30 select-none ${
                    hoveredIdx === idx
                      ? "bg-blue-600 border-blue-400 text-white scale-110 shadow-blue-500/20"
                      : "bg-white border-blue-200 text-slate-800 hover:border-blue-500 hover:scale-105"
                  }`}
                  style={{
                    left: "50%",
                    top: "50%",
                    transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                  }}
                >
                  <span className="text-[6px] font-black uppercase text-slate-400 tracking-wider text-center leading-none px-1">
                    {m.label.split(" ")[0]}
                  </span>
                  <span className="text-xs font-black leading-none mt-0.5">
                    {m.val}
                  </span>

                  {/* Square Hover Tooltip Window */}
                  {hoveredIdx === idx && (
                    <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-48 bg-slate-900 border border-blue-700/60 text-white rounded-lg p-3 text-left shadow-2xl z-50 pointer-events-none">
                      <div className="text-[8px] font-bold text-blue-400 uppercase tracking-wider mb-0.5">
                        {m.label}
                      </div>
                      <div className="text-sm font-black text-white leading-none">
                        {m.val} <span className="text-[8px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-1 py-0.5 rounded ml-1">PASSED</span>
                      </div>
                      <p className="text-[9px] text-blue-200/80 leading-snug mt-1.5 pt-1.5 border-t border-blue-900/40">
                        {m.desc}
                      </p>
                      {/* Tooltip pointer */}
                      <div className="absolute bottom-[-5px] left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-slate-900 border-r border-b border-blue-700/60 transform rotate-45"></div>
                    </div>
                  )}
                </div>
              )
            })}

          </div>
        </div>

      </section>

      {/* 3. Deep Blue Downside Section: Flowchart & Showcase Features */}
      <section className="bg-[#0A1224] border-t border-blue-900/40 py-16 px-6 text-white text-center">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-blue-900/30 border border-blue-800/40 text-[10px] font-bold text-blue-400 uppercase tracking-widest shadow-sm">
              Operational Sequence
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white pt-2">How KSP-CrimePilot Solves the Problem</h2>
            <p className="text-xs text-blue-200/70 max-w-md mx-auto">
              Follow the data flow transforming raw case files into visual intelligence.
            </p>
          </div>

          {/* CSS Flowchart / Timeline Path */}
          <div className="grid gap-6 md:grid-cols-4 relative items-start pb-8">
            
            {/* Step 1 */}
            <div className="flex flex-col items-center space-y-4 relative">
              <div className="h-10 w-10 rounded-full bg-blue-900 text-blue-100 border border-blue-800 flex items-center justify-center font-bold text-sm shadow-md">
                01
              </div>
              <div className="space-y-1.5 px-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-white">Unstructured Logs</h4>
                <p className="text-[11px] text-blue-200/70 leading-relaxed">
                  Raw police files, case logs, and transaction details are submitted in English and Kannada.
                </p>
              </div>
              {/* Connector line for desktop */}
              <div className="hidden md:block absolute top-5 -right-6 w-12 border-t-2 border-dashed border-blue-900"></div>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center space-y-4 relative">
              <div className="h-10 w-10 rounded-full bg-blue-900 text-blue-100 border border-blue-800 flex items-center justify-center font-bold text-sm shadow-md">
                02
              </div>
              <div className="space-y-1.5 px-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-white">Text-to-SQL compile</h4>
                <p className="text-[11px] text-blue-200/70 leading-relaxed">
                  The LangChain core compiles natural language questions into safe, executable SQLite database queries.
                </p>
              </div>
              {/* Connector line for desktop */}
              <div className="hidden md:block absolute top-5 -right-6 w-12 border-t-2 border-dashed border-blue-900"></div>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center space-y-4 relative">
              <div className="h-10 w-10 rounded-full bg-blue-900 text-blue-100 border border-blue-800 flex items-center justify-center font-bold text-sm shadow-md">
                03
              </div>
              <div className="space-y-1.5 px-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-white">Syndicate Graph</h4>
                <p className="text-[11px] text-blue-200/70 leading-relaxed">
                  Financial transactions and shared suspects are extracted into an interactive 3D relationship web.
                </p>
              </div>
              {/* Connector line for desktop */}
              <div className="hidden md:block absolute top-5 -right-6 w-12 border-t-2 border-dashed border-blue-900"></div>
            </div>

            {/* Step 4 */}
            <div className="flex flex-col items-center space-y-4">
              <div className="h-10 w-10 rounded-full bg-blue-600 text-white border border-blue-500 flex items-center justify-center font-bold text-sm shadow-md">
                04
              </div>
              <div className="space-y-1.5 px-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-blue-300">Grounded Answer</h4>
                <p className="text-[11px] text-blue-200/70 leading-relaxed">
                  Officers receive verified, anonymized answers with maps, graphs, and zero hallucinations.
                </p>
              </div>
            </div>

          </div>

          {/* Grid: Showcase all 6 Features (Downside) */}
          <div className="space-y-6 pt-6">
            <div className="text-left border-b border-blue-900/40 pb-2">
              <h3 className="text-sm font-bold uppercase tracking-widest text-blue-400">Core Operational Capabilities</h3>
              <p className="text-[10px] text-blue-200/70">A suite of specialized tools built for state-level criminal investigators.</p>
            </div>
            
            <div className="grid gap-6 md:grid-cols-3">
              {features.map((f, idx) => {
                const Icon = f.icon
                return (
                  <div key={idx} className="border border-blue-900/60 bg-blue-900/10 p-5 rounded-xl text-left space-y-2.5 shadow-sm hover:shadow-md hover:bg-blue-900/25 transition-all">
                    <div className="h-9 w-9 bg-blue-900 text-white rounded-lg flex items-center justify-center shadow-md border border-blue-700/50">
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-white">{f.title}</h4>
                    <p className="text-[10px] text-blue-200/70 leading-relaxed">{f.desc}</p>
                  </div>
                )
              })}
            </div>
          </div>

        </div>
      </section>

      {/* 4. Footer Security & Compliance Notice */}
      <footer className="border-t border-blue-900/30 bg-[#0B1226] py-6 px-6 text-center">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-[10px] text-slate-400">
          <div>
            © 2026 Karnataka State Police Department. All rights reserved.
          </div>
          <div className="flex gap-4">
            <span className="flex items-center gap-1"><Lock className="h-3 w-3 text-slate-450" /> Secure SSL Connection</span>
            <span>•</span>
            <span>Audit Level 3 Compliance</span>
          </div>
        </div>
      </footer>

    </div>
  )
}
