import db from "../config/database.js";

class Notification {
  // Create a new notification
  static create(notificationData) {
    const { 
      user_id, 
      title, 
      message, 
      type = 'general'
    } = notificationData;
    
    const query = `
      INSERT INTO notifications (user_id, title, message, type) 
      VALUES (?, ?, ?, ?)
    `;
    
    return new Promise((resolve, reject) => {
      db.query(
        query, 
        [user_id, title, message, type], 
        (err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        }
      );
    });
  }

  // Get all notifications for a user
  static getByUserId(userId, filters = {}) {
    let query = `
      SELECT * FROM notifications 
      WHERE user_id = ?
    `;
    const params = [userId];
    
    // Filter by read status if provided
    if (filters.is_read !== undefined) {
      query += " AND is_read = ?";
      params.push(filters.is_read);
    }
    
    // Filter by type if provided
    if (filters.type) {
      query += " AND type = ?";
      params.push(filters.type);
    }
    
    query += " ORDER BY created_at DESC";
    
    // Limit results if provided
    if (filters.limit) {
      query += " LIMIT ?";
      params.push(filters.limit);
    }
    
    return new Promise((resolve, reject) => {
      db.query(query, params, (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      });
    });
  }

  // Get notification by ID
  static findById(id) {
    const query = "SELECT * FROM notifications WHERE id = ?";
    
    return new Promise((resolve, reject) => {
      db.query(query, [id], (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results[0]);
        }
      });
    });
  }

  // Mark notification as read
  static markAsRead(id) {
    const query = "UPDATE notifications SET is_read = TRUE WHERE id = ?";
    
    return new Promise((resolve, reject) => {
      db.query(query, [id], (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  // Mark all notifications as read for a user
  static markAllAsRead(userId) {
    const query = "UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE";
    
    return new Promise((resolve, reject) => {
      db.query(query, [userId], (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  // Delete notification
  static delete(id) {
    const query = "DELETE FROM notifications WHERE id = ?";
    
    return new Promise((resolve, reject) => {
      db.query(query, [id], (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  // Delete all notifications for a user
  static deleteAllByUserId(userId) {
    const query = "DELETE FROM notifications WHERE user_id = ?";
    
    return new Promise((resolve, reject) => {
      db.query(query, [userId], (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  // Get unread count for a user
  static getUnreadCount(userId) {
    const query = "SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE";
    
    return new Promise((resolve, reject) => {
      db.query(query, [userId], (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results[0].count);
        }
      });
    });
  }

  // Get all notifications (for admin)
  static getAll(filters = {}) {
    let query = `
      SELECT n.*, u.full_name, u.email 
      FROM notifications n
      LEFT JOIN Users u ON n.user_id = u.id
    `;
    const params = [];
    const conditions = [];
    
    if (filters.type) {
      conditions.push("n.type = ?");
      params.push(filters.type);
    }
    
    if (filters.is_read !== undefined) {
      conditions.push("n.is_read = ?");
      params.push(filters.is_read);
    }
    
    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }
    
    query += " ORDER BY n.created_at DESC";
    
    if (filters.limit) {
      query += " LIMIT ?";
      params.push(filters.limit);
    }
    
    return new Promise((resolve, reject) => {
      db.query(query, params, (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      });
    });
  }

  // Create bulk notifications
  static createBulk(notifications) {
    const query = `
      INSERT INTO notifications (user_id, title, message, type) 
      VALUES ?
    `;
    
    const values = notifications.map(n => [
      n.user_id,
      n.title,
      n.message,
      n.type || 'general'
    ]);
    
    return new Promise((resolve, reject) => {
      db.query(query, [values], (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }
}

export default Notification;
