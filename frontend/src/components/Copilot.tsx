import { useState, useEffect, useRef } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  MessageSquare, Send, Mic, MicOff, Volume2, VolumeX, Code, 
  Clock, Database, AlertCircle, HelpCircle, ChevronRight 
} from "lucide-react"

interface Message {
  role: "user" | "assistant"
  content: string
  sql_query?: string
  explanation?: string
  data?: any[]
  latency?: number
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

  const handleSend = async (textToSend?: string) => {
    const queryText = (textToSend || input).trim()
    if (!queryText) return

    // Add user message
    const userMsg: Message = { role: "user", content: queryText }
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

      const response = await fetch("http://127.0.0.1:8000/api/chat/", {
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
      
      {/* 1. MAIN CHAT AREA PANEL */}
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
              {/* Sender label */}
              <span className="text-[9px] font-bold text-slate-400 mb-1 px-1 uppercase tracking-wider">
                {m.role === "user" ? "Officer Query" : "KSP Copilot"}
              </span>

              {/* Message Bubble */}
              <div className={`p-3.5 rounded-2xl text-xs leading-relaxed shadow-sm transition-all border ${
                m.role === "user"
                  ? "bg-blue-900 border-blue-900 text-white rounded-tr-none"
                  : "bg-white border-blue-100 text-slate-800 rounded-tl-none hover:border-blue-300"
              }`}>
                {m.content}
              </div>

              {/* Audit quick pill */}
              {m.role === "assistant" && m.sql_query && (
                <span className="text-[9px] font-semibold text-blue-800 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full mt-1.5 flex items-center gap-1">
                  <Code className="h-2.5 w-2.5" /> Click bubble to audit SQL
                </span>
              )}
            </div>
          ))}

          {loading && (
            <div className="mr-auto flex items-center gap-2.5 p-3.5 bg-white border border-blue-100 rounded-2xl rounded-tl-none shadow-sm max-w-[200px]">
              <div className="h-2 w-2 bg-blue-900 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
              <div className="h-2 w-2 bg-blue-900 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
              <div className="h-2 w-2 bg-blue-900 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
              <span className="text-[10px] font-medium text-slate-400">Compiling SQL...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Dynamic Suggestion Pills */}
        {messages.length === 1 && (
          <div className="px-6 py-3 border-t border-blue-50 bg-blue-50/5 flex flex-wrap gap-2">
            {suggestions.map((s, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(s)}
                className="text-[10px] font-semibold text-blue-900 bg-blue-50/50 hover:bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-full transition-all flex items-center gap-1"
              >
                {s} <ChevronRight className="h-3 w-3" />
              </button>
            ))}
          </div>
        )}

        {/* Input Bar Section */}
        <div className="p-4 border-t border-blue-100 flex items-center gap-2 bg-white">
          {/* Voice Input Mic */}
          <button
            type="button"
            onClick={isListening ? stopListening : startListening}
            className={`p-2.5 rounded-xl border transition-all ${
              isListening
                ? "bg-red-500 border-red-500 text-white animate-pulse"
                : "bg-blue-50 border-blue-100 text-blue-900 hover:bg-blue-100"
            }`}
            title="Speech Recognition Query"
          >
            {isListening ? <MicOff className="h-4.5 w-4.5" /> : <Mic className="h-4.5 w-4.5" />}
          </button>

          {/* Text Input */}
          <Input
            value={input}
            onChange={(e: any) => setInput(e.target.value)}
            placeholder={isListening ? "Listening... speak now..." : "Ask KSP-CrimePilot..."}
            onKeyDown={(e: any) => e.key === "Enter" && handleSend()}
            disabled={loading}
            className="flex-1 h-10 border-blue-100 text-xs focus-visible:ring-blue-900 focus-visible:border-blue-900"
          />

          {/* Send Button */}
          <Button
            onClick={() => handleSend()}
            disabled={loading}
            className="h-10 bg-blue-900 text-white hover:bg-blue-800 rounded-xl px-4 flex items-center justify-center gap-1.5 shadow-sm"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

