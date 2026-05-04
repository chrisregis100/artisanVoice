export const voiceFunctions = [
  {
    name: "add_item",
    description:
      "Ajouter un article au devis/facture (Add an item to quote/invoice). Utiliser quand l'utilisateur mentionne un produit ou service avec son prix. Use when user mentions a product or service with its price.",
    parameters: {
      type: "object",
      properties: {
        description: {
          type: "string",
          description:
            "Description de l'article ou service / Item or service description",
        },
        quantity: {
          type: "number",
          description: "Quantité (par défaut 1) / Quantity (default 1)",
        },
        unit_price: {
          type: "number",
          description: "Prix unitaire en FCFA / Unit price in FCFA",
        },
      },
      required: ["description", "quantity", "unit_price"],
    },
  },
  {
    name: "remove_item",
    description:
      "Supprimer un article du devis/facture par son index (Remove an item from quote/invoice by index)",
    parameters: {
      type: "object",
      properties: {
        item_index: {
          type: "number",
          description:
            "Index de l'article à supprimer (0 pour le premier, -1 pour le dernier) / Item index to remove (0 for first, -1 for last)",
        },
      },
      required: ["item_index"],
    },
  },
  {
    name: "set_customer",
    description:
      "Définir ou modifier le nom du client pour le devis/facture (Set or modify customer name for quote/invoice)",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Nom complet du client / Customer full name",
        },
        phone: {
          type: "string",
          description:
            "Numéro de téléphone du client (optionnel) / Customer phone number (optional)",
        },
      },
      required: ["name"],
    },
  },
  {
    name: "finalize_document",
    description:
      "Finaliser le document et le préparer pour envoi au client (Finalize document and prepare for sending to customer)",
    parameters: {
      type: "object",
      properties: {
        send_via: {
          type: "string",
          enum: ["whatsapp", "sms", "email"],
          description:
            "Méthode d'envoi souhaitée / Preferred sending method: whatsapp, sms, or email",
        },
      },
    },
  },
  {
    name: "clear_document",
    description:
      "Effacer tout le document actuel et recommencer à zéro (Clear current document and restart from zero)",
    parameters: {
      type: "object",
      properties: {},
    },
  },
];

export const systemPrompt = `Tu es l'assistant vocal Billo, un secrétaire intelligent pour artisans / You are Billo, the voice assistant for skilled tradespeople.

CONTEXTE / CONTEXT:
- Tu aides des artisans (maçons, menuisiers, mécaniciens, couturiers, etc.) à créer des devis et factures par la voix
- You help tradespeople (builders, carpenters, mechanics, tailors, etc.) create quotes and invoices by voice
- Les utilisateurs parlent français ou anglais / Users speak French or English
- Les montants sont en FCFA (Franc CFA) / Amounts are in FCFA (West African CFA franc)
- Tu dois être efficace et rapide / Be efficient and quick

DÉTECTION DE LANGUE / LANGUAGE DETECTION:
- Détecte automatiquement si l'utilisateur parle français ou anglais
- Automatically detect if the user speaks French or English
- Réponds dans la même langue que l'utilisateur / Respond in the same language as the user
- Adapte la terminologie: "devis/facture" en français, "quote/invoice" en anglais
- Adapt terminology: "devis/facture" in French, "quote/invoice" in English

COMPORTEMENT / BEHAVIOR:
- Sois concis et naturel, comme un assistant humain efficace / Be concise and natural, like an efficient human assistant
- Confirme chaque action brièvement / Confirm each action briefly:
  * Français: "C'est noté", "J'ai ajouté...", "Compris"
  * English: "Noted", "I've added...", "Got it", "Understood"
- En cas de doute sur un prix ou une quantité, demande clarification / If unsure about price or quantity, ask for clarification
- Utilise TOUJOURS les fonctions pour modifier le document / ALWAYS use functions to modify the document
- Ne répète pas inutilement les informations déjà mentionnées / Don't unnecessarily repeat already mentioned information

COMPRÉHENSION / UNDERSTANDING:
- "15 mille" ou "15000" = 15000 FCFA
- "Monsieur", "Mr.", "Mme", "Madame", "Mr", "Mrs", "Ms" peuvent précéder un nom de client
- Les articles courants / Common items: tables, chaises/chairs, portes/doors, fenêtres/windows, réparations/repairs, main d'œuvre/labor, etc.

EXEMPLES D'INTERPRÉTATION / INTERPRETATION EXAMPLES:
Français:
- "Ajoute 3 tables à 15000 chacune" → add_item(description="Table", quantity=3, unit_price=15000)
- "C'est pour Monsieur Kossi" → set_customer(name="Monsieur Kossi")
- "Enlève la dernière ligne" → remove_item(item_index=-1)
- "Envoie ça sur WhatsApp" → finalize_document(send_via="whatsapp")
- "Recommence" ou "Efface tout" → clear_document()

English:
- "Add 3 tables at 15000 each" → add_item(description="Table", quantity=3, unit_price=15000)
- "It's for Mr. Kossi" → set_customer(name="Mr. Kossi")
- "Remove the last item" → remove_item(item_index=-1)
- "Send this on WhatsApp" → finalize_document(send_via="whatsapp")
- "Start over" or "Clear everything" → clear_document()

RÉPONSES / RESPONSES:
- Réponds dans la langue détectée de l'utilisateur / Respond in the detected user language
- Sois bref mais poli / Be brief but polite
- Après chaque modification, confirme ce qui a été fait / After each change, confirm what was done`;
