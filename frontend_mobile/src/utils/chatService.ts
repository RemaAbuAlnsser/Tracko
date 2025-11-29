import { supabase } from '../config/supabase';

// Direct TypeScript port of the web chatService, to be used from React Native.

export const loadChatMessages = async (userId: number, otherUserId: number) => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(
        `and(sender_id.eq.${userId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${userId})`,
      )
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading messages:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error loading messages:', error);
    return [];
  }
};

export const sendChatMessage = async (
  senderId: number,
  receiverId: number,
  messageText: string,
) => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .insert([
        {
          sender_id: senderId,
          receiver_id: receiverId,
          message: messageText,
          read: false,
        },
      ])
      .select();

    if (error) {
      console.error('Error sending message:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error sending message:', error);
    return { success: false, error };
  }
};

export const subscribeToMessages = (
  userId: number,
  onNewMessage: (msg: any) => void,
) => {
  const channel = supabase
    .channel('messages-channel')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${userId}`,
      },
      payload => {
        if (onNewMessage) {
          onNewMessage(payload.new);
        }
      },
    )
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `sender_id=eq.${userId}`,
      },
      payload => {
        if (onNewMessage) {
          onNewMessage(payload.new);
        }
      },
    )
    .subscribe();

  return channel;
};

export const unsubscribeFromMessages = (channel: any) => {
  if (channel) {
    channel.unsubscribe();
  }
};

export const markMessagesAsRead = async (
  senderId: number,
  receiverId: number,
) => {
  try {
    const { error } = await supabase
      .from('messages')
      .update({ read: true })
      .eq('sender_id', senderId)
      .eq('receiver_id', receiverId)
      .eq('read', false);

    if (error) {
      console.error('Error marking messages as read:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error marking messages as read:', error);
    return false;
  }
};

export const getUnreadCount = async (
  userId: number,
  fromUserId: number,
): Promise<number> => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('id', { count: 'exact' })
      .eq('receiver_id', userId)
      .eq('sender_id', fromUserId)
      .eq('read', false);

    if (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }

    return data?.length || 0;
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
};
