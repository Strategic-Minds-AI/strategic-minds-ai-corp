-- Chat storage needed by the independent runtime. Existing conversations are preserved.
BEGIN;
CREATE OR REPLACE FUNCTION public.admin_chat_set_updated()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_date = now();
  RETURN NEW;
END;
$$;
DO $$
DECLARE chat_table text;
DECLARE owner_rule text := 'owner_id = auth.uid()::text AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = ''admin'')';
BEGIN
  FOREACH chat_table IN ARRAY ARRAY['admin_conversations', 'admin_chat_turns'] LOOP
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS created_by text DEFAULT (auth.jwt()->>''email'')', chat_table);
    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN created_by_id SET DEFAULT auth.uid()', chat_table);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', chat_table);
    EXECUTE format('DROP POLICY IF EXISTS runtime_read ON public.%I', chat_table);
    EXECUTE format('CREATE POLICY runtime_read ON public.%I FOR SELECT TO authenticated USING (%s)', chat_table, owner_rule);
    EXECUTE format('DROP POLICY IF EXISTS runtime_create ON public.%I', chat_table);
    EXECUTE format('CREATE POLICY runtime_create ON public.%I FOR INSERT TO authenticated WITH CHECK (%s AND created_by_id = auth.uid())', chat_table, owner_rule);
    EXECUTE format('DROP POLICY IF EXISTS runtime_update ON public.%I', chat_table);
    EXECUTE format('CREATE POLICY runtime_update ON public.%I FOR UPDATE TO authenticated USING (%s) WITH CHECK (%s AND created_by_id = auth.uid())', chat_table, owner_rule, owner_rule);
    EXECUTE format('DROP POLICY IF EXISTS runtime_delete ON public.%I', chat_table);
    EXECUTE format('CREATE POLICY runtime_delete ON public.%I FOR DELETE TO authenticated USING (%s)', chat_table, owner_rule);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', chat_table);
    EXECUTE format('DROP TRIGGER IF EXISTS admin_chat_updated ON public.%I', chat_table);
    EXECUTE format('CREATE TRIGGER admin_chat_updated BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.admin_chat_set_updated()', chat_table);
  END LOOP;
END;
$$;
CREATE INDEX IF NOT EXISTS admin_conversations_owner_chat ON public.admin_conversations(owner_id, chat_key);
CREATE INDEX IF NOT EXISTS admin_chat_turns_owner_chat_turn ON public.admin_chat_turns(owner_id, chat_key, turn_key);
COMMIT;