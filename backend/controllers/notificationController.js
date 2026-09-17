import { dbQuery, dbGet, dbRun } from '../config/db.js';

export const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;

    const notifications = await dbQuery(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );

    const unreadRow = await dbGet(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0',
      [userId]
    );

    res.json({
      success: true,
      notifications,
      unread_count: unreadRow ? unreadRow.count : 0
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch notifications.' });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const notificationId = req.params.id;

    await dbRun(
      'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
      [notificationId, userId]
    );

    const unreadRow = await dbGet(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0',
      [userId]
    );

    res.json({
      success: true,
      message: 'Notification marked as read.',
      unread_count: unreadRow ? unreadRow.count : 0
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating notification.' });
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    await dbRun(
      'UPDATE notifications SET is_read = 1 WHERE user_id = ?',
      [userId]
    );

    res.json({
      success: true,
      message: 'All notifications marked as read.',
      unread_count: 0
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating notifications.' });
  }
};

export const deleteNotification = async (req, res) => {
  try {
    const userId = req.user.id;
    const notificationId = req.params.id;

    await dbRun('DELETE FROM notifications WHERE id = ? AND user_id = ?', [notificationId, userId]);

    const unreadRow = await dbGet(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0',
      [userId]
    );

    res.json({
      success: true,
      message: 'Notification deleted.',
      unread_count: unreadRow ? unreadRow.count : 0
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting notification.' });
  }
};
