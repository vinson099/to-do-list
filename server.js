// server.js
// A simple Express.js backend for a Todo list API

const express = require('express');
const app = express();
const PORT = 3000;

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('todos.db');

const path = require('path');
const fs = require('fs');

// Middleware to parse JSON requests
app.use(express.json());

// TODO ➡️  Middleware to inlcude static content from 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// Create todos table through SQLite
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS todos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      priority TEXT DEFAULT 'low',
      isComplete TEXT DEFAULT 'false',
      isFun TEXT DEFAULT 'true'
    )
  `);
});

// TODO ➡️ serve index.html from 'public' at the '/' path
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'), (err) => {
        if (err) {
            res.status(404).send('File not found');
        }
    });
});


// GET all todo items
app.get('/todos', (req, res) => {
  db.all('SELECT * FROM todos', (err, rows) => {  // select all todos from the database
    if (err) {
      console.error('Error fetching todos:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    res.json(rows); // return all todos as JSON
  });
});


// GET a specific todo item by ID
app.get('/todos/:id', (req, res) => {
  const id = parseInt(req.params.id);
  db.get('SELECT * FROM todos WHERE id = ?', [id], (err, row) => {  // select a specific todo by id from the database
    if (err) {
      console.error('Error fetching todo:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (row) {  // check if the todo exists
      res.json(row);  // return the specific todo as JSON
    } 
    
    else {
      res.status(404).json({ message: 'Todo item not found' });
    }
  });
});

// POST a new todo item
app.post('/todos', (req, res) => {
  const { name, priority = 'low', isFun } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Name is required' });
  }

  db.run(
    'INSERT INTO todos (name, priority, isComplete, isFun) VALUES (?, ?, ?, ?)',
    [name, priority, 0, isFun],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      
      db.get('SELECT * FROM todos WHERE id = ?', [this.lastID], (err, row) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        
        // if no error, push the new todo to the database
        res.status(201).json(row);
      });
    }
  );
});

// DELETE a todo item by ID
app.delete('/todos/:id', (req, res) => {
  const id = parseInt(req.params.id);
  
  // First check if todo exists
  db.get('SELECT id FROM todos WHERE id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!row) {
      return res.status(404).json({ message: 'item was not found' });
    }
    
    // Delete the todo
    db.run('DELETE FROM todos WHERE id = ?', [id], (err) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      res.json({ message: `Todo item ${id} deleted.` });
    });
  });
});

// Start the server
// TODO ➡️ Start the server by listening on the specified PORT
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});