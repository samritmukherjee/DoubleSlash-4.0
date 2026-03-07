# Webhook Debugging Guide

## Issue
Calls are being recorded in `initiated[]` but never moving to `answered[]` or `missed[]`. This means the Vapi webhook is either:
1. Not configured in Vapi dashboard
2. Not firing at all
3. Having issues updating Firestore

## Testing Steps

### 1. Test the Analytics Update Function (Locally)

Use the new test endpoint to simulate a webhook call:

```bash
# Test an answered call
curl -X POST http://localhost:3000/api/vapi/webhook-test \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_3ARaRTixmCoRJhICh9Rq9u6XXBY",
    "campaignId": "XCotvhMguU4SzUrbEorV",
    "phone": "+919883479073",
    "duration": 45,
    "answered": true
  }'

# Test a missed call
curl -X POST http://localhost:3000/api/vapi/webhook-test \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_3ARaRTixmCoRJhICh9Rq9u6XXBY",
    "campaignId": "XCotvhMguU4SzUrbEorV",
    "phone": "+918274033662",
    "duration": 0,
    "answered": false
  }'
```

#### Expected Output in Console:
```
✅ Initial call recorded for +919883479073 — Total calls: X
...
📝 UPDATING CALL ANALYTICS
   userId: user_3ARaRTixmCoRJhICh9Rq9u6XXBY
   campaignId: XCotvhMguU4SzUrbEorV
   phone: +919883479073
   duration: 45s
   status: completed

📚 CURRENT FIRESTORE STATE:
   Document exists: true
   calls.total: X
   calls.answered: Y
   calls.missed: Z
   initiated count: 3

🔄 BEFORE UPDATE:
   Total calls: X
   Answered: Y
   Missed: Z
   ✅ Removed from initiated array (index 0)
   ✅ Added to answered array

✍️ WRITING TO FIRESTORE:
   calls.total: X (unchanged)
   calls.answered: Y+1
   calls.missed: Z
   initiated array length: 2 (was 3, now 2)
   answered array length: 1

✅ FIRESTORE UPDATE COMPLETE
```

**If you see this output**: Analytics update logic is working ✅

**If you see errors**: There's an issue with the update function - let me know

---

### 2. Check Vapi Dashboard Webhook Configuration

1. Go to https://dashboard.vapi.ai
2. Sign in to your account
3. Look for **Settings** or **Webhooks** section
4. Find your webhook configuration

#### You should see:
- **Webhook URL**: `https://yourdomain.com/api/vapi/webhook`
- **Events**: Should include "Call Ended" or "End of Call Report"
- **Status**: Should be "Active" or "Enabled"

#### Configure it as:
```
URL: https://yourdomain.com/api/vapi/webhook
Event Types: 
  - call-ended
  - end-of-call-report
  - call.ended
```

---

### 3. Manually Test with Vapi API (Advanced)

If you want to actually trigger a test call in Vapi and wait for webhook:

```bash
# Make a test outbound call
curl -X POST https://api.vapi.ai/call \
  -H "Authorization: Bearer YOUR_VAPI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumberId": "5cbc33fe-374e-418e-b3d4-f669a7267f64",
    "customer": {
      "number": "+919883479073",
      "name": "Test Customer"
    },
    "metadata": {
      "userId": "user_3ARaRTixmCoRJhICh9Rq9u6XXBY",
      "campaignId": "XCotvhMguU4SzUrbEorV"
    },
    "assistant": {
      "name": "Test Agent",
      "firstMessage": "Hello, this is a test call",
      "model": {
        "provider": "openai",
        "model": "gpt-4o-mini",
        "messages": [{"role": "system", "content": "You are a test assistant"}]
      },
      "voice": {
        "provider": "openai",
        "voiceId": "alloy"
      }
    }
  }'
```

Wait ~30 seconds for the test call to complete. Then:

1. **Check your server logs** - should see:
```
🔴🔴🔴 VAPI WEBHOOK RECEIVED 🔴🔴🔴
Event Type: call-ended
```

2. **If you see the webhook**: The webhook is properly configured and firing ✅
3. **If you don't see it**: Check:
   - Is webhook URL correct in Vapi dashboard?
   - Is the domain reachable from internet (not localhost)?
   - Are there firewall/network blocks?

---

## What the Logs Tell You

### Good Sign - You'll See:
```
✅ Initial call recorded for +919883479073 — Total calls: 4
🔴🔴🔴 VAPI WEBHOOK RECEIVED 🔴🔴🔴
Event Type: call-ended
📊 PROCESSING CALL COMPLETION
📝 UPDATING CALL ANALYTICS
✅ FIRESTORE UPDATE COMPLETE
```

### Bad Sign - You'll See:
```
✅ Initial call recorded for +919883479073 — Total calls: 4
[No webhook logs ever appear]
```

This means webhook isn't configured or not firing.

---

## Next Steps Based on Your Test Results

1. **Test endpoint works** → Webhook URL needs to be configured in Vapi
2. **Test endpoint fails** → There's a bug in the update function (tell me the error)
3. **Webhook fires but analytics don't update** → There's a logging step but still something wrong
4. **Webhook fires and analytics update** → Everything working! 🎉

Run the test endpoint first and share the console output!
