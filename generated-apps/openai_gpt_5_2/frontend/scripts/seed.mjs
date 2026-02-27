import { createClient } from '@supabase/supabase-js'

function requireEnv(name) {
  const v = process.env[name]
  if (!v) throw new Error(`Missing required environment variable: ${name}`)
  return v
}

const SUPABASE_URL = requireEnv('SUPABASE_PROJECT_URL')
const SERVICE_ROLE_KEY = requireEnv('SUPABASE_SERVICE_ROLE_KEY')

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const authAdminHeaders = {
  apikey: SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
  'Content-Type': 'application/json',
}

async function listUsers(page, perPage) {
  const url = `${SUPABASE_URL}/auth/v1/admin/users?page=${page}&per_page=${perPage}`
  const res = await fetch(url, { headers: authAdminHeaders })
  if (!res.ok) {
    throw new Error(`Auth listUsers failed: ${res.status} ${await res.text()}`)
  }
  const data = await res.json()
  return data.users || []
}

async function findUserByEmail(email) {
  const normalized = email.toLowerCase()
  const perPage = 200
  for (let page = 1; page <= 10; page++) {
    const users = await listUsers(page, perPage)
    const hit = users.find(
      (u) => (u.email || '').toLowerCase() === normalized && !u.deleted_at,
    )
    if (hit) return hit
    if (users.length < perPage) break
  }
  return null
}

async function createUser({ email, password }) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: authAdminHeaders,
    body: JSON.stringify({ email, password, email_confirm: true }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Auth createUser failed: ${res.status} ${body}`)
  }

  return res.json()
}

async function updateUserPassword(userId, password) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
    method: 'PUT',
    headers: authAdminHeaders,
    body: JSON.stringify({ password }),
  })

  if (!res.ok) {
    throw new Error(`Auth updateUser failed: ${res.status} ${await res.text()}`)
  }

  return res.json()
}

async function ensureUser({ email, password }) {
  const existing = await findUserByEmail(email)
  if (existing) {
    await updateUserPassword(existing.id, password)
    return existing
  }

  try {
    const created = await createUser({ email, password })
    return created
  } catch (e) {
    // Race / already exists
    const again = await findUserByEmail(email)
    if (again) {
      await updateUserPassword(again.id, password)
      return again
    }
    throw e
  }
}

async function upsert(table, rows, onConflict) {
  const { error } = await supabaseAdmin.from(table).upsert(rows, { onConflict })
  if (error) throw error
}

async function run() {
  console.log('Seeding Zeeter...')

  const seedUsers = [
    {
      email: 'alice@zeeter.dev',
      password: 'Password123!',
      display_name: 'Alice Nguyen',
      bio: 'Shipping small experiments. Coffee-first. #zeeter',
    },
    {
      email: 'bob@zeeter.dev',
      password: 'Password123!',
      display_name: 'Bob Patel',
      bio: 'Frontend engineer. Loves clean UX. #buildinpublic',
    },
    {
      email: 'carol@zeeter.dev',
      password: 'Password123!',
      display_name: 'Carol Rivera',
      bio: 'Product & systems. Curious by default. #design',
    },
  ]

  const ensured = []
  for (const u of seedUsers) {
    const authUser = await ensureUser({ email: u.email, password: u.password })
    ensured.push({ ...u, user_id: authUser.id })
    console.log(`✓ user ${u.email} -> ${authUser.id}`)
  }

  await upsert(
    'profiles',
    ensured.map((u) => ({
      user_id: u.user_id,
      display_name: u.display_name,
      bio: u.bio,
      avatar_url: null,
    })),
    'user_id',
  )
  console.log('✓ profiles')

  const [alice, bob, carol] = ensured

  const posts = [
    {
      id: 'ca406fea-f018-459a-bf03-e69d18dee9f3',
      user_id: alice.user_id,
      content:
        'Welcome to Zeeter. Quick updates, real people, no noise. Say hi! #welcome #zeeter',
    },
    {
      id: 'd0cb5364-8390-4c07-9367-2b22b0f6b28b',
      user_id: bob.user_id,
      content:
        'Hot take: trending = quality × conversation. Keep it kind. #buildinpublic',
    },
    {
      id: 'afbe4587-3ffc-4a23-8cd0-0bd6958922a2',
      user_id: carol.user_id,
      content:
        'Design rule: make the next action obvious. Everything else is polish. #design',
    },
  ]

  await upsert('posts', posts, 'id')
  console.log('✓ posts')

  await upsert(
    'follows',
    [
      { follower_id: alice.user_id, followee_id: bob.user_id },
      { follower_id: alice.user_id, followee_id: carol.user_id },
      { follower_id: bob.user_id, followee_id: alice.user_id },
      { follower_id: carol.user_id, followee_id: alice.user_id },
    ],
    'follower_id,followee_id',
  )
  console.log('✓ follows')

  await upsert(
    'likes',
    [
      { post_id: posts[0].id, user_id: bob.user_id },
      { post_id: posts[0].id, user_id: carol.user_id },
      { post_id: posts[1].id, user_id: alice.user_id },
    ],
    'post_id,user_id',
  )
  console.log('✓ likes')

  const comments = [
    {
      id: 'f606eee1-9747-4911-bee4-8a54321428f9',
      post_id: posts[0].id,
      user_id: bob.user_id,
      content: 'Hi! Loving the crisp UI already.',
    },
    {
      id: '142ad24a-28f1-4fd9-a606-913d74a73564',
      post_id: posts[1].id,
      user_id: alice.user_id,
      content: 'Agreed—conversation is the signal.',
    },
    {
      id: '4522b391-9626-4aac-9acd-2c55c743dd52',
      post_id: posts[0].id,
      user_id: carol.user_id,
      content: 'Hello! #welcome',
    },
  ]

  await upsert('comments', comments, 'id')
  console.log('✓ comments')

  console.log('Seed complete.')
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
