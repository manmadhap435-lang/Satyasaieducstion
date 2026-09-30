CREATE TABLE public.admission_enquiries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_name TEXT NOT NULL,
  location TEXT NOT NULL,
  phone TEXT NOT NULL,
  class_of_admission TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT INSERT ON public.admission_enquiries TO anon;
GRANT ALL ON public.admission_enquiries TO service_role;

ALTER TABLE public.admission_enquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit an enquiry" ON public.admission_enquiries
  FOR INSERT TO anon
  WITH CHECK (true);