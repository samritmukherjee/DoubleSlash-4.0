import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/firebase/admin'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { v2 as cloudinary } from 'cloudinary'

type Ctx = { params: Promise<{ campaignId: string }> }

export async function POST(request: NextRequest, { params }: Ctx) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { campaignId } = await params
    const { channel, transcript, toneOfVoice } = await request.json()

    if (!channel || !['voice', 'calls'].includes(channel)) {
      return NextResponse.json(
        { error: 'Channel must be voice or calls' },
        { status: 400 }
      )
    }

    if (!transcript || typeof transcript !== 'string' || transcript.trim().length === 0) {
      return NextResponse.json(
        { error: 'Transcript is required and must be a non-empty string' },
        { status: 400 }
      )
    }

    const ref = db
      .collection('users')
      .doc(userId)
      .collection('campaigns')
      .doc(campaignId)

    const snap = await ref.get()
    if (!snap.exists) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    console.log(`🎵 Generating Gemini TTS for ${channel} channel: ${campaignId}`)

    // Build tone-aware prompt based on channel
    let styledTranscript = transcript
    if (channel === 'voice') {
      styledTranscript = `Read the following as a short, friendly voice message in a ${toneOfVoice || 'neutral'} tone:\n\n${transcript}`
    } else if (channel === 'calls') {
      styledTranscript = `Read the following as a clear phone announcement in a ${toneOfVoice || 'neutral'} tone:\n\n${transcript}`
    }

    // Map tone to supported Gemini TTS voice names
    const VOICE_MAP: Record<string, string> = {
      friendly: 'achird',
      professional: 'charon',
      upbeat: 'puck',
      formal: 'kore',
      neutral: 'kore',
      casual: 'leda',
    }

    const requestedTone = (toneOfVoice || 'friendly').toLowerCase()
    const voiceName = VOICE_MAP[requestedTone] || 'kore'

    console.log(`🎤 Using voice: ${voiceName} for tone: ${requestedTone}`)

    // Initialize Gemini client
    const apiKey = process.env.GEMINI_TTS_API_KEY
    if (!apiKey) {
      throw new Error('GEMINI_TTS_API_KEY is not configured')
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-preview-tts',
    })

    console.log(`📝 TTS Input: ${styledTranscript.substring(0, 100)}...`)

    // Generate content with audio output
    const response = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: styledTranscript,
            },
          ],
        } as any,
      ],
      generationConfig: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName,
            },
          },
        },
      } as any,
    } as any)

    // Extract audio from response
    const audioData = response.response.candidates?.[0]?.content?.parts?.find(
      (part: any) => part.inlineData?.mimeType?.startsWith('audio/')
    )

    if (!audioData?.inlineData?.data) {
      throw new Error('No audio data in Gemini response')
    }

    // Decode base64 audio data
    const base64Audio = audioData.inlineData.data
    let audioBuffer = Buffer.from(base64Audio, 'base64')

    console.log(`✅ Audio generated (${audioBuffer.length} bytes)`)

    // Wrap raw PCM audio in WAV container
    const sampleRate = 24000
    const numChannels = 1
    const bitsPerSample = 16
    const byteRate = sampleRate * numChannels * (bitsPerSample / 8)
    const blockAlign = numChannels * (bitsPerSample / 8)

    const wavHeader = Buffer.alloc(44)
    
    // RIFF header
    wavHeader.write('RIFF', 0)
    wavHeader.writeUInt32LE(audioBuffer.length + 36, 4)
    wavHeader.write('WAVE', 8)
    
    // fmt subchunk
    wavHeader.write('fmt ', 12)
    wavHeader.writeUInt32LE(16, 16)
    wavHeader.writeUInt16LE(1, 20) // PCM format
    wavHeader.writeUInt16LE(numChannels, 22)
    wavHeader.writeUInt32LE(sampleRate, 24)
    wavHeader.writeUInt32LE(byteRate, 28)
    wavHeader.writeUInt16LE(blockAlign, 32)
    wavHeader.writeUInt16LE(bitsPerSample, 34)
    
    // data subchunk
    wavHeader.write('data', 36)
    wavHeader.writeUInt32LE(audioBuffer.length, 40)

    // Combine header and audio data
    audioBuffer = Buffer.concat([wavHeader, audioBuffer])

    console.log(`✅ WAV file created (${audioBuffer.length} bytes total)`)

    // Configure Cloudinary
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    })

    console.log(`📤 Uploading audio to Cloudinary...`)

    // Upload audio to Cloudinary as raw WAV file
    const fileName = channel === 'voice' ? `voice_${campaignId}` : `call_${campaignId}`
    const publicId = `outreachx-campaigns/campaigns/${userId}/${fileName}`
    
    const audioUrl: string = await new Promise((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream(
        {
          resource_type: 'raw',
          public_id: publicId,
          format: 'wav',
        },
        (err, result) => {
          if (err || !result) return reject(err)
          resolve(result.secure_url)
        }
      )
      upload.end(audioBuffer)
    })

    console.log(`✅ Audio uploaded to Cloudinary: ${audioUrl}`)

    // Update Firestore with audio URL and public ID
    const updateData: any = {
      audioUrls: {
        ...(snap.data()?.audioUrls || {}),
        [channel]: audioUrl,
      },
      audioPublicIds: {
        ...(snap.data()?.audioPublicIds || {}),
        [channel]: publicId,
      },
      updatedAt: new Date(),
    }

    await ref.set(updateData, { merge: true })

    return NextResponse.json({
      success: true,
      audioUrl,
      publicId,
      channel,
    })
  } catch (error) {
    console.error('❌ Gemini TTS error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate audio'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
