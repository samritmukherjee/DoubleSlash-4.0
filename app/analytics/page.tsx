'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { VscCallOutgoing } from 'react-icons/vsc'
import { BsFillFileTextFill } from 'react-icons/bs'
import { MdKeyboardVoice, MdAnnouncement } from 'react-icons/md'

interface AnalyticsData {
  campaign: {
    id: string
    title: string
    description: any
    status: string
    createdAt: any
    launchedAt: any
  }
  analytics: {
    totalContacts: number
    contactsReceivedMessage: number
    contactsOpenedChat: number
    contactsReplied: number
    contactsNotInteracted: number
    voiceCalls: number
    voiceCallsAnswered: number
    voiceCallsMissed: number
    voiceCallsAnsweredRate: number
    textInteractions: number
    aiResponsesCount: number
    avgResponseTimeMs: number
    channels: {
      voice: boolean
      calls: boolean
      text: boolean
    }
    engagementScore: number
    totalConversations: number
    totalMessages: number
  }
  conversationSummary: any[]
}

export default function AnalyticsPage() {
  const params = useParams()
  const router = useRouter()
  const campaignId = params.campaignId as string

  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        if (!campaignId) {
          setError('Campaign ID not found')
          setLoading(false)
          return
        }

        console.log('📊 Fetching analytics for campaign:', campaignId)
        const response = await fetch(`/api/campaigns/${campaignId}/analytics`)
        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || 'Failed to fetch analytics')
        }

        console.log('✅ Analytics loaded:', result)
        setData(result)
      } catch (err) {
        console.error('❌ Error fetching analytics:', err)
        setError(err instanceof Error ? err.message : 'Failed to load analytics')
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [campaignId])

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <div className="max-w-7xl mx-auto px-4 py-12 flex items-center justify-center h-[60vh]">
          <div className="text-center space-y-3">
            <div className="flex justify-center">
              <img 
                src="/favicon.svg" 
                alt="Loading" 
                className="w-12 h-12 animate-spin"
              />
            </div>
            <p className="text-white">Loading campaign analytics...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-black">
        <div className="max-w-7xl mx-auto px-4 py-12 flex items-center justify-center h-[60vh]">
          <div className="text-center space-y-4">
            <p className="text-red-400 text-lg">{error}</p>
            <button
              onClick={() => router.back()}
              className="px-6 py-2.5 rounded-lg bg-white hover:bg-white/95 text-black font-semibold"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    )
  }

  const { campaign, analytics } = data
  const formatDate = (dateVal: any) => {
    if (!dateVal) return 'N/A'
    const date = new Date(dateVal)
    return date.toLocaleDateString()
  }

  const formatTime = (ms: number) => {
    if (ms === 0) return 'N/A'
    const hours = Math.floor(ms / 3600000)
    const minutes = Math.floor((ms % 3600000) / 60000)
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-white/10 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => router.back()}
              className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 transition"
            >
              ← Back
            </button>
            <h1 className="text-3xl font-bold">{campaign.title}</h1>
            <div className="w-20" />
          </div>
          <p className="text-white/60 text-sm">Campaign launched: {formatDate(campaign.launchedAt)}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Total Contacts */}
          <div className="bg-linear-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20 rounded-lg p-6">
            <p className="text-white/60 text-sm mb-2">Total Contacts</p>
            <p className="text-3xl font-bold text-blue-400">{analytics.totalContacts}</p>
            <p className="text-white/40 text-xs mt-2">in this campaign</p>
          </div>

          {/* Contacts Received Message */}
          <div className="bg-linear-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20 rounded-lg p-6">
            <p className="text-white/60 text-sm mb-2">📨 Message Received</p>
            <p className="text-3xl font-bold text-purple-400">{analytics.contactsReceivedMessage}</p>
            <p className="text-white/40 text-xs mt-2">
              {analytics.totalContacts > 0
                ? Math.round((analytics.contactsReceivedMessage / analytics.totalContacts) * 100)
                : 0}% delivery rate
            </p>
          </div>

          {/* Contacts Replied */}
          <div className="bg-linear-to-br from-green-500/10 to-green-500/5 border border-green-500/20 rounded-lg p-6">
            <p className="text-white/60 text-sm mb-2 flex items-center gap-2"><BsFillFileTextFill style={{ color: '#f6f4f0' }} className="w-4 h-4" /> Replied/Engaged</p>
            <p className="text-3xl font-bold text-green-400">{analytics.contactsReplied}</p>
            <p className="text-white/40 text-xs mt-2">
              {analytics.totalContacts > 0
                ? Math.round((analytics.contactsReplied / analytics.totalContacts) * 100)
                : 0}% response rate
            </p>
          </div>

          {/* Calls Answered */}
          <div className="bg-linear-to-br from-orange-500/10 to-orange-500/5 border border-orange-500/20 rounded-lg p-6">
            <p className="text-white/60 text-sm mb-2 flex items-center gap-2"><VscCallOutgoing style={{ color: '#f6f4f0' }} className="w-4 h-4" /> Calls Answered</p>
            <p className="text-3xl font-bold text-orange-400">{analytics.voiceCallsAnswered}</p>
            <p className="text-white/40 text-xs mt-2">
              {analytics.voiceCalls > 0
                ? analytics.voiceCallsAnsweredRate
                : 0}% pickup rate
            </p>
          </div>
        </div>

        {/* Engagement Score */}
        <div className="bg-linear-to-r from-yellow-500/10 to-yellow-500/5 border border-yellow-500/20 rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/60 text-sm mb-2">Overall Engagement Score</p>
              <p className="text-4xl font-bold text-yellow-400">{analytics.engagementScore}%</p>
              <p className="text-white/40 text-sm mt-2">Based on replies and call pickups</p>
            </div>
            <div className="hidden lg:flex items-center justify-center w-32 h-32">
              <div className="relative w-24 h-24">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="#ffffff20" strokeWidth="8" />
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="#FBBF24"
                    strokeWidth="8"
                    strokeDasharray={`${(analytics.engagementScore / 100) * 282.6} 282.6`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">{analytics.engagementScore}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Analytics Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Message Analytics */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <span><BsFillFileTextFill style={{ color: '#f6f4f0' }} className="w-5 h-5" /></span> Message Analytics
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-white/60">Total Messages</p>
                <p className="font-semibold text-lg">{analytics.totalMessages}</p>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-white/60">Incoming Messages</p>
                <p className="font-semibold text-lg">{analytics.textInteractions}</p>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-white/60">AI Responses</p>
                <p className="font-semibold text-lg text-blue-400">{analytics.aiResponsesCount}</p>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-white/10">
                <p className="text-white/60">Engagement Rate</p>
                <p className="font-semibold text-lg text-green-400">
                  {analytics.totalMessages > 0
                    ? Math.round((analytics.textInteractions / analytics.totalMessages) * 100)
                    : 0}%
                </p>
              </div>
            </div>
          </div>

          {/* Call Analytics */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <span><VscCallOutgoing style={{ color: '#f6f4f0' }} className="w-5 h-5" /></span> Call Analytics
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-white/60">Total Calls Initiated</p>
                <p className="font-semibold text-lg">{analytics.voiceCalls}</p>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-white/60">Calls Answered</p>
                <p className="font-semibold text-lg text-green-400">{analytics.voiceCallsAnswered}</p>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-white/60">Calls Missed</p>
                <p className="font-semibold text-lg text-red-400">{analytics.voiceCallsMissed}</p>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-white/10">
                <p className="text-white/60">Pickup Rate</p>
                <p className="font-semibold text-lg text-green-400">
                  {analytics.voiceCalls > 0 ? analytics.voiceCallsAnsweredRate : 0}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Breakdown */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <span>👥</span> Contact Breakdown
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-400" />
                <p className="text-white/60">Contacts with opened chats</p>
              </div>
              <div className="flex items-center gap-4">
                <p className="font-semibold">{analytics.contactsOpenedChat}</p>
                <p className="text-white/40 text-sm w-12 text-right">
                  {analytics.totalContacts > 0
                    ? Math.round((analytics.contactsOpenedChat / analytics.totalContacts) * 100)
                    : 0}%
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-400" />
                <p className="text-white/60">Contacted who replied</p>
              </div>
              <div className="flex items-center gap-4">
                <p className="font-semibold">{analytics.contactsReplied}</p>
                <p className="text-white/40 text-sm w-12 text-right">
                  {analytics.totalContacts > 0
                    ? Math.round((analytics.contactsReplied / analytics.totalContacts) * 100)
                    : 0}%
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <p className="text-white/60">Contacts not interacted</p>
              </div>
              <div className="flex items-center gap-4">
                <p className="font-semibold">{analytics.contactsNotInteracted}</p>
                <p className="text-white/40 text-sm w-12 text-right">
                  {analytics.totalContacts > 0
                    ? Math.round((analytics.contactsNotInteracted / analytics.totalContacts) * 100)
                    : 0}%
                </p>
              </div>
            </div>
          </div>

          {/* Visual Progress Bars */}
          <div className="mt-6 pt-6 border-t border-white/10 space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <p className="text-white/60">Chat Opened</p>
                <p className="text-white/40">
                  {analytics.totalContacts > 0
                    ? Math.round((analytics.contactsOpenedChat / analytics.totalContacts) * 100)
                    : 0}%
                </p>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div
                  className="bg-blue-400 h-2 rounded-full transition-all"
                  style={{
                    width: `${analytics.totalContacts > 0 ? (analytics.contactsOpenedChat / analytics.totalContacts) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <p className="text-white/60">Replied</p>
                <p className="text-white/40">
                  {analytics.totalContacts > 0
                    ? Math.round((analytics.contactsReplied / analytics.totalContacts) * 100)
                    : 0}%
                </p>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div
                  className="bg-green-400 h-2 rounded-full transition-all"
                  style={{
                    width: `${analytics.totalContacts > 0 ? (analytics.contactsReplied / analytics.totalContacts) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Contact Distribution Chart */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <span>📊</span> Contact Engagement Distribution
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={[
                  {
                    name: 'Contacts',
                    Replied: analytics.contactsReplied,
                    'Not Replied': analytics.contactsNotInteracted,
                    'Opened Chat': analytics.contactsOpenedChat,
                  }
                ]}
                margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                <XAxis dataKey="name" stroke="#ffffff60" />
                <YAxis stroke="#ffffff60" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #ffffff20', borderRadius: '8px' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Legend />
                <Bar dataKey="Replied" fill="#22c55e" />
                <Bar dataKey="Opened Chat" fill="#3b82f6" />
                <Bar dataKey="Not Replied" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Engagement Metrics Pie Chart */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <span>🎯</span> Engagement Overview
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Replied', value: analytics.contactsReplied },
                    { name: 'AI Resolved', value: analytics.aiResponsesCount },
                    { name: 'Calls Answered', value: analytics.voiceCallsAnswered },
                    { name: 'Not Interacted', value: analytics.contactsNotInteracted },
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  <Cell fill="#22c55e" />
                  <Cell fill="#3b82f6" />
                  <Cell fill="#f59e0b" />
                  <Cell fill="#ef4444" />
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #ffffff20', borderRadius: '8px' }}
                  labelStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Chatbot Performance */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <span>🤖</span> AI Chatbot Performance
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <p className="text-white/60 text-sm mb-2">Total AI Responses</p>
              <p className="text-3xl font-bold text-blue-400">{analytics.aiResponsesCount}</p>
              <p className="text-white/40 text-xs mt-2">Doubts resolved by AI</p>
            </div>
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
              <p className="text-white/60 text-sm mb-2">User Questions</p>
              <p className="text-3xl font-bold text-green-400">{analytics.textInteractions}</p>
              <p className="text-white/40 text-xs mt-2">Total incoming messages</p>
            </div>
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
              <p className="text-white/60 text-sm mb-2">Resolution Rate</p>
              <p className="text-3xl font-bold text-purple-400">
                {analytics.textInteractions > 0 
                  ? Math.round((analytics.aiResponsesCount / analytics.textInteractions) * 100)
                  : 0}%
              </p>
              <p className="text-white/40 text-xs mt-2">AI response rate</p>
            </div>
          </div>
        </div>

        {/* Channel Configuration */}
        {(analytics.channels.voice || analytics.channels.calls || analytics.channels.text) && (
          <div className="bg-white/5 border border-white/10 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <MdAnnouncement style={{ color: '#f6f4f0' }} className="w-5 h-5" /> Active Channels
            </h2>
            <div className="flex flex-wrap gap-4">
              {analytics.channels.voice && (
                <div className="px-4 py-2 rounded-full bg-blue-500/20 border border-blue-500/30">
                  <p className="text-blue-300 text-sm font-medium flex items-center gap-2"><MdKeyboardVoice className="w-4 h-4" /> Voice Messages</p>
                </div>
              )}
              {analytics.channels.calls && (
                <div className="px-4 py-2 rounded-full bg-orange-500/20 border border-orange-500/30">
                  <p className="text-orange-300 text-sm font-medium flex items-center gap-2"><VscCallOutgoing className="w-4 h-4" /> Voice Calls</p>
                </div>
              )}
              {analytics.channels.text && (
                <div className="px-4 py-2 rounded-full bg-green-500/20 border border-green-500/30">
                  <p className="text-green-300 text-sm font-medium flex items-center gap-2"><BsFillFileTextFill className="w-4 h-4" /> Text Messages</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
