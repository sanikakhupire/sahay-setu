// Generates a 6-digit OTP
const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// MOCK sender — logs to console instead of sending real SMS.
// In Phase 9, this function's internals get replaced with a Twilio/Msg91 API call.
// Nothing calling this function needs to change.
const sendOtp = async (phone, otp) => {
  console.log(`\n📱 [MOCK SMS] OTP for ${phone}: ${otp}\n`);
  return { success: true };
};

module.exports = { generateOtp, sendOtp };