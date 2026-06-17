-- ==========================================
-- AURA SYSTEM SEED ACTIONS: STATE ASSUMPTIONS
-- Realistic values for all 50 U.S. States
-- ==========================================

INSERT INTO public.state_assumptions (state_code, state_name, effective_tax_rate, property_tax_rate, cost_of_living_index, appreciation_rate, retirement_factor) VALUES
('AL', 'Alabama', 0.0350, 0.0041, 0.88, 0.0320, 0.85) ON CONFLICT (state_code) DO NOTHING;
INSERT INTO public.state_assumptions (state_code, state_name, effective_tax_rate, property_tax_rate, cost_of_living_index, appreciation_rate, retirement_factor) VALUES
('AK', 'Alaska', 0.0000, 0.0117, 1.25, 0.0300, 1.10) ON CONFLICT (state_code) DO NOTHING;
INSERT INTO public.state_assumptions (state_code, state_name, effective_tax_rate, property_tax_rate, cost_of_living_index, appreciation_rate, retirement_factor) VALUES
('AZ', 'Arizona', 0.0250, 0.0062, 1.02, 0.0480, 1.00) ON CONFLICT (state_code) DO NOTHING;
INSERT INTO public.state_assumptions (state_code, state_name, effective_tax_rate, property_tax_rate, cost_of_living_index, appreciation_rate, retirement_factor) VALUES
('AR', 'Arkansas', 0.0400, 0.0061, 0.87, 0.0290, 0.82) ON CONFLICT (state_code) DO NOTHING;
INSERT INTO public.state_assumptions (state_code, state_name, effective_tax_rate, property_tax_rate, cost_of_living_index, appreciation_rate, retirement_factor) VALUES
('CA', 'California', 0.0930, 0.0076, 1.38, 0.0550, 1.30) ON CONFLICT (state_code) DO NOTHING;
INSERT INTO public.state_assumptions (state_code, state_name, effective_tax_rate, property_tax_rate, cost_of_living_index, appreciation_rate, retirement_factor) VALUES
('CO', 'Colorado', 0.0440, 0.0051, 1.05, 0.0520, 1.12) ON CONFLICT (state_code) DO NOTHING;
INSERT INTO public.state_assumptions (state_code, state_name, effective_tax_rate, property_tax_rate, cost_of_living_index, appreciation_rate, retirement_factor) VALUES
('CT', 'Connecticut', 0.0550, 0.0215, 1.16, 0.0350, 1.15) ON CONFLICT (state_code) DO NOTHING;
INSERT INTO public.state_assumptions (state_code, state_name, effective_tax_rate, property_tax_rate, cost_of_living_index, appreciation_rate, retirement_factor) VALUES
('DE', 'Delaware', 0.0450, 0.0057, 1.01, 0.0340, 0.95) ON CONFLICT (state_code) DO NOTHING;
INSERT INTO public.state_assumptions (state_code, state_name, effective_tax_rate, property_tax_rate, cost_of_living_index, appreciation_rate, retirement_factor) VALUES
('FL', 'Florida', 0.0000, 0.0089, 1.03, 0.0500, 0.98) ON CONFLICT (state_code) DO NOTHING;
INSERT INTO public.state_assumptions (state_code, state_name, effective_tax_rate, property_tax_rate, cost_of_living_index, appreciation_rate, retirement_factor) VALUES
('GA', 'Georgia', 0.0500, 0.0087, 0.93, 0.0420, 0.90) ON CONFLICT (state_code) DO NOTHING;
INSERT INTO public.state_assumptions (state_code, state_name, effective_tax_rate, property_tax_rate, cost_of_living_index, appreciation_rate, retirement_factor) VALUES
('HI', 'Hawaii', 0.0750, 0.0028, 1.76, 0.0580, 1.65) ON CONFLICT (state_code) DO NOTHING;
INSERT INTO public.state_assumptions (state_code, state_name, effective_tax_rate, property_tax_rate, cost_of_living_index, appreciation_rate, retirement_factor) VALUES
('ID', 'Idaho', 0.0580, 0.0063, 0.97, 0.0560, 0.92) ON CONFLICT (state_code) DO NOTHING;
INSERT INTO public.state_assumptions (state_code, state_name, effective_tax_rate, property_tax_rate, cost_of_living_index, appreciation_rate, retirement_factor) VALUES
('IL', 'Illinois', 0.0495, 0.0223, 0.96, 0.0310, 1.05) ON CONFLICT (state_code) DO NOTHING;
INSERT INTO public.state_assumptions (state_code, state_name, effective_tax_rate, property_tax_rate, cost_of_living_index, appreciation_rate, retirement_factor) VALUES
('IN', 'Indiana', 0.0323, 0.0081, 0.90, 0.0330, 0.88) ON CONFLICT (state_code) DO NOTHING;
INSERT INTO public.state_assumptions (state_code, state_name, effective_tax_rate, property_tax_rate, cost_of_living_index, appreciation_rate, retirement_factor) VALUES
('IA', 'Iowa', 0.0550, 0.0152, 0.89, 0.0300, 0.86) ON CONFLICT (state_code) DO NOTHING;
INSERT INTO public.state_assumptions (state_code, state_name, effective_tax_rate, property_tax_rate, cost_of_living_index, appreciation_rate, retirement_factor) VALUES
('KS', 'Kansas', 0.0520, 0.0140, 0.88, 0.0320, 0.85) ON CONFLICT (state_code) DO NOTHING;
INSERT INTO public.state_assumptions (state_code, state_name, effective_tax_rate, property_tax_rate, cost_of_living_index, appreciation_rate, retirement_factor) VALUES
('KY', 'Kentucky', 0.0450, 0.0086, 0.89, 0.0310, 0.84) ON CONFLICT (state_code) DO NOTHING;
INSERT INTO public.state_assumptions (state_code, state_name, effective_tax_rate, property_tax_rate, cost_of_living_index, appreciation_rate, retirement_factor) VALUES
('LA', 'Louisiana', 0.0420, 0.0055, 0.91, 0.0270, 0.83) ON CONFLICT (state_code) DO NOTHING;
INSERT INTO public.state_assumptions (state_code, state_name, effective_tax_rate, property_tax_rate, cost_of_living_index, appreciation_rate, retirement_factor) VALUES
('ME', 'Maine', 0.0650, 0.0130, 1.11, 0.0380, 1.02) ON CONFLICT (state_code) DO NOTHING;
INSERT INTO public.state_assumptions (state_code, state_name, effective_tax_rate, property_tax_rate, cost_of_living_index, appreciation_rate, retirement_factor) VALUES
('MD', 'Maryland', 0.0475, 0.0109, 1.14, 0.0410, 1.15) ON CONFLICT (state_code) DO NOTHING;
INSERT INTO public.state_assumptions (state_code, state_name, effective_tax_rate, property_tax_rate, cost_of_living_index, appreciation_rate, retirement_factor) VALUES
('MA', 'Massachusetts', 0.0500, 0.0120, 1.34, 0.0490, 1.25) ON CONFLICT (state_code) DO NOTHING;
INSERT INTO public.state_assumptions (state_code, state_name, effective_tax_rate, property_tax_rate, cost_of_living_index, appreciation_rate, retirement_factor) VALUES
('MI', 'Michigan', 0.0425, 0.0148, 0.92, 0.0350, 0.91) ON CONFLICT (state_code) DO NOTHING;
INSERT INTO public.state_assumptions (state_code, state_name, effective_tax_rate, property_tax_rate, cost_of_living_index, appreciation_rate, retirement_factor) VALUES
('MN', 'Minnesota', 0.0705, 0.0111, 1.00, 0.0390, 1.03) ON CONFLICT (state_code) DO NOTHING;
INSERT INTO public.state_assumptions (state_code, state_name, effective_tax_rate, property_tax_rate, cost_of_living_index, appreciation_rate, retirement_factor) VALUES
('MS', 'Mississippi', 0.0400, 0.0080, 0.85, 0.0260, 0.78) ON CONFLICT (state_code) DO NOTHING;
INSERT INTO public.state_assumptions (state_code, state_name, effective_tax_rate, property_tax_rate, cost_of_living_index, appreciation_rate, retirement_factor) VALUES
('MO', 'Missouri', 0.0420, 0.0097, 0.89, 0.0320, 0.86) ON CONFLICT (state_code) DO NOTHING;
INSERT INTO public.state_assumptions (state_code, state_name, effective_tax_rate, property_tax_rate, cost_of_living_index, appreciation_rate, retirement_factor) VALUES
('MT', 'Montana', 0.0550, 0.0083, 0.99, 0.0450, 0.98) ON CONFLICT (state_code) DO NOTHING;
INSERT INTO public.state_assumptions (state_code, state_name, effective_tax_rate, property_tax_rate, cost_of_living_index, appreciation_rate, retirement_factor) VALUES
('NE', 'Nebraska', 0.0520, 0.0161, 0.90, 0.0340, 0.89) ON CONFLICT (state_code) DO NOTHING;
INSERT INTO public.state_assumptions (state_code, state_name, effective_tax_rate, property_tax_rate, cost_of_living_index, appreciation_rate, retirement_factor) VALUES
('NV', 'Nevada', 0.0000, 0.0055, 1.04, 0.0490, 1.01) ON CONFLICT (state_code) DO NOTHING;
INSERT INTO public.state_assumptions (state_code, state_name, effective_tax_rate, property_tax_rate, cost_of_living_index, appreciation_rate, retirement_factor) VALUES
('NH', 'New Hampshire', 0.0000, 0.0186, 1.12, 0.0400, 1.06) ON CONFLICT (state_code) DO NOTHING;
INSERT INTO public.state_assumptions (state_code, state_name, effective_tax_rate, property_tax_rate, cost_of_living_index, appreciation_rate, retirement_factor) VALUES
('NJ', 'New Jersey', 0.0637, 0.0242, 1.15, 0.0420, 1.20) ON CONFLICT (state_code) DO NOTHING;
INSERT INTO public.state_assumptions (state_code, state_name, effective_tax_rate, property_tax_rate, cost_of_living_index, appreciation_rate, retirement_factor) VALUES
('NM', 'New Mexico', 0.0490, 0.0078, 0.91, 0.0310, 0.88) ON CONFLICT (state_code) DO NOTHING;
INSERT INTO public.state_assumptions (state_code, state_name, effective_tax_rate, property_tax_rate, cost_of_living_index, appreciation_rate, retirement_factor) VALUES
('NY', 'New York', 0.0650, 0.0172, 1.28, 0.0480, 1.22) ON CONFLICT (state_code) DO NOTHING;
INSERT INTO public.state_assumptions (state_code, state_name, effective_tax_rate, property_tax_rate, cost_of_living_index, appreciation_rate, retirement_factor) VALUES
('NC', 'North Carolina', 0.0450, 0.0077, 0.95, 0.0400, 0.91) ON CONFLICT (state_code) DO NOTHING;
INSERT INTO public.state_assumptions (state_code, state_name, effective_tax_rate, property_tax_rate, cost_of_living_index, appreciation_rate, retirement_factor) VALUES
('ND', 'North Dakota', 0.0210, 0.0098, 0.89, 0.0290, 0.86) ON CONFLICT (state_code) DO NOTHING;
INSERT INTO public.state_assumptions (state_code, state_name, effective_tax_rate, property_tax_rate, cost_of_living_index, appreciation_rate, retirement_factor) VALUES
('OH', 'Ohio', 0.0300, 0.0153, 0.91, 0.0310, 0.89) ON CONFLICT (state_code) DO NOTHING;
INSERT INTO public.state_assumptions (state_code, state_name, effective_tax_rate, property_tax_rate, cost_of_living_index, appreciation_rate, retirement_factor) VALUES
('OK', 'Oklahoma', 0.0450, 0.0090, 0.86, 0.0300, 0.81) ON CONFLICT (state_code) DO NOTHING;
INSERT INTO public.state_assumptions (state_code, state_name, effective_tax_rate, property_tax_rate, cost_of_living_index, appreciation_rate, retirement_factor) VALUES
('OR', 'Oregon', 0.0875, 0.0091, 1.13, 0.0460, 1.10) ON CONFLICT (state_code) DO NOTHING;
INSERT INTO public.state_assumptions (state_code, state_name, effective_tax_rate, property_tax_rate, cost_of_living_index, appreciation_rate, retirement_factor) VALUES
('PA', 'Pennsylvania', 0.0307, 0.0150, 0.98, 0.0330, 0.96) ON CONFLICT (state_code) DO NOTHING;
INSERT INTO public.state_assumptions (state_code, state_name, effective_tax_rate, property_tax_rate, cost_of_living_index, appreciation_rate, retirement_factor) VALUES
('RI', 'Rhode Island', 0.0475, 0.0153, 1.11, 0.0360, 1.05) ON CONFLICT (state_code) DO NOTHING;
INSERT INTO public.state_assumptions (state_code, state_name, effective_tax_rate, property_tax_rate, cost_of_living_index, appreciation_rate, retirement_factor) VALUES
('SC', 'South Carolina', 0.0500, 0.0055, 0.93, 0.0380, 0.89) ON CONFLICT (state_code) DO NOTHING;
INSERT INTO public.state_assumptions (state_code, state_name, effective_tax_rate, property_tax_rate, cost_of_living_index, appreciation_rate, retirement_factor) VALUES
('SD', 'South Dakota', 0.0000, 0.0124, 0.91, 0.0370, 0.88) ON CONFLICT (state_code) DO NOTHING;
INSERT INTO public.state_assumptions (state_code, state_name, effective_tax_rate, property_tax_rate, cost_of_living_index, appreciation_rate, retirement_factor) VALUES
('TN', 'Tennessee', 0.0000, 0.0064, 0.90, 0.0410, 0.86) ON CONFLICT (state_code) DO NOTHING;
INSERT INTO public.state_assumptions (state_code, state_name, effective_tax_rate, property_tax_rate, cost_of_living_index, appreciation_rate, retirement_factor) VALUES
('TX', 'Texas', 0.0000, 0.0174, 0.94, 0.0450, 0.90) ON CONFLICT (state_code) DO NOTHING;
INSERT INTO public.state_assumptions (state_code, state_name, effective_tax_rate, property_tax_rate, cost_of_living_index, appreciation_rate, retirement_factor) VALUES
('UT', 'Utah', 0.0485, 0.0058, 1.01, 0.0540, 0.99) ON CONFLICT (state_code) DO NOTHING;
INSERT INTO public.state_assumptions (state_code, state_name, effective_tax_rate, property_tax_rate, cost_of_living_index, appreciation_rate, retirement_factor) VALUES
('VT', 'Vermont', 0.0500, 0.0186, 1.14, 0.0350, 1.04) ON CONFLICT (state_code) DO NOTHING;
INSERT INTO public.state_assumptions (state_code, state_name, effective_tax_rate, property_tax_rate, cost_of_living_index, appreciation_rate, retirement_factor) VALUES
('VA', 'Virginia', 0.0575, 0.0082, 1.03, 0.0390, 1.02) ON CONFLICT (state_code) DO NOTHING;
INSERT INTO public.state_assumptions (state_code, state_name, effective_tax_rate, property_tax_rate, cost_of_living_index, appreciation_rate, retirement_factor) VALUES
('WA', 'Washington', 0.0000, 0.0094, 1.15, 0.0510, 1.14) ON CONFLICT (state_code) DO NOTHING;
INSERT INTO public.state_assumptions (state_code, state_name, effective_tax_rate, property_tax_rate, cost_of_living_index, appreciation_rate, retirement_factor) VALUES
('WV', 'West Virginia', 0.0450, 0.0057, 0.86, 0.0250, 0.79) ON CONFLICT (state_code) DO NOTHING;
INSERT INTO public.state_assumptions (state_code, state_name, effective_tax_rate, property_tax_rate, cost_of_living_index, appreciation_rate, retirement_factor) VALUES
('WI', 'Wisconsin', 0.0500, 0.0168, 0.94, 0.0320, 0.93) ON CONFLICT (state_code) DO NOTHING;
INSERT INTO public.state_assumptions (state_code, state_name, effective_tax_rate, property_tax_rate, cost_of_living_index, appreciation_rate, retirement_factor) VALUES
('WY', 'Wyoming', 0.0000, 0.0056, 0.92, 0.0360, 0.88) ON CONFLICT (state_code) DO NOTHING;
