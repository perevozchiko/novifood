-- Daily AI usage counter.
-- Tracks how many Gemini requests have been made each calendar day (UTC).
-- One row per day; count is incremented on every successful AI analysis.
-- Allows the app to enforce a daily cap before hitting the Gemini quota ceiling.
create table if not exists ai_usage (
  usage_date  date    primary key default current_date,
  count       integer not null    default 0
);
