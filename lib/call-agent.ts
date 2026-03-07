import { twilioClient } from './twilio-client';

interface CallInput {
  phoneNumbers: string[];
  script: string;
}

interface CallResult {
  status: 'CALLS_COMPLETED';
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  errors: { phone: string; error: string }[];
}

const wait = (ms: number) => new Promise(r => setTimeout(r, ms));

export async function callAgent({ phoneNumbers, script }: CallInput): Promise<CallResult> {
  const result: CallResult = {
    status: 'CALLS_COMPLETED',
    totalCalls: phoneNumbers.length,
    successfulCalls: 0,
    failedCalls: 0,
    errors: []
  };

  const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
  
  if (!twilioPhoneNumber) {
    throw new Error('Missing TWILIO_PHONE_NUMBER environment variable');
  }

  console.log(`📞 Starting to make ${phoneNumbers.length} calls with script...`);
  console.log(`Script preview: ${script.substring(0, 100)}...`);

  for (let i = 0; i < phoneNumbers.length; i++) {
    const number = phoneNumbers[i];
    
    try {
      // Format phone number - ensure it has country code
      const formattedNumber = formatPhoneNumber(number);
      
      console.log(`[${i + 1}/${phoneNumbers.length}] 📞 Calling ${formattedNumber}...`);

      // Escape special characters in script for TwiML
      const escapedScript = escapeXML(script);

      await twilioClient.calls.create({
        to: formattedNumber,
        from: twilioPhoneNumber,
        twiml: `<Response><Say>${escapedScript}</Say></Response>`,
      });

      result.successfulCalls++;
      console.log(`✅ Call to ${formattedNumber} initiated successfully`);

      // Wait 60 seconds between calls to avoid rate limiting
      if (i < phoneNumbers.length - 1) {
        await wait(60000);
      }
    } catch (error) {
      result.failedCalls++;
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`❌ Failed to call ${number}: ${errorMsg}`);
      result.errors.push({
        phone: number,
        error: errorMsg
      });
    }
  }

  console.log(`\n📊 Call Campaign Summary:`);
  console.log(`   Total: ${result.totalCalls}`);
  console.log(`   Successful: ${result.successfulCalls}`);
  console.log(`   Failed: ${result.failedCalls}`);

  return result;
}

/**
 * Format phone number to E.164 format
 * Handles Indian numbers (+91) and US numbers (+1)
 */
function formatPhoneNumber(phone: string): string {
  // Remove all non-numeric characters
  let cleaned = phone.replace(/\D/g, '');
  
  // If it's an Indian number (10 digits), add +91
  if (cleaned.length === 10) {
    return `+91${cleaned}`;
  }
  
  // If it already starts with country code (more than 10 digits)
  if (cleaned.length > 10) {
    // Check if it has + at the start (already formatted)
    if (phone.startsWith('+')) {
      return phone;
    }
    // Add + prefix if not present
    return `+${cleaned}`;
  }
  
  // Default: assume Indian if exactly 10 digits
  return `+91${cleaned}`;
}

/**
 * Escape XML special characters for TwiML safety
 */
function escapeXML(str: string): string {
  const xmlChars: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&apos;'
  };
  
  return str.replace(/[&<>"']/g, (char) => xmlChars[char] || char);
}
