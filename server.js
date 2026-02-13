const express = require('express');
const pool = require('./db');
const path = require('path');

const app = express();

// Middleware
app.use(express.json());
app.use(express.static('public'));

// ======================
// TASK ENDPOINTS
// ======================

// Get all tasks
app.get('/tasks', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM tasks ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching tasks:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Create new task
app.post('/tasks', async (req, res) => {
  try {
    const { task } = req.body;
    
    if (!task || task.trim() === '') {
      return res.status(400).json({ error: 'Task description is required' });
    }
    
    const [result] = await pool.query(
      'INSERT INTO tasks (task) VALUES (?)',
      [task.trim()]
    );
    
    const [newTask] = await pool.query(
      'SELECT * FROM tasks WHERE id = ?',
      [result.insertId]
    );
    
    res.status(201).json(newTask[0]);
  } catch (error) {
    console.error('Error creating task:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Update task (both completion status AND task text)
app.put('/tasks/:id', async (req, res) => {
  try {
    const { completed, task } = req.body;
    const { id } = req.params;
    
    let updateFields = [];
    let values = [];
    
    // Update completion status if provided
    if (completed !== undefined) {
      updateFields.push('completed = ?');
      values.push(completed);
    }
    
    // Update task text if provided
    if (task !== undefined && task.trim() !== '') {
      updateFields.push('task = ?');
      values.push(task.trim());
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    values.push(id);
    
    const [result] = await pool.query(
      `UPDATE tasks SET ${updateFields.join(', ')} WHERE id = ?`,
      values
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    const [updatedTask] = await pool.query(
      'SELECT * FROM tasks WHERE id = ?',
      [id]
    );
    
    res.json(updatedTask[0]);
  } catch (error) {
    console.error('Error updating task:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Delete single task
app.delete('/tasks/:id', async (req, res) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM tasks WHERE id = ?',
      [req.params.id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    res.json({ 
      message: 'Task deleted successfully',
      id: parseInt(req.params.id)
    });
  } catch (error) {
    console.error('Error deleting task:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Delete all tasks
app.delete('/tasks', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM tasks');
    
    res.json({ 
      message: 'All tasks deleted',
      count: result.affectedRows
    });
  } catch (error) {
    console.error('Error deleting all tasks:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ======================
// START SERVER
// ======================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════╗
║   🚀 Vultr MySQL Demo - Task Manager              ║
║   📋 http://localhost:${PORT}                     ║
╚═══════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down...');
  await pool.end();
  process.exit(0);
});