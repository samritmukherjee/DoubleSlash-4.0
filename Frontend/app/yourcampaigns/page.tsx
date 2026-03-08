'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Trash2 } from 'lucide-react'
import { VscCallOutgoing } from 'react-icons/vsc'
import { BsFillFileTextFill } from 'react-icons/bs'
import { MdKeyboardVoice } from 'react-icons/md'

interface Campaign {
  id: string
  title: string
  description: string | { original?: string; aiEnhanced?: string }
  aiDescription?: string
  channels: Record<string, any>
  createdAt: any
  updatedAt: any
  channelContent?: {
    voice?: { transcript?: string }
    calls?: { transcript?: string }
  }
  audioUrls?: {
    voice?: string
    calls?: string
  }
}

export default function YourCampaignsPage() {
  const router = useRouter()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        console.log('📋 Fetching your campaigns...')
        const res = await fetch('/api/yourcampaigns')
        const data = await res.json()

        if (!res.ok) {
          setError(data.error || 'Failed to load campaigns')
          setLoading(false)
          return
        }

        console.log('✅ Campaigns loaded:', data.campaigns.length)
        setCampaigns(data.campaigns)
      } catch (err) {
        console.error('Error fetching campaigns:', err)
        setError('Failed to load campaigns')
      } finally {
        setLoading(false)
      }
    }

    fetchCampaigns()
  }, [])

  const handleDelete = async (e: React.MouseEvent, campaignId: string) => {
    e.preventDefault()
    e.stopPropagation()

    if (!window.confirm('Are you sure you want to delete this campaign? This action cannot be undone.')) {
      return
    }

    try {
      setDeletingId(campaignId)
      console.log('🗑️ Deleting campaign:', campaignId)

      const res = await fetch(`/api/campaigns/${campaignId}/delete`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to delete campaign')
      }

      console.log('✅ Campaign deleted:', campaignId)
      setCampaigns((prev) => prev.filter((c) => c.id !== campaignId))
    } catch (err) {
      console.error('Error deleting campaign:', err)
      alert(err instanceof Error ? err.message : 'Failed to delete campaign')
    } finally {
      setDeletingId(null)
    }
  }

  const getChannelNames = (channels: Record<string, any>) => {
    if (!channels || typeof channels !== 'object') return 'No channels'
    return Object.entries(channels)
      .filter(([, v]: any) => v?.enabled)
      .map(([k]) => {
        if (k === 'text') return 'Text'
        if (k === 'voice') return 'Voice'
        if (k === 'calls') return 'Calls'
        return k
      })
      .join(' • ') || 'No channels'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
      
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="flex items-center justify-center h-[60vh]">
            <div className="text-center space-y-3">
              <div className="flex justify-center">
                <img 
                  src="/favicon.svg" 
                  alt="Loading" 
                  className="w-12 h-12 animate-spin"
                />
              </div>
              <p className="text-white">Loading your campaigns...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black">
        
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="flex items-center justify-center h-[60vh]">
            <div className="text-center space-y-3">
              <p className="text-red-400">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2.5 rounded-lg bg-white hover:bg-white/95 text-black font-semibold transition cursor-pointer"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 relative overflow-hidden">
      {/* Watermark Favicon */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-0">
        <img 
          src="/favicon.svg" 
          alt="watermark"
          className="opacity-5"
          style={{ height: '65vh', width: 'auto' }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10">
        <div className="max-w-6xl mx-auto px-6 py-16">
          {/* Header */}
          <div className="mb-16">
            <div className="flex items-center justify-between mb-8">
              <Link
                href="/campaign/title"
                className="group inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-white/20 text-white/70 hover:text-white hover:border-white/40 transition-all duration-300"
              >
                <span className="group-hover:-translate-x-1 transition-transform">←</span>
                Back
              </Link>
              <div className="flex items-center gap-4">
                 {/* <Link
                  href="/inbox"
                  className="px-5 py-2.5 rounded-lg border border-white/20 text-white hover:border-white/40 hover:bg-white/5 transition-all duration-300 text-sm font-medium"
                >
                Inbox
                </Link>  */}
                <Link
                  href="/campaign/title"
                  className="px-5 py-2.5 rounded-lg bg-white text-black hover:bg-white/90 transition-all duration-300 text-sm font-semibold"
                >
                  New Campaign
                </Link>
              </div>
            </div>
            <div className="w-full text-center">
              <h1 className="text-6xl  text-white mb-2">Your Campaigns</h1>
              <p className="text-white/50 text-lg">Manage and monitor your outreach campaigns</p>
            </div>
          </div>

          {/* Campaigns Grid */}
          {campaigns.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[50vh] text-center">
              <div className="text-5xl mb-4 opacity-50">✨</div>
              <p className="text-white text-xl font-semibold mb-2">No campaigns yet</p>
              <p className="text-white/50 mb-8">Create your first campaign to get started</p>
              <Link
                href="/campaign/title"
                className="px-6 py-3 rounded-lg bg-white text-black hover:bg-white/90 font-semibold transition-all duration-300"
              >
                Create Campaign
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {campaigns.map((campaign, index) => {
                // Neon glow colors for each campaign
                const glowColors = [
                  { border: 'from-orange-500 via-pink-500 to-pink-600', shadow: 'rgba(249, 115, 22, 0.5)' },
                  { border: 'from-cyan-500 via-blue-500 to-blue-600', shadow: 'rgba(6, 182, 212, 0.5)' },
                  { border: 'from-violet-500 via-purple-500 to-pink-600', shadow: 'rgba(139, 92, 246, 0.5)' },
                  { border: 'from-green-500 via-emerald-500 to-cyan-600', shadow: 'rgba(34, 197, 94, 0.5)' },
                  { border: 'from-red-500 via-pink-500 to-rose-600', shadow: 'rgba(239, 68, 68, 0.5)' },
                  { border: 'from-indigo-500 via-purple-500 to-pink-600', shadow: 'rgba(99, 102, 241, 0.5)' },
                ]
                const glow = glowColors[index % glowColors.length]
                
                const enabledChannels = Object.entries(campaign.channels || {})
                  .filter(([, v]: any) => v?.enabled)
                  .map(([k]) => k)

                return (
                  <div 
                    key={campaign.id} 
                    className="group relative"
                    style={{
                      perspective: '1000px'
                    }}
                  >
                    <Link
                      href={`/yourcampaigns/${campaign.id}`}
                      className="block relative rounded-2xl p-8 bg-white/2 backdrop-blur-sm cursor-pointer transition-all duration-300 h-full flex flex-col border border-white/10 hover:border-white/30 group-hover:scale-105"
                      style={{
                        boxShadow: `0 0 40px ${glow.shadow}, 0 0 80px ${glow.shadow}30, inset 0 1px 1px rgba(255,255,255,0.1)`,
                      }}
                    >
                      {/* Color backdrop from top center to bottom */}
                      <div 
                        className="absolute inset-0 rounded-2xl pointer-events-none"
                        style={{
                          background: `linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.2) 30%, transparent 80%)`,
                        }}
                      ></div>

                      {/* Subtle glassmorphic shine effect - hover only */}
                      <div 
                        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                        style={{
                          background: `linear-gradient(180deg, rgba(255,255,255,0.08) 0%, transparent 50%)`,
                        }}
                      ></div>

                      {/* Glow effect - hover only */}
                      <div 
                        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                        style={{
                          background: `radial-gradient(circle at bottom center, ${glow.shadow}, transparent 70%)`,
                          filter: 'blur(20px)',
                        }}
                      ></div>

                      {/* Content */}
                      <div className="relative z-10">
                        {/* Title */}
                        <h3 className="text-white font-bold text-2xl mb-3 line-clamp-1 group-hover:text-white/90 transition-colors">
                          {campaign.title || 'Untitled Campaign'}
                        </h3>

                        {/* Description */}
                        <p className="text-white/60 text-sm line-clamp-3 leading-relaxed">
                          {(() => {
                            let desc = ''
                            if (typeof campaign.description === 'object' && campaign.description) {
                              desc = campaign.description.aiEnhanced || campaign.description.original || ''
                            } else if (typeof campaign.description === 'string') {
                              desc = campaign.description || ''
                            }
                            return campaign.aiDescription || desc || 'No description provided'
                          })()}
                        </p>

                        {/* Quick Stats Overlay */}
                        {(campaign as any).vapiStats && (
                          <div className="mt-4 flex gap-4">
                            <div className="flex flex-col">
                              <span className="text-[10px] text-white/30 uppercase tracking-tighter">Total Calls</span>
                              <span className="text-sm font-bold text-blue-400">{(campaign as any).vapiStats.totalCalls}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[10px] text-white/30 uppercase tracking-tighter">Answered</span>
                              <span className="text-sm font-bold text-green-400">{(campaign as any).vapiStats.answeredCalls}</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Footer Info - Minimal */}
                      <div className="mt-auto pt-6 flex items-center justify-between text-xs text-white/40">
                        <div className="flex gap-2.5">
                          {enabledChannels.slice(0, 3).map((channel) => (
                            <span key={channel} className="inline-block">
                              {channel === 'text' && <BsFillFileTextFill style={{ color: '#f6f4f0' }} className="w-4 h-4" />}
                              {channel === 'voice' && <MdKeyboardVoice style={{ color: '#f6f4f0' }} className="w-4 h-4" />}
                              {channel === 'calls' && <VscCallOutgoing style={{ color: '#f6f4f0' }} className="w-4 h-4" />}
                            </span>
                          ))}
                        </div>
                        <span className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300">→</span>
                      </div>
                    </Link>

                    {/* Delete Button - Floating */}
                    <button
                      onClick={(e) => handleDelete(e, campaign.id)}
                      disabled={deletingId === campaign.id}
                      className="absolute -top-3 -left-3 p-2 rounded-lg bg-black/80 border border-white/20 hover:border-red-500/60 text-white/60 hover:text-red-400 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed opacity-0 group-hover:opacity-100"
                      style={{
                        boxShadow: deletingId !== campaign.id ? 'none' : `0 0 15px rgba(239, 68, 68, 0.3)`,
                      }}
                      title="Delete campaign"
                    >
                      {deletingId === campaign.id ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
