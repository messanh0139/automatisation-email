-- Schéma F1 : table de réception des emails entrants.
-- Exécuté via psql (voir instructions de mise en route) : psql "$DATABASE_URL" -f db/schema.sql
create table if not exists emails (
  id bigint generated always as identity primary key,
  mailgun_message_id text,
  from_address text,
  to_address text,
  subject text,
  body_plain text,
  raw_payload jsonb,
  status text not null default 'reçu',
  received_at timestamptz not null default now()
);
