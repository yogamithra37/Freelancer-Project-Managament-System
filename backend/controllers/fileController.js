import path from 'path';
import fs from 'fs';
import { dbQuery, dbGet, dbRun } from '../config/db.js';

export const uploadFile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { project_id, client_id } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a file.' });
    }

    const fileName = req.file.filename;
    const originalName = req.file.originalname;
    const filePath = `/uploads/${fileName}`;
    const fileSize = req.file.size;
    const fileType = req.file.mimetype;

    const result = await dbRun(
      `INSERT INTO files (user_id, project_id, client_id, file_name, original_name, file_path, file_size, file_type)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, project_id || null, client_id || null, fileName, originalName, filePath, fileSize, fileType]
    );

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully!',
      file: {
        id: result.lastID,
        file_name: fileName,
        original_name: originalName,
        file_path: filePath,
        file_size: fileSize,
        file_type: fileType
      }
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ success: false, message: 'File upload failed.' });
  }
};

export const getFiles = async (req, res) => {
  try {
    const userId = req.user.id;
    const { search, project_id, file_type } = req.query;

    let sql = `
      SELECT f.*, p.name as project_name, c.company as client_company
      FROM files f
      LEFT JOIN projects p ON f.project_id = p.id
      LEFT JOIN clients c ON f.client_id = c.id
      WHERE f.user_id = ?
    `;
    const params = [userId];

    if (search) {
      sql += ` AND (f.original_name LIKE ? OR p.name LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term);
    }

    if (project_id) {
      sql += ` AND f.project_id = ?`;
      params.push(project_id);
    }

    if (file_type) {
      sql += ` AND f.file_type LIKE ?`;
      params.push(`%${file_type}%`);
    }

    sql += ` ORDER BY f.created_at DESC`;

    const files = await dbQuery(sql, params);
    res.json({ success: true, files });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch files.' });
  }
};

export const deleteFile = async (req, res) => {
  try {
    const userId = req.user.id;
    const fileId = req.params.id;

    const file = await dbGet('SELECT * FROM files WHERE id = ? AND user_id = ?', [fileId, userId]);
    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found.' });
    }

    // Unlink physical file
    const diskPath = path.resolve(process.cwd(), 'backend', 'uploads', file.file_name);
    if (fs.existsSync(diskPath)) {
      fs.unlinkSync(diskPath);
    }

    await dbRun('DELETE FROM files WHERE id = ? AND user_id = ?', [fileId, userId]);

    res.json({ success: true, message: 'File deleted successfully!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete file.' });
  }
};
