
-- 1. Make new signups admins (demo mode)
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
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Officer'),
    COALESCE(NEW.raw_user_meta_data->>'phone', '')
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  RETURN NEW;
END;
$$;

-- 2. Drop FKs to auth.users so we can seed synthetic farmers
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE public.applications DROP CONSTRAINT IF EXISTS applications_farmer_id_fkey;
ALTER TABLE public.grievances DROP CONSTRAINT IF EXISTS grievances_farmer_id_fkey;

-- 3. Admins can insert/delete everything (for seeding via UI + management)
CREATE POLICY "Admins insert applications" ON public.applications FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete applications" ON public.applications FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins insert grievances" ON public.grievances FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete grievances" ON public.grievances FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage profiles" ON public.profiles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 4. Seed schemes
INSERT INTO public.schemes (code, name, category, description, required_documents, max_amount) VALUES
('PM-KISAN','PM-KISAN Samman Nidhi','Income Support','Direct income support of ₹6000/year to small farmers',ARRAY['aadhaar','land_record','bank_passbook'],6000),
('PMFBY','Pradhan Mantri Fasal Bima Yojana','Crop Insurance','Comprehensive crop insurance against natural calamities',ARRAY['aadhaar','land_record','sowing_certificate','bank_passbook'],50000),
('KCC','Kisan Credit Card','Credit','Short-term credit for crop production at subsidized rates',ARRAY['aadhaar','land_record','bank_passbook','income_certificate'],300000),
('SMAM','Sub-Mission on Agricultural Mechanization','Equipment','Subsidy for purchase of agricultural machinery',ARRAY['aadhaar','land_record','quotation','bank_passbook'],125000),
('PMKSY','PM Krishi Sinchayee Yojana','Irrigation','Micro-irrigation subsidy for drip and sprinkler systems',ARRAY['aadhaar','land_record','water_source_proof','bank_passbook'],85000),
('SHC','Soil Health Card','Inputs','Soil testing and nutrient recommendations',ARRAY['aadhaar','land_record'],0)
ON CONFLICT (code) DO NOTHING;

-- 5. Seed 60 farmer profiles + 120 applications + 60 grievances
DO $$
DECLARE
  i INT;
  v_farmer UUID;
  v_scheme RECORD;
  v_crop TEXT;
  v_area NUMERIC;
  v_status public.application_status;
  v_priority INT;
  v_fraud_risk INT;
  v_complete INT;
  v_land TEXT;
  v_districts TEXT[] := ARRAY['Pune','Nashik','Nagpur','Aurangabad','Solapur','Kolhapur','Satara','Sangli','Latur','Beed'];
  v_villages TEXT[] := ARRAY['Wadgaon','Shirur','Indapur','Junnar','Khed','Maval','Baramati','Daund','Mulshi','Velhe'];
  v_first TEXT[] := ARRAY['Ramesh','Suman','Anil','Priya','Vikas','Sunita','Mahesh','Kavita','Rajesh','Geeta','Sanjay','Lata','Prakash','Asha','Dilip'];
  v_last TEXT[] := ARRAY['Patil','Kulkarni','Deshmukh','Pawar','Jadhav','Shinde','More','Gaikwad','Bhosale','Salunkhe'];
  v_crops TEXT[] := ARRAY['Wheat','Rice','Cotton','Sugarcane','Soybean','Maize','Onion','Tomato','Bajra','Tur'];
  v_grievance_subjects TEXT[] := ARRAY[
    'Subsidy payment delayed for 3 months',
    'Crop insurance claim not received after damage',
    'Borewell pump not working in irrigation scheme',
    'Wrong land record showing in 7/12 extract',
    'Seeds supplied are of poor quality',
    'Tractor subsidy application pending for months',
    'No water supply to fields urgent emergency',
    'Fertilizer not received from cooperative',
    'PM-KISAN installment missing this quarter',
    'Officer not responding to repeated calls'
  ];
  v_grievance_descs TEXT[] := ARRAY[
    'My PM-KISAN payment has been delayed for the past three months. I have submitted all documents but no response.',
    'Heavy rainfall destroyed my cotton crop in October. Filed insurance claim under PMFBY but no compensation received yet.',
    'The drip irrigation pump installed under PMKSY has been broken for weeks. Crops are dying due to no water.',
    'My 7/12 extract shows wrong area. Survey number boundary is incorrect causing issues with subsidy claim.',
    'The hybrid seeds supplied through the scheme have very low germination rate. Suspecting fake or expired stock.',
    'Tractor subsidy under SMAM has been pending approval for over 6 months despite all documents submitted.',
    'Canal water supply has stopped completely. Standing crop will be destroyed in days. Urgent intervention needed.',
    'Urea and DAP fertilizers were not delivered by the cooperative society for this kharif season.',
    'PM-KISAN installment for this quarter has not been credited to my bank account. Others have received.',
    'Local agriculture officer is not responding to my repeated calls about pending application status.'
  ];
