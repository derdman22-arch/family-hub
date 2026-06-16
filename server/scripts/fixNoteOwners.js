require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

async function fix() {
  await mongoose.connect(process.env.MONGODB_URI);
  const user = await User.findOne({ email: 'd.erdman22@gmail.com' });
  if (!user) { console.log('User not found'); process.exit(1); }

  const createdBy = { userId: user._id.toString(), username: user.email };

  const result = await mongoose.connection.db.collection('notes').updateMany(
    {},
    { $set: { createdBy, completedBy: null } }
  );
  console.log(`Updated ${result.modifiedCount} notes → createdBy: ${JSON.stringify(createdBy)}`);
  await mongoose.disconnect();
}

fix().catch((err) => { console.error(err); process.exit(1); });
