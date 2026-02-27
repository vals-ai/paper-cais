const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_PROJECT_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seed() {
  console.log('Seeding data...');

  const testEmail = 'test@example.com';
  const testPassword = 'password123';
  const testUsername = 'testuser';

  // Create test user
  const { data: userData, error: userError } = await supabase.auth.admin.createUser({
    email: testEmail,
    password: testPassword,
    user_metadata: { username: testUsername, display_name: 'Test User' },
    email_confirm: true
  });

  if (userError && userError.message !== 'User already exists') {
    console.error('Error creating user:', userError);
  } else {
    console.log('Test user created or already exists');
  }

  const userId = userData?.user?.id || (await supabase.from('profiles').select('id').eq('username', testUsername).single()).data?.id;

  if (userId) {
    // Insert a post
    const { error: postError } = await supabase.from('posts').upsert([{
      user_id: userId,
      content: 'Hello Zeeter! This is my first post. #Zeeter #Launch',
    }]);

    if (postError) console.error('Error creating post:', postError);
    else console.log('Initial post created');
    
    // Create another user for interactions
    const otherUsername = 'zeeter_fan';
    const { data: otherUserData } = await supabase.auth.admin.createUser({
        email: 'fan@example.com',
        password: 'password123',
        user_metadata: { username: otherUsername, display_name: 'Zeeter Fan' },
        email_confirm: true
    });
    
    const otherId = otherUserData?.user?.id || (await supabase.from('profiles').select('id').eq('username', otherUsername).single()).data?.id;
    
    if (otherId) {
        // Follow test user
        await supabase.from('follows').upsert([{
            follower_id: otherId,
            following_id: userId
        }]);
        console.log('Follow relationship created');
    }
  }

  console.log('Seeding completed.');
}

seed();
