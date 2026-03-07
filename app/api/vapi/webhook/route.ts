import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/admin';

/**
 * POST /api/vapi/webhook
 * Handlers Vapi.ai webhooks for call lifecycle events.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('📬 Vapi Webhook Received:', body.message?.type);

    const message = body.message;
    if (!message) {
      return NextResponse.json({ error: 'Invalid webhook payload' }, { status: 400 });
    }

    // Handle Call Ended Event
    const eventType = message.type;
    if (eventType === 'call-ended' || eventType === 'call.ended' || eventType === 'end-of-call-report') {
      const call = message.call;
      const metadata = call?.metadata || {};
      const { userId, campaignId } = metadata;

      if (!userId || !campaignId) {
        console.warn('⚠️ Vapi Webhook: Received event without userId/campaignId in metadata');
        console.log('   Received Metadata:', JSON.stringify(metadata, null, 2));
        return NextResponse.json({ status: 'ignored', reason: 'Missing attribution metadata' });
      }

      console.log(`📊 Processing analytics for Call ID ${call.id} (Campaign: ${campaignId})`);

      // 1. Save individual call record
      const callData = {
        callId: call.id,
        timestamp: new Date().toISOString(),
        duration: call.duration || 0,
        status: call.status || 'ended',
        endedReason: call.endedReason || 'unknown',
        customerPhone: call.customer?.number || 'unknown',
        transcript: call.transcript || '',
        summary: call.summary || '',
        cost: call.cost || 0,
      };

      await db
        .collection('users')
        .doc(userId)
        .collection('campaigns')
        .doc(campaignId)
        .collection('calls')
        .doc(call.id)
        .set(callData);

      console.log(`✅ Call record saved to Firestore for campaign ${campaignId}`);

      // 2. Optional: Increment campaign-level stats for faster lookup
      // We can use a transaction or simply update the campaign doc
      const campaignRef = db
        .collection('users')
        .doc(userId)
        .collection('campaigns')
        .doc(campaignId);

      await db.runTransaction(async (transaction) => {
        const campaignDoc = await transaction.get(campaignRef);
        if (campaignDoc.exists) {
          const data = campaignDoc.data() || {};
          const stats = data.vapiStats || {
            totalCalls: 0,
            totalDuration: 0,
            answeredCalls: 0,
          };

          stats.totalCalls += 1;
          stats.totalDuration += call.duration || 0;
          if (call.duration > 0) {
            stats.answeredCalls += 1;
          }

          transaction.update(campaignRef, { vapiStats: stats });
        }
      });
      
      console.log(`📈 Campaign stats updated for ${campaignId}`);
    }

    return NextResponse.json({ status: 'success' });
  } catch (error: any) {
    console.error('❌ Vapi Webhook Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
