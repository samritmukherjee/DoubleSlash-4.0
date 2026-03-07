'use client'

import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Cell, PieChart, Pie 
} from 'recharts'
import useSWR from 'swr'
import { VscCallOutgoing, VscHistory, VscGraph } from 'react-icons/vsc'
import { MdTimer, MdCheckCircle, MdCancel } from 'react-icons/md'

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function CampaignAnalyticsPage() {
  const params = useParams()
  const router = useRouter()
  const campaignId = params.campaignId as string

  const { data, error, isLoading, mutate } = useSWR(
    campaignId ? `/api/campaigns/${campaignId}/analytics` : null,
    fetcher,
    { refreshInterval: 10000 }
  )

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center animate-pulse">
          <img src="/favicon.svg" alt="Loading" className="w-12 h-12 mx-auto mb-4 animate-spin" />
          <p className="text-white/50">Aggregating real-time analytics...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">Failed to load analytics data.</p>
          <button onClick={() => router.back()} className="px-6 py-2 bg-white text-black rounded-lg font-bold">Go Back</button>
        </div>
      </div>
    )
  }

  const { campaign, analytics, callHistory = [] } = data
  const { voiceCalls, voiceCallsAnswered, voiceCallsMissed, voiceCallsAnsweredRate, engagementScore } = analytics
  
  const avgDuration = analytics.avgResponseTimeMs / 1000 || 0

  const chartData = [
    { name: 'Answered', value: voiceCallsAnswered, color: '#22c55e' },
    { name: 'Missed', value: voiceCallsMissed, color: '#ef4444' },
  ]

  return (
    <div className="min-h-screen bg-zinc-950 text-white selection:bg-white/10 p-6 md:p-12 relative overflow-hidden">
      {/* Background Glow */}
      <div className="fixed top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <Link href={`/yourcampaigns/${campaignId}`} className="text-white/40 hover:text-white transition-colors text-sm mb-4 inline-block">
              ← Back to Campaign
            </Link>
            <h1 className="text-5xl font-bold tracking-tight mb-2">{campaign.title} Analytics</h1>
            <p className="text-white/40 text-lg">Real-time performance tracking for your Vapi AI agent.</p>
          </div>
          <button 
            onClick={() => mutate()}
            className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all flex items-center gap-2 group"
          >
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Live Updates
          </button>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {[
            { label: 'Total Calls', value: voiceCalls, icon: VscCallOutgoing, color: 'text-blue-400' },
            { label: 'Answered', value: voiceCallsAnswered, icon: MdCheckCircle, color: 'text-green-400' },
            { label: 'Missed', value: voiceCallsMissed, icon: MdCancel, color: 'text-red-400' },
            { label: 'Avg Duration', value: `${Math.round(avgDuration)}s`, icon: MdTimer, color: 'text-purple-400' },
            { label: 'Engagement', value: `${engagementScore}%`, icon: VscGraph, color: 'text-yellow-400' },
          ].map((kpi, i) => (
            <div key={i} className="bg-white/2 border border-white/5 p-6 rounded-3xl backdrop-blur-md">
              <div className="flex items-center justify-between mb-4">
                <kpi.icon className={`text-2xl ${kpi.color}`} />
                <span className="text-[10px] uppercase tracking-widest text-white/20">Metric</span>
              </div>
              <p className="text-white/40 text-xs mb-1 font-medium">{kpi.label}</p>
              <p className="text-3xl font-bold">{kpi.value}</p>
            </div>
          ))}
        </div>

        {/* Charts & Graphs */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Main Chart */}
          <div className="lg:col-span-2 bg-white/2 border border-white/5 p-8 rounded-3xl backdrop-blur-md">
            <h3 className="text-xl font-bold mb-8 flex items-center gap-2">
              <VscGraph className="text-blue-400 font-bold" />
              Call Distribution
            </h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#ffffff60'}} />
                  <YAxis hide />
                  <Tooltip 
                    cursor={{fill: 'rgba(255,255,255,0.03)'}} 
                    contentStyle={{backgroundColor: '#09090b', border: '1px solid #ffffff10', borderRadius: '16px'}} 
                  />
                  <Bar dataKey="value" radius={[12, 12, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.8} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Ratio Chart */}
          <div className="bg-white/2 border border-white/5 p-8 rounded-3xl backdrop-blur-md flex flex-col items-center justify-center font-bold">
            <h3 className="text-xl font-bold mb-4 w-full">Answer Rate</h3>
            <div className="relative w-48 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold">{voiceCallsAnsweredRate}%</span>
                <span className="text-[10px] text-white/40 uppercase">Success</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Calls Table */}
        <div className="bg-white/2 border border-white/5 rounded-3xl backdrop-blur-md overflow-hidden font-bold">
          <div className="p-8 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <VscHistory className="text-purple-400" />
              Recent Call Logs
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] uppercase tracking-widest text-white/40 border-b border-white/5">
                  <th className="px-8 py-4 font-medium">Customer</th>
                  <th className="px-8 py-4 font-medium">Status</th>
                  <th className="px-8 py-4 font-medium">Duration</th>
                  <th className="px-8 py-4 font-medium">Reason</th>
                  <th className="px-8 py-4 font-medium">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {callHistory.length > 0 ? callHistory.map((call: any) => (
                  <tr key={call.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-8 py-4 font-bold">
                      <p className="text-sm">{call.customerPhone}</p>
                    </td>
                    <td className="px-8 py-4">
                      <span className={`text-[10px] px-2 py-1 rounded-full border font-bold ${
                        call.duration > 0 ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
                      }`}>
                        {call.status?.toUpperCase() || 'ENDED'}
                      </span>
                    </td>
                    <td className="px-8 py-4 font-bold text-sm text-white/70">{call.duration}s</td>
                    <td className="px-8 py-4 font-bold text-sm text-white/40">{call.endedReason?.replace(/-/g, ' ')}</td>
                    <td className="px-8 py-4 font-bold text-sm text-white/40">
                      {new Date(call.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="px-8 py-12 text-center text-white/20 italic">No call logs recorded yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
