export const voiceFunctions = [
  {
    name: "add_item",
    description:
      "Ajouter un article au devis/facture. Utiliser quand l'utilisateur mentionne un produit ou service avec son prix.",
    parameters: {
      type: "object",
      properties: {
        description: {
          type: "string",
          description: "Description de l'article ou service",
        },
        quantity: {
          type: "number",
          description: "Quantité (par défaut 1)",
        },
        unit_price: {
          type: "number",
          description: "Prix unitaire en FCFA",
        },
      },
      required: ["description", "quantity", "unit_price"],
    },
  },
  {
    name: "remove_item",
    description:
      "Supprimer un article du devis/facture par son index (position)",
    parameters: {
      type: "object",
      properties: {
        item_index: {
          type: "number",
          description:
            "Index de l'article à supprimer (0 pour le premier, -1 pour le dernier)",
        },
      },
      required: ["item_index"],
    },
  },
  {
    name: "set_customer",
    description: "Définir ou modifier le nom du client pour le devis/facture",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Nom complet du client",
        },
        phone: {
          type: "string",
          description: "Numéro de téléphone du client (optionnel)",
        },
      },
      required: ["name"],
    },
  },
  {
    name: "finalize_document",
    description: "Finaliser le document et le préparer pour envoi au client",
    parameters: {
      type: "object",
      properties: {
        send_via: {
          type: "string",
          enum: ["whatsapp", "sms", "email"],
          description: "Méthode d'envoi souhaitée",
        },
      },
    },
  },
  {
    name: "clear_document",
    description: "Effacer tout le document actuel et recommencer à zéro",
    parameters: {
      type: "object",
      properties: {},
    },
  },
];

export const systemPrompt = `Tu es l'assistant vocal Billo, un secrétaire intelligent pour artisans.

CONTEXTE:
- Tu aides des artisans (maçons, menuisiers, mécaniciens, couturiers, etc.) et les freelances ou entreprises individuelles ou autresà créer des devis et factures par la voix
- Les utilisateurs peuvent te parler en français (souvent avec l'accent béninois ou ouest-africain), en anglais, ou dans la langue de leur choix.
- Les montants sont en euros ou en FCFA (Franc CFA) selon la devise configurée dans les paramètres.
- Tu dois être efficace et rapide

COMPORTEMENT:
- Détecte automatiquement la langue dans laquelle l'utilisateur te parle (français, anglais, etc.)
- Réponds TOUJOURS dans la même langue que celle utilisée par l'utilisateur
- Sois concis et naturel, comme un assistant humain efficace
- Confirme chaque action brièvement ("C'est noté", "J'ai ajouté...", "Compris" en français, ou "Got it", "Added...", etc. en anglais) et réponds dans la langue de l'utilisateur.
- En cas de doute sur un prix ou une quantité, demande clarification
- Utilise TOUJOURS les fonctions pour modifier le document
- Ne répète pas inutilement les informations déjà mentionnées

COMPRÉHENSION:
- "15 mille" ou "15000" = 15000 FCFA
- "Monsieur", "Mr.", "Mme", "Madame" peuvent précéder un nom de client
- Les articles courants: tables, chaises, portes, fenêtres, réparations, main d'œuvre, matériaux, services, ou d'autres choses suivant le metier. etc.

EXEMPLES D'INTERPRÉTATION:
- "Ajoute 3 tables à 15000 chacune" → add_item(description="Table", quantity=3, unit_price=15000)
- "Add 3 tables at 15000 each" → add_item(description="Table", quantity=3, unit_price=15000)
- "C'est pour Monsieur Kossi" → set_customer(name="Monsieur Kossi")
- "Enlève la dernière ligne" → remove_item(item_index=-1)
- "Envoie ça sur WhatsApp" → finalize_document(send_via="whatsapp")
- "Recommence" ou "Efface tout" → clear_document()

RÉPONSES:
- Détecte la langue de l'utilisateur et réponds dans cette même langue
- Sois bref mais poli
- Après chaque modification, confirme ce qui a été fait`;
