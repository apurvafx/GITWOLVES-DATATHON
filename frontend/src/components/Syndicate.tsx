import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, Html } from "@react-three/drei"
import { Input } from "@/components/ui/input"
import { Network, Landmark, Users, Search, Info, ToggleLeft } from "lucide-react"
import { API_BASE_URL } from "@/config"

interface Node {
  id: string
  label: string
  type: "case" | "accused" | "victim" | "account"
  date?: string
  x?: number
  y?: number
  z?: number
}

interface Edge {
  source: string
  target: string
  label: string
  type: string
  case_id?: string
}

// 3D Node sphere representation
function ThreeNode({ node, onClick, isSelected }: { node: Node; onClick: () => void; isSelected: boolean }) {
  const color = useMemo(() => {
    switch (node.type) {
      case "case": return "#1E3A8A" // navy blue
      case "accused": return "#EF4444" // red
      case "victim": return "#10B981" // green
      case "account": return "#F59E0B" // amber/gold
      default: return "#94A3B8" // grey
    }
  }, [node.type])

  return (
    <mesh 
      position={[node.x || 0, node.y || 0, node.z || 0]}
      onClick={(e: any) => {
        e.stopPropagation()
        onClick()
      }}
    >
      <sphereGeometry args={[isSelected ? 0.6 : 0.45, 24, 24]} />
      <meshStandardMaterial 
        color={color} 
        roughness={0.2}
        metalness={0.8}
        emissive={isSelected ? color : "#000000"}
        emissiveIntensity={isSelected ? 0.4 : 0}
      />
      <Html distanceFactor={12} position={[0, 0.7, 0]}>
        <div className={`px-2 py-0.5 rounded text-[8px] font-bold text-white whitespace-nowrap pointer-events-none select-none border border-slate-700/20 bg-slate-900/90 shadow-md`}>
          {node.label}
        </div>
      </Html>
    </mesh>
  )
}

// 3D Connection line representation
function ThreeEdge({ edge, nodesMap }: { edge: Edge; nodesMap: Map<string, Node> }) {
  const sourceNode = nodesMap.get(edge.source)
  const targetNode = nodesMap.get(edge.target)

  if (!sourceNode || !targetNode) return null

  const p1 = [sourceNode.x || 0, sourceNode.y || 0, sourceNode.z || 0]
  const p2 = [targetNode.x || 0, targetNode.y || 0, targetNode.z || 0]

  const points = new Float32Array([...p1, ...p2])

  return (
    <line>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[points, 3]}
        />
      </bufferGeometry>
      <lineBasicMaterial 
        color={edge.type === "transaction" ? "#F59E0B" : "#94A3B8"} 
        linewidth={1.5}
        transparent
        opacity={0.6}
      />
    </line>
  )
}

