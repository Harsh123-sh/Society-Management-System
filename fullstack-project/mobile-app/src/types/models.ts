export type AppRole = 'resident' | 'guard' | 'admin';

export type UserProfile = {
  id: number;
  name: string;
  email: string;
  role: AppRole;
  societyId?: number | null;
  flatId?: number | null;
  token: string;
};

export type PushNotificationCategory =
  | 'visitor_alert'
  | 'payment_reminder'
  | 'chat_message'
  | 'emergency_alert'
  | 'event_reminder'
  | 'ai_alert'
  | 'general';

export type AppNotification = {
  id: number;
  title: string;
  message: string;
  category: PushNotificationCategory;
  deepLink?: string | null;
  createdAt?: string;
  isRead?: boolean;
};

export type ChatThread = {
  id: number;
  title?: string | null;
  threadType?: 'direct' | 'group' | 'channel';
  lastMessage?: string | null;
  unreadCount?: number;
};

export type VisitorApproval = {
  id: number;
  visitorName: string;
  flatNumber: string;
  wing: string;
  status: string;
  expectedArrivalTime?: string | null;
};

export type PaymentItem = {
  id: number;
  title: string;
  amount: number;
  dueDate: string;
  status: 'paid' | 'unpaid' | 'overdue' | 'partially_paid';
};
