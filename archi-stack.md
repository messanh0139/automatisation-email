# Architecture & Stack — Système Intelligent d'Automatisation Email

> **Version** 0.1 · **Date** 5 juillet 2026 · **Statut** validé le 5 juillet 2026 · **Méthodologie** VibeCoding PDCA
> Dérivé du PRD. Décrit le *comment* technique. Une fois l'approche choisie, ce document est stable.

## Approche retenue

Netlify Functions (serverless) + webhook email entrant + LLM (Claude API) pour la classification et la génération, avec Supabase pour la persistance et un dashboard React sur le même site.

**Pourquoi celle-ci :** elle couvre tous les *Must have* du PRD (classification, génération de réponses, extraction, tickets, sync CRM, escalade) avec une seule pile JS/TS et un seul dépôt, cohérente avec la mise en ligne finale unique de la méthode VibeCoding (un seul `push` Netlify, pas d'infra à gérer en parallèle). C'est le compromis le plus simple pour une v1, quitte à revoir l'infra si le volume réel s'avère plus élevé que prévu (voir Notes).

## Stack technique

| Couche | Choix | Rôle |
|--------|-------|------|
| Langage / framework backend | Node.js + Netlify Functions | logique de classification, extraction, décision, appels API externes |
| Interface / rendu | React + Vite | dashboard de supervision (Should have) : liste des emails traités, statuts, escalades |
| Réception des emails | Webhook provider transactionnel — Mailgun (*Inbound Routes*) | déclenche la Function à chaque email entrant |
| IA de classification/génération | API Claude (Anthropic) | intention, urgence, contexte, profil client + brouillon de réponse |
| Données | Supabase (Postgres managé) | historique des échanges, tickets, statuts, traçabilité RGPD |
| Intégration CRM | Adaptateur HTTP générique (le CRM précis reste une question ouverte du PRD) | création/synchronisation des fiches et tickets côté CRM |
| Hébergement / déploiement | Netlify | mise en ligne en **étape finale** (après la dernière feature), puis auto à chaque `push` ultérieur |
| Versioning | Git + GitHub | historique et synchronisation |

## Lancement local

**Commande :** `netlify dev` · **Port :** `8888` (par défaut) · **Prérequis :** Node.js + Netlify CLI (`npm install -g netlify-cli`)

> Commande et port **figés** ici : réutilisés **à l'identique** à chaque CHECK (test en local par l'utilisateur).
> `netlify dev` lance en même temps le front (Vite) et les Functions — un seul processus à surveiller.

## Architecture en bref

```
Email entrant → Webhook provider → Netlify Function (/api/inbound-email)
                                        │
                                        ├─ Appel Claude API : classification + extraction + brouillon de réponse
                                        │
                                        ├─ Écriture Supabase (email, statut, données extraites)
                                        │
                                        ├─ Cas standard → envoi auto de la réponse (API provider email)
                                        ├─ Donnée métier → création ticket + appel adaptateur CRM
                                        └─ Cas complexe/sensible → statut "à escalader" (visible au dashboard)

Dashboard React (Netlify) ──lecture/écriture──> Supabase
```

## Contraintes techniques héritées du PRD

- **Performance :** traitement synchrone au moment du webhook pour rester en quasi temps réel ; si le volume réel dépasse les capacités d'une Function serverless (durée d'exécution limitée), ce sera un signal pour revoir l'architecture (voir Notes).
- **Compatibilité :** intégration CRM via un adaptateur générique, faute de CRM précis tranché dans le PRD — à spécialiser une fois ce point décidé.
- **Accessibilité :** haute disponibilité portée par l'infra managée (Netlify + Supabase) ; RGPD : choisir une région d'hébergement Supabase dans l'UE, traçabilité assurée par l'horodatage et les logs en base.

## Alternatives écartées

- **Moteur no-code auto-hébergé (n8n) :** écartée car elle s'éloigne de l'esprit « vibecoding » (configuration visuelle plutôt que code, donc moins pédagogique) et de la mise en ligne Netlify unique prévue par la méthode.
- **Backend dédié (Node.js + file d'attente + Postgres, hébergé séparément) :** écartée pour la v1 car elle ajoute une infra à déployer et maintenir en plus de Netlify ; option de repli si le volume réel dépasse ce que les Functions serverless peuvent absorber.

## Notes

- Clés API sensibles (Claude, Supabase, provider email, CRM) : jamais commitées dans le repo, uniquement en variables d'environnement Netlify.
- Le CRM cible reste à trancher (question ouverte du PRD) ; l'adaptateur générique sera spécialisé une fois ce choix fait.
- Si le volume réel d'emails s'avère élevé, la bascule vers un backend dédié (option écartée ci-dessus) est le premier levier à envisager — ne pas changer d'infra sans GO explicite.
