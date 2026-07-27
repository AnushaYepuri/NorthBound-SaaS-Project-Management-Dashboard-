import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  'https://ptaatcyxoczfykkxmoyk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0YWF0Y3l4b2N6Znlra3htb3lrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDc4MTE4OCwiZXhwIjoyMTAwMzU3MTg4fQ.rf_IoywQV1Q8A1EDHZUIigSlB8jsOQwhM6W6YOsGO-k'
)

const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
  '3ecf7fce-e1cc-49da-ad73-33dd3138ab59',
  { password: 'YourNewPassword123' }
)

console.log('Result:', data, error)