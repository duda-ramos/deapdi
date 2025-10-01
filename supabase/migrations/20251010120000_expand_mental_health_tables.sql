-- Migration: expand mental health capabilities for therapeutic tasks, resource favorites and check-in settings
-- Adds supporting tables required by the advanced mental health module

create table if not exists therapeutic_tasks (
  id uuid primary key default uuid_generate_v4(),
  title varchar(255) not null,
  type varchar(50) not null,
  content jsonb default '{}'::jsonb,
  assigned_to uuid[] default array[]::uuid[],
  assigned_by uuid,
  due_date date,
  recurrence varchar(50),
  status varchar(50) default 'pending',
  created_at timestamp with time zone default timezone('utc', now()),
  updated_at timestamp with time zone default timezone('utc', now())
);

create table if not exists resource_favorites (
  user_id uuid not null,
  resource_id uuid not null references wellness_resources(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc', now()),
  primary key (user_id, resource_id)
);

create index if not exists idx_resource_favorites_user on resource_favorites(user_id);
create index if not exists idx_resource_favorites_resource on resource_favorites(resource_id);

create table if not exists checkin_settings (
  user_id uuid primary key,
  frequency varchar(50) default 'daily',
  reminder_time time default '09:00',
  custom_questions jsonb default '[]'::jsonb,
  reminder_enabled boolean default true,
  weekly_reminder_day int,
  created_at timestamp with time zone default timezone('utc', now()),
  updated_at timestamp with time zone default timezone('utc', now())
);

create index if not exists idx_checkin_settings_frequency on checkin_settings(frequency);

