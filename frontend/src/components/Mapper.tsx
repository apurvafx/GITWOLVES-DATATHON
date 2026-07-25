import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { MapContainer, TileLayer, CircleMarker, Popup, Circle } from "react-leaflet"
import { Shield, MapPin, Filter, Layers } from "lucide-react"

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

export default function Mapper() {
  const [cases, setCases] = useState<Case[]>([])
  const [filteredCases, setFilteredCases] = useState<Case[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // Filter states
  const [selectedDistrict, setSelectedDistrict] = useState("All Districts")
  const [selectedCategory, setSelectedCategory] = useState("All Categories")
  const [showRadiusHotspots, setShowRadiusHotspots] = useState(true)

  useEffect(() => {
    async function fetchCases() {
      try {
        const token = localStorage.getItem("ksp_user_token")
        const headers = { Authorization: `Bearer ${token}` }

        const response = await fetch("http://127.0.0.1:8000/api/cases", { headers })
        if (!response.ok) throw new Error("Failed to load map coordinate cases")
        
        // Wait, the API returns a redirect to /api/cases/ or direct JSON
        const data = await response.json()
        
        // Filter out cases that do not have valid coordinates
        const validCases = data.filter((c: Case) => c.latitude && c.longitude)
        setCases(validCases)
        setFilteredCases(validCases)
      } catch (err: any) {
        setError(err.message || "Failed to establish map server link")
      } finally {
        setLoading(false)
      }
    }

    fetchCases()
  }, [])

  // Apply filters
  useEffect(() => {
    let result = cases
    if (selectedDistrict !== "All Districts") {
      result = result.filter(c => c.DistrictName === selectedDistrict)
    }
    if (selectedCategory !== "All Categories") {
      result = result.filter(c => c.CrimeGroupName === selectedCategory)
    }
    setFilteredCases(result.slice(0, 1000))
  }, [selectedDistrict, selectedCategory, cases])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center space-y-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-900 border-t-transparent mx-auto"></div>
          <p className="text-xs text-slate-500 font-medium">Downloading spatiotemporal coordinates...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-center space-y-2">
        <h4 className="text-sm font-bold text-red-700">Map Load Failed</h4>
        <p className="text-xs text-red-600">{error}</p>
      </div>
    )
  }

  // Get unique districts & categories for filters
  const districts = ["All Districts", ...Array.from(new Set(cases.map(c => c.DistrictName)))]
  const categories = ["All Categories", ...Array.from(new Set(cases.map(c => c.CrimeGroupName)))]

  // Color helper based on crime group name
  const getMarkerColor = (crimeGroup: string, crimeHead: string) => {
    const group = (crimeGroup || "").toLowerCase()
    const head = (crimeHead || "").toLowerCase()
    if (group.includes("cyber") || head.includes("phishing") || head.includes("online")) return "#3B82F6" // blue
    if (group.includes("property") || head.includes("robbery") || head.includes("theft") || head.includes("breaking")) return "#F59E0B" // amber
    if (group.includes("body") || head.includes("murder") || head.includes("homicide")) return "#EF4444" // red
    return "#10B981" // emerald
  }

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] w-full gap-4 select-none font-sans overflow-hidden">
      
      {/* 1. TOP HEADER & FILTER MODULE */}
      <Card className="border border-blue-100 bg-white shadow-sm rounded-xl">
        <CardContent className="py-4 px-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 bg-blue-100 text-blue-900 rounded-lg flex items-center justify-center border border-blue-200">
              <Shield className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Crime Mapper</h3>
              <p className="text-[10px] text-slate-400 font-medium">Spatiotemporal GIS Hotspot Directory</p>
            </div>
          </div>

          {/* Filters Area */}
          <div className="flex flex-wrap items-center gap-3">
            
            {/* District select */}
            <div className="flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-slate-400" />
              <select
                value={selectedDistrict}
                onChange={(e: any) => setSelectedDistrict(e.target.value)}
                className="text-xs font-semibold border border-blue-100 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus-visible:ring-blue-900 focus-visible:border-blue-900 cursor-pointer"
              >
                {districts.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* Category select */}
            <div className="flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-slate-400" />
              <select
                value={selectedCategory}
                onChange={(e: any) => setSelectedCategory(e.target.value)}
                className="text-xs font-semibold border border-blue-100 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus-visible:ring-blue-900 focus-visible:border-blue-900 cursor-pointer"
              >
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Hotspots toggle */}
            <button
              onClick={() => setShowRadiusHotspots(!showRadiusHotspots)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                showRadiusHotspots
                  ? "bg-blue-100 border-blue-250 text-blue-900"
                  : "bg-white border-blue-100 text-slate-400 hover:text-slate-600"
              }`}
            >
              Toggle Hotspot Buffers
            </button>

            {/* Direct coordinate counter */}
            <span className="text-[10px] font-bold text-slate-500 bg-blue-50 border border-blue-100 px-2 py-1 rounded">
              Active: {filteredCases.length} case nodes
            </span>

          </div>
        </CardContent>
      </Card>

      {/* 2. LEAFLET MAP PANEL CONTAINER */}
      <div className="flex-1 border border-blue-100 rounded-xl overflow-hidden shadow-sm bg-white relative z-10">
        <MapContainer
          center={[12.9716, 77.5946]} // Center in Bengaluru
          zoom={12}                  // Initial focus zoom
          scrollWheelZoom={true}
          style={{ height: "100%", width: "100%" }}
        >
          {/* CartoDB Positron Clean Light-mode Tiles */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />

          {/* Render Case Markers */}
          {filteredCases.map((c) => {
            const markerColor = getMarkerColor(c.CrimeGroupName, c.CrimeHeadName)
            return (
              <div key={c.CaseMasterID}>
                {/* 1. Clean Circle Marker Node */}
                <CircleMarker
                  center={[c.latitude, c.longitude]}
                  radius={8}
                  pathOptions={{
                    fillColor: markerColor,
                    fillOpacity: 0.85,
                    color: "#FFFFFF",
                    weight: 1.5,
                  }}
                >
                  <Popup>
                    <div className="p-2 space-y-1.5 font-sans min-w-[200px] text-slate-800">
                      <div className="flex justify-between items-center border-b border-blue-50 pb-1 mb-1">
                        <span className="text-[10px] font-bold text-blue-900">No: {c.CrimeNo}</span>
                        <span className="text-[8px] font-bold text-slate-400 bg-slate-100 border px-1 rounded">
                          {c.CaseStatusName}
                        </span>
                      </div>
                      
                      <div className="text-[9px] text-slate-500 font-semibold space-y-0.5">
                        <div className="flex items-center gap-1"><MapPin className="h-2.5 w-2.5" /> {c.UnitName}, {c.DistrictName}</div>
                        <div>Date: {new Date(c.CrimeRegisteredDate).toLocaleDateString()}</div>
                        <div className="text-blue-700 uppercase tracking-wide text-[8px] font-bold">Group: {c.CrimeGroupName}</div>
                      </div>

                      <p className="text-[10px] text-slate-600 leading-normal bg-slate-50 p-1.5 border border-slate-150 rounded mt-1.5">
                        {c.BriefFacts}
                      </p>
                    </div>
                  </Popup>
                </CircleMarker>

                {/* 2. Spatiotemporal Hotspot buffer pulse */}
                {showRadiusHotspots && (
                  <Circle
                    center={[c.latitude, c.longitude]}
                    radius={250} // 250 meters
                    pathOptions={{
                      fillColor: markerColor,
                      fillOpacity: 0.08,
                      color: markerColor,
                      weight: 1,
                      dashArray: "4,4"
                    }}
                  />
                )}
              </div>
            )
          })}
        </MapContainer>

        {/* Floating Map Legend Indicator */}
        <div className="absolute bottom-4 right-4 bg-white/95 border border-blue-100 rounded-lg p-2.5 shadow-md z-[1000] text-[9px] font-semibold space-y-1 text-slate-700 backdrop-blur-sm pointer-events-none">
          <div className="font-bold border-b border-blue-50 pb-0.5 mb-1 text-slate-900 uppercase tracking-wider">Legend</div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-red-500"></span> Murder / Homicide
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-500"></span> Robbery / Theft
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-blue-500"></span> Cyber / SIM Cloning
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500"></span> Other Offenses
          </div>
        </div>

      </div>

    </div>
  )
}