export default function Syndicate() {
  const [nodes, setNodes] = useState<Node[]>([])
  const [edges, setEdges] = useState<Edge[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  
  // Interactive View mode toggle
  const [is3DMode, setIs3DMode] = useState(true)

  useEffect(() => {
    async function fetchGraphData() {
      try {
        const token = localStorage.getItem("ksp_user_token")
        const headers = { Authorization: `Bearer ${token}` }

        const response = await fetch(`${API_BASE_URL}/api/cases/network/graph`, { headers })
        if (response.status === 401) {
          localStorage.clear()
          window.location.reload()
          return
        }
        if (!response.ok) throw new Error("Failed to load criminal network graph")

        const data = await response.json()
        
        // Compute positions for 3D layout (Hub-and-spoke layout)
        const casesList = data.nodes.filter((n: any) => n.type === "case")
        const otherList = data.nodes.filter((n: any) => n.type !== "case")
        
        const computedNodes: Node[] = []
        const nodesMap = new Map<string, Node>()

        // 1. Position Case nodes spaced along a ring in xz plane
        casesList.forEach((c: any, index: number) => {
          const angle = (index * 2 * Math.PI) / (casesList.length || 1)
          const radius = 8
          const x = radius * Math.cos(angle)
          const y = 0
          const z = radius * Math.sin(angle)
          
          const caseNode: Node = { ...c, x, y, z }
          computedNodes.push(caseNode)
          nodesMap.set(c.id, caseNode)
        })

        // 2. Position other nodes clustering around their connected case nodes
        const edgesList: Edge[] = data.edges
        const casePositions = new Map<string, { x: number; y: number; z: number }>()
        computedNodes.forEach(n => {
          casePositions.set(n.id, { x: n.x || 0, y: n.y || 0, z: n.z || 0 })
        })

        // Track number of spokes for each case to angle them correctly
        const spokesCount = new Map<string, number>()

        otherList.forEach((node: any) => {
          // Find first edge connected to this node that leads to a case
          const parentEdge = edgesList.find(e => 
            (e.source === node.id && e.target.startsWith("case_")) || 
            (e.target === node.id && e.source.startsWith("case_"))
          )
          
          let parentCaseId = ""
          if (parentEdge) {
            parentCaseId = parentEdge.target.startsWith("case_") ? parentEdge.target : parentEdge.source
          } else {
            // Default to first case if disconnected
            parentCaseId = casesList[0]?.id || ""
          }

          const center = casePositions.get(parentCaseId) || { x: 0, y: 0, z: 0 }
          const count = spokesCount.get(parentCaseId) || 0
          spokesCount.set(parentCaseId, count + 1)

          // Helical / spherical offset coordinates around case center
          const orbitalRadius = 3.2
          const angle = count * 1.1 // Orbit spacing
          const x = center.x + orbitalRadius * Math.cos(angle)
          const y = center.y + orbitalRadius * Math.sin(angle) * 0.4 + (count * 0.2 - 0.5)
          const z = center.z + orbitalRadius * Math.sin(angle) * 0.9

          const orbitNode: Node = { ...node, x, y, z }
          computedNodes.push(orbitNode)
          nodesMap.set(node.id, orbitNode)
        })

        setNodes(computedNodes)
        setEdges(edgesList)
        
        // Default select first accused suspect
        const firstAccused = computedNodes.find(n => n.type === "accused")
        if (firstAccused) setSelectedNode(firstAccused)

      } catch (err: any) {
        setError(err.message || "Failed to parse network database")
      } finally {
        setLoading(false)
      }
    }

    fetchGraphData()
  }, [])

  // Create a map for fast coordinate lookups
  const nodesMap = useMemo(() => {
    const map = new Map<string, Node>()
    nodes.forEach(n => map.set(n.id, n))
    return map
  }, [nodes])

  // Filter nodes matching search
  const filteredNodes = useMemo(() => {
    if (!searchQuery) return nodes
    return nodes.filter(n => n.label.toLowerCase().includes(searchQuery.toLowerCase()))
  }, [searchQuery, nodes])

  // Selected node connections
  const connectedEdges = useMemo(() => {
    if (!selectedNode) return []
    return edges.filter(e => e.source === selectedNode.id || e.target === selectedNode.id)
  }, [selectedNode, edges])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center space-y-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-900 border-t-transparent mx-auto"></div>
          <p className="text-xs text-slate-500 font-medium">Generating 3D spatial connection nodes...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-center space-y-2">
        <h4 className="text-sm font-bold text-red-700">Network Engine Failure</h4>
        <p className="text-xs text-red-600">{error}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-100px)] w-full gap-6 select-none font-sans overflow-hidden">
      
      {/* Left panel: Directory & Node Inspector */}
      <div className="w-full md:w-[360px] h-[300px] md:h-full shrink-0 flex flex-col gap-4 overflow-y-auto">
        
        {/* Search & Mode select */}
        <Card className="border border-blue-100 bg-white shadow-sm rounded-xl">
          <CardHeader className="p-4 border-b border-blue-50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xs font-black text-slate-900 uppercase tracking-wider">Syndicate Link</CardTitle>
                <CardDescription className="text-[10px] text-slate-400 font-medium">3D relationship transaction network</CardDescription>
              </div>
              <Network className="h-4.5 w-4.5 text-blue-900" />
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(e: any) => setSearchQuery(e.target.value)}
                placeholder="Search suspect, victim, or account..."
                className="pl-8.5 h-9 border-blue-100 text-xs focus-visible:ring-blue-900 focus-visible:border-blue-900"
              />
            </div>

            {/* Toggle view mode */}
            <div className="flex items-center justify-between border-t border-blue-50 pt-2.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase">View Mode</span>
              <button
                onClick={() => setIs3DMode(!is3DMode)}
                className="flex items-center gap-1.5 text-xs font-bold text-blue-900 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-lg"
              >
                <ToggleLeft className={`h-4 w-4 transition-transform ${is3DMode ? "rotate-180 text-blue-900" : "text-slate-400"}`} />
                {is3DMode ? "3D Canvas" : "2D Grid Layout"}
              </button>
            </div>

          </CardContent>
        </Card>

        {/* Selected Node Details Card */}
        {selectedNode && (
          <Card className="border border-blue-100 bg-white shadow-sm rounded-xl flex-1 flex flex-col overflow-hidden">
            <CardHeader className="p-4 border-b border-blue-50 bg-blue-50/10">
              <div className="flex items-center gap-2">
                <span className={`h-3 w-3 rounded-full ${
                  selectedNode.type === "case" ? "bg-blue-900" :
                  selectedNode.type === "accused" ? "bg-red-500" :
                  selectedNode.type === "victim" ? "bg-emerald-500" : "bg-amber-500"
                }`}></span>
                <CardTitle className="text-xs font-black text-slate-900 uppercase tracking-widest leading-none">
                  {selectedNode.type} Details
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4 flex-1 overflow-y-auto space-y-4">
              
              <div>
                <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Node Name / ID</h4>
                <div className="text-sm font-black text-slate-900 pt-0.5">{selectedNode.label}</div>
              </div>

              {selectedNode.type === "case" && selectedNode.date && (
                <div>
                  <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Registration Date</h4>
                  <div className="text-xs font-semibold text-slate-600 pt-0.5">{new Date(selectedNode.date).toLocaleDateString()}</div>
                </div>
              )}

              {/* Connected edges list */}
              <div className="space-y-2 border-t border-blue-50 pt-3">
                <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Direct Connections ({connectedEdges.length})</h4>
                
                {connectedEdges.length === 0 ? (
                  <div className="text-[10px] text-slate-400 italic">No direct connections mapped.</div>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {connectedEdges.map((e, idx) => {
                      const otherNodeId = e.source === selectedNode.id ? e.target : e.source
                      const otherNode = nodesMap.get(otherNodeId)
                      if (!otherNode) return null

                      return (
                        <div 
                          key={idx}
                          onClick={() => setSelectedNode(otherNode)}
                          className="flex items-center justify-between p-2 rounded-lg border border-blue-50 bg-slate-50/50 hover:bg-blue-50/20 cursor-pointer text-xs transition-all"
                        >
                          <div className="flex flex-col max-w-[70%]">
                            <span className="text-[9px] font-bold text-slate-900 truncate">{otherNode.label}</span>
                            <span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">{otherNode.type}</span>
                          </div>
                          <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded ${
                            e.type === "transaction"
                              ? "bg-amber-50 text-amber-600 border border-amber-100"
                              : "bg-blue-50 text-blue-800 border border-blue-100"
                          }`}>
                            {e.label}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

            </CardContent>
          </Card>
        )}

      </div>

      {/* Right panel: Dynamic Visualization Workspace */}
      <div className="flex-1 border border-blue-100 rounded-xl overflow-hidden shadow-sm bg-slate-950 relative flex flex-col min-h-[350px] md:min-h-0">
        
        {/* Helper Top Bar */}
        <div className="absolute top-4 left-4 bg-slate-900/90 border border-blue-850 px-3 py-1.5 rounded-lg z-10 text-[9px] font-semibold text-slate-400 flex items-center gap-1.5 select-none shadow-md backdrop-blur-sm pointer-events-none">
          <Info className="h-3.5 w-3.5 text-blue-450" /> Left-click + drag to rotate • Scroll wheel to zoom
        </div>

        {/* 3D Canvas Visualizer */}
        {is3DMode ? (
          <div className="flex-1 w-full h-full cursor-grab active:cursor-grabbing">
            <Canvas camera={{ position: [0, 0, 16], fov: 60 }}>
              <ambientLight intensity={1.5} />
              <pointLight position={[10, 10, 10]} intensity={1.5} />
              <pointLight position={[-10, -10, -10]} intensity={0.5} />
              
              <OrbitControls enableZoom={true} enablePan={true} maxDistance={25} minDistance={4} />

              {/* Render 3D Edges */}
              {edges.map((edge, idx) => (
                <ThreeEdge key={idx} edge={edge} nodesMap={nodesMap} />
              ))}

              {/* Render 3D Nodes */}
              {filteredNodes.map((node) => (
                <ThreeNode
                  key={node.id}
                  node={node}
                  onClick={() => setSelectedNode(node)}
                  isSelected={selectedNode?.id === node.id}
                />
              ))}
            </Canvas>
          </div>
        ) : (
          /* Responsive 2D Grid Layout Fallback (useful for clean filtering directory lookup) */
          <div className="flex-1 w-full h-full overflow-y-auto p-6 bg-slate-900 text-white flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest border-b border-slate-800 pb-2">
                Filtered Node Network List ({filteredNodes.length})
              </h3>
              
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {filteredNodes.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => setSelectedNode(n)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedNode?.id === n.id
                        ? "bg-blue-900/40 border-blue-500 text-white shadow-md"
                        : "bg-slate-800/40 border-slate-800 text-slate-300 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-widest text-slate-500 mb-1">
                      <span>{n.type}</span>
                      {n.type === "account" && <Landmark className="h-3 w-3 text-amber-500" />}
                      {n.type === "accused" && <Users className="h-3 w-3 text-red-500" />}
                    </div>
                    <div className="text-xs font-bold truncate">{n.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-blue-950/20 border border-blue-900/30 text-[10px] text-blue-300 max-w-lg mt-6">
              Toggle "3D Canvas" mode above to explore connections in spatial coordinate orbits!
            </div>
          </div>
        )}

        {/* Legend Overlay on Map Canvas */}
        <div className="absolute bottom-4 right-4 bg-slate-900/95 border border-slate-800 rounded-lg p-2.5 shadow-md z-10 text-[9px] font-semibold space-y-1 text-slate-400 backdrop-blur-sm pointer-events-none select-none">
          <div className="font-bold border-b border-slate-800 pb-0.5 mb-1 text-white uppercase tracking-wider">Node Legend</div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#1E3A8A] border border-blue-400/20"></span> FIR case Head
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#EF4444] border border-red-400/20"></span> Accused Node
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#10B981] border border-emerald-400/20"></span> Victim Node
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#F59E0B] border border-amber-400/20"></span> Bank Account
          </div>
        </div>

      </div>

    </div>
  )
}
