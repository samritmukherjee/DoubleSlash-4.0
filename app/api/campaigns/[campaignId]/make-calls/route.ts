import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase/admin";
import { callAgent } from "@/lib/call-agent";

type Context = { params: Promise<{ campaignId: string }> };

/**
 * POST /api/campaigns/[campaignId]/make-calls
 * 
 * Makes Twilio calls to all contacts in the campaign.
 * Requires:
 * - Campaign to have channelContent.calls.transcript (the script to say)
 * - Contacts with phone numbers
 */
export async function POST(
  request: NextRequest,
  { params }: Context
): Promise<NextResponse> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { campaignId } = await params;

    if (!campaignId) {
      return NextResponse.json(
        { error: "Missing campaignId" },
        { status: 400 }
      );
    }

    const ref = db
      .collection("users")
      .doc(userId)
      .collection("campaigns")
      .doc(campaignId);

    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    const campaignData = snap.data() as any;

    console.log('====== MAKE CALLS DEBUG START ======');
    console.log('Campaign ID:', campaignId);
    console.log('All campaign data keys:', Object.keys(campaignData));
    
    // Check if calls channel is enabled
    const callsEnabled = campaignData.channels?.calls?.enabled;
    console.log('Calls enabled:', callsEnabled);

    if (!callsEnabled) {
      console.log('❌ Calls channel is disabled');
      return NextResponse.json(
        { error: "Calls channel is not enabled for this campaign" },
        { status: 400 }
      );
    }

    // Get call transcript - handle FLAT key structure from Firestore merge
    let callScript = '';
    
    // First try nested structure
    callScript = campaignData?.channelContent?.calls?.transcript;
    console.log('Attempt 1 (nested):', callScript ? 'FOUND' : 'NOT FOUND');
    
    // If not found, try flat key structure (from Firestore merge with dot notation)
    if (!callScript) {
      callScript = campaignData['channelContent.calls.transcript'];
      console.log('Attempt 2 (flat key):', callScript ? 'FOUND' : 'NOT FOUND');
    }

    console.log('Final call script:', callScript ? `${callScript.substring(0, 100)}...` : 'EMPTY');
    console.log('====== MAKE CALLS DEBUG END ======');

    if (!callScript || callScript.trim() === '') {
      console.error('❌ No call script found');
      return NextResponse.json(
        { error: "Call transcript not found in campaign data. Please generate one in the campaign editor first." },
        { status: 400 }
      );
    }

    // Get contacts from campaign data
    const contacts = campaignData.contacts || campaignData.contactsSummary?.items || [];
    
    if (contacts.length === 0) {
      return NextResponse.json(
        { error: "No contacts found to call" },
        { status: 400 }
      );
    }

    // Extract phone numbers
    const phoneNumbers = contacts
      .map((contact: any) => contact.phone)
      .filter((phone: any) => phone && phone.trim());

    if (phoneNumbers.length === 0) {
      return NextResponse.json(
        { error: "No valid phone numbers found in contacts" },
        { status: 400 }
      );
    }

    console.log(`📞 Making calls for campaign ${campaignId}`);
    console.log(`   Contacts: ${contacts.length}`);
    console.log(`   Phone numbers to call: ${phoneNumbers.length}`);
    console.log(`   Call script: ${callScript.substring(0, 100)}...`);

    // Make the calls
    const callResult = await callAgent({
      phoneNumbers,
      script: callScript
    });

    // Update campaign status to track calls
    await ref.update({
      callsInitiated: true,
      callsInitiatedAt: new Date(),
      callResults: {
        totalAttempted: callResult.totalCalls,
        successfulCalls: callResult.successfulCalls,
        failedCalls: callResult.failedCalls,
        errors: callResult.errors
      }
    });

    return NextResponse.json({
      success: true,
      campaignId,
      callResults: callResult
    });

  } catch (error) {
    console.error("Call execution error:", error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Internal server error"
      },
      { status: 500 }
    );
  }
}
