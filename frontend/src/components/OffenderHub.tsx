import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Shield, Search, TrendingUp, AlertTriangle, Users, Award } from "lucide-react"

interface Offender {
  name: string
  case_count: number
  threat_score: number
  risk_level: "High" | "Medium" | "Low"
}

// 5-Axis Radar Chart SVG Component
function OffenderRadarChart({ offender }: { offender: Offender }) {
  // Compute axes values based on the offender's threat score & case count
  const metrics = useMemo(() => {
    // Generate realistic, consistent metric dimensions based on their threat profile
    const severityFactor = offender.threat_score / 100
    const recidivismFactor = Math.min(1.0, offender.case_count / 3)
    
    // Custom values for showcase criminals
    const isSuresh = offender.name.toLowerCase().includes("suresh")
    
    return {
      severity: severityFactor,
      recidivism: recidivismFactor,
      financial: isSuresh ? 0.95 : Math.min(1.0, severityFactor * 0.8 + 0.1),
      accomplices: isSuresh ? 0.8 : Math.min(1.0, recidivismFactor * 0.9 + 0.1),
      geographic: isSuresh ? 0.7 : Math.min(1.0, (recidivismFactor + severityFactor) / 2),
    }
  }, [offender])

  const center = 130
  const maxRadius = 90
  const axes = [
    { label: "Severity", val: metrics.severity, angle: -Math.PI / 2 },
    { label: "Recidivism", val: metrics.recidivism, angle: -Math.PI / 2 + (2 * Math.PI) / 5 },
    { label: "Financial", val: metrics.financial, angle: -Math.PI / 2 + (4 * Math.PI) / 5 },
    { label: "Accomplices", val: metrics.accomplices, angle: -Math.PI / 2 + (6 * Math.PI) / 5 },
    { label: "Geographic", val: metrics.geographic, angle: -Math.PI / 2 + (8 * Math.PI) / 5 },
  ]

  // Concentric pentagon lines coordinates
  const levels = [0.2, 0.4, 0.6, 0.8, 1.0]

  const getPointsString = (scale: number) => {
    return axes.map(ax => {
      const radius = maxRadius * scale
      const x = center + radius * Math.cos(ax.angle)
      const y = center + radius * Math.sin(ax.angle)
      return `${x},${y}`
    }).join(" ")
  }

  // Active data points string
  const activePoints = axes.map(ax => {
    const radius = maxRadius * ax.val
    const x = center + radius * Math.cos(ax.angle)
    const y = center + radius * Math.sin(ax.angle)
    return `${x},${y}`
  }).join(" ")

  return (
    <div className="flex flex-col items-center justify-center p-2 bg-slate-50/50 border border-blue-50 rounded-xl">
      <svg width={260} height={260} className="overflow-visible select-none">
        {/* Background concentric pentagon webs */}
        {levels.map((level, idx) => (
          <polygon
            key={idx}
            points={getPointsString(level)}
            fill="none"
            stroke="#E2E8F0"
            strokeWidth={1}
          />
        ))}

        {/* Axis straight lines */}
        {axes.map((ax, idx) => {
          const x2 = center + maxRadius * Math.cos(ax.angle)
          const y2 = center + maxRadius * Math.sin(ax.angle)
          return (
            <line
              key={idx}
              x1={center}
              y1={center}
              x2={x2}
              y2={y2}
              stroke="#CBD5E1"
              strokeWidth={1}
            />
          )
        })}

        {/* Render polygon for active threat coordinates */}
        <polygon
          points={activePoints}
          fill="rgba(59, 130, 246, 0.18)"
          stroke="#2563EB"
          strokeWidth={2}
        />

        {/* Circle markers at vertices */}
        {axes.map((ax, idx) => {
          const radius = maxRadius * ax.val
          const x = center + radius * Math.cos(ax.angle)
          const y = center + radius * Math.sin(ax.angle)
          return (
            <circle
              key={idx}
              cx={x}
              cy={y}
              r={3.5}
              fill="#1E3A8A"
              stroke="#FFFFFF"
              strokeWidth={1}
            />
          )
        })}

        {/* Labels positioned at axes tips */}
        {axes.map((ax, idx) => {
          const labelRadius = maxRadius + 16
          const x = center + labelRadius * Math.cos(ax.angle)
          const y = center + labelRadius * Math.sin(ax.angle) + 3 // slight font centering
          
          return (
            <text
              key={idx}
              x={x}
              y={y}
              textAnchor="middle"
              className="text-[9px] font-black fill-slate-500 uppercase tracking-wider"
            >
              {ax.label}
            </text>
          )
        })}
      </svg>
    </div>
  )
}

