-- Fee Collections table
CREATE TABLE public.fee_collections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_name TEXT NOT NULL,
  class TEXT NOT NULL,
  email TEXT NOT NULL,
  fee_amount NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.fee_collections ENABLE ROW LEVEL SECURITY;

GRANT ALL ON public.fee_collections TO service_role;
GRANT INSERT, SELECT ON public.fee_collections TO anon;

CREATE POLICY "Allow all operations on fee_collections" ON public.fee_collections
  FOR ALL TO anon
  USING (true)
  WITH CHECK (true);

-- Expenses table
CREATE TABLE public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reason TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

GRANT ALL ON public.expenses TO service_role;
GRANT INSERT, SELECT ON public.expenses TO anon;

CREATE POLICY "Allow all operations on expenses" ON public.expenses
  FOR ALL TO anon
  USING (true)
  WITH CHECK (true);
