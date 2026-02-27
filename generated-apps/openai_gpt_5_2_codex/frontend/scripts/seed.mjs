import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const envPath = path.resolve(__dirname, '..', '..', '.env')
const envContent = fs.readFileSync(envPath, 'utf8')

const env = envContent
  .split('\n')
  .map((line) => line.trim())
  .filter((line) => line && !line.startsWith('#'))
  .reduce((acc, line) => {
    const [key, ...rest] = line.split('=')
    const value = rest.join('=').replace(/^['"]|['"]$/g, '')
    acc[key] = value
    return acc
  }, {})

const supabaseUrl = env.SUPABASE_PROJECT_URL
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing Supabase environment variables in .env')
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const ensureUser = async ({ email, password, display_name, bio, avatar_url }) => {
  const { data: listData, error: listError } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 200
  })
  if (listError) throw listError

  const existing = listData?.users?.find((user) => user.email === email)
  let userId = existing?.id

  if (!userId) {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    })
    if (error) throw error
    userId = data.user.id
  }

  const { error: profileError } = await supabase.from('profiles').upsert({
    id: userId,
    display_name,
    bio,
    avatar_url
  })
  if (profileError) throw profileError

  return userId
}

const ensurePost = async ({ author_id, content }) => {
  const { data: existing } = await supabase
    .from('posts')
    .select('id')
    .eq('author_id', author_id)
    .eq('content', content)
    .maybeSingle()

  if (existing?.id) return existing.id

  const { data, error } = await supabase
    .from('posts')
    .insert({ author_id, content })
    .select('id')
    .single()

  if (error) throw error
  return data.id
}

const ensureFollow = async ({ follower_id, following_id }) => {
  const { error } = await supabase
    .from('follows')
    .upsert({ follower_id, following_id })
  if (error) throw error
}

const ensureLike = async ({ user_id, post_id }) => {
  const { error } = await supabase.from('likes').upsert({ user_id, post_id })
  if (error) throw error
}

const ensureComment = async ({ author_id, post_id, content }) => {
  const { data: existing } = await supabase
    .from('comments')
    .select('id')
    .eq('author_id', author_id)
    .eq('post_id', post_id)
    .eq('content', content)
    .maybeSingle()

  if (existing?.id) return

  const { error } = await supabase
    .from('comments')
    .insert({ author_id, post_id, content })
  if (error) throw error
}

const run = async () => {
  const avaId = await ensureUser({
    email: 'ava@zeeter.test',
    password: 'Password123!',
    display_name: 'Ava Harper',
    bio: 'Design strategist sharing quick insights on community building.',
    avatar_url: ''
  })

  const micahId = await ensureUser({
    email: 'micah@zeeter.test',
    password: 'Password123!',
    display_name: 'Micah Stone',
    bio: 'Product lead exploring the intersection of tech and people.',
    avatar_url: ''
  })

  const avaPost1 = await ensurePost({
    author_id: avaId,
    content: 'Sketching ideas for a more human-centered product roadmap. #product'
  })
  const avaPost2 = await ensurePost({
    author_id: avaId,
    content: 'Today’s focus: small experiments that help teams move faster. #leadership'
  })
  const micahPost1 = await ensurePost({
    author_id: micahId,
    content: 'Just shipped a tiny UX tweak that already feels like a big win. #design'
  })

  await ensureFollow({ follower_id: avaId, following_id: micahId })
  await ensureFollow({ follower_id: micahId, following_id: avaId })

  await ensureLike({ user_id: avaId, post_id: micahPost1 })
  await ensureLike({ user_id: micahId, post_id: avaPost1 })

  await ensureComment({
    author_id: micahId,
    post_id: avaPost2,
    content: 'Love the focus on experiments. Small wins add up quickly.'
  })
  await ensureComment({
    author_id: avaId,
    post_id: micahPost1,
    content: 'Congrats on the UX win! Those tweaks make a huge difference.'
  })

  console.log('Seed data created successfully.')
}

run().catch((error) => {
  console.error('Seed failed:', error)
  process.exit(1)
})
