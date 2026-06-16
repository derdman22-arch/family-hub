require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');

const User = require('../models/User');
const Note = require('../models/Note');

async function migrate() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const notes = await mongoose.connection.db.collection('notes').find({}).toArray();
  console.log(`Found ${notes.length} notes`);

  let updated = 0;
  let skipped = 0;

  for (const note of notes) {
    const patch = {};

    // Migrate createdBy if it's an embedded object
    if (note.createdBy && typeof note.createdBy === 'object' && !mongoose.Types.ObjectId.isValid(note.createdBy)) {
      const email = note.createdBy.username;
      const user = await User.findOne({ email });
      if (user) {
        patch.createdBy = user._id;
      } else {
        console.warn(`  No user found for createdBy email: ${email} (note ${note._id})`);
      }
    }

    // Migrate completedBy if it's an embedded object
    if (note.completedBy && typeof note.completedBy === 'object' && !mongoose.Types.ObjectId.isValid(note.completedBy)) {
      const email = note.completedBy.username;
      const user = await User.findOne({ email });
      if (user) {
        patch.completedBy = user._id;
      } else {
        console.warn(`  No user found for completedBy email: ${email} (note ${note._id})`);
      }
    }

    if (Object.keys(patch).length > 0) {
      await mongoose.connection.db.collection('notes').updateOne(
        { _id: note._id },
        { $set: patch }
      );
      console.log(`  Updated note ${note._id}`);
      updated++;
    } else {
      skipped++;
    }
  }

  console.log(`\nDone — ${updated} updated, ${skipped} skipped`);
  await mongoose.disconnect();
}

migrate().catch((err) => { console.error(err); process.exit(1); });
