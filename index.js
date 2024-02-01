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

app.get('/users', (req, res) => {
  db.all('SELECT id, name FROM users', (err, rows) => {
    res.send(rows);
  });
});

app.post('/users', (req, res) => {
  let checkStmt = db.prepare('SELECT * FROM users WHERE id = ?');
  checkStmt.get(req.body.id, (err, row) => {
    if (err) {
      res.status(500).send(err.message);
    } else if (row) {
      res.status(400).send('User with this ID already exists');
    } else {
      let insertStmt = db.prepare('INSERT INTO users VALUES (?, ?)');
      insertStmt.run(req.body.id, req.body.name, (err) => {
        if (err) {
          res.status(500).send(err.message);
        } else {
          insertStmt.finalize();
          res.send('User added');
        }
      });
    }
  });
});

app.put('/users/:id', (req, res) => {
  let stmt = db.prepare('UPDATE users SET name = ? WHERE id = ?');
  stmt.run(req.body.name, req.params.id);
  stmt.finalize();
  res.send('User updated');
});

app.delete('/users/:id', (req, res) => {
  let stmt = db.prepare('DELETE FROM users WHERE id = ?');
  stmt.run(req.params.id);
  stmt.finalize();
  res.send('User deleted');
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});