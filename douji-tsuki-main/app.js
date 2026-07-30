// ==================== グローバル変数 ====================
let currentProfile = null;
let allPosts = [];
let allQAs = [];
let postSubscription = null;
let qaSubscription = null;
let selectedPostPlace = 'all';
let selectedQAPlace = 'all';

// ==================== 初期化 ====================
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 アプリ起動...')
  loadProfileIntoForm()
  loadPostsData()
  loadQAsData()
  setupRealtimeSubscriptions()
})

// ==================== プロフィール管理 ====================

function loadProfileIntoForm() {
  currentProfile = loadProfile()
  if (currentProfile) {
    document.getElementById('profile-name').value = currentProfile.name || ''
    document.getElementById('profile-country').value = currentProfile.country || ''
    document.getElementById('profile-week').value = currentProfile.week || ''
    document.getElementById('profile-memo').value = currentProfile.memo || ''
    const senpaiCheckbox = document.getElementById('profile-senpai')
    if (senpaiCheckbox) senpaiCheckbox.checked = !!currentProfile.senpai
  }
}

function toggleProfileModal() {
  const modal = document.getElementById('profile-modal')
  modal.classList.toggle('active')
}

function handleSaveProfile(event) {
  event.preventDefault()

  const senpaiCheckbox = document.getElementById('profile-senpai')

  const profile = {
    name: document.getElementById('profile-name').value,
    country: document.getElementById('profile-country').value,
    week: document.getElementById('profile-week').value,
    memo: document.getElementById('profile-memo').value,
    senpai: senpaiCheckbox ? senpaiCheckbox.checked : false
  }

  saveProfile(profile)
  currentProfile = profile
  console.log('✅ プロフィール保存:', profile)

  alert('✅ プロフィールを保存しました！')
  toggleProfileModal()
}

// ==================== タブ切り替え ====================

function switchTab(tabName, event) {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.classList.remove('active')
  })

  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.remove('active')
  })

  document.getElementById(`${tabName}-tab`).classList.add('active')

  if (event && event.target) {
    event.target.classList.add('active')
  }
}

// ==================== 投稿管理 ====================

async function loadPostsData() {
  const posts = await loadPosts()
  allPosts = posts
  renderPlaceFilter('posts-place-filter', allPosts, selectedPostPlace, 'onPostPlaceFilterChange')
  renderPosts()
}

function getUniquePlaces(items) {
  const places = items.map(item => item.place).filter(Boolean)
  return [...new Set(places)].sort()
}

function renderPlaceFilter(containerId, items, selectedValue, onChangeFnName) {
  const container = document.getElementById(containerId)
  if (!container) return

  const places = getUniquePlaces(items)

  if (places.length === 0) {
    container.innerHTML = ''
    return
  }

  container.innerHTML = `
    <label for="${containerId}-select" style="font-weight:600; margin-right:0.5rem;">📍 場所で絞り込み</label>
    <select id="${containerId}-select" onchange="${onChangeFnName}(this.value)">
      <option value="all" ${selectedValue === 'all' ? 'selected' : ''}>すべての場所</option>
      ${places.map(place => `
        <option value="${escapeHtml(place)}" ${selectedValue === place ? 'selected' : ''}>${escapeHtml(place)}</option>
      `).join('')}
    </select>
  `
}

function onPostPlaceFilterChange(value) {
  selectedPostPlace = value
  renderPosts()
}

function onQAPlaceFilterChange(value) {
  selectedQAPlace = value
  renderQAs()
}

function renderPosts() {
  const postsList = document.getElementById('posts-list')

  const filtered = selectedPostPlace === 'all'
    ? allPosts
    : allPosts.filter(post => post.place === selectedPostPlace)

  if (filtered.length === 0) {
    postsList.innerHTML = '<p class="loading">まだ投稿がありません</p>'
    return
  }

  postsList.innerHTML = filtered.map(post => `
    <div class="post-card">
      <div class="post-header">
        <div>
          <div class="post-author">👤 ${escapeHtml(post.author)}</div>
          <div class="post-meta">📍 ${escapeHtml(post.place)} | 妊娠${post.week}週</div>
        </div>
      </div>
      <div class="post-text">${escapeHtml(post.text)}</div>
      <div class="post-actions">
        <button class="post-action-btn ${isPostLiked(post.id) ? 'liked' : ''}" onclick="toggleHeartAction(${post.id})">
          ❤️ ${post.hearts || 0}
        </button>
        <button class="post-action-btn" onclick="toggleCommentForm(${post.id})">
          💬 ${(post.comments || []).length}
        </button>
      </div>
      ${renderComments(post.id, post.comments)}
    </div>
  `).join('')
}

