import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Shield, AlertTriangle, BadgePercent, Calendar, MapPin, Landmark, Upload, Loader2, Sparkles, X } from "lucide-react"

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
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Registration modal states
  const [showRegisterModal, setShowRegisterModal] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [ocrSuccess, setOcrSuccess] = useState(false)

  // Form states
  const [formValues, setFormValues] = useState({
    crime_no: "",
    case_no: "",
    crime_date: new Date().toISOString().split("T")[0],
    station_id: 101,
    major_head_id: 1,
    minor_head_id: 1,
    gravity_id: 2,
    status_id: 1,
    court_id: 1,
    lat: 12.9716,
    lng: 77.5946,
    facts: "",
    accused_name: "",
    accused_age: "",
    accused_role: "A1"
  })

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const token = localStorage.getItem("ksp_user_token")
        const headers = { Authorization: `Bearer ${token}` }

        // Fetch cases
        const casesRes = await fetch("http://127.0.0.1:8000/api/cases", { headers })
        if (!casesRes.ok) throw new Error("Failed to fetch cases database")
        const casesData = await casesRes.json()

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
  }, [refreshTrigger])

  const handleInputChange = (e: any) => {
    const { name, value } = e.target
    setFormValues(prev => ({
      ...prev,
      [name]: name === "station_id" || name === "major_head_id" || name === "minor_head_id" || 
               name === "gravity_id" || name === "status_id" || name === "court_id" || 
               name === "lat" || name === "lng"
               ? parseFloat(value) || value
               : value
    }))
  }

  // AI OCR autofill simulation
  const handlePhotoUpload = () => {
    setIsScanning(true)
    setOcrSuccess(false)
    setTimeout(() => {
      setIsScanning(false)
      setOcrSuccess(true)
      const randomId = Math.floor(Math.random() * 9000 + 1000)
      setFormValues({
        crime_no: `1044300062026${randomId}`,
        case_no: `2026${randomId}`,
        crime_date: "2026-07-25",
        station_id: 103, // Electronic City PS
        major_head_id: 3, // Cyber Crime
        minor_head_id: 6, // Online Financial Fraud
        gravity_id: 2, // Non-Heinous
        status_id: 1, // Under Investigation
        court_id: 1, // City Civil Court
        lat: 12.8452,
        lng: 77.6632,
        facts: "AI OCR Auto-fill: Incident reported near Electronic City phase 1. Complainant reports suspect Suresh Hegde cloned SIM card details and funneled Rs. 95,000 from banking portal.",
        accused_name: "Suresh Hegde",
        accused_age: "31",
        accused_role: "A1"
      })
    }, 2000)
  }

  // Register Form Submit
  const handleFormSubmit = async (e: any) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem("ksp_user_token")
      const response = await fetch("http://127.0.0.1:8000/api/cases/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          crime_no: formValues.crime_no,
          case_no: formValues.case_no,
          crime_date: formValues.crime_date,
          station_id: formValues.station_id,
          major_head_id: formValues.major_head_id,
          minor_head_id: formValues.minor_head_id,
          gravity_id: formValues.gravity_id,
          status_id: formValues.status_id,
          court_id: formValues.court_id,
          lat: formValues.lat,
          lng: formValues.lng,
          facts: formValues.facts,
          accused_name: formValues.accused_name || null,
          accused_age: formValues.accused_age ? parseInt(formValues.accused_age) : null,
          accused_role: formValues.accused_role || null
        })
      })

      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.detail || "Failed to register case")
      }

      setShowRegisterModal(false)
      setRefreshTrigger(prev => prev + 1)
      setOcrSuccess(false)
      // Reset form
      setFormValues({
        crime_no: "",
        case_no: "",
        crime_date: new Date().toISOString().split("T")[0],
        station_id: 101,
        major_head_id: 1,
        minor_head_id: 1,
        gravity_id: 2,
        status_id: 1,
        court_id: 1,
        lat: 12.9716,
        lng: 77.5946,
        facts: "",
        accused_name: "",
        accused_age: "",
        accused_role: "A1"
      })
    } catch (err: any) {
      alert(err.message || "Failed to register case")
    }
  }

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

  const totalCases = cases.length
  const activeCases = cases.filter(c => c.CaseStatusName.toLowerCase() !== "resolved" && c.CaseStatusName.toLowerCase() !== "convicted" && c.CaseStatusName.toLowerCase() !== "closed").length
  const resolvedCases = totalCases - activeCases
  const resolutionRate = totalCases > 0 ? Math.round((resolvedCases / totalCases) * 100) : 0
  const totalMoneyFunneled = 580000 // Mock accumulated trail index

  const districtCounts: { [key: string]: number } = {}
  cases.forEach(c => {
    districtCounts[c.DistrictName] = (districtCounts[c.DistrictName] || 0) + 1
  })

  const categoryCounts: { [key: string]: number } = {}
  cases.forEach(c => {
    categoryCounts[c.CrimeHeadName] = (categoryCounts[c.CrimeHeadName] || 0) + 1
  })

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans select-none relative">
      
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard</h2>
          <p className="text-xs text-slate-500 font-semibold">Real-time crime statistics, timelines, and threat leaderboards.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowRegisterModal(true)}
            className="text-xs font-black text-white bg-blue-900 hover:bg-blue-950 px-4.5 py-2.5 rounded-lg shadow-sm transition-all uppercase tracking-wider"
          >
            + Register Case
          </button>
          <div className="text-right text-xs text-slate-400 font-medium">
            Last Sync: {new Date().toLocaleTimeString()} • State Data Node
          </div>
        </div>
      </div>

      {/* Grid: 4 Metric Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        
        <Card className="border border-blue-100 bg-white shadow-sm hover:shadow-md transition-shadow rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Registered Cases</span>
            <Shield className="h-4 w-4 text-blue-900" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{totalCases}</div>
            <p className="text-[10px] text-slate-400 mt-1">FIR Database ({offenders.length} suspects tracked)</p>
          </CardContent>
        </Card>

        <Card className="border border-blue-100 bg-white shadow-sm hover:shadow-md transition-shadow rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Investigations</span>
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{activeCases}</div>
            <p className="text-[10px] text-slate-400 mt-1">Pending chargesheet submissions</p>
          </CardContent>
        </Card>

        <Card className="border border-blue-100 bg-white shadow-sm hover:shadow-md transition-shadow rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Resolution Rate</span>
            <BadgePercent className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{resolutionRate}%</div>
            <p className="text-[10px] text-slate-400 mt-1">Cases marked as Closed / Resolved</p>
          </CardContent>
        </Card>

        <Card className="border border-blue-100 bg-white shadow-sm hover:shadow-md transition-shadow rounded-xl">
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
        
        <Card className="md:col-span-2 border border-blue-100 bg-white shadow-sm rounded-xl">
          <CardHeader className="pb-3 border-b border-blue-50">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-900" />
              <CardTitle className="text-sm font-bold text-slate-900">Recent Registered Cases</CardTitle>
            </div>
            <CardDescription className="text-xs text-slate-500">
              Live case feed sorted by FIR registration date (Showing latest 5 entries)
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 px-6 max-h-[460px] overflow-y-auto">
            {cases.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400">No recent cases found.</div>
            ) : (
              <div className="relative border-l border-blue-100 ml-3 pl-6 space-y-6 py-1">
                {cases.slice(0, 5).map((c, idx) => (
                  <div key={`${c.CaseMasterID}-${idx}`} className="relative">
                    <div className="absolute -left-[31px] top-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-blue-950 shadow-sm"></div>
                    
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">Crime No: {c.CrimeNo}</span>
                        <span className="text-[10px] font-semibold text-blue-800 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded">
                          {c.CrimeGroupName}
                        </span>
                      </div>
                      
                      <p className="text-[11px] text-slate-600 leading-normal bg-slate-50/50 p-2.5 rounded-lg border border-slate-100/60 font-medium">
                        {c.BriefFacts}
                      </p>
                      
                      <div className="flex items-center gap-4 text-[9px] text-slate-400 font-semibold uppercase tracking-wider">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-slate-400" />
                          {c.UnitName}, {c.DistrictName}
                        </span>
                        <span>•</span>
                        <span>Date: {c.CrimeRegisteredDate}</span>
                        <span>•</span>
                        <span className="text-blue-900">{c.CaseStatusName}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Column Metrics */}
        <div className="space-y-6">
          
          <Card className="border border-blue-100 bg-white shadow-sm rounded-xl">
            <CardHeader className="pb-3 border-b border-blue-50">
              <CardTitle className="text-sm font-bold text-slate-900">District Distribution</CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Number of registered cases across jurisdictions
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              {Object.entries(districtCounts).map(([dist, count], idx) => {
                const pct = Math.round((count / totalCases) * 100)
                return (
                  <div key={`${dist}-${idx}`} className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-700 font-medium">
                      <span>{dist}</span>
                      <span className="font-semibold">{count} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-blue-50/20 h-2 rounded-full overflow-hidden border border-blue-100/30">
                      <div 
                        className="bg-blue-900 h-full"
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          <Card className="border border-blue-100 bg-white shadow-sm rounded-xl">
            <CardHeader className="pb-3 border-b border-blue-50">
              <CardTitle className="text-sm font-bold text-slate-900">Crime Head Analysis</CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Classification of major crime groups registered
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              {Object.entries(categoryCounts).map(([cat, count], idx) => {
                const pct = Math.round((count / totalCases) * 100)
                return (
                  <div key={`${cat}-${idx}`} className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-700 font-medium">
                      <span className="truncate max-w-[200px]">{cat}</span>
                      <span className="font-semibold">{count} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-blue-50/20 h-2 rounded-full overflow-hidden border border-blue-100/30">
                      <div 
                        className="bg-blue-800 h-full"
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>

        </div>

      </div>

      {/* Case Registration Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <Card className="w-full max-w-2xl bg-white border border-blue-100 shadow-2xl rounded-2xl overflow-hidden flex flex-col my-8 max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center p-5 border-b border-blue-55/60 bg-blue-50/20">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4.5 w-4.5 text-blue-900 animate-pulse" />
                <div>
                  <CardTitle className="text-sm font-black text-slate-900 uppercase tracking-wider">KSP Case Registration</CardTitle>
                  <CardDescription className="text-[10px] text-slate-400 font-semibold uppercase">Register new crime record into secure database</CardDescription>
                </div>
              </div>
              <button 
                onClick={() => { setShowRegisterModal(false); setOcrSuccess(false); }}
                className="p-1.5 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Form Scroll Area */}
            <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Photo Upload Autofill Segment */}
              <div className="p-4 bg-blue-50/30 border border-dashed border-blue-200 rounded-xl flex flex-col items-center justify-center gap-3 text-center">
                <div className="h-10 w-10 bg-blue-900/10 rounded-full flex items-center justify-center">
                  {isScanning ? (
                    <Loader2 className="h-5 w-5 text-blue-900 animate-spin" />
                  ) : (
                    <Upload className="h-5 w-5 text-blue-900" />
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Upload FIR Document / Suspect Record</h4>
                  <p className="text-[10px] text-slate-400 font-medium">Extract entity profiles & geospatial coordinates via KSP-OCR AI pipeline</p>
                </div>
                
                {isScanning ? (
                  <div className="text-[10px] font-black text-blue-900 uppercase tracking-widest animate-pulse">
                    AI OCR Scanning Document Layout...
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handlePhotoUpload}
                    className="text-xs font-black text-blue-900 bg-blue-50/60 hover:bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg transition-all uppercase tracking-wider flex items-center gap-1.5"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    Trigger AI OCR Scan
                  </button>
                )}

                {ocrSuccess && (
                  <div className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded">
                    AI Auto-fill Complete! Suspect Suresh Hegde mapped.
                  </div>
                )}
              </div>

              {/* Grid: Case Numbers & Date */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Crime Number (18 Digits)</label>
                  <Input 
                    name="crime_no"
                    value={formValues.crime_no}
                    onChange={handleInputChange}
                    placeholder="e.g. 1044300062026..."
                    required
                    className="h-9 text-xs border-blue-100"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Case ID Reference</label>
                  <Input 
                    name="case_no"
                    value={formValues.case_no}
                    onChange={handleInputChange}
                    placeholder="e.g. 202600123"
                    required
                    className="h-9 text-xs border-blue-100"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Date Registered</label>
                  <Input 
                    type="date"
                    name="crime_date"
                    value={formValues.crime_date}
                    onChange={handleInputChange}
                    required
                    className="h-9 text-xs border-blue-100"
                  />
                </div>
              </div>

              {/* Grid: Unit, Category, Severity */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Police Station Unit</label>
                  <select
                    name="station_id"
                    value={formValues.station_id}
                    onChange={handleInputChange}
                    className="w-full h-9 rounded-lg border border-blue-100 px-3 text-xs bg-transparent focus-visible:ring-1 focus-visible:ring-blue-900"
                  >
                    <option value={101}>Koramangala PS (Bengaluru)</option>
                    <option value={102}>Indiranagar PS (Bengaluru)</option>
                    <option value={103}>Electronic City PS (Bengaluru)</option>
                    <option value={202}>Lashkar PS (Mysuru)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Offence Gravity</label>
                  <select
                    name="gravity_id"
                    value={formValues.gravity_id}
                    onChange={handleInputChange}
                    className="w-full h-9 rounded-lg border border-blue-100 px-3 text-xs bg-transparent focus-visible:ring-1 focus-visible:ring-blue-900"
                  >
                    <option value={2}>Non-Heinous (Minor offence)</option>
                    <option value={1}>Heinous (Major threat)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Court jurisdiction</label>
                  <select
                    name="court_id"
                    value={formValues.court_id}
                    onChange={handleInputChange}
                    className="w-full h-9 rounded-lg border border-blue-100 px-3 text-xs bg-transparent focus-visible:ring-1 focus-visible:ring-blue-900"
                  >
                    <option value={1}>City Civil Court Bengaluru</option>
                    <option value={2}>JMFC Court Mysuru</option>
                    <option value={3}>High Court of Karnataka</option>
                  </select>
                </div>
              </div>

              {/* Grid: Crime Head Classification */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Major Crime Group</label>
                  <select
                    name="major_head_id"
                    value={formValues.major_head_id}
                    onChange={handleInputChange}
                    className="w-full h-9 rounded-lg border border-blue-100 px-3 text-xs bg-transparent focus-visible:ring-1 focus-visible:ring-blue-900"
                  >
                    <option value={1}>Crimes Against Body</option>
                    <option value={2}>Crimes Against Property</option>
                    <option value={3}>Cyber Crime</option>
                    <option value={4}>Financial & White Collar Crime</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Minor Sub-Head Code</label>
                  <select
                    name="minor_head_id"
                    value={formValues.minor_head_id}
                    onChange={handleInputChange}
                    className="w-full h-9 rounded-lg border border-blue-100 px-3 text-xs bg-transparent focus-visible:ring-1 focus-visible:ring-blue-900"
                  >
                    <option value={1}>Murder (Body)</option>
                    <option value={2}>Attempt to Murder (Body)</option>
                    <option value={3}>Robbery (Property)</option>
                    <option value={4}>House Breaking (Property)</option>
                    <option value={5}>Phishing & Identity Theft (Cyber)</option>
                    <option value={6}>Online Financial Fraud (Cyber)</option>
                    <option value={7}>Cheating & Forgery (White Collar)</option>
                  </select>
                </div>
              </div>

              {/* Geospatial Coordinates */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Latitude Coordinate</label>
                  <Input
                    type="number"
                    step="0.000001"
                    name="lat"
                    value={formValues.lat}
                    onChange={handleInputChange}
                    required
                    className="h-9 text-xs border-blue-100"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Longitude Coordinate</label>
                  <Input
                    type="number"
                    step="0.000001"
                    name="lng"
                    value={formValues.lng}
                    onChange={handleInputChange}
                    required
                    className="h-9 text-xs border-blue-100"
                  />
                </div>
              </div>

              {/* Suspect profile block */}
              <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-xl space-y-3">
                <h5 className="text-[10px] font-black text-slate-600 uppercase tracking-wider">Accused Suspect Profile (Syndicate Mapping)</h5>
                
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[8px] font-bold text-slate-500 uppercase">Suspect Name</label>
                    <Input
                      name="accused_name"
                      value={formValues.accused_name}
                      onChange={handleInputChange}
                      placeholder="e.g. Suresh Hegde"
                      className="h-8 text-xs border-slate-200"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-bold text-slate-500 uppercase">Suspect Age</label>
                    <Input
                      type="number"
                      name="accused_age"
                      value={formValues.accused_age}
                      onChange={handleInputChange}
                      placeholder="e.g. 31"
                      className="h-8 text-xs border-slate-200"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-bold text-slate-500 uppercase">Accomplice Role</label>
                    <select
                      name="accused_role"
                      value={formValues.accused_role}
                      onChange={handleInputChange}
                      className="w-full h-8 rounded-md border border-slate-200 px-2 text-xs bg-transparent"
                    >
                      <option value="A1">Primary Accused (A1)</option>
                      <option value="A2">Secondary Accomplice (A2)</option>
                      <option value="A3">Tertiary Suspect (A3)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Brief Facts */}
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider">FIR Case Brief Facts</label>
                <textarea
                  name="facts"
                  value={formValues.facts}
                  onChange={handleInputChange}
                  rows={3}
                  required
                  placeholder="Detail the case incident statements, loss amount, and recovery trails..."
                  className="w-full p-2.5 rounded-lg border border-blue-100 text-xs focus-visible:ring-1 focus-visible:ring-blue-900 bg-transparent font-sans"
                />
              </div>

            </form>

            {/* Modal Footer */}
            <div className="p-4 border-t border-blue-50/60 bg-blue-50/10 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => { setShowRegisterModal(false); setOcrSuccess(false); }}
                className="text-xs font-bold text-slate-500 hover:bg-slate-100 border border-slate-200 px-4 py-2 rounded-lg transition-colors uppercase tracking-wider"
              >
                Cancel
              </button>
              <button
                onClick={handleFormSubmit}
                className="text-xs font-black text-white bg-blue-900 hover:bg-blue-950 px-5 py-2 rounded-lg shadow transition-colors uppercase tracking-wider"
              >
                Submit Register
              </button>
            </div>

          </Card>
        </div>
      )}

    </div>
  )
}
