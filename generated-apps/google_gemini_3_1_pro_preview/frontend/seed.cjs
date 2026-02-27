
const { createClient } = require('@supabase/supabase-js');

// Load env variables
const supabaseUrl = process.env.SUPABASE_PROJECT_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_PROJECT_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log('Seeding Database...');

  // 1. Create Users
  const users = [
    { email: 'member1@example.com', password: 'password123', username: 'john_doe', display_name: 'John Doe', bio: 'Living the good life.' },
    { email: 'member2@example.com', password: 'password123', username: 'jane_smith', display_name: 'Jane Smith', bio: 'Tech enthusiast and blogger.' },
    { email: 'member3@example.com', password: 'password123', username: 'bob_martin', display_name: 'Bob Martin', bio: 'Photographer and traveler.' }
  ];

  const userIds = [];

  for (const u of users) {
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true
    });
    
    if (authError) {
       console.log(`Failed to create user or already exists: ${u.email}`);
       const { data: existingUser } = await supabase.from('profiles').select('id').eq('username', u.username).single();
       if (existingUser) userIds.push(existingUser.id);
    } else {
       console.log(`Created user: ${u.email}`);
       const id = authUser.user.id;
       userIds.push(id);
       
       await supabase.from('profiles').upsert([{
         id,
         username: u.username,
         display_name: u.display_name,
         bio: u.bio
       }]);
    }
  }

  if (userIds.length < 3) {
      console.log('Users not fully seeded, skipping relations seeding');
      return;
  }

  // 2. Create Posts
  const { data: posts, error: postsError } = await supabase.from('posts').insert([
    { author_id: userIds[0], content: 'Hello world! This is my first post on Zeeter.' },
    { author_id: userIds[1], content: 'Loving the clean interface of this app! Great work developers.' },
    { author_id: userIds[2], content: 'Just had agreat coffee! Happy Monday everyone!' }
  ]).select();
  
  if (postsError) {
      console.error('Failed to create posts:', postsError);
      return;
  }
  
  console.log(`Created ${posts?.length} posts`);

  // 3. Interactions
  // Follows
  await supabase.from('follows').upsert([
    { follower_id: userIds[0], following_id: userIds[1] },
    { follower_id: userIds[1], following_id: userIds[0] },
    { follower_id: userIds[2], following_id: userIds[0] }
  ], { onConflict: 'follower_id,following_id' });
  console.log('Created follows');

  // Likes
  if (posts?.length > 0) {
      await supabase.from('likes').upsert([
        { user_id: userIds[1], post_id: posts[0].id },
        { user_id: userIds[2], post_id: posts[0].id },
        { user_id: userIds[0], post_id: posts[1].id }
      ], { onConflict: 'post_id,user_id' });
      console.log('Created likes');

      // Comments
      await supabase.from('comments').insert([
        { author_id: userIds[1], post_id: posts[0].id, content: 'Welcome to Zeeter!' },
        { author_id: userIds[2], post_id: posts[0].id, content: 'Hey John!' }
      ]);
      console.log('Created comments');

      // Notifications
      await supabase.from('notifications').insert([
        { user_id: userIds[0], actor_id: userIds[1], type: 'like', post_id: posts[0].id },
        { user_id: userIds[0], actor_id: userIds[1], type: 'comment', post_id: posts[0].id }
      ]);
      console.log('Created notifications');
  }

  console.log('Seeding Completed Succesfully!');
}

seed();
