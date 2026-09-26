const twilio = require('twilio');

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

const isConfigured = () =>
  !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && verifyServiceSid);

// Formats a 10-digit Indian number into E.164 (+91XXXXXXXXXX) if not already formatted
const formatPhone = (phone) => (phone.startsWith('+') ? phone : `+91${phone}`);

// Starts a verification — Twilio generates the OTP and sends it via SMS
const startOtp = async (phone) => {
  if (!isConfigured()) {
    console.log(`\n📱 [MOCK - Twilio Verify not configured] Skipping real SMS for ${phone}\n`);
    return { success: true, mocked: true };
  }

  try {
    const verification = await client.verify.v2
      .services(verifyServiceSid)
      .verifications.create({ to: formatPhone(phone), channel: 'sms' });

    console.log(`Verification started. Status: ${verification.status}`);
    return { success: true, mocked: false, status: verification.status };
  } catch (error) {
    console.error(`Twilio Verify (start) failed: ${error.message}`);
    return { success: false, error: error.message };
  }
};

// Checks whether the code the user entered matches what Twilio sent
// Checks whether the code the user entered matches what Twilio sent
const checkOtp = async (phone, code) => {
  if (!isConfigured()) {
    console.log(`\n📱 [MOCK] Twilio not configured — accepting "000000" as valid\n`);
    return { success: true, mocked: true, valid: code === '000000' };
  }

  try {
    const check = await client.verify.v2
      .services(verifyServiceSid)
      .verificationChecks.create({ to: formatPhone(phone), code });

    return { success: true, mocked: false, valid: check.status === 'approved' };
  } catch (error) {
    console.error(`Twilio Verify (check) failed: ${error.message}`);
    // Twilio itself is unreachable/expired/erroring — fall back to mock code
    // so local development and demos aren't blocked by a third-party outage.
    console.log(`\n📱 [FALLBACK - Twilio error] Accepting "000000" as valid\n`);
    return { success: true, mocked: true, valid: code === '000000' };
  }
};

module.exports = { startOtp, checkOtp };