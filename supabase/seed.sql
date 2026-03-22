-- ============================================================
-- seed.sql
-- 코드없이 — AI 툴 기본 데이터
-- ============================================================

INSERT INTO tools (id, name, slug, icon_url, website) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Cursor',     'cursor',     NULL, 'https://cursor.com'),
  ('00000000-0000-0000-0000-000000000002', 'Claude',     'claude',     NULL, 'https://claude.ai'),
  ('00000000-0000-0000-0000-000000000003', 'ChatGPT',    'chatgpt',    NULL, 'https://chatgpt.com'),
  ('00000000-0000-0000-0000-000000000004', 'Lovable',    'lovable',    NULL, 'https://lovable.dev'),
  ('00000000-0000-0000-0000-000000000005', 'Bolt',       'bolt',       NULL, 'https://bolt.new'),
  ('00000000-0000-0000-0000-000000000006', 'Replit',     'replit',     NULL, 'https://replit.com'),
  ('00000000-0000-0000-0000-000000000007', 'v0',         'v0',         NULL, 'https://v0.dev'),
  ('00000000-0000-0000-0000-000000000008', 'Windsurf',   'windsurf',   NULL, 'https://windsurf.com'),
  ('00000000-0000-0000-0000-000000000009', 'Gemini',     'gemini',     NULL, 'https://gemini.google.com'),
  ('00000000-0000-0000-0000-000000000010', 'Copilot',    'copilot',    NULL, 'https://github.com/features/copilot'),
  ('00000000-0000-0000-0000-000000000011', 'Perplexity', 'perplexity', NULL, 'https://perplexity.ai'),
  ('00000000-0000-0000-0000-000000000012', 'Grok',       'grok',       NULL, 'https://x.ai'),
  ('00000000-0000-0000-0000-000000000013', 'Devin',      'devin',      NULL, 'https://devin.ai'),
  ('00000000-0000-0000-0000-000000000014', 'Cline',      'cline',      NULL, 'https://cline.bot'),
  ('00000000-0000-0000-0000-000000000015', 'Aider',      'aider',      NULL, 'https://aider.chat'),
  ('00000000-0000-0000-0000-000000000016', 'Continue',   'continue',   NULL, 'https://continue.dev'),
  ('00000000-0000-0000-0000-000000000017', 'Mistral',    'mistral',    NULL, 'https://mistral.ai'),
  ('00000000-0000-0000-0000-000000000018', 'Cohere',     'cohere',     NULL, 'https://cohere.com'),
  ('00000000-0000-0000-0000-000000000019', 'Vercel AI',  'vercel-ai',  NULL, 'https://vercel.com/ai'),
  ('00000000-0000-0000-0000-000000000020', 'Figma AI',   'figma-ai',   NULL, 'https://figma.com')
ON CONFLICT (slug) DO NOTHING;
