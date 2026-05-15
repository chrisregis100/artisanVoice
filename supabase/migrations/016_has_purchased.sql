-- 1. Ajouter la colonne
ALTER TABLE credit_wallets
  ADD COLUMN IF NOT EXISTS has_purchased BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Backfill : marquer les users ayant déjà acheté
UPDATE credit_wallets cw
SET has_purchased = TRUE
WHERE EXISTS (
  SELECT 1 FROM credit_transactions ct
  WHERE ct.user_id = cw.user_id
    AND ct.kind = 'purchase'
);

-- 3. Trigger automatique : toute future transaction 'purchase' met le flag à TRUE
CREATE OR REPLACE FUNCTION set_has_purchased()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.kind = 'purchase' THEN
    UPDATE credit_wallets
    SET has_purchased = TRUE
    WHERE user_id = NEW.user_id
      AND has_purchased = FALSE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_purchase_transaction ON credit_transactions;
CREATE TRIGGER on_purchase_transaction
  AFTER INSERT ON credit_transactions
  FOR EACH ROW
  EXECUTE FUNCTION set_has_purchased();

-- 4. Index composé pour le check paywall (user_id est déjà PK, ceci aide le gating)
CREATE INDEX IF NOT EXISTS idx_credit_wallets_paywall
  ON credit_wallets (user_id, has_purchased, balance);
