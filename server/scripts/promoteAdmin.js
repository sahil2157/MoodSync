/**
 * promoteAdmin.js
 * -------------------------------------------------------------------------
 * One-off CLI script to promote an already-registered user to the admin
 * role, for when you didn't (or couldn't) set ADMIN_EMAILS before they
 * registered.
 *
 * Usage (from the server/ directory):
 *   node scripts/promoteAdmin.js someone@example.com
 *
 * Requires server/.env to have a working MONGO_URI.
 * -------------------------------------------------------------------------
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error('Usage: node scripts/promoteAdmin.js <email>');
    process.exit(1);
  }

  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('MONGO_URI is not set in server/.env');
    process.exit(1);
  }

  await mongoose.connect(uri);

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    console.error(`No user found with email: ${email}`);
    await mongoose.disconnect();
    process.exit(1);
  }

  if (user.role === 'admin') {
    console.log(`${email} is already an admin.`);
  } else {
    user.role = 'admin';
    await user.save();
    console.log(`✔ ${email} has been promoted to admin.`);
  }

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error('Failed to promote user:', err.message);
  process.exit(1);
});
