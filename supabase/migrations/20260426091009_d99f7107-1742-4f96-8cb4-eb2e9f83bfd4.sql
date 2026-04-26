-- Roles enum and table
CREATE TYPE public.app_role AS ENUM ('admin', 'farmer');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  aadhaar_last4 TEXT,
  village TEXT,
  district TEXT,
  state TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Security definer to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Schemes catalog
CREATE TABLE public.schemes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  required_documents TEXT[] NOT NULL DEFAULT '{}',
  max_amount NUMERIC,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Applications
CREATE TYPE public.application_status AS ENUM (
  'submitted', 'docs_incomplete', 'fraud_flagged', 'under_review', 'field_verified', 'approved', 'rejected'
);

CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scheme_id UUID NOT NULL REFERENCES public.schemes(id),
  land_id TEXT NOT NULL,
  crop TEXT NOT NULL,
  area_acres NUMERIC NOT NULL,
  season TEXT,
  submitted_documents TEXT[] NOT NULL DEFAULT '{}',
  status application_status NOT NULL DEFAULT 'submitted',
  priority_score INT NOT NULL DEFAULT 0,
  ai_completeness JSONB,
  ai_fraud JSONB,
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_applications_farmer ON public.applications(farmer_id);
CREATE INDEX idx_applications_status ON public.applications(status);
CREATE INDEX idx_applications_land ON public.applications(land_id);

-- Grievances
CREATE TYPE public.grievance_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');
CREATE TYPE public.grievance_priority AS ENUM ('low', 'medium', 'high');

CREATE TABLE public.grievances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  ai_category TEXT,
  priority grievance_priority NOT NULL DEFAULT 'medium',
  status grievance_status NOT NULL DEFAULT 'open',
  admin_response TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_grievances_farmer ON public.grievances(farmer_id);
CREATE INDEX idx_grievances_status ON public.grievances(status);

-- Trigger to auto-create profile + farmer role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', '')
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'farmer');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_applications_updated BEFORE UPDATE ON public.applications
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_grievances_updated BEFORE UPDATE ON public.grievances
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schemes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grievances ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

-- user_roles policies (read only; managed via SQL/admin)
CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Schemes: anyone authenticated reads
CREATE POLICY "Authenticated read schemes" ON public.schemes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage schemes" ON public.schemes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Applications policies
CREATE POLICY "Farmers view own applications" ON public.applications FOR SELECT TO authenticated
  USING (auth.uid() = farmer_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Farmers insert own applications" ON public.applications FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = farmer_id);
CREATE POLICY "Admins update applications" ON public.applications FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Grievances policies
CREATE POLICY "Farmers view own grievances" ON public.grievances FOR SELECT TO authenticated
  USING (auth.uid() = farmer_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Farmers insert own grievances" ON public.grievances FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = farmer_id);
CREATE POLICY "Admins update grievances" ON public.grievances FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));