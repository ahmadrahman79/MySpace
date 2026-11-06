const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

async function seedMongo() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('Please provide MONGODB_URI in environment or .env file');
    process.exit(1);
  }

  const seedFile = path.join(__dirname, '..', 'data', 'seed-data.json');
  if (!fs.existsSync(seedFile)) {
    console.error('Seed file not found at:', seedFile);
    process.exit(1);
  }

  const seedData = JSON.parse(fs.readFileSync(seedFile, 'utf8'));
  console.log('Connecting to MongoDB Atlas...');
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected successfully!');
    const db = client.db('productivity_system');

    // Tasks
    if (seedData.tasks && seedData.tasks.length > 0) {
      await db.collection('tasks').deleteMany({});
      const taskDocs = seedData.tasks.map(t => ({ ...t, _id: t.id }));
      await db.collection('tasks').insertMany(taskDocs);
      console.log(`Inserted ${taskDocs.length} tasks`);
    }

    // Events
    if (seedData.events && seedData.events.length > 0) {
      await db.collection('events').deleteMany({});
      const eventDocs = seedData.events.map(e => ({ ...e, _id: e.id }));
      await db.collection('events').insertMany(eventDocs);
      console.log(`Inserted ${eventDocs.length} events`);
    }

    // Notes
    if (seedData.notes && seedData.notes.length > 0) {
      await db.collection('notes').deleteMany({});
      const noteDocs = seedData.notes.map(n => ({ ...n, _id: n.id }));
      await db.collection('notes').insertMany(noteDocs);
      console.log(`Inserted ${noteDocs.length} notes`);
    }

    // Sticky Notes
    if (seedData.stickyNotes && seedData.stickyNotes.length > 0) {
      await db.collection('sticky_notes').deleteMany({});
      const stickyDocs = seedData.stickyNotes.map(s => ({ ...s, _id: s.id }));
      await db.collection('sticky_notes').insertMany(stickyDocs);
      console.log(`Inserted ${stickyDocs.length} sticky notes`);
    }

    // Resources
    if (seedData.resources && seedData.resources.length > 0) {
      await db.collection('resources').deleteMany({});
      const resDocs = seedData.resources.map(r => ({ ...r, _id: r.id }));
      await db.collection('resources').insertMany(resDocs);
      console.log(`Inserted ${resDocs.length} resources`);
    }

    console.log('MongoDB Atlas seeding completed successfully!');
  } catch (err) {
    console.error('Error seeding MongoDB:', err);
  } finally {
    await client.close();
  }
}

seedMongo();

