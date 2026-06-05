import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

export async function logSecurityEvent(
  supabaseUrl: string,
  serviceRoleKey: string,
  eventType: string,
  description: string,
  severity: 'info' | 'warning' | 'critical' = 'warning',
  metadata: any = {}
) {
  const supabase = createClient(supabaseUrl, serviceRoleKey)
  
  try {
    const { error } = await supabase
      .from('security_audit_logs')
      .insert({
        event_type: eventType,
        description: description,
        severity: severity,
        metadata: metadata
      })
    
    if (error) {
      console.error('Failed to log security event to database:', error)
    }
  } catch (err) {
    console.error('Critical failure logging security event:', err)
  }
}
