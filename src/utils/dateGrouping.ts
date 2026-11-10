import { Conversation } from '../types/index';

export interface ConversationGroup {
  id: string;
  label: string;
  conversations: Conversation[];
}

export function groupConversationsByDate(conversations: Conversation[]): ConversationGroup[] {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;
  const startOf7Days = startOfToday - 7 * 24 * 60 * 60 * 1000;
  const startOf30Days = startOfToday - 30 * 24 * 60 * 60 * 1000;

  const pinned: Conversation[] = [];
  const today: Conversation[] = [];
  const yesterday: Conversation[] = [];
  const previous7Days: Conversation[] = [];
  const previous30Days: Conversation[] = [];
  const older: Conversation[] = [];

  for (const conv of conversations) {
    if (conv.pinned) {
      pinned.push(conv);
      continue;
    }

    const convTime = new Date(conv.updatedAt || conv.createdAt).getTime();

    if (convTime >= startOfToday) {
      today.push(conv);
    } else if (convTime >= startOfYesterday) {
      yesterday.push(conv);
    } else if (convTime >= startOf7Days) {
      previous7Days.push(conv);
    } else if (convTime >= startOf30Days) {
      previous30Days.push(conv);
    } else {
      older.push(conv);
    }
  }

  const groups: ConversationGroup[] = [];

  if (pinned.length > 0) {
    groups.push({ id: 'pinned', label: 'Pinned', conversations: pinned });
  }
  if (today.length > 0) {
    groups.push({ id: 'today', label: 'Today', conversations: today });
  }
  if (yesterday.length > 0) {
    groups.push({ id: 'yesterday', label: 'Yesterday', conversations: yesterday });
  }
  if (previous7Days.length > 0) {
    groups.push({ id: 'previous-7', label: 'Previous 7 Days', conversations: previous7Days });
  }
  if (previous30Days.length > 0) {
    groups.push({ id: 'previous-30', label: 'Previous 30 Days', conversations: previous30Days });
  }
  if (older.length > 0) {
    groups.push({ id: 'older', label: 'Older', conversations: older });
  }

  return groups;
}
