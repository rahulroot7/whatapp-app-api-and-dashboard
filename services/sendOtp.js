module.exports = async function sendOtp(phone, otp) {
  try {
    // Replace this with Twilio, MSG91, etc.
    console.log(`Sending OTP ${otp} to ${phone}`);
    const success = true;

    if (success) {
      return { success: true };
    } else {
      return { success: false, message: 'SMS API failed' };
    }
  } catch (error) {
    return { success: false, message: error.message };
  }
};