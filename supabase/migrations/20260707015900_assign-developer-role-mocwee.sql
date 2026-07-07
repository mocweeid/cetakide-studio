-- ============================================================
-- Assign 'developer' role to mocwee2021@gmail.com
-- ============================================================

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Cari user_id berdasarkan email
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'mocwee2021@gmail.com'
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User dengan email mocwee2021@gmail.com tidak ditemukan di auth.users';
  END IF;

  -- Cek apakah role sudah ada untuk user tersebut sebelum insert
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = v_user_id AND role::text = 'developer'
  ) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_user_id, 'developer');
    RAISE NOTICE 'Role developer berhasil diberikan ke user_id: %', v_user_id;
  ELSE
    RAISE NOTICE 'User sudah memiliki role developer';
  END IF;
END;
$$;
