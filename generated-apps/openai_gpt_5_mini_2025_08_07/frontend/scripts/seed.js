import { createClient } from '@supabase/supabase-js';

(async () => {
  try {
    const url = process.env.SUPABASE_PROJECT_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) {
      console.error('Missing SUPABASE_PROJECT_URL or SUPABASE_SERVICE_ROLE_KEY in environment');
      process.exit(1);
    }

    const supabaseAdmin = createClient(url, serviceKey, { auth: { persistSession: false } });

    const seedUsers = [
      { email: 'alice@example.com', password: 'password', display_name: 'Alice' },
      { email: 'bob@example.com', password: 'password', display_name: 'Bob' }
    ];

    const createdUsers = [];
    for (const u of seedUsers) {
      let userRecord;
      try {
        const res = await supabaseAdmin.auth.admin.createUser({
          email: u.email,
          password: u.password,
          email_confirm: true
        });
        if (res?.user) userRecord = res.user;
        else if (res?.data) userRecord = res.data;
      } catch (err) {
        console.log('Create user error (maybe exists):', err?.message || err);
      }

      if (!userRecord) {
        try {
          const list = await supabaseAdmin.auth.admin.listUsers();
          const found = list?.users?.find(x => x.email === u.email);
          if (found) userRecord = found;
        } catch (err) {
          console.error('Could not list users', err?.message || err);
        }
      }

      if (!userRecord) {
        console.error('Failed to create or find user', u.email);
        continue;
      }

      const profile = {
        id: userRecord.id,
        username: u.email.split('@')[0],
        display_name: u.display_name,
        bio: `Hi, I'm ${u.display_name} on Zeeter.`
      };
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .upsert(profile, { onConflict: 'id' });
      if (profileError) console.error('Profile upsert error', profileError.message);

      createdUsers.push({ ...userRecord, profile });
    }

    const alice = createdUsers.find(u => u.email === 'alice@example.com');
    const bob = createdUsers.find(u => u.email === 'bob@example.com');

    if (alice) {
      const { error } = await supabaseAdmin.from('posts').insert([
        { author: alice.id, content: 'Hello Zeeter! This is my first post.' }
      ]);
      if (error) console.error('Insert post error', error.message);
    }
    if (bob) {
      const { error } = await supabaseAdmin.from('posts').insert([
        { author: bob.id, content: "Hi everyone, I'm Bob. #welcome" }
      ]);
      if (error) console.error('Insert post error', error.message);
    }

    if (alice && bob) {
      const { error } = await supabaseAdmin.from('follows').upsert([
        { follower: bob.id, following: alice.id }
      ], { onConflict: ['follower', 'following'] });
      if (error) console.error('Follow upsert error', error.message);

      await supabaseAdmin.from('notifications').insert([
        { recipient: alice.id, type: 'follow', payload: { follower: bob.id } }
      ]).catch(e => console.error('notify err', e));
    }

    console.log('Seeding complete');
    process.exit(0);
  } catch (err) {
    console.error('Seed script error', err);
    process.exit(1);
  }
})();
