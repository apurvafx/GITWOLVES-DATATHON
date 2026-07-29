import React, { useState } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Shield, Eye, EyeOff } from "lucide-react"
import { API_BASE_URL } from "@/config"

interface LoginProps {
  onLoginSuccess: (userData: { username: string; name: string; role: string; kgid: string; token: string }) => void
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState("Investigator")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  // Map username helper based on role selection for easy hackathon demo logging
  const handleRoleChange = (selectedRole: string) => {
    setRole(selectedRole)
    setUsername(selectedRole.toLowerCase())
    setPassword("password123")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || "Authentication failed")
      }

      // Store in local storage
      localStorage.setItem("ksp_user_token", data.token)
      localStorage.setItem("ksp_user_name", data.name)
      localStorage.setItem("ksp_user_role", data.role)
      localStorage.setItem("ksp_user_kgid", data.kgid)
      localStorage.setItem("ksp_username", data.username)

      onLoginSuccess(data)
    } catch (err: any) {
      setError(err.message || "Connection refused by KSP API Gateway")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F0F4F8] px-4 font-sans">
      <div className="w-full max-w-[420px]">
        {/* KSP Branding Header */}
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-900 text-white shadow-sm mb-3">
            <Shield className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-gray-900">KSP-CRIMEPILOT</h2>
          <p className="text-xs text-gray-500 mt-1">
            State Crime Records Bureau (SCRB) • Karnataka Police
          </p>
        </div>

        <Card className="border border-blue-100 bg-white shadow-md rounded-xl">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-lg font-semibold text-gray-950">Officer Authorization</CardTitle>
            <CardDescription className="text-xs text-gray-500">
              Select your role credential to log in to the command hub
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Role Select Quick Tabs */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-700">Select Access Credential</Label>
                <div className="grid grid-cols-3 gap-1.5">
                  {["Investigator", "Analyst", "Supervisor", "Policymaker", "Constable"].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => handleRoleChange(r)}
                      className={`py-1.5 px-2 text-[10px] font-bold border rounded-md transition-all text-center ${
                        role === r
                          ? "bg-blue-900 text-white border-blue-900 shadow-sm"
                          : "bg-blue-50/20 text-slate-700 border-blue-100 hover:bg-blue-50/50"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Username Input */}
              <div className="space-y-1.5">
                <Label htmlFor="username" className="text-xs font-semibold text-gray-700">Username / KGID</Label>
                <Input
                  id="username"
                  placeholder="e.g. investigator"
                  value={username}
                  onChange={(e: any) => setUsername(e.target.value)}
                  required
                  className="h-9 border-blue-100 text-sm focus-visible:ring-blue-900 focus-visible:border-blue-900 bg-white"
                />
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-semibold text-gray-700">Security PIN / Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e: any) => setPassword(e.target.value)}
                    required
                    className="h-9 pr-9 border-blue-100 text-sm focus-visible:ring-blue-900 focus-visible:border-blue-900 bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-2.5 rounded-md bg-red-50 border border-red-100 text-xs text-red-600 font-medium">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-9 bg-blue-900 text-white hover:bg-blue-800 text-sm font-medium transition-colors rounded-lg shadow-sm"
              >
                {loading ? "Authorizing Security Node..." : "Establish Secure Link"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer Audit Notice */}
        <div className="mt-8 text-center text-[10px] text-gray-400 leading-relaxed max-w-[320px] mx-auto">
          RESTRICTED ACCESS AREA. All sessions are logged and audited in accordance with the IT Governance framework of the Karnataka Police Department.
        </div>
      </div>
    </div>
  )
}
