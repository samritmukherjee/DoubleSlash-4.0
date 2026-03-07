import { triggerOutboundCall } from './vapi-caller';
import { db } from '@/lib/firebase/admin';

interface CallInput {
  phoneNumbers: string[];
  campaignId: string;
  userId: string;
  baseUrl?: string;
}

interface CallResult {
  status: 'CALLS_COMPLETED';
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  errors: { phone: string; error: string }[];
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

function formatPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) return `+91${cleaned}`;
  if (cleaned.length > 10) {
    return phone.startsWith('+') ? phone : `+${cleaned}`;
  }
  return `+91${cleaned}`;
}

/**
 * AI Calling Agent using Vapi (No LiveKit or NGrok required)
 */
export async function callAgent({
  phoneNumbers,
  campaignId,
  userId,
  baseUrl,
}: CallInput): Promise<CallResult> {
  const result: CallResult = {
    status: 'CALLS_COMPLETED',
    totalCalls: phoneNumbers.length,
    successfulCalls: 0,
    failedCalls: 0,
    errors: [],
  };

  console.log(`\n📞 ══════════════════════════════════════════`);
  console.log(`📞 AI CALLING AGENT (VAPI) — Starting ${phoneNumbers.length} calls`);
  console.log(`   Campaign: ${campaignId}`);
  console.log(`📞 ══════════════════════════════════════════\n`);

  try {
    // 1. Fetch Campaign Data
    const campaignRef = db
      .collection('users')
      .doc(userId)
      .collection('campaigns')
      .doc(campaignId);

    const campaignSnap = await campaignRef.get();
    if (!campaignSnap.exists) {
      throw new Error(`Campaign ${campaignId} not found for user ${userId}`);
    }

    const campaignData = campaignSnap.data() || {};
    const campaignTitle = campaignData.title || "Support Campaign";
    const campaignDescription = campaignData.description || "Conversational customer support and inquiry handling.";
    
    // Fetch ordered questions if they exist
    const orderedQuestions = campaignData.questions || [];

    // 2. Fetch Knowledge Base / Documents Text
    const docs = campaignData.documents || [];
    const docsText = docs
      .map((doc: any) => `Document: ${doc.name}\nContent: ${doc.extractedText}`)
      .join('\n\n---\n\n');

    for (let i = 0; i < phoneNumbers.length; i++) {
      const rawPhone = phoneNumbers[i];

      try {
        const phone = formatPhoneNumber(rawPhone);

        console.log(`[${i + 1}/${phoneNumbers.length}] 📞 Triggering Vapi outbound call: ${phone}`);

        // 3. Trigger Vapi Call with Dynamic Data
        await triggerOutboundCall({
          customerPhoneNumber: phone,
          customerName: `Customer (${phone})`,
          campaignTitle,
          campaignDescription,
          docsText,
          orderedQuestions,
          userId,
          campaignId
        });

        console.log(`   ✅ Vapi outbound call initiated for ${phone}`);
        result.successfulCalls++;

        if (i < phoneNumbers.length - 1) {
          await wait(2000); 
        }
      } catch (error) {
        result.failedCalls++;
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`   ❌ Failed to call ${rawPhone}: ${errorMsg}`);
        result.errors.push({ phone: rawPhone, error: errorMsg });
      }
    }
  } catch (outerError: any) {
    console.error(`❌ Global error in callAgent for campaign ${campaignId}:`, outerError.message);
    result.errors.push({ phone: 'ALL', error: outerError.message });
  }

  return result;
}
