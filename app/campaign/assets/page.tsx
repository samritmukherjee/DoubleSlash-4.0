'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCampaign } from '../CampaignContext'

export default function AssetsPage() {
  const router = useRouter()
  const { campaign, updateCampaign } = useCampaign()
  const [assets, setAssets] = useState<File[]>(campaign.assets)
  const [dragActive, setDragActive] = useState(false)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(e.type === 'dragenter' || e.type === 'dragover')
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = Array.from(e.dataTransfer.files).filter((file) =>
      ['image/png', 'image/jpeg', 'video/mp4', 'video/quicktime'].includes(file.type)
    )
    setAssets((prev) => [...prev, ...files])
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      setAssets((prev) => [...prev, ...files])
    }
  }

  const removeAsset = (idx: number) => {
    setAssets((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleContinue = () => {
    updateCampaign({ assets })
    router.push('/campaign/contacts')
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
                accept="image/png,image/jpeg,video/mp4,video/quicktime"
                onChange={handleFileInput}
                className="hidden"
              />
            </label>
          </div>
          <p className="text-xs text-white/50">PNG, JPG, MP4, MOV up to 100MB</p>
        </div>
      </div>

      {/* Assets list */}
      {assets.length > 0 && (
        <div>
          <h3 className="text-sm  text-white mb-3">Uploaded assets ({assets.length})</h3>
          <div className="grid grid-cols-2 gap-2">
            {assets.map((file, idx) => (
              <div key={idx} className="flex items-center justify-between bg-black/40 border border-white/10 rounded-lg p-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-lg">{file.type.startsWith('image') ? '🖼️' : '🎬'}</span>
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

      <div className="flex justify-between gap-3 pt-4">
        <button
          onClick={() => router.push('/campaign/channels')}
          className="px-6 py-2.5 rounded-lg bg-black/40 border border-white/20 hover:bg-black/50 text-white font-medium transition cursor-pointer"
        >
          Back
        </button>
        <button
          onClick={handleContinue}
          className="px-6 py-2.5 rounded-lg bg-white hover:bg-white/95 text-black font-semibold transition shadow-[0_4px_12px_rgba(255,255,255,0.2)] cursor-pointer"
        >
          Continue
        </button>
      </div>
    </div>
  )
}
