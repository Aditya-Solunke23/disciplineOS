
CREATE TABLE public.health_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  water_glasses INTEGER NOT NULL DEFAULT 0,
  stretching_minutes INTEGER NOT NULL DEFAULT 0,
  exercise_minutes INTEGER NOT NULL DEFAULT 0,
  exercise_type TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, log_date)
);

ALTER TABLE public.health_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own health logs"
ON public.health_logs
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_health_logs_updated_at
BEFORE UPDATE ON public.health_logs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
