# Architecture & Stack — Système Intelligent d'Automatisation Email

> **Version** 0.1 · **Date** 5 juillet 2026 · **Statut** validé le 5 juillet 2026 · **Méthodologie** VibeCoding PDCA
> Dérivé du PRD. Décrit le *comment* technique. Une fois l'approche choisie, ce document est stable.

## Approche retenue

Netlify Functions (serverless) + webhook email entrant + LLM (API OpenAI) pour la classification et la génération, avec Neon (Postgres serverless) pour la persistance et un dashboard React sur le même site.

**Pourquoi celle-ci :** elle couvre tous les *Must have* du PRD (classification, génération de réponses, extraction, tickets, sync CRM, escalade) avec une seule pile JS/TS et un seul dépôt, cohérente avec la mise en ligne finale unique de la méthode VibeCoding (un seul `push` Netlify, pas d'infra à gérer en parallèle). Neon est retenu plutôt qu'un Postgres classique parce que son driver HTTP (`@neondatabase/serverless`) évite la saturation de connexions typique des Functions serverless (éphémères, potentiellement très nombreuses en parallèle) ; le schéma reste 100% du code SQL versionné dans le repo, pas une interface web à configurer. C'est le compromis le plus simple pour une v1, quitte à revoir l'infra si le volume réel s'avère plus élevé que prévu (voir Notes).

## Stack technique

| Couche | Choix | Rôle |
|--------|-------|------|
| Langage / framework backend | Node.js + Netlify Functions | logique de classification, extraction, décision, appels API externes |
| Interface / rendu | React + Vite | dashboard de supervision (Should have) : liste des emails traités, statuts, escalades |
| Réception des emails | Webhook provider transactionnel — Mailgun (*Inbound Routes*) | déclenche la Function à chaque email entrant |
| Envoi des emails (réponses) | SMTP direct (`nodemailer`, compte email personnel) | envoi du brouillon de réponse (F4) au client |
| IA de classification/génération | API OpenAI | intention, urgence, contexte, profil client + brouillon de réponse |
| Données | Neon (Postgres serverless, driver HTTP) | historique des échanges, tickets, statuts, traçabilité RGPD |
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
                                        ├─ Appel API OpenAI : classification + extraction + brouillon de réponse
                                        │
                                        ├─ Écriture Neon (email, statut, données extraites)
                                        │
                                        ├─ Cas standard → envoi auto de la réponse (API provider email)
                                        ├─ Donnée métier → création ticket + appel adaptateur CRM
                                        └─ Cas complexe/sensible → statut "à escalader" (visible au dashboard)

Dashboard React (Netlify) ──lecture/écriture──> Neon
```

## Contraintes techniques héritées du PRD

- **Performance :** traitement synchrone au moment du webhook pour rester en quasi temps réel ; si le volume réel dépasse les capacités d'une Function serverless (durée d'exécution limitée), ce sera un signal pour revoir l'architecture (voir Notes).
- **Compatibilité :** intégration CRM via un adaptateur générique, faute de CRM précis tranché dans le PRD — à spécialiser une fois ce point décidé.
- **Accessibilité :** haute disponibilité portée par l'infra managée (Netlify + Neon) ; RGPD : choisir une région d'hébergement Neon dans l'UE, traçabilité assurée par l'horodatage et les logs en base.

## Alternatives écartées

- **Moteur no-code auto-hébergé (n8n) :** écartée car elle s'éloigne de l'esprit « vibecoding » (configuration visuelle plutôt que code, donc moins pédagogique) et de la mise en ligne Netlify unique prévue par la méthode.
- **Backend dédié (Node.js + file d'attente + Postgres, hébergé séparément) :** écartée pour la v1 car elle ajoute une infra à déployer et maintenir en plus de Netlify ; option de repli si le volume réel dépasse ce que les Functions serverless peuvent absorber.

## Notes

- Clés API sensibles (OpenAI, Neon, provider email, CRM) : jamais commitées dans le repo, uniquement en variables d'environnement Netlify (et en local dans un `.env` ignoré par git).
- Neon a été choisi plutôt que Supabase pour rester « codé de bout en bout » (schéma en SQL versionné, requêtes en code) plutôt que piloté via une interface web dédiée.
- Le CRM cible reste à trancher (question ouverte du PRD) ; l'adaptateur générique sera spécialisé une fois ce choix fait.
- Réception (Mailgun, webhook) et envoi (SMTP direct via un compte email personnel) utilisent deux mécanismes différents pour l'instant — Mailgun et Resend se sont avérés payants sans palier gratuit exploitable pour la v1. Un fournisseur unique pour les deux sens sera retranché avant la mise en ligne, une fois les coûts réels comparés.
- Si le volume réel d'emails s'avère élevé, la bascule vers un backend dédié (option écartée ci-dessus) est le premier levier à envisager — ne pas changer d'infra sans GO explicite.
- **Dette RGPD assumée :** le projet Neon (`automatisation_email`) est hébergé en région `AWS US East 1`, pas en UE — Neon ne permet pas de changer la région d'un projet existant. Acceptable pour cette phase de dev/v1 sans données clients réelles ; à corriger (recréation d'un projet en région UE + migration) avant toute mise en production avec de vraies données.
