/**
 * Campaign Assets Upload Page
 * 
 * Handles uploading images and videos for the campaign.
 * Files are uploaded immediately to the draft campaign via /api/campaigns/[campaignId]/files.
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCampaign } from '../CampaignContext'

export default function AssetsPage() {
  const router = useRouter()
  const { campaign, updateCampaign } = useCampaign()
  const [assets, setAssets] = useState<File[]>(campaign.assets || [])
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState('')
  const [isUploading, setIsUploading] = useState(false)

  const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(e.type === 'dragenter' || e.type === 'dragover')
  }

  const uploadAssets = async (filesToUpload: File[]) => {
    if (!campaign.campaignId) {
      setError('Campaign ID not found. Please go back and try again.')
      return false
    }

    try {
      setError('')
      setIsUploading(true)

      const formData = new FormData()
      filesToUpload.forEach((file) => {
        formData.append('assets', file)
      })

      console.log('📤 Uploading assets to draft campaign...')
      const res = await fetch(`/api/campaigns/${campaign.campaignId}/files`, {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to upload assets')
      }

      console.log('✅ Assets uploaded successfully')
      return true
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to upload assets'
      setError(errorMsg)
      console.error('Error uploading assets:', err)
      return false
    } finally {
      setIsUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = Array.from(e.dataTransfer.files).filter((file) =>
      ['image/png', 'image/jpeg', 'video/mp4', 'video/quicktime', 'application/pdf'].includes(file.type)
    )
    
    // Check file sizes
    const oversized = files.filter(f => f.size > MAX_FILE_SIZE)
    if (oversized.length > 0) {
      setError(`${oversized.length} file(s) exceed 10MB limit`)
      return
    }
    
    setError('')
    setAssets((prev) => [...prev, ...files])
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      
      // Check file sizes
      const oversized = files.filter(f => f.size > MAX_FILE_SIZE)
      if (oversized.length > 0) {
        setError(`${oversized.length} file(s) exceed 10MB limit`)
        return
      }
      
      setError('')
      setAssets((prev) => [...prev, ...files])
    }
  }

  const removeAsset = (idx: number) => {
    setAssets((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleContinue = async () => {
    // Upload assets if any
    if (assets.length > 0) {
      const uploaded = await uploadAssets(assets)
      if (!uploaded) return
    }

    // Update context and continue
    updateCampaign({ assets })
    router.push('/campaign/docs')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl  text-white mb-2">Upload assets</h1>
        <p className="text-slate-400">Add images or videos to include in your campaign</p>
      </div>

      {/* Drag and drop area */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-3xl p-8 text-center transition ${
          dragActive
            ? 'border-white/60 bg-white/10'
            : 'border-white/20 bg-black/30 hover:border-white/30'
        }`}
      >
        <div className="space-y-3">
          <div className="text-4xl">📁</div>
          <div>
            <p className="text-white ">Drag files here or</p>
            <label className="text-white/80 cursor-pointer hover:text-white">
              click to browse
              <input
                type="file"
                multiple
                accept="image/png,image/jpeg,video/mp4,video/quicktime,.pdf"
                onChange={handleFileInput}
                className="hidden"
              />
            </label>
          </div>
          <p className="text-xs text-white/50">PNG, JPG, MP4, MOV, PDF up to 10MB each</p>
        </div>
      </div>

      {/* Assets list - show selected files */}
      {assets.length > 0 && (
        <div>
          <h3 className="text-sm text-white mb-3">
            Assets ({assets.length})
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {assets.map((file, idx) => (
              <div key={`asset-${idx}`} className="flex items-center justify-between bg-blue-900/30 border border-blue-500/40 rounded-lg p-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-lg">{file.type.startsWith('image') ? '🖼️' : file.type.startsWith('video') ? '🎬' : '📄'}</span>
                  <span className="text-sm text-white/80 truncate">{file.name}</span>
                </div>
                <button
                  onClick={() => removeAsset(idx)}
                  className="text-white/50 hover:text-red-400 transition ml-2 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex justify-between gap-3 pt-4">
        <button
          onClick={() => router.push('/campaign/channels')}
          className="px-6 py-2.5 rounded-lg bg-black/40 border border-white/20 hover:bg-black/50 text-white font-medium transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isUploading}
        >
          Back
        </button>
        <button
          onClick={handleContinue}
          disabled={isUploading}
          className="px-6 py-2.5 rounded-lg bg-white hover:bg-white/95 text-black font-semibold transition shadow-[0_4px_12px_rgba(255,255,255,0.2)] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading ? '⟳ Uploading...' : 'Continue'}
        </button>
      </div>
    </div>
  )
}
