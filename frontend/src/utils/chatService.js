import { supabase } from '../config/supabase';

/**
 * Load all students for a specific trainer
 */
export const loadTrainerStudents = async (trainerId) => {
  try {
    const response = await fetch(`http://localhost:5050/api/trainers/${trainerId}/students`);
    const data = await response.json();
    if (data.success) {
      return data.students || [];
    }
    return [];
  } catch (error) {
    console.error('Error loading students:', error);
    return [];
  }
};

/**
 * Load all messages between trainer and student
 */
export const loadChatMessages = async (trainerId, studentId) => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${trainerId},receiver_id.eq.${studentId}),and(sender_id.eq.${studentId},receiver_id.eq.${trainerId})`)
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

/**
 * Send a new message
 */
export const sendChatMessage = async (senderId, receiverId, messageText) => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .insert([{
        sender_id: senderId,
        receiver_id: receiverId,
        message: messageText,
        read: false
      }])
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

/**
 * Subscribe to real-time messages
 */
export const subscribeToMessages = (userId, onNewMessage) => {
  const channel = supabase
    .channel('messages-channel')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${userId}`
      },
      (payload) => {
        if (onNewMessage) {
          onNewMessage(payload.new);
        }
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `sender_id=eq.${userId}`
      },
      (payload) => {
        if (onNewMessage) {
          onNewMessage(payload.new);
        }
      }
    )
    .subscribe();

  return channel;
};

/**
 * Unsubscribe from messages channel
 */
export const unsubscribeFromMessages = (channel) => {
  if (channel) {
    channel.unsubscribe();
  }
};

/**
 * Mark messages as read
 */
export const markMessagesAsRead = async (senderId, receiverId) => {
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

/**
 * Get unread messages count
 */
export const getUnreadCount = async (userId, fromUserId) => {
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
