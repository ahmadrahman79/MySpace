const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

async function seedSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('your-project')) {
    console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY / ANON_KEY must be provided.');
    console.error('Example: NEXT_PUBLIC_SUPABASE_URL=https://xyz.supabase.co SUPABASE_SERVICE_ROLE_KEY=eyJh... node scripts/seed-supabase.js');
    process.exit(1);
  }

  const seedFile = path.join(__dirname, '..', 'data', 'seed-data.json');
  if (!fs.existsSync(seedFile)) {
    console.error('Seed file not found at:', seedFile);
    process.exit(1);
  }

  const seedData = JSON.parse(fs.readFileSync(seedFile, 'utf8'));
  console.log(`Connecting to Supabase at: ${supabaseUrl}`);
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // 1. Tasks
    if (seedData.tasks && seedData.tasks.length > 0) {
      console.log(`Seeding ${seedData.tasks.length} tasks...`);
      // Insert in batches of 100 to avoid payload size limit
      for (let i = 0; i < seedData.tasks.length; i += 100) {
        const batch = seedData.tasks.slice(i, i + 100).map(t => ({
          id: t.id,
          name: t.name,
          activity: t.activity,
          progress: t.progress,
          finish_at: t.finishAt,
          finish_at_raw: t.finishAtRaw,
          status_kipapp: t.statusKipApp,
          note: t.note,
          priority: t.priority,
          image_urls: t.imageUrls || [],
          link_urls: t.linkUrls || [],
          origin_sticky_note_id: t.originStickyNoteId,
          event_id: t.eventId,
        }));
        const { error } = await supabase.from('tasks').upsert(batch, { onConflict: 'id' });
        if (error) console.error(`Error in tasks batch ${i}:`, error.message);
      }
      console.log('✓ Tasks seeded successfully!');
    }

    // 2. Events & Calendar
    if (seedData.events && seedData.events.length > 0) {
      console.log(`Seeding ${seedData.events.length} events...`);
      for (let i = 0; i < seedData.events.length; i += 100) {
        const batch = seedData.events.slice(i, i + 100).map(e => ({
          id: e.id,
          title: e.title,
          activity: e.activity,
          start_date: e.startDate,
          end_date: e.endDate,
          date_raw: e.dateRaw,
          is_range: e.isRange,
          status: e.status,
          type: e.type,
          description: e.description || '',
          image_urls: e.imageUrls || [],
          link_urls: e.linkUrls || [],
          associated_task_ids: e.associatedTaskIds || [],
        }));
        const { error } = await supabase.from('events').upsert(batch, { onConflict: 'id' });
        if (error) console.error(`Error in events batch ${i}:`, error.message);
      }
      console.log('✓ Events seeded successfully!');
    }

    // 3. Notes🤓
    if (seedData.notes && seedData.notes.length > 0) {
      console.log(`Seeding ${seedData.notes.length} notes...`);
      for (let i = 0; i < seedData.notes.length; i += 50) {
        const batch = seedData.notes.slice(i, i + 50).map(n => ({
          id: n.id,
          title: n.title,
          activity: n.activity,
          created_at: n.createdAt,
          created_by: n.createdBy,
          last_edited_time: n.lastEditedTime,
          content: n.content,
          images: n.images || [],
          links: n.links || [],
          associated_task_ids: n.associatedTaskIds || [],
        }));
        const { error } = await supabase.from('notes').upsert(batch, { onConflict: 'id' });
        if (error) console.error(`Error in notes batch ${i}:`, error.message);
      }
      console.log('✓ Notes seeded successfully!');
    }

    // 4. Sticky Notes
    if (seedData.stickyNotes && seedData.stickyNotes.length > 0) {
      console.log(`Seeding ${seedData.stickyNotes.length} sticky notes...`);
      const batch = seedData.stickyNotes.map(s => ({
        id: s.id,
        title: s.title,
        content: s.content,
        area: s.area,
        priority: s.priority,
        status: s.status,
        date: s.date,
        completed: s.completed,
        color: s.color,
        converted_to_task_id: s.convertedToTaskId,
        image_urls: s.imageUrls || [],
        link_urls: s.linkUrls || [],
      }));
      const { error } = await supabase.from('sticky_notes').upsert(batch, { onConflict: 'id' });
      if (error) console.error('Error seeding sticky notes:', error.message);
      else console.log('✓ Sticky notes seeded successfully!');
    }

    // 5. Resources
    if (seedData.resources && seedData.resources.length > 0) {
      console.log(`Seeding ${seedData.resources.length} resources...`);
      const batch = seedData.resources.map(r => ({
        id: r.id,
        title: r.title,
        url: r.url,
        category: r.category,
        description: r.description,
        tags: r.tags || [],
        type: r.type || 'link',
        created_at: r.createdAt,
      }));
      const { error } = await supabase.from('resources').upsert(batch, { onConflict: 'id' });
      if (error) console.error('Error seeding resources:', error.message);
      else console.log('✓ Resources seeded successfully!');
    }

    console.log('\n🎉 All seed data successfully loaded into Supabase!');
  } catch (err) {
    console.error('Unexpected seeding error:', err);
  }
}

seedSupabase();