      </div>

      {/* 2. EXPLAINABLE AI (XAI) DRAWER OVERLAY */}
      {drawerOpen && (
        <Card className="w-[380px] border border-blue-100 bg-white shadow-md rounded-xl flex flex-col overflow-hidden animate-slideIn">
          <CardHeader className="px-5 py-4 border-b border-blue-50 bg-blue-50/10 flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-xs font-black text-slate-900 uppercase tracking-wider">Explainable AI Audit</CardTitle>
              <CardDescription className="text-[10px] text-slate-400 font-medium">Text-to-SQL query compilation pipeline</CardDescription>
            </div>
            <Code className="h-4.5 w-4.5 text-blue-900" />
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-5 space-y-5">
            {selectedMessage ? (
              <div className="space-y-4">
                
                {/* 1. SQL Code Block */}
                <div className="space-y-2">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                    <Database className="h-3.5 w-3.5 text-slate-600" /> Generated SQL Statement
                  </span>
                  {selectedMessage.sql_query ? (
                    <div className="relative">
                      <pre className="bg-slate-900 text-emerald-400 p-3 rounded-lg font-mono text-[10px] overflow-x-auto border border-slate-800 leading-normal max-h-40">
                        <code>{selectedMessage.sql_query}</code>
                      </pre>
                      <span className="absolute top-1.5 right-1.5 text-[8px] font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-1 rounded uppercase">
                        SELECT ONLY
                      </span>
                    </div>
                  ) : (
                    <div className="p-3 bg-blue-50/20 border border-blue-100 rounded-lg text-[10px] text-slate-400 flex items-center gap-1.5">
                      <AlertCircle className="h-4 w-4 text-blue-500" /> No SQL query generated for this response (General conversation).
                    </div>
                  )}
                </div>

                {/* 2. Execution Latency */}
                <div className="space-y-2">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-slate-600" /> Execution Metrics
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="border border-blue-50 bg-blue-50/10 rounded-lg p-2 text-center">
                      <div className="text-[8px] font-bold text-slate-450 uppercase">Network RTT</div>
                      <div className="text-sm font-black text-blue-900 mt-0.5">{selectedMessage.latency || 0} ms</div>
                    </div>
                    <div className="border border-blue-50 bg-blue-50/10 rounded-lg p-2 text-center">
                      <div className="text-[8px] font-bold text-slate-450 uppercase">Compile Engine</div>
                      <div className="text-sm font-black text-emerald-600 mt-0.5">LOCAL NLP</div>
                    </div>
                  </div>
                </div>

                {/* 3. Raw Data Returned */}
                <div className="space-y-2">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                    <Database className="h-3.5 w-3.5 text-slate-600" /> Raw Database Rows
                  </span>
                  {selectedMessage.data && selectedMessage.data.length > 0 ? (
                    <pre className="bg-slate-50 border border-blue-100 text-slate-700 p-3 rounded-lg font-mono text-[9px] overflow-x-auto leading-normal max-h-56">
                      {JSON.stringify(selectedMessage.data, null, 2)}
                    </pre>
                  ) : (
                    <div className="p-3 bg-blue-50/20 border border-blue-100 rounded-lg text-[10px] text-slate-400 flex items-center gap-1.5">
                      <AlertCircle className="h-4 w-4 text-blue-500" /> No raw rows returned from SQLite.
                    </div>
                  )}
                </div>

                {/* 4. Engine explanation */}
                <div className="p-2.5 rounded-lg bg-blue-50/20 border border-blue-50 text-[10px] text-slate-500 leading-relaxed">
                  <span className="font-bold text-slate-700">Governance explanation:</span> {selectedMessage.explanation || "No explanation provided."}
                </div>

              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-center p-6">
                <div className="space-y-2">
                  <HelpCircle className="h-8 w-8 text-blue-300 mx-auto" />
                  <p className="text-xs text-slate-400">Select a KSP Copilot message bubble to audit its query generation metrics.</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

    </div>
  )
}
