'use client'

import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useState } from 'react'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Cell, PieChart, Pie 
} from 'recharts'
import useSWR from 'swr'
import { VscCallOutgoing, VscHistory, VscGraph } from 'react-icons/vsc'
import { MdTimer, MdCheckCircle, MdCancel, MdMessage, MdPeople, MdArrowBack } from 'react-icons/md'
import { BsWhatsapp } from 'react-icons/bs'

const fetcher = (url: string) => fetch(url).then(res => res.json())

// Helper: get initials from a name string
function getInitials(name: string) {
  if (!name) return '?'
  return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
}

export default function CampaignAnalyticsPage() {
  const params = useParams()
  const router = useRouter()
  const campaignId = params.campaignId as string
  const [whatsappModal, setWhatsappModal] = useState<'messages' | 'users' | null>(null)
  const [selectedConversation, setSelectedConversation] = useState<any>(null)

  const { data, error, isLoading, mutate } = useSWR(
    campaignId ? `/api/campaigns/${campaignId}/analytics` : null,
    fetcher,
    { refreshInterval: 10000 }
  )

  const { data: campaignData } = useSWR(
    campaignId ? `/api/campaigns/${campaignId}` : null,
    fetcher
  )

  const campaignName = campaignData?.title || campaignData?.campaign?.title || null

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
        <div className="text-center space-y-5">
          <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
            <MdCancel className="text-3xl text-red-400" />
          </div>
          <p className="text-white/50">Failed to load analytics data.</p>
          <button onClick={() => router.back()} className="px-6 py-2.5 bg-white text-black rounded-xl font-semibold text-sm hover:bg-white/90 transition-colors">
            Go Back
          </button>
        </div>
      </div>
    )
  }

  const { 
    whatsappMessagesSent = 0, 
    whatsappInteractedUsers = 0, 
    whatsappConversations = [],
    answeredContacts = [],
    missedContacts = []
  } = data
  
  // Demo override
  const voiceCallsAnswered = 1
  const voiceCallsMissed = 3
  const voiceCalls = voiceCallsAnswered + voiceCallsMissed
  const voiceCallsAnsweredRate = Math.round((voiceCallsAnswered / voiceCalls) * 100)
  const engagementScore = voiceCalls > 0
    ? Math.round((voiceCallsAnswered / voiceCalls) * 100)
    : 0

  // Bar chart — hardcoded call data
  const chartData = [
    { name: 'Answered', value: voiceCallsAnswered, color: '#22c55e' },
    { name: 'Missed', value: voiceCallsMissed, color: '#ef4444' },
  ]

  // Donut chart — WhatsApp reply ratio
  const waReplied = whatsappInteractedUsers
  const waNotReplied = Math.max(0, whatsappMessagesSent - whatsappInteractedUsers)
  const waReplyRate = whatsappMessagesSent > 0
    ? Math.round((waReplied / whatsappMessagesSent) * 100)
    : 0
  const waChartData = [
    { name: 'Users Interacted', value: waReplied || 0, color: '#06b6d4' },
    { name: 'Not Interacted', value: waNotReplied || 0, color: '#3f3f46' },
  ]

  return (
    <div className="min-h-screen bg-zinc-950 text-white selection:bg-white/10 relative overflow-hidden">
      {/* Ambient glow layers */}
      <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-blue-600/8 blur-[140px] rounded-full pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[500px] h-[500px] bg-violet-600/8 blur-[140px] rounded-full pointer-events-none" />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-emerald-600/4 blur-[160px] rounded-full pointer-events-none" />

      {/* ── Top nav bar ── */}
      <div className="sticky top-0 z-30 bg-zinc-950/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link
            href={`/yourcampaigns/${campaignId}`}
            className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm group"
          >
            <span className="group-hover:-translate-x-0.5 transition-transform">←</span>
            Back to Campaign
          </Link>

          <div className="flex items-center gap-2">
            <span className="hidden sm:flex items-center gap-1.5 text-xs text-white/30 mr-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Auto-refresh every 10s
            </span>
            <button
              onClick={() => mutate()}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl text-sm transition-all"
            >
              <VscGraph className="text-blue-400" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10 relative z-10">

        {/* ── Page header ── */}
        <div className="mb-10">
          <p className="text-xs text-white/30 uppercase tracking-widest mb-2">Campaign Analytics</p>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Performance Overview</h1>
          <p className="text-white/40 mt-2">Real-time metrics · <span className="text-white/70 font-medium">{campaignName ?? campaignId}</span></p>
        </div>

        {/* ── Hero KPI strip ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {/* Total Calls */}
          <div className="relative bg-gradient-to-br from-blue-500/10 to-blue-500/0 border border-blue-500/20 rounded-2xl p-5 overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 blur-2xl rounded-full" />
            <VscCallOutgoing className="text-blue-400 text-xl mb-3" />
            <p className="text-3xl font-bold">{voiceCalls}</p>
            <p className="text-xs text-white/40 mt-1">Total Calls</p>
          </div>
          {/* Answered */}
          <div className="relative bg-gradient-to-br from-emerald-500/10 to-emerald-500/0 border border-emerald-500/20 rounded-2xl p-5 overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 blur-2xl rounded-full" />
            <MdCheckCircle className="text-emerald-400 text-xl mb-3" />
            <p className="text-3xl font-bold text-emerald-400">{voiceCallsAnswered}</p>
            <p className="text-xs text-white/40 mt-1">Answered</p>
          </div>
          {/* Missed */}
          <div className="relative bg-gradient-to-br from-red-500/10 to-red-500/0 border border-red-500/20 rounded-2xl p-5 overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-red-500/10 blur-2xl rounded-full" />
            <MdCancel className="text-red-400 text-xl mb-3" />
            <p className="text-3xl font-bold text-red-400">{voiceCallsMissed}</p>
            <p className="text-xs text-white/40 mt-1">Missed</p>
          </div>
          {/* Answer Rate */}
          <div className="relative bg-gradient-to-br from-violet-500/10 to-violet-500/0 border border-violet-500/20 rounded-2xl p-5 overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-violet-500/10 blur-2xl rounded-full" />
            <MdTimer className="text-violet-400 text-xl mb-3" />
            <p className="text-3xl font-bold text-violet-400">{voiceCallsAnsweredRate}%</p>
            <p className="text-xs text-white/40 mt-1">Answer Rate</p>
            {/* Progress bar */}
            <div className="mt-3 h-1 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-violet-500 rounded-full transition-all duration-700"
                style={{ width: `${voiceCallsAnsweredRate}%` }}
              />
            </div>
          </div>
        </div>

        {/* ── WhatsApp KPI strip ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-10">
          <div
            onClick={() => setWhatsappModal('messages')}
            className="relative bg-gradient-to-br from-green-500/10 to-green-500/0 border border-green-500/20 rounded-2xl p-5 overflow-hidden cursor-pointer hover:border-green-500/50 hover:from-green-500/15 transition-all group"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/10 blur-2xl rounded-full" />
            <div className="flex items-center justify-between mb-3">
              <BsWhatsapp className="text-green-400 text-xl" />
              <span className="text-[10px] text-green-400/60 group-hover:text-green-400 transition-colors uppercase tracking-widest">View →</span>
            </div>
            <p className="text-3xl font-bold text-green-400">{whatsappMessagesSent}</p>
            <p className="text-xs text-white/40 mt-1">Contacts Messaged</p>
          </div>
          <div
            onClick={() => setWhatsappModal('users')}
            className="relative bg-gradient-to-br from-cyan-500/10 to-cyan-500/0 border border-cyan-500/20 rounded-2xl p-5 overflow-hidden cursor-pointer hover:border-cyan-500/50 hover:from-cyan-500/15 transition-all group"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 blur-2xl rounded-full" />
            <div className="flex items-center justify-between mb-3">
              <MdPeople className="text-cyan-400 text-xl" />
              <span className="text-[10px] text-cyan-400/60 group-hover:text-cyan-400 transition-colors uppercase tracking-widest">View →</span>
            </div>
            <p className="text-3xl font-bold text-cyan-400">{whatsappInteractedUsers}</p>
            <p className="text-xs text-white/40 mt-1">WhatsApp Users Interacted</p>
          </div>
          {/* Engagement score */}
          <div className="relative bg-gradient-to-br from-amber-500/10 to-amber-500/0 border border-amber-500/20 rounded-2xl p-5 overflow-hidden col-span-2 sm:col-span-1">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 blur-2xl rounded-full" />
            <VscGraph className="text-amber-400 text-xl mb-3" />
            <div className="flex items-end gap-2">
              <p className="text-3xl font-bold text-amber-400">{engagementScore}%</p>
              <p className="text-xs text-white/40 mb-1">engagement</p>
            </div>
            <div className="mt-3 h-1 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-700"
                style={{ width: `${engagementScore}%` }}
              />
            </div>
          </div>
        </div>

        {/* ── Charts ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Bar chart */}
          <div className="lg:col-span-2 bg-white/[0.02] border border-white/8 rounded-2xl p-7 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold flex items-center gap-2 text-white/80">
                <VscGraph className="text-blue-400" />
                Call Distribution
              </h3>
              <div className="flex items-center gap-4 text-xs text-white/40">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />Answered</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" />Missed</span>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barSize={56}>
                  <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 13 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 12 }} />
                  <Tooltip
                    cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                    contentStyle={{ backgroundColor: '#0f0f11', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}
                    labelStyle={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.85} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Donut + percentage — WhatsApp reply rate */}
          <div className="bg-white/[0.02] border border-white/8 rounded-2xl p-7 backdrop-blur-sm flex flex-col">
            <div className="mb-6">
              <h3 className="font-semibold text-white/80">WhatsApp Reply Rate</h3>
              <p className="text-xs text-white/30 mt-0.5">{whatsappMessagesSent} msgs sent · {whatsappInteractedUsers} users interacted</p>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="relative w-44 h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={waChartData} innerRadius={56} outerRadius={76} paddingAngle={6} dataKey="value" startAngle={90} endAngle={-270}>
                      {waChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-4xl font-bold text-cyan-400">{waReplyRate}%</span>
                  <span className="text-[10px] text-white/30 uppercase tracking-widest mt-0.5">replied</span>
                </div>
              </div>
              <div className="mt-6 w-full space-y-2">
                {waChartData.map((d) => (
                  <div key={d.name} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-white/50">
                      <span className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                      {d.name}
                    </span>
                    <span className="font-semibold" style={{ color: d.color }}>{d.value}</span>
                  </div>
                ))}
                <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs text-white/30">
                  <span>Total contacts messaged</span>
                  <span className="font-medium text-white/50">{whatsappMessagesSent}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── WhatsApp conversations preview ── */}
        {whatsappConversations.length > 0 && (
          <div className="bg-white/[0.02] border border-white/8 rounded-2xl overflow-hidden backdrop-blur-sm">
            <div className="px-7 py-5 border-b border-white/5 flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2 text-white/80">
                <BsWhatsapp className="text-green-400" />
                WhatsApp Conversations
              </h3>
              <span className="text-xs text-white/30">{whatsappConversations.length} conversations</span>
            </div>
            <div className="p-7 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {whatsappConversations.slice(0, 6).map((conv: any, idx: number) => (
                <div
                  key={conv.contactId}
                  onClick={() => { setSelectedConversation(conv) }}
                  className="flex items-center gap-3 p-4 bg-white/3 border border-white/6 rounded-xl hover:border-green-500/30 hover:bg-green-500/5 transition-all cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-full bg-green-500/15 border border-green-500/20 flex items-center justify-center text-green-400 text-sm font-bold flex-shrink-0">
                    {getInitials(conv.contactName || '')}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate group-hover:text-green-300 transition-colors">{conv.contactName}</p>
                    <p className="text-xs text-white/30 truncate">{conv.phone}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-white/50">{conv.messagesSent + conv.messagesReceived} msgs</p>
                  </div>
                </div>
              ))}
            </div>
            {whatsappConversations.length > 6 && (
              <div className="px-7 pb-5 text-center">
                <button
                  onClick={() => setWhatsappModal('messages')}
                  className="text-xs text-white/30 hover:text-white/60 transition-colors"
                >
                  + {whatsappConversations.length - 6} more conversations
                </button>
              </div>
            )}
          </div>
        )}

      </div>

      {/* ══ WhatsApp Modal ══ */}
      {whatsappModal && !selectedConversation && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl">
            {/* Modal header */}
            <div className="sticky top-0 bg-zinc-900/95 backdrop-blur-sm border-b border-white/8 px-7 py-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {whatsappModal === 'messages' ? (
                  <div className="w-9 h-9 rounded-xl bg-green-500/15 flex items-center justify-center">
                    <MdMessage className="text-green-400" />
                  </div>
                ) : (
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/15 flex items-center justify-center">
                    <MdPeople className="text-cyan-400" />
                  </div>
                )}
                <div>
                  <h2 className="font-semibold">
                    {whatsappModal === 'messages' ? 'Messages Sent' : 'Users Interacted'}
                  </h2>
                  <p className="text-xs text-white/30">WhatsApp · {whatsappConversations.length} conversations</p>
                </div>
              </div>
              <button onClick={() => setWhatsappModal(null)} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-all">
                ✕
              </button>
            </div>

            <div className="p-6">
              {whatsappConversations.length > 0 ? (
                <div className="space-y-3">
                  {whatsappConversations.map((conv: any, idx: number) => (
                    <div
                      key={conv.contactId}
                      onClick={() => setSelectedConversation(conv)}
                      className="flex items-center gap-4 p-4 bg-white/3 border border-white/6 rounded-xl hover:border-white/15 hover:bg-white/5 transition-all cursor-pointer group"
                    >
                      <div className="w-10 h-10 rounded-full bg-green-500/15 border border-green-500/20 flex items-center justify-center text-green-400 text-sm font-bold flex-shrink-0">
                        {getInitials(conv.contactName || '')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium group-hover:text-blue-300 transition-colors truncate">{conv.contactName}</p>
                        <p className="text-sm text-white/30 truncate">{conv.phone}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        {whatsappModal === 'messages' ? (
                          <>
                            <p className="text-xl font-bold text-green-400">{conv.messagesSent}</p>
                            <p className="text-xs text-white/30">sent</p>
                          </>
                        ) : (
                          <>
                            <p className="text-xl font-bold text-cyan-400">{conv.messagesReceived}</p>
                            <p className="text-xs text-white/30">received</p>
                          </>
                        )}
                      </div>
                      <div className="text-white/20 group-hover:text-white/60 transition-colors text-sm">›</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <BsWhatsapp className="text-3xl text-white/10 mx-auto mb-3" />
                  <p className="text-white/30">
                    {whatsappModal === 'messages' ? 'No WhatsApp messages sent yet.' : 'No WhatsApp user interactions yet.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══ Conversation Detail Modal ══ */}
      {selectedConversation && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-2xl h-[82vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Chat header */}
            <div className="bg-gradient-to-r from-green-500/8 to-emerald-500/5 border-b border-white/8 px-6 py-4 flex items-center gap-4">
              <button
                onClick={() => setSelectedConversation(null)}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all flex-shrink-0"
              >
                <MdArrowBack />
              </button>
              <div className="w-10 h-10 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center text-green-400 font-bold text-sm flex-shrink-0">
                {getInitials(selectedConversation.contactName || '')}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold truncate">{selectedConversation.contactName}</h2>
                <p className="text-xs text-white/30">{selectedConversation.phone}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-semibold">{selectedConversation.messagesReceived + selectedConversation.messagesSent}</p>
                <p className="text-xs text-white/30">messages</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-3 bg-zinc-950/50">
              {selectedConversation.messages && selectedConversation.messages.length > 0 ? (
                [...selectedConversation.messages]
                  .sort((a: any, b: any) => {
                    const timeA = new Date(a.timestamp || a.createdAt).getTime()
                    const timeB = new Date(b.timestamp || b.createdAt).getTime()
                    return timeA - timeB
                  })
                  .map((msg: any, idx: number) => {
                    const isUser = msg.sender === 'user'
                    const timestamp = new Date(msg.timestamp || msg.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                    return (
                      <div key={idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-sm px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                            isUser
                              ? 'bg-blue-600 text-white rounded-br-none'
                              : 'bg-white/8 text-white/90 rounded-bl-none border border-white/10'
                          }`}
                        >
                          <p className="break-words">{msg.content}</p>
                          <p className={`text-[10px] mt-1.5 ${isUser ? 'text-blue-200/70' : 'text-white/30'}`}>{timestamp}</p>
                        </div>
                      </div>
                    )
                  })
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-white/30 text-sm">No messages in this conversation</p>
                </div>
              )}
            </div>

            {/* Footer stats */}
            <div className="border-t border-white/8 bg-zinc-900/80 px-6 py-4 grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-lg font-bold text-green-400">{selectedConversation.messagesSent}</p>
                <p className="text-xs text-white/30 mt-0.5">Sent</p>
              </div>
              <div className="border-l border-white/8">
                <p className="text-lg font-bold text-cyan-400">{selectedConversation.messagesReceived}</p>
                <p className="text-xs text-white/30 mt-0.5">Received</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
