# Plan d'action — Système Intelligent d'Automatisation Email

> **Document vivant** — mis à jour à **chaque tour** de la boucle PDCA. Son état doit toujours refléter la réalité du dépôt.
> **Méthodologie** VibeCoding PDCA · **Statut cadrage** validé le 5 juillet 2026 · **Dernière mise à jour** 5 juillet 2026 (F8 fait — toutes les features Must have sont fait)

## Comment lire / tenir ce document

- L'agent prend la **première feature « à faire »** dans l'ordre du tableau (les *Must have* d'abord).
- Il la passe en **« en cours »** au début du tour, puis en **« fait »** après le **commit local** (Check OK + GO #2).
- États possibles : `à faire` · `en cours` · `fait`.
- Tant qu'il reste des `à faire`, la boucle continue. Toutes les features en `fait` → on passe à la **clôture** (déploiement Netlify + bilan).

## Tableau de pilotage

| Ordre | Feature (du FDD) | État | Critère de réussite | Tour / commit |
|-------|------------------|------|---------------------|---------------|
| 1 | F1 — Recevoir et enregistrer un email entrant | fait | Un email de test **simulé en local** (script reproduisant le payload Mailgun) fait apparaître une ligne dans la table `emails` (Neon), avec le contenu et un statut « reçu » | commit cadrage + F1 |
| 2 | F2 — Classifier un email reçu (intention, urgence, contexte, profil client) | fait | Pour un email de test, la ligne est complétée avec les 4 dimensions renseignées (aucune vide) | commit F2 |
| 3 | F3 — Composer une réponse contextualisée pour un cas standard | fait | Pour un email de test classé « cas standard », un brouillon de réponse cohérent avec le contenu est enregistré en base | commit F3 |
| 4 | F4 — Envoyer la réponse générée au client | fait | Le brouillon généré est effectivement reçu dans la boîte de test, et le statut de l'email passe à « répondu » | commit F4 |
| 5 | F5 — Extraire et structurer les données utiles d'un email | fait | Pour un email de test contenant des données exploitables (ex. référence, coordonnées), ces données apparaissent structurées en base | commit F5 |
| 6 | F6 — Créer un ticket à partir des données extraites | fait | Un ticket est créé en base à partir des données extraites, avec un statut « ouvert » | commit F6 |
| 7 | F7 — Synchroniser un ticket avec le CRM | fait | La création du ticket déclenche un appel vérifiable à l'adaptateur CRM (HubSpot), et le statut passe à « synchronisé » | commit F7 |
| 8 | F8 — Escalader un cas complexe vers un opérateur humain | fait | Pour un email de test marqué complexe/sensible, le statut passe à « à escalader », visible en base, sans envoi automatique de réponse | commit F8 |
| — | **Déploiement Netlify** (mise en ligne — après la dernière feature) | à faire | site accessible à l'URL publique, vérifié par l'utilisateur | — |

> Formuler les critères de console comme « aucune erreur **liée à notre code** » : le navigateur génère du bruit bénin (ex. 404 sur la favicon) qui ne doit pas invalider un CHECK.
> Le CHECK de F1 à F8 se fait en simulant l'arrivée d'un email (script reproduisant le payload Mailgun envoyé à la Function locale) et en observant le résultat dans les logs de la Function et/ou la table `emails` (via `psql`) — pas dans une page de l'app elle-même, tant que le dashboard (Should have, hors v1) n'existe pas. Le vrai aller-retour avec Mailgun (compte, domaine, route entrante) n'est mis en place qu'une seule fois, au moment du déploiement — c'est lui qui sert de smoke test final.

## Journal des passes de non-régression

> À remplir au feeling, tous les N tours. Trace ce qui a été re-testé **en local**. (Le smoke test de prod n'a lieu qu'à la mise en ligne, en clôture.)

| Date | Après feature # | Non-régression (local) | Anomalie / action |
|------|-----------------|------------------------|-------------------|
| — | — | — | — |

## Pour aller plus loin (backlog)

> Rempli en **clôture**, après la mise en ligne : pistes d'évolution proposées et retenues pour un futur cycle (repêchage des *Could have* et *Questions ouvertes* du PRD inclus).

| Idée de feature | Valeur | Effort estimé |
|-----------------|--------|---------------|
| — | — | — |

## Notes de session

> Reprise de chantier : relire le PRD, l'archi-stack, le FDD, puis ce plan. Reprendre à la première feature « à faire » ou « en cours ».

- Cadrage initial posé le 5 juillet 2026. Les features Should/Could (F9 à F13 du FDD) ne figurent pas encore dans le tableau de pilotage — elles rejoindront un futur tour via la section « Pour aller plus loin ».
- Questions ouvertes du PRD à garder en tête pendant la boucle : CRM précis à intégrer (impacte F7), seuil exact d'« urgence » (impacte F2/F8/F11), langue(s) à supporter (impacte F13), volumes attendus (impacte le choix d'architecture si la charge dépasse les capacités des Functions serverless).