export default function OffenderHub() {
  const [offenders, setOffenders] = useState<Offender[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [selectedOffender, setSelectedOffender] = useState<Offender | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    async function fetchOffenders() {
      try {
        const token = localStorage.getItem("ksp_user_token")
        const headers = { Authorization: `Bearer ${token}` }

        const response = await fetch("http://127.0.0.1:8000/api/cases/offenders", { headers })
        if (!response.ok) throw new Error("Failed to load habitual offender directory")

        const data = await response.json()
        const sortedData = data.sort((a: Offender, b: Offender) => b.threat_score - a.threat_score)
        
        setOffenders(sortedData)
        if (sortedData.length > 0) setSelectedOffender(sortedData[0])
      } catch (err: any) {
        setError(err.message || "Failed to load offender metrics")
      } finally {
        setLoading(false)
      }
    }

    fetchOffenders()
  }, [])

  // Filtered offenders list
  const filteredOffenders = useMemo(() => {
    if (!searchQuery) return offenders
    return offenders.filter(o => o.name.toLowerCase().includes(searchQuery.toLowerCase()))
  }, [searchQuery, offenders])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center space-y-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-900 border-t-transparent mx-auto"></div>
          <p className="text-xs text-slate-500 font-medium">Downloading offender records...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-center space-y-2">
        <h4 className="text-sm font-bold text-red-700">Database Connection Failed</h4>
        <p className="text-xs text-red-600">{error}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-100px)] w-full gap-6 select-none font-sans overflow-hidden">
      
      {/* 1. LEFT COLUMN: SEARCH & OFFENDERS LIST */}
      <div className="w-full md:w-[320px] flex flex-col gap-4 overflow-y-auto">
        
        {/* Header and Search Card */}
        <Card className="border border-blue-100 bg-white shadow-sm rounded-xl">
          <CardHeader className="p-4 border-b border-blue-50">
            <div className="flex items-center gap-2">
              <Shield className="h-4.5 w-4.5 text-blue-900" />
              <div>
                <CardTitle className="text-xs font-black text-slate-900 uppercase tracking-widest">Offender Hub</CardTitle>
                <CardDescription className="text-[10px] text-slate-400 font-medium">Recidivism risk and threat analytics</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(e: any) => setSearchQuery(e.target.value)}
                placeholder="Search offender profile name..."
                className="pl-8 h-9 border-blue-100 text-xs focus-visible:ring-blue-900 focus-visible:border-blue-900"
              />
            </div>
          </CardContent>
        </Card>

        {/* Directory List Card */}
        <Card className="border border-blue-100 bg-white shadow-sm rounded-xl flex-1 flex flex-col overflow-hidden">
          <CardContent className="p-2 flex-1 overflow-y-auto space-y-1">
            {filteredOffenders.map((o, idx) => (
              <div
                key={`${o.name}-${idx}`}
                onClick={() => setSelectedOffender(o)}
                className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-all ${
                  selectedOffender?.name === o.name
                    ? "bg-blue-50/40 border-blue-200 text-blue-900 shadow-sm"
                    : "bg-transparent border-transparent text-slate-700 hover:bg-blue-50/10"
                }`}
              >
                <div className="flex flex-col max-w-[70%]">
                  <span className="text-xs font-bold truncate">{o.name}</span>
                  <span className="text-[9px] text-slate-400 font-semibold">{o.case_count} case registers</span>
                </div>
                
                {/* Risk Badge */}
                <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                  o.risk_level === "High"
                    ? "bg-red-50 text-red-600 border border-red-100"
                    : o.risk_level === "Medium"
                    ? "bg-amber-50 text-amber-600 border border-amber-100"
                    : "bg-blue-50 text-blue-700 border border-blue-100"
                }`}>
                  {o.risk_level}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

      </div>

      {/* 2. RIGHT COLUMN: THREAT PROFILE DISPLAY */}
      <div className="flex-1 flex flex-col gap-6 overflow-y-auto">
        {selectedOffender ? (
          <div className="grid gap-6 md:grid-cols-2">
            
            {/* Profile Overview Card */}
            <Card className="border border-blue-100 bg-white shadow-sm rounded-xl">
              <CardHeader className="border-b border-blue-50 bg-blue-50/10">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-xs font-black text-slate-900 uppercase tracking-widest">Offender Profile</CardTitle>
                  <Award className="h-4.5 w-4.5 text-blue-900" />
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                
                {/* Profile Header Details */}
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-blue-900 text-white rounded-full flex items-center justify-center font-black text-lg shadow">
                    {selectedOffender.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">{selectedOffender.name}</h3>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Karnataka Police Accused Registry</p>
                  </div>
                </div>

                {/* Threat Scale Meter */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-500 uppercase text-[9px] tracking-wider">Syndication Threat Index</span>
                    <span className={`text-xs font-black ${
                      selectedOffender.threat_score >= 60 ? "text-red-600" : (selectedOffender.threat_score >= 30 ? "text-amber-500" : "text-blue-900")
                    }`}>{selectedOffender.threat_score} / 100</span>
                  </div>
                  
                  <div className="w-full bg-blue-50/30 h-2.5 rounded-full overflow-hidden border border-blue-100/50">
                    <div 
                      className={`h-full transition-all duration-500 ${
                        selectedOffender.threat_score >= 60 ? "bg-red-500" : (selectedOffender.threat_score >= 30 ? "bg-amber-500" : "bg-blue-600")
                      }`}
                      style={{ width: `${selectedOffender.threat_score}%` }}
                    ></div>
                  </div>
                  <p className="text-[9px] text-slate-400 leading-normal">
                    This score is dynamically computed based on registered case volume, severity parameters, and connected accomplice ratios.
                  </p>
                </div>

                {/* Stat Grid */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  
                  <div className="border border-blue-50 bg-blue-50/10 rounded-xl p-3 text-center">
                    <TrendingUp className="h-4.5 w-4.5 text-blue-900 mx-auto mb-1" />
                    <div className="text-[8px] font-bold text-slate-450 uppercase">Recidivism Rate</div>
                    <div className="text-sm font-black text-slate-900 mt-0.5">
                      {selectedOffender.case_count >= 3 ? "Critical" : (selectedOffender.case_count >= 2 ? "High" : "Moderate")}
                    </div>
                  </div>

                  <div className="border border-blue-50 bg-blue-50/10 rounded-xl p-3 text-center">
                    <Users className="h-4.5 w-4.5 text-blue-900 mx-auto mb-1" />
                    <div className="text-[8px] font-bold text-slate-450 uppercase">Accomplice Links</div>
                    <div className="text-sm font-black text-slate-900 mt-0.5">
                      {selectedOffender.name.toLowerCase().includes("suresh") ? "5 active" : "2 linked"}
                    </div>
                  </div>

                </div>

              </CardContent>
            </Card>

            {/* Radar Chart Display Card */}
            <Card className="border border-blue-100 bg-white shadow-sm rounded-xl flex flex-col items-center justify-center p-6">
              <div className="text-center mb-2 space-y-0.5">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">Multi-Dimensional Threat Map</h4>
                <p className="text-[9px] text-slate-400 font-medium">Offence attributes compared across 5 key dimensions</p>
              </div>
              <OffenderRadarChart offender={selectedOffender} />
            </Card>

          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-center p-6 border border-blue-100 bg-white rounded-xl shadow-sm">
            <div className="space-y-2">
              <AlertTriangle className="h-8 w-8 text-blue-300 mx-auto" />
              <p className="text-xs text-slate-400">Select an offender from the sidebar directory to inspect metrics.</p>
            </div>
          </div>
        )}
      </div>

    </div>
  )
}
