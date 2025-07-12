const mongoose = require('mongoose');

const mongoDBConnect = async () => {
  try {
    const connectionUri = process.env.ENV==="development"?process.env.MONGODB_URI:process.env.MONGODB_URI_LIVE
    await mongoose.connect(connectionUri);
    console.log('MongoDB - Connected');
  } catch (error) {
    console.error('Error - MongoDB Connection:', error);
  }
};

module.exports = mongoDBConnect;
