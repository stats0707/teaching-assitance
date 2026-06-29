-- ====================================
-- 小组互评系统 - Supabase 数据库初始化
-- ====================================
-- 在 Supabase SQL Editor 中执行此脚本

-- 1. 创建评分表
CREATE TABLE IF NOT EXISTS scores (
  id BIGSERIAL PRIMARY KEY,
  class_id TEXT NOT NULL,
  evaluator_group INTEGER NOT NULL,
  target_group INTEGER NOT NULL,
  dim1 FLOAT DEFAULT 0,
  dim2 FLOAT DEFAULT 0,
  dim3 FLOAT DEFAULT 0,
  dim4 FLOAT DEFAULT 0,
  dim5 FLOAT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(class_id, evaluator_group, target_group)
);

-- 2. 启用行级安全（RLS）
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;

-- 3. 允许公开读写（因为不涉及敏感数据）
CREATE POLICY "允许公开读写" ON scores
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 4. 创建索引加速查询
CREATE INDEX idx_scores_class ON scores(class_id);
CREATE INDEX idx_scores_evaluator ON scores(class_id, evaluator_group);
CREATE INDEX idx_scores_target ON scores(class_id, target_group);
