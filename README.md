# Expense Tracker

A full-stack expense tracking web application that allows users to manage their daily expenses. It features a Node.js/Express backend connected to a PostgreSQL database with full CRUD capabilities and data validation.

## How to run

**Backend**

1. Create a PostgreSQL database named `expense_tracker`.

2. Run the `schema.sql` file on the `expense_tracker` database to create the required table.

3. Create a `.env` file in the backend folder and add your PostgreSQL connection details:

   ```env
   DB_USER=your_postgres_username
   DB_PASSWORD=your_postgres_password
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=expense_tracker
   PORT=3000
   ```

4. Open a terminal in the backend folder.

5. Install the required dependencies:

   ```bash
   npm install express cors pg dotenv
   ```

6. Start the backend:

   ```bash
   node server.js
   ```

7. The backend will run at `http://localhost:3000`.

**Frontend**

1. Open the frontend folder in VS Code.
2. Make sure the backend server is running.
3. Open `index.html` in a browser.
4. The frontend will connect to the backend API at `http://localhost:3000/api/expenses`.

## Features

* [x] Add an expense with validation
* [x] Edit an expense
* [x] Delete an expense
* [x] Filter expenses by category
* [x] Search expenses by title
* [x] Filter expenses by month
* [x] Sort expenses by title, amount, category, and date
* [x] Summary cards showing total spent, number of expenses, and highest expense
* [x] Expenses by category chart using Chart.js
* [x] Export expenses to CSV
* [x] Light and dark mode
 

## Screenshots
  **desktop
    <p align="center">
      <img src="Screenshots\desktop\interface-desktop-dark.png" width="700">
    </p>

    <p align="center">
      <img src="Screenshots\desktop\interface-desktop-light.png" width="700">
    </p>

  **mobile
    <p align="center">
      <img src="Screenshots\mobile\interface-mobile.png" width="300">
    </p>
** demo drive link
    https://drive.google.com/drive/folders/1NcKgQf4xcltlwlPBKHfkkRbzroCX_HSA?usp=drive_link

## What was the hardest part?

The hardest parts were implementing and testing the backend API with PostgreSQL and connecting the frontend to the backend API. I had to make sure that the expense data was validated before being stored, IDs were checked correctly, and SQL queries used parameters safely. On the frontend, I also had to handle validation, loading states, error messages, filtering, sorting, and updating the summary cards whenever the expense data changed. I tested the API endpoints with Thunder Client before connecting the frontend, which made the integration process easier and helped ensure that adding, retrieving, updating, and deleting expenses worked correctly.