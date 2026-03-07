import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/firebase/admin'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'

type Ctx = { params: Promise<{ campaignId: string }> }

interface ContactItem {
  name: string
  phone: string
}

export async function POST(request: NextRequest, { params }: Ctx) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { campaignId } = await params

    console.log('📞 Extracting contacts for campaign:', campaignId)

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
    
    // Get FormData from request (if file is being uploaded directly)
    const formData = await request.formData()
    const uploadedFile = formData.get('contactsFile') as File | null
    
    let buffer: Buffer
    let fileName: string = 'contacts'

    if (uploadedFile) {
      // File is being uploaded directly in this request
      console.log('📥 Processing uploaded file:', uploadedFile.name)
      fileName = uploadedFile.name
      const arrayBuffer = await uploadedFile.arrayBuffer()
      buffer = Buffer.from(arrayBuffer)
    } else {
      // File should already be in Firestore
      const contactsFile = data.contactsFile

      if (!contactsFile?.url) {
        return NextResponse.json(
          { error: 'No contacts file uploaded' },
          { status: 400 }
        )
      }

      console.log('📥 Downloading file from:', contactsFile.url)
      fileName = contactsFile.name || 'contacts'

      // Download file from Cloudinary
      const res = await fetch(contactsFile.url)
      if (!res.ok) {
        return NextResponse.json(
          { error: 'Failed to download contacts file' },
          { status: 400 }
        )
      }

      const arrayBuffer = await res.arrayBuffer()
      buffer = Buffer.from(arrayBuffer)
    }

    let rows: any[] = []

    // Determine file type and parse accordingly
    if (fileName.toLowerCase().includes('.csv')) {
      console.log('📄 Parsing as CSV...')
      const text = buffer.toString('utf8')
      const parsed = Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: false,
      })
      rows = parsed.data as any[]
    } else {
      console.log('📊 Parsing as Excel...')
      const workbook = XLSX.read(buffer, { type: 'buffer' })
      const sheetName = workbook.SheetNames[0]
      if (!sheetName) {
        return NextResponse.json(
          { error: 'No sheets found in workbook' },
          { status: 400 }
        )
      }
      const sheet = workbook.Sheets[sheetName]
      rows = XLSX.utils.sheet_to_json(sheet)
    }

    // Extract name and phone
    const contacts: ContactItem[] = []
    const phoneRegex = /[\+\d][\d\-\s\(\)]{6,}/

    for (const row of rows) {
      if (!row || typeof row !== 'object') continue

      const entries = Object.entries(row) as [string, any][]
      let name = ''
      let phone = ''

      // First pass: match by column headers
      for (const [key, value] of entries) {
        const k = key.toLowerCase().trim()
        const str = String(value ?? '').trim()

        if (!name && (k.includes('name') || k.includes('customer'))) {
          name = str
        }

        if (
          !phone &&
          (k.includes('phone') ||
            k.includes('mobile') ||
            k.includes('contact') ||
            k.includes('tel'))
        ) {
          phone = str
        }
      }

      // Second pass: search by regex if phone not found
      if (!phone) {
        for (const [, value] of entries) {
          const str = String(value ?? '').trim()
          const match = str.match(phoneRegex)
          if (match) {
            phone = match[0]
            break
          }
        }
      }

      if (phone) {
        contacts.push({
          name: name || 'Unknown',
          phone,
        })
      }
    }

    const count = contacts.length

    console.log(`✅ Extracted ${count} contacts`)

    // Prepare data to save
    const updateData: any = {
      contactsSummary: {
        count,
        items: contacts,
      },
      contactCount: count,
      updatedAt: new Date(),
    }

    // If file was uploaded directly, store its metadata
    if (uploadedFile) {
      updateData.contactsFile = {
        name: uploadedFile.name,
        size: uploadedFile.size,
        type: uploadedFile.type,
        uploadedAt: new Date(),
      }
    }

    // Save to Firestore
    await ref.set(updateData, { merge: true })

    console.log('💾 Saved contact summary to Firestore')

    return NextResponse.json({
      success: true,
      count,
      contacts,
      fileName: uploadedFile?.name || fileName,
    })
  } catch (error) {
    console.error('❌ Contacts parse error:', error)
    return NextResponse.json(
      { error: 'Failed to parse contacts file' },
      { status: 500 }
    )
  }
}
