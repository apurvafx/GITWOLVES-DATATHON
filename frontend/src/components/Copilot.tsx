import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  MessageSquare, Send, Mic, MicOff, Volume2, VolumeX, Code, 
  Clock, Database, Download, Plus, Trash2 
} from "lucide-react"
import { API_BASE_URL } from "@/config"

interface Message {
  role: "user" | "assistant"
  content: string
  sql_query?: string
  explanation?: string
  data?: any[]
  latency?: number
}

interface ChatSession {
  id: string
  title: string
  date: string
  messages: Message[]
}

// Browser WebSpeech API recognition definition
let recognition: any = null
if (typeof window !== "undefined") {
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  if (SpeechRecognition) {
    recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = false
  }
}

export default function Copilot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello Officer! I am KSP-CrimePilot. I can query our FIR database and track transaction flows locally in English and Kannada. How can I assist you?",
      explanation: "Greeting message initialized locally.",
      latency: 0,
    }
  ])
  const [input, setInput] = useState("")
  const [language, setLanguage] = useState<"English" | "Kannada">("English")
  const [ttsEnabled, setTtsEnabled] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [loading, setLoading] = useState(false)
  
  // Chat history sessions
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string>("")

  // XAI Drawer state
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(true)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Select the latest assistant message for XAI drawer automatically
  useEffect(() => {
    const assistantMsgs = messages.filter(m => m.role === "assistant")
    if (assistantMsgs.length > 0) {
      setSelectedMessage(assistantMsgs[assistantMsgs.length - 1])
    }
  }, [messages])

  // Load sessions from localStorage on component mount
  useEffect(() => {
    const saved = localStorage.getItem("ksp_copilot_sessions")
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setSessions(parsed)
        if (parsed.length > 0) {
          setCurrentSessionId(parsed[0].id)
          setMessages(parsed[0].messages)
        } else {
          const defaultId = "session_" + Date.now()
          setCurrentSessionId(defaultId)
        }
      } catch (e) {
        console.error("Failed to load local chat sessions", e)
      }
    } else {
      const defaultId = "session_" + Date.now()
      setCurrentSessionId(defaultId)
    }
  }, [])

  // Save current session to localStorage when messages change
  useEffect(() => {
    if (!currentSessionId) return
    if (messages.length <= 1 && sessions.length === 0) return

    const sessionTitle = messages.length > 1 
      ? (messages[1].content.slice(0, 24) + (messages[1].content.length > 24 ? "..." : ""))
      : "New Case Inquiry"

    setSessions(prev => {
      const existsIdx = prev.findIndex(s => s.id === currentSessionId)
      let updated = [...prev]

      const newSession: ChatSession = {
        id: currentSessionId,
        title: sessionTitle,
        date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        messages: messages
      }

      if (existsIdx >= 0) {
        updated[existsIdx] = newSession
      } else {
        updated.unshift(newSession)
      }

      localStorage.setItem("ksp_copilot_sessions", JSON.stringify(updated))
      return updated
    })
  }, [messages, currentSessionId])

  // Setup WebSpeech recognition handlers
  useEffect(() => {
    if (!recognition) return

    recognition.onstart = () => {
      setIsListening(true)
    }

    recognition.onerror = (e: any) => {
      console.error("Speech recognition error:", e)
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      setInput(transcript)
    }
  }, [])

  const startListening = () => {
    if (!recognition) {
      alert("Browser speech recognition is not supported in this browser. Please use Chrome or Edge.")
      return
    }
    recognition.lang = language === "Kannada" ? "kn-IN" : "en-US"
    try {
      recognition.start()
    } catch (e) {
      recognition.stop()
    }
  }

  const stopListening = () => {
    if (recognition) {
      recognition.stop()
    }
  }

  const speakText = (text: string) => {
    if (!ttsEnabled || typeof window === "undefined") return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = language === "Kannada" ? "kn-IN" : "en-US"
    window.speechSynthesis.speak(utterance)
  }

  // Handle New Chat Inquiry Session
  const handleNewChat = () => {
    const newId = "session_" + Date.now()
    setCurrentSessionId(newId)
    setMessages([
      {
        role: "assistant",
        content: "Hello Officer! I am KSP-CrimePilot. I can query our FIR database and track transaction flows locally in English and Kannada. How can I assist you?",
        explanation: "Greeting message initialized locally.",
        latency: 0,
      }
    ])
  }

  // Handle Selecting a Past Chat Session
  const handleSelectSession = (id: string) => {
    const session = sessions.find(s => s.id === id)
    if (session) {
      setCurrentSessionId(id)
      setMessages(session.messages)
    }
  }

  // Handle Deleting a Session
  const handleDeleteSession = (id: string, e: any) => {
    e.stopPropagation()
    const updated = sessions.filter(s => s.id !== id)
    setSessions(updated)
    localStorage.setItem("ksp_copilot_sessions", JSON.stringify(updated))
    if (currentSessionId === id) {
      handleNewChat()
    }
  }

  // Submit Text Query
  const handleSubmit = async (e: any) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const queryText = input
    const userMsg: Message = {
      role: "user",
      content: queryText
    }

    setMessages(prev => [...prev, userMsg])
    setInput("")
    setLoading(true)

    const startTime = performance.now()

    try {
      const token = localStorage.getItem("ksp_user_token")
      const historyPayload = messages.map(m => ({
        role: m.role,
        content: m.content
      }))

      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          message: queryText,
          language: language,
          history: historyPayload
        })
      })

      if (!response.ok) {
        throw new Error("Chat gateway returned an error response.")
      }

      const data = await response.json()
      const latencyMs = Math.round(performance.now() - startTime)

      const assistantMsg: Message = {
        role: "assistant",
        content: data.response,
        sql_query: data.sql_query,
        explanation: data.explanation,
        data: data.data,
        latency: latencyMs
      }

      setMessages(prev => [...prev, assistantMsg])
      speakText(data.response)

    } catch (err: any) {
      const latencyMs = Math.round(performance.now() - startTime)
      const errorMsg: Message = {
        role: "assistant",
        content: "Error: KSP API Gateway failed to process this query. Please check your network link.",
        explanation: "API Connection Timeout",
        sql_query: "",
        latency: latencyMs
      }
      setMessages(prev => [...prev, errorMsg])
    } finally {
      setLoading(false)
    }
  }

  const handleExportPdf = () => {
    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    const dateStr = new Date().toLocaleString()
    const officerRole = localStorage.getItem("ksp_user_role") || "Investigating Officer"

    const htmlContent = `
      <html>
      <head>
        <title>KSP Case Query Audit Report</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 40px; color: #0F172A; background-color: #FFFFFF; }
          .header { border-bottom: 2px solid #1E3A8A; padding-bottom: 20px; margin-bottom: 30px; display: flex; align-items: center; justify-content: space-between; }
          .header-title { font-size: 20px; font-weight: 850; color: #1E3A8A; text-transform: uppercase; letter-spacing: 1px; }
          .meta { font-size: 11px; text-transform: uppercase; color: #64748B; font-weight: 600; text-align: right; line-height: 1.5; }
          .section-title { font-size: 13px; font-weight: 850; text-transform: uppercase; color: #475569; margin-top: 30px; margin-bottom: 15px; border-bottom: 1px solid #E2E8F0; padding-bottom: 5px; }
          .message-card { border: 1px solid #E2E8F0; border-radius: 8px; padding: 15px; margin-bottom: 15px; background-color: #F8FAFC; page-break-inside: avoid; }
          .msg-meta { font-size: 10px; font-weight: 800; text-transform: uppercase; margin-bottom: 8px; display: flex; justify-content: space-between; }
          .role-user { color: #2563EB; }
          .role-assistant { color: #1E3A8A; }
          .msg-content { font-size: 12px; line-height: 1.6; font-weight: 500; }
          .sql-box { font-family: 'Courier New', Courier, monospace; background-color: #0F172A; color: #38BDF8; padding: 10px; border-radius: 6px; font-size: 11px; margin-top: 10px; word-break: break-all; white-space: pre-wrap; }
          .footer { border-top: 1px solid #E2E8F0; margin-top: 50px; padding-top: 15px; text-align: center; font-size: 10px; color: #94A3B8; font-weight: 600; text-transform: uppercase; }
          @media print {
            body { padding: 20px; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="header-title">Karnataka State Police</div>
            <div style="font-size: 12px; font-weight: 700; color: #475569; margin-top: 2px;">Investigator Copilot Query Audit Report</div>
          </div>
          <div class="meta">
            Report Generated: ${dateStr}<br/>
            Operator Role: ${officerRole}<br/>
            Security Level: Confidential
          </div>
        </div>

        <div class="section-title">Copilot Conversation Session Log</div>
        
        ${messages.map((m, idx) => `
          <div class="message-card">
            <div class="msg-meta">
              <span class="${m.role === 'user' ? 'role-user' : 'role-assistant'}">${m.role.toUpperCase()} MESSAGE</span>
              <span>STEP ${idx + 1}</span>
            </div>
            <div class="msg-content">${m.content}</div>
            ${m.sql_query ? `
              <div style="font-size: 10px; font-weight: 800; color: #64748B; margin-top: 12px; text-transform: uppercase;">Compiled Database SQL SELECT Statement</div>
              <div class="sql-box">${m.sql_query}</div>
            ` : ""}
          </div>
        `).join("")}

        <div class="footer">
          End of Transcript Report • Karnataka Police Digital Transformation Cell
        </div>
      </body>
      </html>
    `

    printWindow.document.write(htmlContent)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 500)
  }

  const suggestions = language === "English" ? [
    "How many cases in Bengaluru?",
    "Who is the accused in case 104430006202600001?",
    "Suresh Hegde wallet money funneled amount",
    "accused profile suresh hegde"
  ] : [
    "ಬೆಂಗಳೂರು ಜಿಲ್ಲೆಯಲ್ಲಿ ಎಷ್ಟು ಪ್ರಕರಣಗಳು ದಾಖಲಾಗಿವೆ?",
    "ಪ್ರಕರಣ 104430006202600001 ಆರೋಪಿ ಯಾರು?",
    "ಸುರೇಶ್ ಹೆಗ್ಡೆ ವಾಲೆಟ್‌ಗೆ ಎಷ್ಟು ಹಣ ವರ್ಗಾವಣೆಯಾಗಿದೆ?",
    "ಸುರೇಶ್ ಹೆಗ್ಡೆ ಪ್ರೊಫೈಲ್ ಏನು?"
  ]

  return (
    <div className="flex h-[calc(100vh-100px)] w-full gap-6 select-none font-sans overflow-hidden">
      
      {/* LEFT COLUMN: CHAT INQUIRY HISTORY SIDEBAR */}
      <div className="hidden md:flex w-64 border border-blue-100 rounded-xl flex-col p-4 bg-white shrink-0 overflow-y-auto shadow-sm">
        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 border-b border-blue-50 pb-2 flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" />
          Case History
        </h4>
        
        {/* New Chat Button */}
        <button
          onClick={handleNewChat}
          className="w-full text-xs font-black uppercase text-white bg-blue-900 hover:bg-blue-950 p-2.5 rounded-lg shadow-sm transition-all text-center mb-4 flex items-center justify-center gap-1.5"
        >
          <Plus className="h-4 w-4" />
          New Inquiry
        </button>

        {/* Sessions Feed */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {sessions.length === 0 ? (
            <div className="text-center py-6 text-[10px] text-slate-400 font-medium">No previous history.</div>
          ) : (
            sessions.map(s => (
              <div
                key={s.id}
                onClick={() => handleSelectSession(s.id)}
                className={`group p-2.5 rounded-lg border cursor-pointer flex justify-between items-center transition-all ${
                  currentSessionId === s.id
                    ? "bg-blue-50/40 border-blue-200 text-blue-900 shadow-xs"
                    : "border-slate-100 hover:bg-slate-50 text-slate-700"
                }`}
              >
                <div className="flex flex-col min-w-0 pr-2">
                  <span className="text-xs font-bold truncate">{s.title}</span>
                  <span className="text-[8px] text-slate-400 font-semibold">{s.date}</span>
                </div>
                
                {/* Delete Button */}
                <button
                  onClick={(e) => handleDeleteSession(s.id, e)}
                  className="hidden group-hover:block p-1 hover:bg-red-50 text-red-500 rounded transition-colors"
                  title="Delete Session"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: MAIN CHAT AREA PANEL */}
      <div className="flex-1 flex flex-col bg-white border border-blue-100 rounded-xl overflow-hidden shadow-sm">
        
        {/* Chat Panel Header */}
        <div className="px-6 py-4 border-b border-blue-100 flex items-center justify-between bg-blue-50/10">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 bg-blue-100 text-blue-900 rounded-lg flex items-center justify-center border border-blue-200">
              <MessageSquare className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Investigator Copilot</h3>
              <p className="text-[10px] text-slate-400 font-medium">Bilingual Natural Language SQL Core</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Selection Toggle */}
            <select
              value={language}
              onChange={(e: any) => setLanguage(e.target.value)}
              className="text-xs font-semibold border border-blue-100 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus-visible:ring-blue-900 focus-visible:border-blue-900 cursor-pointer"
            >
              <option value="English">English</option>
              <option value="Kannada">ಕನ್ನಡ (Kannada)</option>
            </select>

            {/* Export PDF Button */}
            <button
              onClick={handleExportPdf}
              className="p-1.5 rounded-lg border bg-white border-blue-100 text-slate-500 hover:text-blue-950 hover:bg-slate-50 transition-all flex items-center gap-1.5"
              title="Export Conversation Log as Official PDF Report"
            >
              <Download className="h-4 w-4" />
              <span className="text-[10px] font-black uppercase tracking-wider pr-1 hidden md:inline">Export PDF</span>
            </button>

            {/* TTS Toggle */}
            <button
              onClick={() => setTtsEnabled(!ttsEnabled)}
              className={`p-1.5 rounded-lg border transition-all ${
                ttsEnabled 
                  ? "bg-blue-100 border-blue-200 text-blue-900" 
                  : "bg-white border-blue-100 text-slate-400 hover:text-slate-600"
              }`}
              title="Toggle Text-to-Speech Response Readout"
            >
              {ttsEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </button>

            {/* XAI Toggle */}
            <button
              onClick={() => setDrawerOpen(!drawerOpen)}
              className={`p-1.5 rounded-lg border transition-all ${
                drawerOpen 
                  ? "bg-blue-900 border-blue-900 text-white" 
                  : "bg-white border-blue-100 text-slate-500 hover:text-slate-800"
              }`}
              title="Toggle Explainable SQL Audit Drawer"
            >
              <Code className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Chat Feed */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
          {messages.map((m, idx) => (
            <div 
              key={idx} 
              onClick={() => {
                if (m.role === "assistant") setSelectedMessage(m)
              }}
              className={`flex flex-col max-w-[85%] ${
                m.role === "user" ? "ml-auto items-end" : "mr-auto items-start"
              } cursor-pointer group`}
            >
              <div className={`p-3 rounded-xl border text-xs font-semibold leading-relaxed shadow-xs ${
                m.role === "user" 
                  ? "bg-blue-900 border-blue-900 text-white rounded-tr-none" 
                  : "bg-white border-blue-50 text-slate-800 rounded-tl-none hover:border-blue-150 transition-colors"
              }`}>
                {m.content}
              </div>
              
              <div className="mt-1 flex items-center gap-2 text-[9px] font-bold text-slate-400 uppercase tracking-wider px-1">
                <span>{m.role}</span>
                {m.latency !== undefined && (
                  <span>• {m.latency}ms</span>
                )}
                {m.role === "assistant" && m.sql_query && (
                  <span className="text-blue-900 font-extrabold flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Database className="h-2.5 w-2.5" /> Explain SQL
                  </span>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Queries */}
        {messages.length === 1 && (
          <div className="px-6 py-3 border-t border-slate-100 bg-white">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-2">Suggested Investigations:</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => setInput(s)}
                  className="text-[10px] font-bold text-slate-600 bg-slate-50 hover:bg-blue-50 hover:text-blue-900 border border-slate-200 hover:border-blue-200 px-2.5 py-1 rounded-lg transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Bar */}
        <div className="p-4 border-t border-blue-100 bg-white">
          <form onSubmit={handleSubmit} className="flex gap-2 items-center">
            
            <button
              type="button"
              onClick={isListening ? stopListening : startListening}
              className={`p-2.5 rounded-lg border transition-all ${
                isListening 
                  ? "bg-red-500 border-red-500 text-white animate-pulse" 
                  : "bg-slate-50 border-blue-100 text-slate-500 hover:text-slate-800"
              }`}
              title="Voice transcription (English/Kannada)"
            >
              {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </button>

            <Input
              value={input}
              onChange={(e: any) => setInput(e.target.value)}
              placeholder={language === "English" ? "Ask copilot to search database files..." : "ಪ್ರಕರಣದ ಫೈಲ್ ಮಾಹಿತಿ ಕೇಳಿ..."}
              disabled={loading}
              className="flex-1 h-10 border-blue-100 text-xs focus-visible:ring-blue-900 focus-visible:border-blue-900"
            />
            
            <Button 
              type="submit" 
              disabled={loading || !input.trim()}
              className="bg-blue-900 hover:bg-blue-950 text-white h-10 px-4 rounded-lg flex items-center justify-center"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </div>

      </div>

      {/* 3. EXPLAINABLE AI (XAI) DRAWER PANEL */}
      {drawerOpen && selectedMessage && (
        <div className="w-[340px] border border-blue-100 rounded-xl flex flex-col bg-white overflow-hidden shadow-sm shrink-0">
          <div className="px-5 py-4 border-b border-blue-100 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-blue-900" />
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">Explainable SQL Audit</h4>
            </div>
            <button
              onClick={() => setDrawerOpen(false)}
              className="text-[9px] font-black text-slate-400 hover:text-slate-600 uppercase"
            >
              Hide
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            
            {/* Logic Explanation */}
            <div className="space-y-1.5">
              <div className="text-[9px] font-black text-slate-450 uppercase tracking-wider">Natural Language Interpretation</div>
              <p className="text-xs text-slate-700 leading-relaxed font-semibold bg-slate-50 p-3 rounded-lg border border-slate-100/50">
                {selectedMessage.explanation || "No interpreter log for this query."}
              </p>
            </div>

            {/* SQL Query Compiled */}
            {selectedMessage.sql_query && (
              <div className="space-y-1.5">
                <div className="text-[9px] font-black text-slate-455 uppercase tracking-wider">Compiled SQL SELECT Statement</div>
                <pre className="text-[10px] font-mono bg-slate-950 text-sky-400 p-3.5 rounded-lg border border-slate-900 overflow-x-auto whitespace-pre-wrap break-all leading-normal">
                  {selectedMessage.sql_query}
                </pre>
              </div>
            )}

            {/* SQLite Table Records Returned */}
            {selectedMessage.data && selectedMessage.data.length > 0 && (
              <div className="space-y-2">
                <div className="text-[9px] font-black text-slate-450 uppercase tracking-wider">Database Records Found ({selectedMessage.data.length})</div>
                <div className="border border-slate-100 rounded-lg overflow-hidden">
                  <table className="w-full text-[10px] text-left">
                    <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[8px] font-bold border-b border-slate-100">
                      <tr>
                        {Object.keys(selectedMessage.data[0]).map((key, i) => (
                          <th key={i} className="px-3 py-2 font-black">{key}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                      {selectedMessage.data.slice(0, 3).map((row, i) => (
                        <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                          {Object.values(row).map((val: any, j) => (
                            <td key={j} className="px-3 py-2 truncate max-w-[120px]">{String(val)}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {selectedMessage.data.length > 3 && (
                    <div className="p-2 text-center text-[9px] font-bold text-slate-400 bg-slate-50/45 border-t border-slate-100 uppercase">
                      + {selectedMessage.data.length - 3} more records found
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  )
}

// Simple loader helper since lucide-react loader2 might check differently
function Loader2({ className }: { className?: string }) {
  return (
    <div className={`h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent ${className}`} />
  )
}
