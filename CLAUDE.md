# Garde-fous du projet

Ces règles encadrent ton comportement sur ces trois projets (Automatisation Email,
Agent Service Client, Scoring Prospects). Elles sont non négociables.

## RÈGLE 0 — Méthode : VibeCoding PDCA, feature par feature

Le travail se fait **une feature à la fois**, en cycles PDCA. Chaque cycle suit cet
ordre, sans le raccourcir :

**Plan → 🛑 GO #1 → Do → Check (local) → Act**

- **Plan** : proposer 3 options d'implémentation conformes à ces règles, expliquer
  le raisonnement. Ne rien coder à ce stade.
- **🛑 GO #1** : ne jamais écrire ou modifier du code sans approbation explicite.
- **Do** : coder dans le périmètre strict de la feature.
- **Check** : lancer le serveur local et faire tester par l'utilisateur lui-même
  (jamais d'auto-validation par navigateur intégré ou sous-agent de navigation).
- **Act** : si Check **KO** → retour au Plan (rien n'est commité). Si Check **OK**
  → 🛑 **GO #2** obligatoire avant le `commit` local (pas de `push` à ce stade).
  Puis mise à jour de l'état de la feature dans `plan-action.md`.
- **Non-régression (en local)** : à déclencher périodiquement, au jugement du dev.
- **Mise en ligne — étape finale unique** : quand toutes les features sont « fait »,
  clôture du chantier (🛑 **GO MISE EN LIGNE** : `push` + Netlify + URL vérifiée par
  l'utilisateur → walkthrough + post-mortem → nouvelles features → checklist).

## GARDE-FOUS

### Règle 1 — Checkpoint obligatoire
Ne jamais écrire ni modifier de code sans approbation explicite (« GO »).

### Règle 2 — Périmètre strict
Ne modifie que ce qui est explicitement demandé — rien d'autre, même si une
amélioration annexe te semble évidente.

### Règle 3 — Réflexion avant action
Avant de demander le « GO », explique ton raisonnement de manière pédagogique.
Avant ET pendant chaque action (commande, édition), explique en termes simples
ce que tu fais et pourquoi. L'utilisateur doit comprendre et apprendre, même
passivement.

## MÉTHODE DE TRAVAIL

### Règle 4 — Décomposition en sous-tâches
Décompose chaque tâche complexe en étapes petites et séquentielles.

### Règle 5 — 3 options systématiques
Pour toute modification significative, propose 3 approches distinctes, en
précisant pour chacune ses avantages et ses inconvénients.

### Règle 6 — Plan d'action dans la todo list
Rédige un plan d'action détaillé, sous forme de todo list, avant toute
génération de code.

### Règle 7 — Todo list à jour en permanence
Mets à jour la todo list en temps réel, au fil de l'avancement.

## QUALITÉ DU CODE

### Règle 8 — Simplicité d'abord (KISS)
Privilégie toujours la solution la plus simple qui répond au besoin.

### Règle 9 — Rien de superflu (YAGNI)
N'ajoute jamais de fonctionnalité non demandée, même si elle te semble utile.

### Règle 10 — Code modulaire
Structure le code de manière modulaire : un fichier par responsabilité
(ex. : un module dédié à la classification, un autre au scoring, un autre à
l'intégration CRM — pas de fichier fourre-tout).

### Règle 11 — Logs de débogage détaillés
Ajoute des logs explicites (`console.log` ou équivalent) à chaque étape clé,
en particulier sur les flux automatisés critiques (classification d'un email,
appel RAG, calcul de score) où une erreur silencieuse est difficile à repérer
sans traçabilité.

### Règle 12 — Commentaires utiles
Explique le POURQUOI (l'intention) plutôt que le QUOI (ce que le code fait déjà
de façon évidente).

## POSTURE

### Règle 13 — Communication pédagogique
Explique chaque décision technique en termes accessibles, sans présumer que
l'utilisateur maîtrise le jargon.

## ENVIRONNEMENT

### Règle 14 — PowerShell
PowerShell n'accepte pas `&&` pour enchaîner les commandes. Utilise `;` à la
place.