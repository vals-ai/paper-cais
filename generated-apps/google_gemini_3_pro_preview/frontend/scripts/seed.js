import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_PROJECT_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seed() {
  console.log('Seeding...');

  // Create users
  const users = [
    { email: 'alice@example.com', password: 'password123', full_name: 'Alice Wonderland', user_name: 'alice', avatar_url: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Alice' },
    { email: 'bob@example.com', password: 'password123', full_name: 'Bob Builder', user_name: 'bob', avatar_url: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Bob' },
  ];

  const createdUsers = [];

  for (const u of users) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: { full_name: u.full_name, user_name: u.user_name, avatar_url: u.avatar_url }
    });

    if (error) {
      console.log(`User ${u.email} might already exist:`, error.message);
      const { data: { users: existingUsers } } = await supabase.auth.admin.listUsers();
      const existing = existingUsers.find(eu => eu.email === u.email);
      if (existing) createdUsers.push(existing);
    } else {
      console.log(`Created user ${u.email}`);
      createdUsers.push(data.user);
    }
  }

  if (createdUsers.length >= 2) {
    const alice = createdUsers.find(u => u.email === 'alice@example.com');
    const bob = createdUsers.find(u => u.email === 'bob@example.com');

    if (alice && bob) {
         // Create profiles manually if trigger failed or update them just in case
        await supabase.from('profiles').upsert({ 
            id: alice.id, 
            username: 'alice', 
            full_name: 'Alice Wonderland', 
            avatar_url: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Alice',
            bio: 'Curiouser and curiouser!'
        });
        await supabase.from('profiles').upsert({ 
            id: bob.id, 
            username: 'bob', 
            full_name: 'Bob Builder', 
            avatar_url: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Bob',
            bio: 'Can we fix it? Yes we can!'
        });

        const postsData = [
            { user_id: alice.id, content: 'Hello Zeeter! This is my first post.' },
            { user_id: bob.id, content: 'Building something cool today. #coding' },
            { user_id: alice.id, content: 'I love React and Supabase.' },
        ];
    
        for (const p of postsData) {
            await supabase.from('posts').insert(p);
        }
        console.log('Created posts');
    
        await supabase.from('follows').upsert({ follower_id: bob.id, following_id: alice.id });
        console.log('Bob follows Alice');
    
        const { data: alicePosts } = await supabase.from('posts').select('id').eq('user_id', alice.id);
        if (alicePosts && alicePosts.length > 0) {
            await supabase.from('likes').upsert({ user_id: bob.id, post_id: alicePosts[0].id });
            console.log('Bob liked Alice\'s post');
        }
    }
  }

  console.log('Seeding complete.');
}

seed();
