# ArtisanVoice

Assistant vocal de facturation pour artisans - Créez vos devis et factures par la voix, sans saisie au clavier.

## Fonctionnalités

- **Commande vocale** : Dictez vos devis avec OpenAI Realtime API
- **Prévisualisation en temps réel** : Voyez le document se construire pendant que vous parlez
- **Génération PDF** : Créez des documents professionnels automatiquement
- **Partage WhatsApp** : Envoyez directement à vos clients
- **Mode hors-ligne** : Travaillez même sans connexion internet
- **PWA** : Installez l'app sur votre téléphone

## Stack Technique

- **Framework** : Next.js 14 (App Router)
- **UI** : Tailwind CSS + Shadcn UI + Radix
- **Base de données** : Supabase (PostgreSQL)
- **Voice AI** : OpenAI gpt-4o-realtime-preview
- **PDF** : @react-pdf/renderer
- **Offline** : Dexie (IndexedDB)
- **State** : Zustand

## Installation

```bash
# Cloner le projet
git clone <repo-url>
cd artisanVoice

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.local.example .env.local
# Éditer .env.local avec vos clés API

# Lancer en développement
npm run dev
```

## Configuration

### Variables d'environnement

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# OpenAI
OPENAI_API_KEY=your_openai_api_key
```

### Base de données Supabase

1. Créez un nouveau projet sur [Supabase](https://supabase.com)
2. Exécutez le script SQL dans `supabase/migrations/001_initial_schema.sql`
3. Copiez les clés API dans `.env.local`

## Utilisation

1. **Créer un compte** : Inscrivez-vous avec votre email
2. **Nouveau devis** : Appuyez sur le bouton micro
3. **Dictez** : "Ajoute 3 tables à 15000 chacune pour Monsieur Kossi"
4. **Envoyez** : "Envoie ça sur WhatsApp"

### Commandes vocales supportées

| Commande | Action |
|----------|--------|
| "Ajoute X [article] à [prix]" | Ajouter un article |
| "Pour [nom du client]" | Définir le client |
| "Enlève la dernière ligne" | Supprimer un article |
| "Envoie sur WhatsApp" | Partager le document |
| "Efface tout" | Recommencer |

## Structure du projet

```
src/
├── app/                    # Pages Next.js (App Router)
│   ├── (auth)/            # Pages d'authentification
│   ├── (dashboard)/       # Dashboard principal
│   └── api/               # Routes API
├── components/            # Composants React
│   ├── ui/               # Composants Shadcn
│   ├── voice/            # Interface vocale
│   └── invoice/          # Prévisualisation/PDF
├── lib/                   # Utilitaires
│   ├── supabase/         # Client Supabase
│   ├── openai/           # Client OpenAI Realtime
│   └── offline/          # Gestion hors-ligne
├── hooks/                 # Hooks React personnalisés
├── stores/               # État global (Zustand)
└── types/                # Types TypeScript
```

## Développement

```bash
# Lancer le serveur de développement
npm run dev

# Build de production
npm run build

# Lancer en production
npm start

# Linter
npm run lint
```

## Déploiement

L'application peut être déployée sur Vercel :

```bash
npm install -g vercel
vercel
```

## Licence

MIT
