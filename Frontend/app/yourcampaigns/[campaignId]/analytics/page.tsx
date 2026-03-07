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

const fetcher = (url: string) => fetch(url).then(res => res.json())

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

  const { 
    callsTotal = 0, 
    callsAnswered = 0, 
    callsMissed = 0,
    whatsappMessagesSent = 0, 
    whatsappInteractedUsers = 0, 
    whatsappConversations = [],
    answeredContacts = [],
    missedContacts = []
  } = data
  
  // Calculate metrics
  const voiceCalls = callsTotal
  const voiceCallsAnswered = callsAnswered
  const voiceCallsMissed = callsMissed
  const voiceCallsAnsweredRate = voiceCalls > 0
    ? Math.round((voiceCallsAnswered / voiceCalls) * 100)
    : 0
  const engagementScore = voiceCalls > 0
    ? Math.round((voiceCallsAnswered / voiceCalls) * 100)
    : 0

  const chartData = [
    { name: 'Answered', value: voiceCallsAnswered, color: '#22c55e' },
    { name: 'Missed', value: voiceCallsMissed, color: '#ef4444' },
  ]
  
  // Handle missing data gracefully
  const totalChartValue = voiceCallsAnswered + voiceCallsMissed || 1

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
            <h1 className="text-5xl font-bold tracking-tight mb-2">Campaign Analytics</h1>
            <p className="text-white/40 text-lg">Real-time performance metrics for your campaign.</p>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-4 mb-8">
          {[
            { label: 'Total Calls', value: voiceCalls, icon: VscCallOutgoing, color: 'text-blue-400' },
            { label: 'Answered', value: voiceCallsAnswered, icon: MdCheckCircle, color: 'text-green-400' },
            { label: 'Missed', value: voiceCallsMissed, icon: MdCancel, color: 'text-red-400' },
            { label: 'Answer Rate', value: `${voiceCallsAnsweredRate}%`, icon: MdTimer, color: 'text-purple-400' },
            { label: 'Engagement', value: `${engagementScore}%`, icon: VscGraph, color: 'text-yellow-400' },
            { label: 'WA Messages', value: whatsappMessagesSent, icon: MdMessage, color: 'text-green-400', onClick: () => setWhatsappModal('messages') },
            { label: 'WA Users', value: whatsappInteractedUsers, icon: MdPeople, color: 'text-cyan-400', onClick: () => setWhatsappModal('users') },
          ].map((kpi, i) => (
            <div 
              key={i}
              className={`bg-white/2 border border-white/5 p-6 rounded-3xl backdrop-blur-md transition-all ${kpi.onClick ? 'cursor-pointer hover:bg-white/5 hover:border-white/10' : ''}`}
              onClick={kpi.onClick}
              style={{
                animation: 'fadeIn 0.4s ease-out forwards',
                animationDelay: `${i * 0.06}s`
              }}
            >
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
          <div 
            className="lg:col-span-2 bg-white/2 border border-white/5 p-8 rounded-3xl backdrop-blur-md"
            style={{
              animation: 'fadeIn 0.4s ease-out forwards',
              animationDelay: '0.42s'
            }}
          >
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
          <div 
            className="bg-white/2 border border-white/5 p-8 rounded-3xl backdrop-blur-md flex flex-col items-center justify-center font-bold"
            style={{
              animation: 'fadeIn 0.4s ease-out forwards',
              animationDelay: '0.48s'
            }}
          >
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
        <div 
          className="bg-white/2 border border-white/5 rounded-3xl backdrop-blur-md overflow-hidden font-bold"
          style={{
            animation: 'fadeIn 0.4s ease-out forwards',
            animationDelay: '0.54s'
          }}
        >
          <div className="p-8 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <VscHistory className="text-purple-400" />
              Call Status
            </h3>
          </div>
          <div className="p-8">
            {voiceCalls > 0 ? (
              <div className="space-y-4">
                <div className="bg-white/2 border border-white/5 p-6 rounded-2xl">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-lg font-bold">Call Summary</p>
                      <p className="text-sm text-white/40">Total calls made: {voiceCalls}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-green-400">{voiceCallsAnswered}</p>
                      <p className="text-xs text-white/40">calls answered</p>
                    </div>
                  </div>
                  <div className="flex gap-4 text-sm text-white/60">
                    <span>✅ Answered: {voiceCallsAnswered}</span>
                    <span>❌ Missed: {voiceCallsMissed}</span>
                    <span>📈 Rate: {voiceCallsAnsweredRate}%</span>
                  </div>
                </div>
                {answeredContacts.length > 0 && (
                  <div className="mt-6">
                    <p className="text-sm font-bold text-white/60 mb-3">Answered Calls</p>
                    {answeredContacts.slice(0, 5).map((contact: any, i: number) => (
                      <div 
                        key={i} 
                        className="text-sm text-white/40 py-2 border-b border-white/5"
                        style={{
                          animation: 'fadeIn 0.3s ease-out forwards',
                          animationDelay: `${0.54 + i * 0.05}s`
                        }}
                      >
                        {contact.phone || contact.contactId} - {contact.contactName || 'Unknown'}
                      </div>
                    ))}
                  </div>
                )}
                {missedContacts.length > 0 && (
                  <div className="mt-6">
                    <p className="text-sm font-bold text-white/60 mb-3">Missed Calls</p>
                    {missedContacts.slice(0, 5).map((contact: any, i: number) => (
                      <div 
                        key={i} 
                        className="text-sm text-white/40 py-2 border-b border-white/5"
                        style={{
                          animation: 'fadeIn 0.3s ease-out forwards',
                          animationDelay: `${0.54 + 0.28 + i * 0.05}s`
                        }}
                      >
                        {contact.phone || contact.contactId} - {contact.contactName || 'Unknown'}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-white/40 text-lg">No calls made yet. Launch your campaign to make calls.</p>
              </div>
            )}
          </div>
        </div>

        {/* WhatsApp Modal */}
        {whatsappModal && !selectedConversation && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-white/10 rounded-3xl max-w-2xl w-full max-h-[80vh] overflow-y-auto relative">
              {/* Modal Header */}
              <div className="sticky top-0 bg-zinc-900 border-b border-white/10 p-8 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {whatsappModal === 'messages' ? (
                    <MdMessage className="text-2xl text-green-400" />
                  ) : (
                    <MdPeople className="text-2xl text-cyan-400" />
                  )}
                  <h2 className="text-2xl font-bold">
                    {whatsappModal === 'messages' ? 'WhatsApp Messages Sent' : 'WhatsApp Users Interacted'}
                  </h2>
                </div>
                <button
                  onClick={() => setWhatsappModal(null)}
                  className="text-white/40 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-8">
                {whatsappConversations.length > 0 ? (
                  <div className="space-y-4">
                    {whatsappConversations.map((conv: any, idx: number) => (
                      <div
                        key={conv.contactId}
                        onClick={() => setSelectedConversation(conv)}
                        className="bg-white/2 border border-white/5 p-6 rounded-2xl hover:bg-white/5 transition-colors cursor-pointer group"
                        style={{
                          animation: 'fadeIn 0.4s ease-out forwards',
                          animationDelay: `${idx * 0.08}s`
                        }}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="text-lg font-bold group-hover:text-blue-400 transition-colors">{conv.contactName}</p>
                            <p className="text-sm text-white/40">{conv.phone}</p>
                          </div>
                          {whatsappModal === 'messages' ? (
                            <div className="text-right">
                              <p className="text-2xl font-bold text-green-400">{conv.messagesSent}</p>
                              <p className="text-xs text-white/40">messages sent</p>
                            </div>
                          ) : (
                            <div className="text-right">
                              <p className="text-2xl font-bold text-cyan-400">{conv.messagesReceived}</p>
                              <p className="text-xs text-white/40">messages received</p>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-4 text-sm text-white/60">
                          <span>📤 Sent: {conv.messagesSent}</span>
                          <span>📥 Received: {conv.messagesReceived}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-white/40 text-lg">
                      {whatsappModal === 'messages'
                        ? 'No WhatsApp messages sent yet.'
                        : 'No WhatsApp user interactions yet.'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Conversation Detail Modal */}
        {selectedConversation && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-white/10 rounded-3xl w-full max-w-2xl h-[80vh] max-h-[80vh] flex flex-col overflow-hidden relative">
              {/* Chat Header */}
              <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-b border-white/10 p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setSelectedConversation(null)}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                  >
                    <MdArrowBack className="text-xl text-white/60" />
                  </button>
                  <div>
                    <h2 className="text-xl font-bold">{selectedConversation.contactName}</h2>
                    <p className="text-sm text-white/40">{selectedConversation.phone}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-white/60">
                    {selectedConversation.messagesReceived + selectedConversation.messagesSent} messages
                  </p>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
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
                      <div
                        key={idx}
                        className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                        style={{
                          animation: `${isUser ? 'slideInRight' : 'slideInLeft'} 0.3s ease-out forwards`,
                          animationDelay: `${idx * 0.05}s`
                        }}
                      >
                        <div
                          className={`max-w-xs px-4 py-3 rounded-2xl ${
                            isUser
                              ? 'bg-blue-600 text-white rounded-br-none'
                              : 'bg-white/10 text-white/90 rounded-bl-none border border-white/20'
                          }`}
                        >
                          <p className="text-sm break-words leading-relaxed">{msg.content}</p>
                          <p className={`text-xs mt-1 ${isUser ? 'text-blue-200' : 'text-white/40'}`}>
                            {timestamp}
                          </p>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-white/40">No messages in this conversation</p>
                  </div>
                )}
              </div>

              {/* Chat Stats Footer */}
              <div className="border-t border-white/10 bg-white/2 p-6 grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-sm text-white/40">Messages Sent</p>
                  <p className="text-2xl font-bold text-green-400">{selectedConversation.messagesSent}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-white/40">Messages Received</p>
                  <p className="text-2xl font-bold text-cyan-400">{selectedConversation.messagesReceived}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-white/40">Last Updated</p>
                  <p className="text-sm font-bold text-white/60">
                    {new Date(selectedConversation.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
