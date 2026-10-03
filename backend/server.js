
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME
});



// endpoints

// return all expenses
app.get('/api/expenses', async (req, res) => {
    try {
        const query = `
            SELECT id, title, amount::float8, category, to_char(date, 'YYYY-MM-DD') as date 
            FROM expenses
            ORDER BY id`;
        const result = await pool.query(query);
        res.status(200).json({ 
            message: 'Success returning all expenses', 
            data: result.rows 
        });
        
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// helper function to check if the id is valid
const isValidId = (id) => {
    const parsedID = Number(id);
    return Number.isInteger(parsedID) && parsedID > 0;
};
// return one expense (404 if not found)
app.get('/api/expenses/:id', async (req, res) => {
    const { id } = req.params;
    if (!isValidId(id)) {
        return res.status(404).json({ error: 'Invalid id' });
    } 
    try {
        const query = `
            SELECT id, title, amount::float8, category, to_char(date, 'YYYY-MM-DD') as date 
            FROM expenses
            WHERE id = $1`;
        const result = await pool.query(query, [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Expense not found' });
        }
        res.status(200).json({ 
            message: 'Success returning one expenses', 
            data: result.rows[0]
        });
       
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});



// add an expense (201, or 400 if the data is invalid)
app.post('/api/expenses', async (req, res) => {
    const { title, amount, category, date } = req.body;
    
    if (!title || typeof title !== 'string' || title.trim() === '') {
        return res.status(400).json({ error: 'Title is required and must not be empty.' });
    }
    if (amount === undefined || typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({ error: 'Amount is required and must be a positive number.' });
    }
    if (!category || !['Food', 'Transport', 'Bills', 'Entertainment', 'Other'].includes(category)) {
        return res.status(400).json({ error: 'Category is invalid or missing.' });
    }
    if (!date || isNaN(Date.parse(date))) {
        return res.status(400).json({ error: 'Date is required and must be a valid date (YYYY-MM-DD).' });
    }

    try {
        const query = `
            INSERT INTO expenses (title, amount, category, date)
            VALUES ($1, $2, $3, $4)
            RETURNING id, title, amount::float8, category, to_char(date, 'YYYY-MM-DD') as date
        `;
        const values = [title.trim(), amount, category, date];
        const result = await pool.query(query, values);
        res.status(201).json({ 
            message: 'Success adding an expenses', 
            data: result.rows[0]
        });
       
        
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error:  'Internal Server Error' });
    }
});

// update an expense (200, 400, or 404)
app.put('/api/expenses/:id', async (req, res) => {
    const { id } = req.params;
    const { title, amount, category, date } = req.body;

    if (!isValidId(id)) {
        return res.status(400).json({ error: 'Invalid ID format. ID must be a positive integer.' });
    }

    if (!title || typeof title !== 'string' || title.trim() === '') {
        return res.status(400).json({ error: 'Title is required and must not be empty.' });
    }
    if (amount === undefined || typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({ error: 'Amount is required and must be a positive number.' });
    }
    if (!category || !['Food', 'Transport', 'Bills', 'Entertainment', 'Other'].includes(category)) {
        return res.status(400).json({ error: 'Category is invalid or missing.' });
    }
    if (!date || isNaN(Date.parse(date))) {
        return res.status(400).json({ error: 'Date is required and must be a valid date (YYYY-MM-DD).' });
    }

    try {
        const query = `
            UPDATE expenses
            SET title = $1, amount = $2, category = $3, date = $4
            WHERE id = $5
            RETURNING id, title, amount::float8, category, to_char(date, 'YYYY-MM-DD') as date
        `;
        const values = [title.trim(), amount, category, date, id];
        const result = await pool.query(query, values);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Expense not found' });
        }
          res.status(200).json({ 
            message: 'Success updating an expenses', 
            data: result.rows[0]
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error:  'Internal Server Error' });
    }
});

// delete an expense (200, or 404)
app.delete('/api/expenses/:id', async (req, res) => {
    const { id } = req.params;

    if (!isValidId(id)) {
        return res.status(404).json({ error: 'Invalid ID format. ID must be a positive integer.' });
    }

    try {
        const query = `
            DELETE FROM expenses
            WHERE id = $1
            RETURNING id, title, amount::float8, category, to_char(date, 'YYYY-MM-DD') as date
        `;

        const result = await pool.query(query, [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Expense not found' });
        }
        res.json({ message: 'Success deleting an expenses', deletedExpense: result.rows[0] });
    } catch (err) {
        console.error(err.message); 
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});