import { useState, useEffect } from "react"
import Login from "./components/Login"
import Dashboard from "./components/Dashboard"
import LandingPage from "./components/LandingPage"
import Copilot from "./components/Copilot"
import Mapper from "./components/Mapper"
import Syndicate from "./components/Syndicate"
import OffenderHub from "./components/OffenderHub"
import { Shield, LayoutDashboard, MessageSquareCode, Map, Share2, Users, LogOut, Lock } from "lucide-react"

// Types
interface UserSession {
  username: string
  name: string
  role: string
  kgid: string
  token: string
}

export default function App() {
  const [view, setView] = useState<"landing" | "login" | "portal">("landing")
  const [session, setSession] = useState<UserSession | null>(null)
  const [activeTab, setActiveTab] = useState("dashboard")


  // Load session from localStorage on start
  useEffect(() => {
    const token = localStorage.getItem("ksp_user_token")
    if (token) {
      setSession({
        token,
        name: localStorage.getItem("ksp_user_name") || "",
        role: localStorage.getItem("ksp_user_role") || "Investigator",
        kgid: localStorage.getItem("ksp_user_kgid") || "",
        username: localStorage.getItem("ksp_username") || ""
      })
      setView("portal")
    }
  }, [])

  const handleLoginSuccess = (userData: UserSession) => {
    setSession(userData)
    setView("portal")
  }

  const handleLogout = () => {
    localStorage.clear()
    setSession(null)
    setView("landing")
    setActiveTab("dashboard")
  }

  if (view === "landing") {
    return <LandingPage onEnterPortal={() => setView(session ? "portal" : "login")} />
  }

  if (view === "login" || !session) {
    return <Login onLoginSuccess={handleLoginSuccess} />
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F0F4F8] text-slate-800 font-sans antialiased">
      
      {/* 1. LEFT SIDEBAR NAVIGATION */}
      <aside className="w-[260px] bg-white border-r border-blue-100 flex flex-col justify-between select-none">
        
        {/* Top Branding Section */}
        <div>
          <div className="h-16 border-b border-blue-100 flex items-center px-6 gap-3">
            <div className="h-8 w-8 bg-blue-900 text-white rounded-lg flex items-center justify-center shadow-sm">
              <Shield className="h-4 w-4" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-slate-900">KSP-CRIMEPILOT</h1>
              <p className="text-[10px] text-slate-400 font-medium">SCRB Command Hub</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            {[
              { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
              { id: "copilot", label: "Investigator Copilot", icon: MessageSquareCode },
              { id: "mapper", label: "Crime Mapper", icon: Map },
              { id: "syndicate", label: "Syndicate Link", icon: Share2 },
              { id: "offenders", label: "Offender Hub", icon: Users },
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? "bg-blue-900 text-white shadow-sm"
                      : "text-slate-600 hover:text-blue-900 hover:bg-blue-50/50"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Bottom Officer Profile & Logout */}
        <div className="border-t border-blue-100 p-4 space-y-3 bg-blue-50/10">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 bg-blue-100 text-blue-900 rounded-full flex items-center justify-center font-bold text-sm border border-blue-200">
              {session.name.split(" ").map(n => n[0]).join("").toUpperCase()}
            </div>
            <div className="flex-1 overflow-hidden">
              <h4 className="text-xs font-semibold text-slate-900 truncate">{session.name}</h4>
              <p className="text-[10px] text-slate-400 font-medium truncate flex items-center gap-1">
                <Lock className="h-2.5 w-2.5 text-blue-600 inline" /> {session.role} • {session.kgid}
              </p>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 border border-blue-100 hover:border-red-200 text-xs font-medium rounded-lg text-slate-600 hover:text-red-600 hover:bg-red-50/50 transition-all"
          >
            <LogOut className="h-3.5 w-3.5" />
            Security Sign Out
          </button>
        </div>
      </aside>

      {/* 2. MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col overflow-hidden">
        
        {/* Dynamic Workspace Container */}
        <div className="flex-1 overflow-y-auto p-8">
          {activeTab === "dashboard" && <Dashboard />}
          {activeTab === "copilot" && <Copilot />}
          {activeTab === "mapper" && <Mapper />}
          {activeTab === "syndicate" && <Syndicate />}
          {activeTab === "offenders" && <OffenderHub />}
        </div>
      </main>
    </div>
  )
}
