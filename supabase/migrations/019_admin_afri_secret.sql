-- Allow storing an encrypted AFRI API key in admin_settings
INSERT INTO admin_settings (key, value)
VALUES ('secret_afri_api_key', 'null'::jsonb)
ON CONFLICT (key) DO NOTHING;
