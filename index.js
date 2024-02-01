import express from 'express';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

async function setupDatabase() {
    const db = await open({
        filename: 'mydb.sqlite',
        driver: sqlite3.Database
    });

    await db.run('CREATE TABLE IF NOT EXISTS users(id INT, name TEXT)');
    return db;
}

const app = express();
app.use(express.json());

const port = 3000;
let db;

setupDatabase().then(database => {
    db = database;
    app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
    });
}).catch(err => {
    console.error('Database initialization failed:', err);
});


// Error handling function
function handleDatabaseError(res, error) {
  console.error(error.message);
  res.status(500).send('Internal Server Error');
}

// GET route for fetching users
app.get('/users', async (req, res) => {
  try {
      const rows = await db.all('SELECT id, name FROM users');
      res.json(rows);
  } catch (error) {
      handleDatabaseError(res, error);
  }
});

// POST route for adding a new user
app.post('/users', async (req, res) => {
  const { id, name } = req.body;
  if (!id || !name) {
      return res.status(400).send('ID and Name are required');
  }

  try {
      const row = await db.get('SELECT * FROM users WHERE id = ?', [id]);
      if (row) {
          return res.status(400).send('User with this ID already exists');
      }
      await db.run('INSERT INTO users (id, name) VALUES (?, ?)', [id, name]);
      res.send('User added');
  } catch (error) {
      handleDatabaseError(res, error);
  }
});

// PUT route for updating a user
app.put('/users/:id', async (req, res) => {
  const { name } = req.body;
  if (!name) {
      return res.status(400).send('Name is required');
  }

  try {
      const result = await db.run('UPDATE users SET name = ? WHERE id = ?', [name, req.params.id]);
      if (result.changes === 0) {
          return res.status(404).send('No user found with that ID');
      }
      res.send('User updated');
  } catch (error) {
      handleDatabaseError(res, error);
  }
});

// DELETE route for removing a user
app.delete('/users/:id', async (req, res) => {
  try {
      const result = await db.run('DELETE FROM users WHERE id = ?', [req.params.id]);
      if (result.changes === 0) {
          return res.status(404).send('No user found with that ID');
      }
      res.send('User deleted');
  } catch (error) {
      handleDatabaseError(res, error);
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});