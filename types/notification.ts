// Notification-domain shared types (Sprint 7A).

/** A single in-app notification row as read by the current user (RLS-scoped). */
export type NotificationItem = {
  id: string;
  type: string;
  title: string;
  message: string;
  reference_type: string | null;
  reference_id: string | null;
  action_url: string | null;
  is_read: boolean;
  created_at: string | null;
  read_at: string | null;
};
