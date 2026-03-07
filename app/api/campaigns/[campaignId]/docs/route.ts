import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/firebase/admin'
import { uploadToCloudinary } from '@/lib/cloudinary'
import { extractPdfText } from '@/lib/pdf-extraction'

type Ctx = { params: Promise<{ campaignId: string }> }

export async function POST(request: NextRequest, { params }: Ctx) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { campaignId } = await params

    console.log('📄 Processing document for campaign:', campaignId)

    const ref = db
      .collection('users')
      .doc(userId)
      .collection('campaigns')
      .doc(campaignId)

    const snap = await ref.get()
    if (!snap.exists) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    const formData = await request.formData()
    const uploadedFile = formData.get('docFile') as File | null

    if (!uploadedFile) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    // Validate PDF file
    if (!uploadedFile.type.includes('pdf') && !uploadedFile.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json({ error: 'Only PDF files are supported' }, { status: 400 })
    }

    console.log('📥 Processing PDF file:', uploadedFile.name)

    // Convert file to buffer
    const arrayBuffer = await uploadedFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to Cloudinary
    console.log('☁️ Uploading to Cloudinary...')
    const cloudinaryResult = await uploadToCloudinary(uploadedFile, `campaigns/${campaignId}/docs`, 'raw')

    // Extract text from PDF
    console.log('🔍 Extracting text from PDF...')
    let extractedText = ''
    try {
      extractedText = await extractPdfText(buffer)
    } catch (extractError) {
      console.warn('⚠️ PDF text extraction warning:', extractError)
      // Don't fail completely, just note that extraction failed
      extractedText = '[PDF text extraction failed - file may be encrypted or corrupted]'
    }

    // Prepare document data
    const documentData = {
      url: cloudinaryResult.secure_url,
      publicId: cloudinaryResult.public_id,
      name: uploadedFile.name,
      extractedText,
      uploadedAt: new Date().toISOString(),
    }

    // Update campaign with document
    await ref.update({
      documents: [documentData], // Store as array for potential multiple docs
      updatedAt: new Date().toISOString(),
    })

    console.log('✅ Document uploaded and saved successfully')

    return NextResponse.json({
      success: true,
      document: documentData,
      message: 'Document uploaded and text extracted successfully',
    })
  } catch (error) {
    console.error('❌ Error uploading document:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to upload document' },
      { status: 500 }
    )
  }
}

// GET endpoint to fetch documents
export async function GET(request: NextRequest, { params }: Ctx) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { campaignId } = await params

    const ref = db
      .collection('users')
      .doc(userId)
      .collection('campaigns')
      .doc(campaignId)

    const snap = await ref.get()
    if (!snap.exists) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    const data = snap.data() || {}
    const documents = data.documents || []

    return NextResponse.json({ documents })
  } catch (error) {
    console.error('❌ Error fetching documents:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch documents' },
      { status: 500 }
    )
  }
}
