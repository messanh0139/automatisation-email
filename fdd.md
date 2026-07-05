# FDD — Décomposition en features — Système Intelligent d'Automatisation Email

> **Version** 0.1 · **Date** 5 juillet 2026 · **Statut** validé le 5 juillet 2026 · **Méthodologie** VibeCoding PDCA
> Traduit les fonctionnalités du PRD (table MoSCoW) en **features-unités de construction** — des morceaux assez petits pour tenir dans un cycle PDCA chacun.
> Dérivé du PRD **et** de l'architecture retenue dans `archi-stack.md` (webhook Mailgun → Netlify Function → API OpenAI → Neon).

## Principe de formulation

Chaque feature est nommée à la manière FDD : **`<action> <résultat> <objet>`**

Une bonne feature-unité est : **petite** (réalisable en un cycle), **testable seule** (on sait dire si elle marche), et **autonome** (elle n'exige pas qu'une autre soit finie en même temps).

> Note d'architecture : ces features sont majoritairement **backend** (déclenchées par un webhook, pas par un clic dans une page). Le CHECK de chaque feature se fera en déclenchant un email de test et en observant le résultat dans les logs de la Function et/ou dans la table `emails` (via `psql`) — pas forcément dans une page de l'app elle-même, tant que le dashboard (Should have) n'existe pas encore.

## Features issues des « Must have »

| # | Feature (`action résultat objet`) | Issue de (PRD) | Note |
|---|-----------------------------------|----------------|------|
| 1 | Recevoir et enregistrer un email entrant | — | Brique technique (point d'entrée webhook Mailgun → Neon) ; pas un Must have du PRD en soi, mais nécessaire pour construire toutes les suivantes |
| 2 | Classifier un email reçu (intention, urgence, contexte, profil client) | Classification intelligente des messages | Un seul appel API OpenAI, sortie structurée sur les 4 dimensions |
| 3 | Composer une réponse contextualisée pour un cas standard | Génération de réponses contextualisées | Dépend de la classification (F2) |
| 4 | Envoyer la réponse générée au client | Génération de réponses contextualisées | Séparée de la composition (F3) pour pouvoir vérifier le texte avant d'activer l'envoi réel |
| 5 | Extraire et structurer les données utiles d'un email | Extraction et structuration des données | Ex. coordonnées, référence commande, éléments métier cités dans le message |
| 6 | Créer un ticket à partir des données extraites | Création de tickets/actions métier | Dépend de F5 |
| 7 | Synchroniser un ticket avec le CRM | Synchronisation CRM et bases de données | Via l'adaptateur générique défini dans `archi-stack.md` ; dépend de F6 |
| 8 | Escalader un cas complexe vers un opérateur humain | Escalade vers un opérateur humain | Déclenchée par le résultat de la classification (F2) |

## Features issues des « Should / Could have »

| # | Feature | Priorité (Should / Could) | Note |
|---|---------|---------------------------|------|
| 9 | Afficher un tableau de bord des volumes et du taux de résolution automatique | Should | Porte aussi les specs visuelles du PRD (sobriété, codes couleur urgence/escalade) |
| 10 | Afficher l'historique des échanges d'un même client | Should | Mémoire contextuelle persistante |
| 11 | Déclencher une alerte en cas de dépassement de SLA | Should | Dépend d'un seuil d'urgence — à définir (question ouverte du PRD) |
| 12 | Apprendre des corrections humaines pour améliorer la classification | Could | Apprentissage continu |
| 13 | Supporter plusieurs langues au-delà de la langue principale | Could | Multilingue étendu — dépend aussi de la question ouverte « langue(s) à supporter » |

## Couverture du PRD

| Exigence du PRD | Couverte par | Si non couverte : raison |
|-----------------|--------------|--------------------------|
| Classification intelligente des messages | F2 | — |
| Génération de réponses contextualisées | F3, F4 | — |
| Extraction et structuration des données | F5 | — |
| Création de tickets/actions métier | F6 | — |
| Synchronisation CRM et bases de données | F7 | — |
| Escalade vers un opérateur humain | F8 | — |
| Spécifications visuelles (sobriété, codes couleur urgence/escalade) | F9 | reportée : dépend du dashboard, hors périmètre Must have de la v1 |
| Mémoire contextuelle persistante (Should have) | F10 | — |
| Tableau de bord de suivi (Should have) | F9 | — |
| Alertes SLA (Should have) | F11 | — |

## Hors périmètre (« Won't have »)

- Prise en charge d'autres canaux que l'email (chat, SMS, réseaux sociaux).
- Décision finale automatique sur des cas juridiquement ou financièrement sensibles — ces cas passent systématiquement par l'escalade (F8).

## Dépendances entre features

- F1 avant toutes les autres — rien ne peut être classifié, répondu ou extrait sans qu'un email ait été reçu et enregistré.
- F2 avant F3 et F8 — la composition de réponse et la décision d'escalade s'appuient sur le résultat de la classification.
- F3 avant F4 — on compose le brouillon avant d'activer l'envoi réel.
- F5 avant F6 — un ticket se crée à partir des données extraites.
- F6 avant F7 — la synchro CRM porte sur le ticket déjà créé.
