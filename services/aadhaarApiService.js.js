// Export both functions separately
async function aadharSendOtp(aadharNumber) {
    try {
        // Replace this with Twilio, MSG91, etc.
        console.log(`Sending OTP to Aadhar ${aadharNumber}`);
        const success = true;

        if (success) {
        return { success: true };
        } else {
        return { success: false, message: 'SMS API failed' };
        }
    } catch (error) {
        return { success: false, message: error.message };
    }
}

async function aadharVerifyOtp(referenceId, otp) {
  try {
    console.log(`Verifying OTP for Aadhar Number: ${referenceId}, OTP: ${otp}`);

    // Simulated verification success flag
    const success = true;

    if (success) {
      return { success: true };
    } else {
      return { success: false, message: "SMS API failed" };
    }
  } catch (error) {
    return { success: false, message: error.message };
  }
}

module.exports = { aadharSendOtp, aadharVerifyOtp};
