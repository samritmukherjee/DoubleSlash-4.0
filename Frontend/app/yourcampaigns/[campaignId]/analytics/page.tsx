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
import { BsWhatsapp, BsLightningChargeFill } from 'react-icons/bs'
import { motion, AnimatePresence } from 'framer-motion'

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
    totalContacts = 0,
    whatsappConversations = [],
    answeredContacts = [],
    missedContacts = []
  } = data
  
  // Demo override
  const voiceCallsAnswered = 1
  const voiceCallsMissed = 1
  const voiceCalls = 2
  const voiceCallsAnsweredRate = Math.round((voiceCallsAnswered / voiceCalls) * 100)
  const engagementScore = voiceCalls > 0
    ? Math.round((voiceCallsAnswered / voiceCalls) * 100)
    : 0

  // Bar chart — hardcoded call data
  const chartData = [
    { name: 'Answered', value: voiceCallsAnswered, color: '#22c55e' },
    { name: 'Missed', value: voiceCallsMissed, color: '#ef4444' },
  ]

  // Donut chart — WhatsApp reply ratio (interacted vs total contacts)
  const waReplied = whatsappInteractedUsers
  const waTotal = totalContacts > 0 ? totalContacts : Math.max(whatsappMessagesSent, whatsappInteractedUsers)
  const waNotReplied = Math.max(0, waTotal - waReplied)
  const waReplyRate = waTotal > 0
    ? Math.round((waReplied / waTotal) * 100)
    : 0
  const waChartData = [
    { name: 'Users Interacted', value: waReplied || 0, color: '#06b6d4' },
    { name: 'Not Interacted', value: waNotReplied || 0, color: '#3f3f46' },
  ]

  return (
    <div className="min-h-screen bg-[#0F0B0A] text-white selection:bg-white/10 relative overflow-hidden font-sans">

      {/* ── Top Floating Buttons ── */}
      <div className="absolute top-6 left-6 z-50">
        <Link
          href={`/yourcampaigns/${campaignId}`}
          className="flex items-center gap-2 text-white/50 hover:text-white transition-all text-[13px] font-medium group bg-white/[0.02] border border-white/5 px-4 py-2 rounded-full backdrop-blur-xl hover:bg-white/[0.05]"
        >
           <MdArrowBack className="text-base group-hover:-translate-x-0.5 transition-transform" />
          Back to Campaign
        </Link>
      </div>

      <div className="absolute top-6 right-6 z-50 flex items-center gap-4">
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-xl">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" />
          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Live Sync</span>
        </div>
        <button
          onClick={() => mutate()}
          className="flex items-center gap-2 px-5 py-2 bg-white hover:bg-zinc-200 text-black rounded-full text-[13px] font-semibold transition-all active:scale-95 shadow-xl"
        >
          Refresh
        </button>
      </div>


      <div className="max-w-7xl mx-auto px-6 pt-24 pb-16 relative z-10">

        {/* ── Page header ── */}
        <header className="mb-14 text-center mt-4">
          <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-3 font-sans">Campaign Analytics</p>
          <h1 className="text-4xl md:text-6xl font-instrument mb-3 text-zinc-100">
            Performance Overview
          </h1>
          <p className="text-xl md:text-2xl text-zinc-400 font-instrument tracking-tight italic">
             {campaignName ?? campaignId}
          </p>
        </header>

        {/* ── Hero KPI strip ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          {/* Total Calls */}
          <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 transition-colors hover:bg-white/[0.04] backdrop-blur-3xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.02)]">
            <div className="w-10 h-10 rounded-2xl bg-zinc-800/50 border border-white/5 flex items-center justify-center mb-6">
              <VscCallOutgoing className="text-zinc-300 text-lg" />
            </div>
            <p className="text-[13px] text-zinc-400 font-medium mb-1 tracking-wide font-sans">Total Calls</p>
            <p className="text-4xl font-bold font-sans text-white">{voiceCalls}</p>
          </div>
          
          {/* Answered */}
          <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 transition-colors hover:bg-white/[0.04] backdrop-blur-3xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.02)] relative overflow-hidden group">
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-emerald-500/10 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6 relative z-10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]">
              <MdCheckCircle className="text-emerald-500 text-lg" />
            </div>
            <p className="text-[13px] text-zinc-400 font-medium mb-1 tracking-wide relative z-10 font-sans">Answered</p>
            <p className="text-4xl font-bold font-sans text-emerald-500 relative z-10">{voiceCallsAnswered}</p>
          </div>

          {/* Missed */}
          <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 transition-colors hover:bg-white/[0.04] backdrop-blur-3xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.02)] relative overflow-hidden group">
             <div className="absolute -top-10 -right-10 w-24 h-24 bg-red-500/10 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            <div className="w-10 h-10 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6 relative z-10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]">
              <MdCancel className="text-red-500 text-lg" />
            </div>
            <p className="text-[13px] text-zinc-400 font-medium mb-1 tracking-wide relative z-10 font-sans">Missed</p>
            <p className="text-4xl font-bold font-sans text-red-500 relative z-10">{voiceCallsMissed}</p>
          </div>

          {/* Answer Rate */}
          <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 relative transition-colors hover:bg-white/[0.04] backdrop-blur-3xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.02)] overflow-hidden group">
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-violet-500/10 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            <div className="w-10 h-10 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-6 relative z-10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]">
              <MdTimer className="text-violet-500 text-lg" />
            </div>
            <p className="text-[13px] text-zinc-400 font-medium mb-1 tracking-wide relative z-10 font-sans">Answer Rate</p>
            <p className="text-4xl font-bold font-sans text-violet-500 relative z-10">{voiceCallsAnsweredRate}%</p>
            {/* Progress bar */}
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/5">
              <div className="h-full bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.5)]" style={{ width: `${voiceCallsAnsweredRate}%` }} />
            </div>
          </div>
        </div>

        {/* ── WhatsApp KPI strip ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          <div
            onClick={() => setWhatsappModal('messages')}
            className="group bg-white/[0.02] border border-white/5 rounded-3xl p-6 cursor-pointer transition-all hover:bg-white/[0.04] backdrop-blur-3xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.02)] relative overflow-hidden"
          >
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-green-500/10 blur-[40px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            <div className="flex items-center justify-between mb-6 relative z-10">
              <div className="w-10 h-10 rounded-2xl bg-green-500/10 border border-green-500/20 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)] flex items-center justify-center">
                <BsWhatsapp className="text-green-500 text-lg" />
              </div>
              <div className="w-8 h-8 rounded-full border border-white/5 flex items-center justify-center text-white/30 group-hover:text-green-400 group-hover:bg-white/5 transition-all">
                <span className="text-sm block group-hover:translate-x-0.5 transition-transform">→</span>
              </div>
            </div>
            <div className="relative z-10">
              <p className="text-[13px] text-zinc-400 font-medium mb-1 tracking-wide font-sans">Messages Sent</p>
              <p className="text-4xl font-bold font-sans text-white group-hover:scale-105 origin-left transition-transform duration-500">{whatsappMessagesSent}</p>
            </div>
          </div>

          <div
            onClick={() => setWhatsappModal('users')}
            className="group bg-white/[0.02] border border-white/5 rounded-3xl p-6 cursor-pointer transition-all hover:bg-white/[0.04] backdrop-blur-3xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.02)] relative overflow-hidden"
          >
             <div className="absolute -top-10 -right-10 w-32 h-32 bg-cyan-500/10 blur-[40px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            <div className="flex items-center justify-between mb-6 relative z-10">
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)] flex items-center justify-center">
                <MdPeople className="text-cyan-500 text-lg" />
              </div>
              <div className="w-8 h-8 rounded-full border border-white/5 flex items-center justify-center text-white/30 group-hover:text-cyan-400 group-hover:bg-white/5 transition-all">
                <span className="text-sm block group-hover:translate-x-0.5 transition-transform">→</span>
              </div>
            </div>
            <div className="relative z-10">
              <p className="text-[13px] text-zinc-400 font-medium mb-1 tracking-wide font-sans">Unique Leads</p>
              <p className="text-4xl font-bold font-sans text-white group-hover:scale-105 origin-left transition-transform duration-500">{whatsappInteractedUsers}</p>
            </div>
          </div>

          {/* Engagement score */}
          <div className="bg-gradient-to-br from-amber-500/10 to-white/[0.02] border border-amber-500/20 rounded-3xl p-6 relative overflow-hidden transition-colors hover:bg-white/[0.04] backdrop-blur-3xl shadow-[inset_0_1px_0_0_rgba(245,158,11,0.2)] flex flex-col justify-between h-40">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center mb-4 relative z-10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)]">
              <VscGraph className="text-amber-500 text-lg" />
            </div>
            <p className="text-[13px] text-amber-500/70 font-bold mb-1 tracking-[0.1em] uppercase absolute top-6 right-6 font-sans">Engagement</p>
            <div className="relative z-10 flex items-baseline gap-1 mt-auto">
              <p className="text-5xl md:text-6xl font-bold font-sans text-amber-500 drop-shadow-[0_0_12px_rgba(245,158,11,0.4)]">{engagementScore}</p>
              <span className="text-xl text-amber-500/50 font-sans">%</span>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/5">
              <div className="h-full bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)]" style={{ width: `${engagementScore}%` }} />
            </div>
          </div>
        </div>

        {/* ── Charts ── */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
        >
          {/* Bar chart */}
          <div className="md:col-span-2 bg-white/[0.02] border border-white/5 rounded-3xl p-7 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.02)] relative overflow-hidden group hover:bg-white/[0.03] transition-colors">
            <div className="absolute top-0 right-0 -m-16 w-48 h-48 bg-blue-500/5 rounded-full blur-[50px] pointer-events-none group-hover:bg-blue-500/10 transition-colors duration-700" />
            <div className="flex items-center justify-between mb-8 relative z-10">
              <h3 className="font-semibold text-lg text-white">Call Distribution</h3>
              <div className="flex items-center gap-4 text-xs font-semibold tracking-wider uppercase text-zinc-500">
                <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] inline-block" />Answered</span>
                <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] inline-block" />Missed</span>
              </div>
            </div>
            <div className="h-64 relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barSize={40}>
                  <CartesianGrid stroke="rgba(255,255,255,0.03)" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 11, fontWeight: 500 }} dy={12} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 11, fontWeight: 500 }} dx={-10} />
                  <Tooltip
                    cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                    contentStyle={{ backgroundColor: 'rgba(10,10,12,0.9)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '16px', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5)' }}
                    labelStyle={{ color: '#a1a1aa', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}
                    itemStyle={{ color: '#fff', fontSize: '15px', fontWeight: 600 }}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.9} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Donut + percentage — WhatsApp reply rate */}
          <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-7 flex flex-col shadow-[inset_0_1px_0_0_rgba(255,255,255,0.02)] relative overflow-hidden group hover:bg-white/[0.03] transition-colors">
            <div className="absolute center right-0 -m-16 w-48 h-48 bg-cyan-500/5 rounded-full blur-[50px] pointer-events-none group-hover:bg-cyan-500/10 transition-colors duration-700" />
            <div className="mb-2 relative z-10 text-center">
              <h3 className="font-semibold text-lg text-white">Reply Rate</h3>
              <p className="text-[11px] font-bold text-zinc-500 mt-1 uppercase tracking-widest">WhatsApp Funnel</p>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center relative z-10 mt-4">
              <div className="relative w-44 h-44 drop-shadow-[0_0_20px_rgba(6,182,212,0.2)]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={waChartData} innerRadius={64} outerRadius={80} paddingAngle={4} dataKey="value" startAngle={90} endAngle={-270} cornerRadius={6} stroke="none">
                      {waChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-4xl font-semibold tracking-tight text-white">{waReplyRate}</span>
                  <span className="text-sm font-medium text-cyan-500">%</span>
                </div>
              </div>
              <div className="mt-8 w-full space-y-3 px-2">
                {waChartData.map((d) => (
                  <div key={d.name} className="flex items-center justify-between text-[13px] font-medium">
                    <span className="flex items-center gap-2 text-zinc-400">
                      <span className="w-2 h-2 rounded-full shadow-sm" style={{ background: d.color }} />
                      {d.name}
                    </span>
                    <span className="text-white text-[15px]">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── WhatsApp conversations preview ── */}
        {whatsappConversations.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden mb-16 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.02)] backdrop-blur-md"
          >
            <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
              <h3 className="font-semibold text-lg text-white flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center text-green-400 text-sm">
                  <BsWhatsapp />
                </div>
                Recent Conversations
              </h3>
              <div className="px-3 py-1 rounded-full bg-white/5 border border-white/5 text-[11px] font-bold text-zinc-400 uppercase tracking-widest shadow-inner">
                {whatsappConversations.length} total
              </div>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {whatsappConversations.slice(0, 6).map((conv: any, idx: number) => (
                <div
                  key={conv.contactId}
                  onClick={() => { setSelectedConversation(conv) }}
                  className="flex items-center gap-4 p-4 bg-transparent border border-white/5 rounded-2xl hover:bg-white/[0.04] hover:border-white/10 transition-all duration-300 cursor-pointer group relative overflow-hidden"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 p-[1px]">
                    <div className="w-full h-full bg-[#121214] rounded-full flex items-center justify-center text-white text-sm font-semibold shadow-inner group-hover:bg-transparent transition-colors duration-300">
                      {getInitials(conv.contactName || '')}
                    </div>
                  </div>
                  <div className="min-w-0 flex-1 relative z-10">
                    <p className="text-[15px] font-semibold truncate text-white group-hover:text-green-300 transition-colors">{conv.contactName}</p>
                    <p className="text-[13px] text-zinc-500 font-medium truncate mt-0.5">{conv.phone}</p>
                  </div>
                  <div className="text-right flex-shrink-0 text-zinc-500 flex items-center gap-2 group-hover:text-green-400 transition-colors">
                    <span className="w-8 h-8 rounded-full border border-white/5 flex items-center justify-center bg-white/[0.02]">
                      <span className="text-[13px] font-medium text-white group-hover:text-green-400 transition-colors">{conv.messagesSent + conv.messagesReceived}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
            {whatsappConversations.length > 6 && (
              <div className="p-5 border-t border-white/5 flex justify-center bg-white/[0.01]">
                <button
                  onClick={() => setWhatsappModal('messages')}
                  className="text-[13px] font-semibold text-zinc-400 hover:text-white transition-colors flex items-center gap-2 px-4 py-2 rounded-full hover:bg-white/5"
                >
                  View All Conversations <span className="text-lg leading-none pt-0.5">›</span>
                </button>
              </div>
            )}
          </motion.div>
        )}

      </div>

      {/* ══ WhatsApp Modal ══ */}
      <AnimatePresence>
        {whatsappModal && !selectedConversation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#0F0B0A]/80 backdrop-blur-2xl z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white/[0.02] border border-white/5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.02)] rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden drop-shadow-2xl"
            >
              {/* Modal header */}
              <div className="bg-white/[0.01] border-b border-white/5 px-8 py-6 flex items-center justify-between z-10">
                <div className="flex items-center gap-4">
                  {whatsappModal === 'messages' ? (
                    <div className="w-12 h-12 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]">
                      <MdMessage className="text-green-500 text-xl" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]">
                      <MdPeople className="text-cyan-500 text-xl" />
                    </div>
                  )}
                  <div>
                    <h2 className="font-semibold text-2xl tracking-tight text-white mb-1">
                      {whatsappModal === 'messages' ? 'Messages Sent' : 'Unique Leads'}
                    </h2>
                    <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider">WhatsApp · {whatsappConversations.length} conversations</p>
                  </div>
                </div>
                <button onClick={() => setWhatsappModal(null)} className="w-10 h-10 rounded-full bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-all group">
                  <span className="text-lg group-hover:rotate-90 transition-transform duration-300">✕</span>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-4 hide-scrollbar">
                {whatsappConversations.length > 0 ? (
                  <div className="space-y-3">
                    {whatsappConversations.map((conv: any, idx: number) => (
                      <div
                        key={conv.contactId}
                        onClick={() => setSelectedConversation(conv)}
                        className="flex items-center gap-4 p-4 bg-transparent border border-transparent rounded-2xl hover:bg-white/[0.03] hover:border-white/5 transition-all cursor-pointer group"
                      >
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 p-[1px]">
                           <div className="w-full h-full bg-[#0a0a0a] rounded-full flex items-center justify-center text-white text-base font-semibold shadow-inner">
                            {getInitials(conv.contactName || '')}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-white truncate text-[16px] group-hover:text-blue-300 transition-colors">{conv.contactName}</p>
                          <p className="text-[14px] text-zinc-500 font-medium truncate mt-0.5">{conv.phone}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          {whatsappModal === 'messages' ? (
                            <>
                              <p className="text-xl font-bold text-white group-hover:scale-105 transition-transform origin-right">{conv.messagesSent}</p>
                              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">sent</p>
                            </>
                          ) : (
                            <>
                              <p className="text-xl font-bold text-white group-hover:scale-105 transition-transform origin-right">{conv.messagesReceived}</p>
                              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">received</p>
                            </>
                          )}
                        </div>
                        <div className="text-zinc-600 group-hover:text-white transition-colors ml-4 w-8 h-8 rounded-full border border-transparent group-hover:border-white/10 group-hover:bg-white/5 flex items-center justify-center">
                          <span className="text-lg">›</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full py-20">
                    <div className="w-20 h-20 rounded-3xl bg-white/[0.02] border border-white/5 flex items-center justify-center mb-6 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]">
                      <BsWhatsapp className="text-3xl text-zinc-500" />
                    </div>
                    <p className="text-zinc-400 font-medium text-[16px]">
                      {whatsappModal === 'messages' ? 'No messages sent yet.' : 'No user interactions yet.'}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══ Conversation Detail Modal ══ */}
      <AnimatePresence>
        {selectedConversation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#0F0B0A]/80 backdrop-blur-2xl z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white/[0.02] border border-white/5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.02)] rounded-3xl w-full max-w-2xl h-[85vh] flex flex-col overflow-hidden drop-shadow-2xl relative"
            >
              {/* Chat header */}
              <div className="bg-white/[0.01] border-b border-white/5 px-6 py-4 flex items-center gap-4 z-10 backdrop-blur-md">
                <button
                  onClick={() => setSelectedConversation(null)}
                  className="w-10 h-10 rounded-full hover:bg-white/5 flex items-center justify-center text-blue-400 hover:text-blue-300 transition-colors flex-shrink-0"
                >
                  <span className="text-3xl leading-none -mt-1">‹</span>
                </button>
                <div className="flex flex-col flex-1 items-center justify-center relative right-5">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 p-[1px] mb-1">
                    <div className="w-full h-full bg-[#0a0a0a] rounded-full flex items-center justify-center text-white text-[13px] font-bold shadow-inner">
                      {getInitials(selectedConversation.contactName || '')}
                    </div>
                  </div>
                  <h2 className="font-semibold text-[15px] truncate text-white">{selectedConversation.contactName}</h2>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 bg-black/20 hide-scrollbar z-10 flex flex-col">
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
                          <div className={`max-w-[75%] flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                            <div
                              className={`px-5 py-3 text-[15px] leading-relaxed shadow-sm ${
                                isUser
                                  ? 'bg-blue-500 text-white rounded-3xl rounded-tr-sm'
                                  : 'bg-white/[0.08] border border-white/5 text-zinc-100 rounded-3xl rounded-tl-sm'
                              }`}
                            >
                              <p className="break-words font-medium">{msg.content}</p>
                            </div>
                            <p className="text-[10px] font-bold mt-1.5 px-2 text-zinc-500 uppercase tracking-wider">{timestamp}</p>
                          </div>
                        </div>
                      )
                    })
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center">
                    <div className="w-16 h-16 rounded-3xl bg-white/[0.02] border border-white/5 flex items-center justify-center mb-4">
                      <MdMessage className="text-2xl text-zinc-500" />
                    </div>
                    <p className="text-zinc-500 font-medium text-[15px]">No messages in this conversation</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
