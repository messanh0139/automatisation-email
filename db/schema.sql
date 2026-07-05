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
  received_at timestamptz not null default now(),
  -- F2 : résultat de la classification (API OpenAI)
  intention text,
  urgence text,
  contexte text,
  profil_client text,
  cas_standard boolean,
  -- F3 : brouillon de réponse (cas standard uniquement)
  brouillon_reponse text,
  -- F5 : données utiles extraites (liste de paires label/valeur, structure libre)
  donnees_extraites jsonb
);

-- F6 : ticket créé à partir des données extraites (uniquement si l'email en contient).
create table if not exists tickets (
  id bigint generated always as identity primary key,
  email_id bigint not null references emails (id),
  donnees jsonb not null,
  statut text not null default 'ouvert',
  created_at timestamptz not null default now()
);