function renderComments(postId, comments) {
  if (!comments || comments.length === 0) {
    return `
      <div class="comments-section">
        <div class="add-comment-form">
          <input type="text" id="comment-input-${postId}" placeholder="コメントを書く...">
          <button onclick="submitComment(${postId})">送信</button>
        </div>
      </div>
    `
  }

  return `
    <div class="comments-section">
      <h4>💬 コメント (${comments.length})</h4>
      <div class="comments-list">
        ${comments.map(comment => `
          <div class="comment-item">
            <div class="comment-author">👤 ${escapeHtml(comment.author)}</div>
            <div class="comment-text">${escapeHtml(comment.text)}</div>
            <div class="comment-time">⏰ ${escapeHtml(comment.time)}</div>
          </div>
        `).join('')}
      </div>
      <div class="add-comment-form">
        <input type="text" id="comment-input-${postId}" placeholder="コメントを書く...">
        <button onclick="submitComment(${postId})">送信</button>
      </div>
    </div>
  `
}

async function handleCreatePost(event) {
  event.preventDefault()

  const week = document.getElementById('post-week').value
  const place = document.getElementById('post-place').value
  const text = document.getElementById('post-text').value
  const author = document.getElementById('post-author').value || (currentProfile?.name || '匿名の月')

  if (!week || !place || !text) {
    alert('❌ 全ての項目を入力してください')
    return
  }

  const newPost = await createPost(week, place, text, author)
  if (newPost) {
    console.log('✅ 投稿成功:', newPost)
    document.getElementById('post-week').value = ''
    document.getElementById('post-place').value = ''
    document.getElementById('post-text').value = ''
    document.getElementById('post-author').value = ''
    await loadPostsData()
  } else {
    alert('❌ 投稿に失敗しました')
  }
}

async function toggleHeartAction(postId) {
  const isLiked = isPostLiked(postId)
  const newHearts = await toggleHeart(postId, isLiked)
  if (newHearts !== null) {
    if (isLiked) {
      localStorage.removeItem(`liked-post-${postId}`)
    } else {
      localStorage.setItem(`liked-post-${postId}`, 'true')
    }
    await loadPostsData()
  }
}

function isPostLiked(postId) {
  return localStorage.getItem(`liked-post-${postId}`) === 'true'
}

function toggleCommentForm(postId) {
  const input = document.getElementById(`comment-input-${postId}`)
  if (input) {
    input.focus()
  }
}

async function submitComment(postId) {
  const input = document.getElementById(`comment-input-${postId}`)
  const text = input.value.trim()

  if (!text) {
    alert('❌ コメントを入力してください')
    return
  }

  const author = currentProfile?.name || '匿名の月'
  const success = await addComment(postId, author, text)

  if (success) {
    input.value = ''
    await loadPostsData()
  } else {
    alert('❌ コメント追加に失敗しました')
  }
}

// ==================== Q&A管理 ====================

async function loadQAsData() {
  const qas = await loadQA()
  allQAs = qas
  renderPlaceFilter('qa-place-filter', allQAs, selectedQAPlace, 'onQAPlaceFilterChange')
  renderQAs()
}

function renderQAs() {
  const qaList = document.getElementById('qa-list')

  const filtered = selectedQAPlace === 'all'
    ? allQAs
    : allQAs.filter(qa => qa.place === selectedQAPlace)

  if (filtered.length === 0) {
    qaList.innerHTML = '<p class="loading">まだ質問がありません</p>'
    return
  }

  qaList.innerHTML = filtered.map(qa => `
    <div class="qa-card">
      <div class="qa-header">
        <div class="qa-question">❓ ${escapeHtml(qa.question)}</div>
        <div class="qa-meta">📍 ${escapeHtml(qa.place)} | 妊娠${qa.week}週</div>
      </div>
      ${renderAnswers(qa.id, qa.answers)}
    </div>
  `).join('')
}

function renderAnswers(qaId, answers) {
  let html = ''

  if (answers && answers.length > 0) {
    // 先輩ママの回答を先頭に表示
    const sorted = [...answers].sort((a, b) => (b.senpai ? 1 : 0) - (a.senpai ? 1 : 0))

    html += `
      <div class="comments-section">
        <h4>💬 回答 (${answers.length})</h4>
        <div class="comments-list">
          ${sorted.map(answer => `
            <div class="comment-item" style="${answer.senpai ? 'border-left: 3px solid #F4A89C;' : ''}">
              <div class="comment-author">
                ${answer.senpai ? '👑' : '👤'} ${escapeHtml(answer.author)}
                ${answer.senpai ? '<span style="color: #F4A89C; font-weight: bold;"> [先輩ママ]</span>' : ''}
              </div>
              <div class="comment-text">${escapeHtml(answer.text)}</div>
              <div class="comment-time">📍 ${escapeHtml(answer.place)}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `
  }

  html += `
    <div class="add-comment-form" style="margin-top: 1rem;">
      <input type="text" id="answer-input-${qaId}" placeholder="回答を書く...">
      <button onclick="submitAnswer(${qaId})">送信</button>
    </div>
  `

  return html
}

async function handleCreateQuestion(event) {
  event.preventDefault()

  const week = document.getElementById('qa-week').value
  const place = document.getElementById('qa-place').value
  const question = document.getElementById('qa-question').value

  if (!week || !place || !question) {
    alert('❌ 全ての項目を入力してください')
    return
  }

  const newQuestion = await createQuestion(place, week, question)
}