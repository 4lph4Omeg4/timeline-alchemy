-- Fix conversation_list view to use SECURITY INVOKER instead of SECURITY DEFINER
-- This addresses the security linter warning and improves security

-- Drop the existing view
DROP VIEW IF EXISTS conversation_list;

-- Recreate the view with SECURITY INVOKER
-- This makes the view execute with the permissions of the querying user (safer)
CREATE OR REPLACE VIEW conversation_list 
WITH (security_invoker = true)
AS
SELECT 
  c.id,
  c.user1_id,
  c.user2_id,
  c.created_at,
  c.updated_at,
  (
    SELECT content 
    FROM messages 
    WHERE conversation_id = c.id 
    ORDER BY created_at DESC 
    LIMIT 1
  ) AS last_message,
  (
    SELECT created_at 
    FROM messages 
    WHERE conversation_id = c.id 
    ORDER BY created_at DESC 
    LIMIT 1
  ) AS last_message_at,
  (
    SELECT COUNT(*) 
    FROM messages 
    WHERE conversation_id = c.id 
    AND read = FALSE 
    AND sender_id != COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid)
  ) AS unread_count
FROM conversations c;

-- Grant access to the view
GRANT SELECT ON conversation_list TO authenticated;

-- Update comment
COMMENT ON VIEW conversation_list IS 'Helper view for listing conversations with latest message preview and unread count (SECURITY INVOKER for improved security)';

