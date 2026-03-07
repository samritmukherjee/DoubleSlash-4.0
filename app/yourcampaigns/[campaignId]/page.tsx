'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { VscCallOutgoing } from 'react-icons/vsc'
import { BsFillFileTextFill } from 'react-icons/bs'
import { MdKeyboardVoice } from 'react-icons/md'
import { IoMdAnalytics } from 'react-icons/io'
import type { ChannelConfig } from '@/campaign/CampaignContext'

interface Asset {
  url: string
  publicId: string
  type: 'image' | 'video'
}

interface LoadedCampaign {
  id: string
  title: string
  description: string | { original?: string; aiEnhanced?: string }
  channels: ChannelConfig
  toneOfVoice?: string
  assets?: Asset[]
  contactCount: number
  status: string
  csvStoragePath?: string
  aiDescription?: string
  previewText?: string
  transcript?: string
  contactsFile?: { url: string; publicId: string; name?: string }
  documents?: { url: string; publicId: string; name: string; extractedText: string; uploadedAt: string }[]
  channelContent?: {
    voice?: { transcript?: string }
    calls?: { transcript?: string }
  }
  audioUrls?: {
    voice?: string
    calls?: string
  }
  audioPublicIds?: {
    voice?: string
    calls?: string
  }
}

export default function CampaignDetailPage() {
  const router = useRouter()
  const params = useParams()
  const campaignId = params.campaignId as string

  const [loadedCampaign, setLoadedCampaign] = useState<LoadedCampaign | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [makingCalls, setMakingCalls] = useState(false)
  const [callSuccess, setCallSuccess] = useState('')

  useEffect(() => {
    const loadCampaign = async () => {
      try {
        if (!campaignId) {
          setError('No campaign ID found')
          setLoading(false)
          return
        }

        console.log('📡 Fetching campaign from API:', campaignId)

        // Use API endpoint instead of client SDK
        const response = await fetch(`/api/campaigns/${campaignId}`)
        const contentType = response.headers.get('content-type')
        
        // Check if we got HTML instead of JSON (error page)
        if (!contentType?.includes('application/json')) {
          console.error('❌ Got non-JSON response:', { status: response.status, contentType })
          setError(`API Error (${response.status}): Server returned ${contentType || 'non-JSON'} instead of JSON. Check authentication.`)
          setLoading(false)
          return
        }

        const data = await response.json()

        if (response.ok) {
          console.log('✅ Campaign loaded from API:', {
            title: data.campaign.title,
            hasChannelContent: !!data.campaign.channelContent,
            channelContent: data.campaign.channelContent,
            audioUrls: data.campaign.audioUrls,
          })

          setLoadedCampaign(data.campaign)
        } else {
          setError(data.error || `Failed to load campaign (${response.status})`)
        }
      } catch (err) {
        console.error('❌ Error loading campaign:', err)
        setError(`Failed to load campaign: ${err instanceof Error ? err.message : String(err)}`)
      } finally {
        setLoading(false)
      }
    }

    loadCampaign()
  }, [campaignId])

  const handleMakeCalls = async () => {
    if (!campaignId) {
      setError('Campaign ID not found')
      return
    }

    try {
      setError('')
      setCallSuccess('')
      setMakingCalls(true)

      console.log('📞 Making calls for campaign:', campaignId)
      const response = await fetch(`/api/campaigns/${campaignId}/make-calls`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to make calls')
      }

      console.log('✅ Calls initiated:', data.callResults)
      setCallSuccess(`📞 Calls initiated! Successful: ${data.callResults.successfulCalls}/${data.callResults.totalCalls}`)
    } catch (err) {
      console.error('Error making calls:', err)
      setError(err instanceof Error ? err.message : 'Failed to make calls')
    } finally {
      setMakingCalls(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950">
        <div className="max-w-5xl mx-auto px-6 py-12 flex items-center justify-center h-[60vh]">
          <div className="text-center space-y-3">
            <div className="flex justify-center">
              <img 
                src="/favicon.svg" 
                alt="Loading" 
                className="w-12 h-12 animate-spin"
              />
            </div>
            <p className="text-white">Loading campaign...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error && !loadedCampaign) {
    return (
      <div className="min-h-screen bg-zinc-950">
        <div className="max-w-5xl mx-auto px-6 py-12 flex items-center justify-center h-[60vh]">
          <div className="text-center space-y-3">
            <p className="text-red-400">{error}</p>
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

  if (!loadedCampaign) {
    return (
      <div className="min-h-screen bg-zinc-950">
        <div className="max-w-5xl mx-auto px-6 py-12 flex items-center justify-center h-[60vh]">
          <p className="text-white">No campaign data found</p>
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
          className="opacity-3"
          style={{ height: '65vh', width: 'auto' }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10">
        <div className="max-w-5xl mx-auto px-6 py-12">
          {/* Header */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-8">
              <Link
                href="/yourcampaigns"
                className="group inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-white/20 text-white/70 hover:text-white hover:border-white/40 transition-all duration-300"
              >
                <span className="group-hover:-translate-x-1 transition-transform">←</span>
                Back to Campaigns
              </Link>
              
              <div className="flex items-center gap-3">
                <Link
                  href={`/analytics/${loadedCampaign.id}`}
                  className="px-5 py-2.5 rounded-lg border border-white/20 text-white hover:border-white/40 hover:bg-white/5 transition-all duration-300 text-sm font-medium flex items-center gap-2"
                >
                  <IoMdAnalytics className="w-5 h-5" style={{ color: '#f6f4f0' }} />
                  Analytics
                </Link>
                {loadedCampaign?.channels?.calls?.enabled && (
                  <button
                    onClick={handleMakeCalls}
                    disabled={makingCalls}
                    className="px-5 py-2.5 rounded-lg bg-white cursor-pointer text-black hover:bg-white/90 transition-all duration-300 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {makingCalls ? (
                      <>
                        <span className="inline-block animate-spin">⏳</span>
                        Making Calls...
                      </>
                    ) : (
                      <>
                        <VscCallOutgoing className='text-lg' />
                        Make Call
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Title Section */}
            <div className="mb-8">
              <h1 className="text-5xl font-bold text-white mb-2">{loadedCampaign.title}</h1>
              <p className="text-white/50 text-lg">Campaign Details & Configuration</p>
            </div>
          </div>

          {error && (
            <div className="mb-8 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          {callSuccess && (
            <div className="mb-8 p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
              {callSuccess}
            </div>
          )}

          {/* Block Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Description Block - Full Width */}
            <div className="lg:col-span-3 rounded-2xl p-8 bg-white/2 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all">
              <p className="text-xs text-white/50 mb-3 uppercase tracking-wider">Description</p>
              <p className="text-white/80 text-base leading-relaxed line-clamp-4">
                {(typeof loadedCampaign.description === 'object' 
                  ? loadedCampaign.description?.original 
                  : loadedCampaign.description) || 'No description provided'}
              </p>
            </div>

            {/* AI Description Block - Full Width */}
            {(typeof loadedCampaign.description === 'object' 
              ? loadedCampaign.description?.aiEnhanced 
              : loadedCampaign.aiDescription) && (
              <div className="lg:col-span-3 rounded-2xl p-8 bg-gradient-to-br from-purple-500/10 to-violet-500/10 backdrop-blur-sm border border-purple-500/20 hover:border-purple-500/40 transition-all">
                <p className="text-xs text-purple-300/70 mb-3 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                  AI-Enhanced
                </p>
                <p className="text-white/80 text-sm leading-relaxed line-clamp-4">
                  {(typeof loadedCampaign.description === 'object' 
                    ? loadedCampaign.description?.aiEnhanced 
                    : loadedCampaign.aiDescription)}
                </p>
              </div>
            )}

            {/* Channel Blocks */}
            {loadedCampaign.channels.text?.enabled && (
              <div className="rounded-2xl p-6 bg-blue-500/5 backdrop-blur-sm border border-blue-500/20 hover:border-blue-500/40 transition-all flex flex-col">
                <p className="text-xs text-blue-300/70 mb-4 uppercase tracking-wider">Text</p>
                <div className="flex-1 flex flex-col justify-center">
                  <span className="text-3xl font-bold text-white mb-1">{loadedCampaign.channels.text.wordLimit}</span>
                  <span className="text-xs text-white/40">words max</span>
                </div>
              </div>
            )}
            {loadedCampaign.channels.voice?.enabled && (
              <div className="rounded-2xl p-6 bg-blue-500/5 backdrop-blur-sm border border-blue-500/20 hover:border-blue-500/40 transition-all flex flex-col">
                <p className="text-xs text-blue-300/70 mb-4 uppercase tracking-wider flex items-center gap-2">
                  <MdKeyboardVoice className="w-4 h-4" style={{ color: '#f6f4f0' }} /> Voice
                </p>
                <div className="flex-1 flex flex-col justify-center">
                  <span className="text-3xl font-bold text-white mb-1">{loadedCampaign.channels.voice.maxDurationSeconds}s</span>
                  <span className="text-xs text-white/40">max duration</span>
                </div>
              </div>
            )}
            {loadedCampaign.channels.calls?.enabled && (
              <div className="rounded-2xl p-6 bg-green-500/5 backdrop-blur-sm border border-green-500/20 hover:border-green-500/40 transition-all flex flex-col">
                <p className="text-xs text-green-300/70 mb-4 uppercase tracking-wider flex items-center gap-2">
                  <VscCallOutgoing className="w-4 h-4" style={{ color: '#f6f4f0' }} /> Calls
                </p>
                <div className="flex-1 flex flex-col justify-center">
                  <span className="text-3xl font-bold text-white mb-1">{loadedCampaign.channels.calls.maxCallDurationSeconds}s</span>
                  <span className="text-xs text-white/40">max duration</span>
                </div>
              </div>
            )}

            {/* Voice Message Block */}
            {loadedCampaign.channels.voice?.enabled && loadedCampaign.channelContent?.voice?.transcript && (
              <div className="lg:col-span-2 rounded-2xl p-6 bg-blue-500/5 backdrop-blur-sm border border-blue-500/20 hover:border-blue-500/40 transition-all">
                <p className="text-xs text-blue-300/70 mb-3 uppercase tracking-wider flex items-center gap-2">
                  <MdKeyboardVoice className="w-4 h-4" style={{ color: '#f6f4f0' }} /> Voice Script
                </p>
                <p className="text-white/80 text-xs leading-relaxed line-clamp-4 bg-black/20 rounded-lg p-3 border border-blue-500/10 mb-3">
                  {loadedCampaign.channelContent.voice.transcript}
                </p>
                {loadedCampaign.audioUrls?.voice && (
                  <audio
                    controls
                    src={loadedCampaign.audioUrls.voice}
                    className="w-full bg-black/30 rounded-lg border border-blue-500/10 h-8"
                  />
                )}
              </div>
            )}

            {/* Call Script Block */}
            {loadedCampaign.channels.calls?.enabled && loadedCampaign.channelContent?.calls?.transcript && (
              <div className="lg:col-span-1 rounded-2xl p-6 bg-green-500/5 backdrop-blur-sm border border-green-500/20 hover:border-green-500/40 transition-all">
                <p className="text-xs text-green-300/70 mb-3 uppercase tracking-wider flex items-center gap-2">
                  <VscCallOutgoing className="w-4 h-4" style={{ color: '#f6f4f0' }} /> Call Script
                </p>
                <p className="text-white/80 text-xs leading-relaxed line-clamp-3 bg-black/20 rounded-lg p-3 border border-green-500/10">
                  {loadedCampaign.channelContent.calls.transcript}
                </p>
              </div>
            )}

            {/* Assets Block - Full Width */}
            <div className="lg:col-span-3 rounded-2xl p-6 bg-white/2 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all">
              <p className="text-xs text-white/50 mb-4 uppercase tracking-wider">
                Assets <span className="text-white/40">({loadedCampaign.assets?.length || 0})</span>
              </p>
              {loadedCampaign.assets && loadedCampaign.assets.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {loadedCampaign.assets.map((asset, idx) => (
                    <div key={idx} className="rounded-lg overflow-hidden aspect-square bg-black/40 border border-white/10 hover:border-white/20 transition-all hover:scale-105">
                      {asset.type === 'image' ? (
                        <img src={asset.url} alt={`Asset ${idx}`} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-indigo-500/10 to-purple-500/10">
                          <span className="text-2xl">🎬</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-white/40 text-xs text-center py-6">No assets uploaded</p>
              )}
            </div>

            {/* Documents Block */}
            {loadedCampaign.documents && loadedCampaign.documents.length > 0 && (
              <div className="lg:col-span-2 rounded-2xl p-6 bg-white/2 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all">
                <p className="text-xs text-white/50 mb-3 uppercase tracking-wider">Documents</p>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {loadedCampaign.documents.map((doc, idx) => (
                    <div key={idx} className="px-3 py-2 rounded-lg bg-black/30 border border-white/10 hover:border-white/20 transition-all flex items-center justify-between text-xs">
                      <div>
                        <span className="text-white/80 block font-medium line-clamp-1">{doc.name}</span>
                      </div>
                      <a
                        href={doc.url}
                        download
                        className="px-2 py-1 rounded bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 text-xs font-medium transition cursor-pointer whitespace-nowrap ml-2"
                      >
                        Get
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Contacts Block */}
            {loadedCampaign.contactsFile && (
              <div className="lg:col-span-1 rounded-2xl p-6 bg-white/2 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all flex flex-col">
                <p className="text-xs text-white/50 mb-3 uppercase tracking-wider">Contacts</p>
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-white/80 text-sm block font-medium line-clamp-1">{loadedCampaign.contactsFile?.name || 'File'}</span>
                    <span className="text-xs text-white/60">{loadedCampaign.contactCount} total</span>
                  </div>
                  <a
                    href={`/api/campaigns/${campaignId}/contacts/download`}
                    download
                    className="px-3 py-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 text-xs font-medium transition cursor-pointer text-center mt-2"
                  >
                    Download
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