BEGIN
  -- Profiles
  FOR i IN 1..60 LOOP
    v_farmer := gen_random_uuid();
    INSERT INTO public.profiles (id, full_name, phone, aadhaar_last4, village, district, state)
    VALUES (
      v_farmer,
      v_first[1+(i % array_length(v_first,1))] || ' ' || v_last[1+(i % array_length(v_last,1))],
      '+91' || (9000000000 + i)::TEXT,
      lpad((1000 + i)::TEXT, 4, '0'),
      v_villages[1+(i % array_length(v_villages,1))],
      v_districts[1+(i % array_length(v_districts,1))],
      'Maharashtra'
    );
  END LOOP;

  -- Applications (120) — pick from seeded farmers
  FOR i IN 1..120 LOOP
    SELECT id INTO v_farmer FROM public.profiles ORDER BY random() LIMIT 1;
    SELECT * INTO v_scheme FROM public.schemes ORDER BY random() LIMIT 1;
    v_crop := v_crops[1+(i % array_length(v_crops,1))];
    v_area := round((0.5 + random() * 12)::numeric, 1);
    v_land := 'LAND-' || lpad((100 + (i % 90))::TEXT, 5, '0'); -- forces some duplicates
    v_complete := CASE WHEN random() < 0.75 THEN 100 ELSE (40 + floor(random()*40))::INT END;
    v_fraud_risk := CASE WHEN random() < 0.15 THEN (50 + floor(random()*45))::INT ELSE floor(random()*30)::INT END;
    v_priority := GREATEST(0, LEAST(100, (CASE WHEN v_area<=2 THEN 30 WHEN v_area<=5 THEN 15 ELSE 0 END) + v_complete/2 - v_fraud_risk/3));
    v_status := CASE
      WHEN v_fraud_risk >= 50 THEN 'fraud_flagged'::public.application_status
      WHEN v_complete < 100 THEN 'docs_incomplete'::public.application_status
      WHEN random() < 0.35 THEN 'approved'::public.application_status
      WHEN random() < 0.15 THEN 'rejected'::public.application_status
      WHEN random() < 0.40 THEN 'under_review'::public.application_status
      WHEN random() < 0.50 THEN 'field_verified'::public.application_status
      ELSE 'submitted'::public.application_status
    END;

    INSERT INTO public.applications (
      farmer_id, scheme_id, land_id, crop, area_acres, season,
      submitted_documents, status, priority_score,
      ai_completeness, ai_fraud, created_at
    ) VALUES (
      v_farmer, v_scheme.id, v_land, v_crop, v_area,
      CASE WHEN random()<0.5 THEN 'Kharif' ELSE 'Rabi' END,
      CASE WHEN v_complete=100 THEN v_scheme.required_documents
           ELSE v_scheme.required_documents[1:GREATEST(1,array_length(v_scheme.required_documents,1)-1)] END,
      v_status, v_priority,
      jsonb_build_object('complete', v_complete=100, 'score', v_complete,
        'missing', CASE WHEN v_complete=100 THEN '[]'::jsonb
                        ELSE to_jsonb(ARRAY[v_scheme.required_documents[array_length(v_scheme.required_documents,1)]]) END),
      jsonb_build_object('flagged', v_fraud_risk>=50, 'riskScore', v_fraud_risk,
        'reasons', CASE WHEN v_fraud_risk>=50
                   THEN to_jsonb(ARRAY['Same land already claimed by another farmer for this scheme'])
                   ELSE '[]'::jsonb END),
      now() - (random()*60 || ' days')::interval
    );
  END LOOP;

  -- Grievances (60)
  FOR i IN 1..60 LOOP
    SELECT id INTO v_farmer FROM public.profiles ORDER BY random() LIMIT 1;
    INSERT INTO public.grievances (farmer_id, subject, description, ai_category, priority, status, created_at)
    VALUES (
      v_farmer,
      v_grievance_subjects[1+(i % 10)],
      v_grievance_descs[1+(i % 10)],
      (ARRAY['Subsidy / Payment','Crop Insurance','Irrigation / Water','Land Records','Seeds / Inputs','Equipment / Machinery','Officer Conduct'])[1+(i % 7)],
      (ARRAY['low','medium','high','medium','high'])[1+(i % 5)]::public.grievance_priority,
      (ARRAY['open','open','in_progress','resolved','open'])[1+(i % 5)]::public.grievance_status,
      now() - (random()*45 || ' days')::interval
    );
  END LOOP;
END $$;
