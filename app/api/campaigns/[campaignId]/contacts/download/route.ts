import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/firebase/admin'

type Ctx = { params: Promise<{ campaignId: string }> }

export async function GET(request: NextRequest, { params }: Ctx) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { campaignId } = await params

    console.log('📥 Downloading contacts for campaign:', campaignId)

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
    const contactsFile = data.contactsFile

    if (!contactsFile?.url) {
      return NextResponse.json(
        { error: 'No contacts file available for download' },
        { status: 400 }
      )
    }

    // Download file from Cloudinary
    console.log('📥 Downloading file from Cloudinary:', contactsFile.url)
    const res = await fetch(contactsFile.url)

    if (!res.ok) {
      console.error('Failed to download from Cloudinary:', res.statusText)
      return NextResponse.json(
        { error: 'Failed to download contacts file' },
        { status: 400 }
      )
    }

    const buffer = await res.arrayBuffer()
    const fileName = contactsFile.name || 'contacts.xlsx'

    // Determine content type based on file extension
    let contentType = 'application/octet-stream'
    if (fileName.toLowerCase().endsWith('.csv')) {
      contentType = 'text/csv'
    } else if (fileName.toLowerCase().endsWith('.xlsx')) {
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    } else if (fileName.toLowerCase().endsWith('.xls')) {
      contentType = 'application/vnd.ms-excel'
    }

    console.log(`✅ Sending ${fileName} with type ${contentType}`)

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      },
    })
  } catch (error) {
    console.error('❌ Download contacts error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to download contacts' },
      { status: 500 }
    )
  }
}
