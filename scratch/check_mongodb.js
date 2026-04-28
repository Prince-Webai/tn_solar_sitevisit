const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

async function check() {
  if (!MONGODB_URI) {
    console.error('MONGODB_URI is not defined');
    return;
  }

  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected!');

  const collections = await mongoose.connection.db.listCollections().toArray();
  console.log('\nCollections found:', collections.map(c => c.name));

  for (const coll of collections) {
    const count = await mongoose.connection.db.collection(coll.name).countDocuments();
    console.log(`- ${coll.name}: ${count} documents`);
    
    if (coll.name === 'profiles') {
        const profiles = await mongoose.connection.db.collection('profiles').find({}).toArray();
        console.log('Profiles:', JSON.stringify(profiles, null, 2));
    }
  }

  await mongoose.disconnect();
}

check().catch(console.error);
