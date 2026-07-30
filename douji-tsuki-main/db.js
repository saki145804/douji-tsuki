// ==================== db.js ====================
// Supabaseとのデータのやり取りをまとめたファイル
// app.js から呼び出される関数群

import { supabase } from './supabase-init.js'

// ---------- プロフィール（localStorageで管理） ----------

export function loadProfile() {
  const raw = localStorage.getItem('douji-tsuki-profile')
  return raw ? JSON.parse(raw) : null
}

export function saveProfile(profile) {
  localStorage.setItem('douji-tsuki-profile', JSON.stringify(profile))
}

// ---------- 投稿（posts） ----------

export async function loadPosts() {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('❌ 投稿の読み込みに失敗:', error)
    return []
  }
  return data || []
}

export async function createPost(week, place, text, author) {
  const { data, error } = await supabase
    .from('posts')
    .insert([{ week, place, text, author, hearts: 0, comments: [] }])
    .select()
    .single()

  if (error) {
    console.error('❌ 投稿の作成に失敗:', error)
    return null
  }
  return data
}

export async function toggleHeart(postId, isLiked) {
  const { data: post, error: fetchError } = await supabase
    .from('posts')
    .select('hearts')
    .eq('id', postId)
    .single()

  if (fetchError || !post) {
    console.error('❌ 投稿の取得に失敗:', fetchError)
    return null
  }

  const newHearts = Math.max(0, (post.hearts || 0) + (isLiked ? -1 : 1))

  const { data, error } = await supabase
    .from('posts')
    .update({ hearts: newHearts })
    .eq('id', postId)
    .select()
    .single()

  if (error) {
    console.error('❌ ハートの更新に失敗:', error)
    return null
  }
  return data.hearts
}

export async function addComment(postId, author, text) {
  const { data: post, error: fetchError } = await supabase
    .from('posts')
    .select('comments')
    .eq('id', postId)
    .single()

  if (fetchError || !post) {
    console.error('❌ 投稿の取得に失敗:', fetchError)
    return false
  }

  const newComment = {
    author,
    text,
    time: new Date().toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const updatedComments = [...(post.comments || []), newComment]

  const { error } = await supabase
    .from('posts')
    .update({ comments: updatedComments })
    .eq('id', postId)

  if (error) {
    console.error('❌ コメントの追加に失敗:', error)
    return false
  }
  return true
}

// ---------- Q&A（qa） ----------

export async function loadQA() {
  const { data, error } = await supabase
    .from('qa')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('❌ Q&Aの読み込みに失敗:', error)
    return []
  }
  return data || []
}

export async function createQuestion(place, week, question) {
  const { data, error } = await supabase
    .from('qa')
    .insert([{ place, week, question, answers: [] }])
    .select()
    .single()

  if (error) {
    console.error('❌ 質問の作成に失敗:', error)
    return null
  }
  return data
}

export async function addAnswer(qaId, author, text, place, isSenpai) {
  const { data: qa, error: fetchError } = await supabase
    .from('qa')
    .select('answers')
    .eq('id', qaId)
    .single()

  if (fetchError || !qa) {
    console.error('❌ Q&Aの取得に失敗:', fetchError)
    return false
  }

  const newAnswer = {
    author,
    text,
    place,
    senpai: !!isSenpai
  }

  const updatedAnswers = [...(qa.answers || []), newAnswer]

  const { error } = await supabase
    .from('qa')
    .update({ answers: updatedAnswers })
    .eq('id', qaId)

  if (error) {
    console.error('❌ 回答の追加に失敗:', error)
    return false
  }
  return true
}

// ---------- リアルタイム購読 ----------

export function subscribeToPostsRealtime(callback) {
  return supabase
    .channel('posts-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, callback)
    .subscribe()
}

export function subscribeToQARealtime(callback) {
  return supabase
    .channel('qa-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'qa' }, callback)
    .subscribe()
}
