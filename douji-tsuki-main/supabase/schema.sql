-- ==================== posts テーブル ====================
CREATE TABLE posts (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  week INTEGER NOT NULL,
  place TEXT NOT NULL,
  text TEXT NOT NULL,
  author TEXT DEFAULT '匿名の月',
  hearts INTEGER DEFAULT 0,
  comments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- インデックスを作成（検索を高速化）
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_week ON posts(week);
CREATE INDEX idx_posts_place ON posts(place);

-- ==================== qa テーブル ====================
CREATE TABLE qa (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  place TEXT NOT NULL,
  week INTEGER NOT NULL,
  question TEXT NOT NULL,
  answers JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- インデックスを作成（検索を高速化）
CREATE INDEX idx_qa_created_at ON qa(created_at DESC);
CREATE INDEX idx_qa_week ON qa(week);
CREATE INDEX idx_qa_place ON qa(place);

-- ==================== RLS設定 ====================
-- postsテーブルのRLSを有効化
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- 全員が読み取り可能
CREATE POLICY "posts_select_policy" ON posts
  FOR SELECT USING (true);

-- 全員が挿入可能
CREATE POLICY "posts_insert_policy" ON posts
  FOR INSERT WITH CHECK (true);

-- 全員が更新可能（hearts, comments を更新するため）
CREATE POLICY "posts_update_policy" ON posts
  FOR UPDATE USING (true);

-- qaテーブルのRLSを有効化
ALTER TABLE qa ENABLE ROW LEVEL SECURITY;

-- 全員が読み取り可能
CREATE POLICY "qa_select_policy" ON qa
  FOR SELECT USING (true);

-- 全員が挿入可能
CREATE POLICY "qa_insert_policy" ON qa
  FOR INSERT WITH CHECK (true);

-- 全員が更新可能（answers を更新するため）
CREATE POLICY "qa_update_policy" ON qa
  FOR UPDATE USING (true);
