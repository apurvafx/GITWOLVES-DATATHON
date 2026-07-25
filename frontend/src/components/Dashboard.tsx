import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Shield, AlertTriangle, BadgePercent, TrendingUp, Calendar, MapPin, Landmark } from "lucide-react"

interface Case {
  CaseMasterID: number
  CrimeNo: string
  CaseNo: string
  CrimeRegisteredDate: string
  CrimeGroupName: string
  CrimeHeadName: string
  latitude: number
  longitude: number
  BriefFacts: string
  DistrictName: string
  UnitName: string
  CaseStatusName: string
}

interface Offender {
  AccusedName: string
  CaseCount: number
  threat_score: number
  AgeYear?: number
}

export default function Dashboard() {
  const [cases, setCases] = useState<Case[]>([])
  const [offenders, setOffenders] = useState<Offender[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const token = localStorage.getItem("ksp_user_token")
        const headers = { Authorization: `Bearer ${token}` }

        // Fetch cases
        const casesRes = await fetch("http://127.0.0.1:8000/api/cases", { headers })
        if (!casesRes.ok) throw new Error("Failed to fetch cases database")
        const casesData = await casesRes.ok ? await casesRes.json() : []

        // Fetch offenders
        const offendersRes = await fetch("http://127.0.0.1:8000/api/cases/offenders", { headers })
        const offendersData = offendersRes.ok ? await offendersRes.json() : []

        setCases(casesData)
        setOffenders(offendersData)
      } catch (err: any) {
        setError(err.message || "Failed to load dashboard metrics")
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center space-y-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-900 border-t-transparent mx-auto"></div>
          <p className="text-xs text-slate-500 font-medium">Aggregating KSP Command Center metrics...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-center space-y-2">
        <h4 className="text-sm font-bold text-red-700">Database Connection Failed</h4>
        <p className="text-xs text-red-600">{error}</p>
        <p className="text-[10px] text-slate-400 mt-2">Ensure the Uvicorn backend server is running on localhost port 8000.</p>
      </div>
    )
  }

  // Calculate stats
  const totalCases = cases.length
  const activeCases = cases.filter(c => c.CaseStatusName.toLowerCase() !== "resolved" && c.CaseStatusName.toLowerCase() !== "convicted").length
  const resolvedCases = totalCases - activeCases
  const resolutionRate = totalCases > 0 ? Math.round((resolvedCases / totalCases) * 100) : 0

  // Money funneled - Mock calculated sum for display based on seeded financial records
  const totalMoneyFunneled = 390000

  // Count by District
  const districtCounts: { [key: string]: number } = {}
  cases.forEach(c => {
    districtCounts[c.DistrictName] = (districtCounts[c.DistrictName] || 0) + 1
  })

  // Count by Crime Category
  const categoryCounts: { [key: string]: number } = {}
  cases.forEach(c => {
    categoryCounts[c.CrimeGroupName] = (categoryCounts[c.CrimeGroupName] || 0) + 1
  })

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard</h2>
          <p className="text-xs text-slate-500">Real-time crime statistics, timelines, and threat leaderboards.</p>
        </div>
        <div className="text-right text-xs text-slate-400 font-medium">
          Last Sync: {new Date().toLocaleTimeString()} • State Data Node
        </div>
      </div>

      {/* Grid: 4 Metric Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        
        {/* Total Cases */}
        <Card className="border border-blue-100 bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Registered Cases</span>
            <Shield className="h-4 w-4 text-blue-900" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{totalCases}</div>
            <p className="text-[10px] text-slate-400 mt-1">Direct from FIR Database Master</p>
          </CardContent>
        </Card>

        {/* Active Cases */}
        <Card className="border border-blue-100 bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Investigations</span>
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{activeCases}</div>
            <p className="text-[10px] text-slate-400 mt-1">Pending chargesheet submissions</p>
          </CardContent>
        </Card>

        {/* Resolution Rate */}
        <Card className="border border-blue-100 bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Resolution Rate</span>
            <BadgePercent className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{resolutionRate}%</div>
            <p className="text-[10px] text-slate-400 mt-1">Cases marked as Closed / Resolved</p>
          </CardContent>
        </Card>

        {/* Money Funneled */}
        <Card className="border border-blue-100 bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tracked Money Trail</span>
            <Landmark className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">₹{totalMoneyFunneled.toLocaleString()}</div>
            <p className="text-[10px] text-slate-400 mt-1">Accumulated financial transaction trails</p>
          </CardContent>
        </Card>

      </div>

      {/* Grid: Main Charts & Details */}
      <div className="grid gap-6 md:grid-cols-3">
        
        {/* Left Column: Recent Activity Timeline */}
        <Card className="md:col-span-2 border border-blue-100 bg-white shadow-sm">
          <CardHeader className="pb-3 border-b border-blue-50">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-900" />
              <CardTitle className="text-sm font-bold text-slate-900">Recent Registered Cases</CardTitle>
            </div>
            <CardDescription className="text-xs text-slate-500">
              Live case feed sorted by FIR registration date
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 px-6">
            {cases.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400">No recent cases found.</div>
            ) : (
              <div className="relative border-l border-blue-100 ml-3 pl-6 space-y-6 py-1">
                {cases.map((c, idx) => (
                  <div key={`${c.CaseMasterID}-${idx}`} className="relative">
                    {/* Circle Node */}
                    <div className="absolute -left-[31px] top-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-blue-950 shadow-sm"></div>
                    
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">Crime No: {c.CrimeNo}</span>
                        <span className="text-[10px] font-semibold text-blue-800 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded">
                          {c.CrimeGroupName}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-3 text-[10px] text-slate-500">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {c.UnitName}, {c.DistrictName}
                        </span>
                        <span>•</span>
                        <span>FIR Date: {new Date(c.CrimeRegisteredDate).toLocaleDateString()}</span>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed bg-blue-50/10 p-2.5 border border-blue-50 rounded-lg">
                        {c.BriefFacts}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Column: Habitual Offenders Leaderboard */}
        <Card className="border border-blue-100 bg-white shadow-sm">
          <CardHeader className="pb-3 border-b border-blue-50">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-900" />
              <CardTitle className="text-sm font-bold text-slate-900">Habitual Offenders</CardTitle>
            </div>
            <CardDescription className="text-xs text-slate-500">
              Ranked by computed syndication threat score
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            {offenders.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400">No offender records.</div>
            ) : (
              offenders
                .sort((a, b) => b.threat_score - a.threat_score)
                .slice(0, 5)
                .map((offender, idx) => (
                  <div key={`${offender.AccusedName}-${idx}`} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-900">{offender.AccusedName}</span>
                      <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${
                        offender.threat_score >= 70
                          ? "bg-red-50 text-red-600 border border-red-100"
                          : offender.threat_score >= 40
                          ? "bg-amber-50 text-amber-600 border border-amber-100"
                          : "bg-blue-50 text-blue-700 border border-blue-100"
                      }`}>
                        Score: {offender.threat_score}
                      </span>
                    </div>
                    
                    {/* Custom Metric Threat Progress Bar */}
                    <div className="w-full bg-blue-50/30 h-2 rounded-full overflow-hidden border border-blue-100/30">
                      <div 
                        className={`h-full transition-all ${
                          offender.threat_score >= 70
                            ? "bg-red-500"
                            : offender.threat_score >= 40
                            ? "bg-amber-500"
                            : "bg-blue-600"
                        }`}
                        style={{ width: `${offender.threat_score}%` }}
                      ></div>
                    </div>
                    
                    <div className="flex justify-between items-center text-[9px] text-slate-400">
                      <span>Involved in {offender.CaseCount} case(s)</span>
                    </div>
                  </div>
                ))
            )}
          </CardContent>
        </Card>

      </div>

      {/* Grid: Spatiotemporal Distribution Analysis */}
      <div className="grid gap-6 md:grid-cols-2">
        
        {/* District Case Distribution */}
        <Card className="border border-blue-100 bg-white shadow-sm">
          <CardHeader className="pb-3 border-b border-blue-50">
            <CardTitle className="text-sm font-bold text-slate-900">District Case Distribution</CardTitle>
            <CardDescription className="text-xs text-slate-500">
              FIR distribution by Police District Command
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            {Object.entries(districtCounts).map(([district, count], idx) => {
              const pct = Math.round((count / totalCases) * 100);
              return (
                <div key={`${district}-${idx}`} className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-700">
                    <span className="font-medium">{district}</span>
                    <span className="font-semibold">{count} case(s) ({pct}%)</span>
                  </div>
                  <div className="w-full bg-blue-50/20 h-2 rounded-full overflow-hidden border border-blue-100/30">
                    <div 
                      className="bg-blue-900 h-full"
                      style={{ width: `${pct}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Crime Head Distribution */}
        <Card className="border border-blue-100 bg-white shadow-sm">
          <CardHeader className="pb-3 border-b border-blue-50">
            <CardTitle className="text-sm font-bold text-slate-900">Crime Head Analysis</CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Classification of major crime groups registered
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            {Object.entries(categoryCounts).map(([cat, count], idx) => {
              const pct = Math.round((count / totalCases) * 100);
              return (
                <div key={`${cat}-${idx}`} className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-700">
                    <span className="font-medium truncate max-w-[200px]">{cat}</span>
                    <span className="font-semibold">{count} ({pct}%)</span>
                  </div>
                  <div className="w-full bg-blue-50/20 h-2 rounded-full overflow-hidden border border-blue-100/30">
                    <div 
                      className="bg-blue-800 h-full"
                      style={{ width: `${pct}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

      </div>

    </div>
  )
}
