-- ========================================================
-- COLLEGE MINI PROJECT: LIBRARY MANAGEMENT SYSTEM (100 MARKS)
-- Student: Aditya
-- Database Script: database.sql
-- ========================================================

-- Step 1: Create Database
CREATE DATABASE IF NOT EXISTS library_db;
USE library_db;

-- Step 2: Drop existing tables if they already exist (re-runnable script)
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS members;
DROP TABLE IF EXISTS books;

-- ========================================================
-- Table 1: books
-- Stores the book catalog and inventory counts
-- ========================================================
CREATE TABLE books (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    author VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    isbn VARCHAR(20) UNIQUE NOT NULL,
    total_copies INT NOT NULL DEFAULT 1,
    available_copies INT NOT NULL DEFAULT 1,
    added_date DATE NOT NULL,
    CONSTRAINT chk_copies CHECK (available_copies >= 0 AND available_copies <= total_copies)
);

-- ========================================================
-- Table 2: members (Students / Faculty)
-- Stores library card holders
-- ========================================================
CREATE TABLE members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    roll_no VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    department VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(15) NOT NULL,
    join_date DATE NOT NULL
);

-- ========================================================
-- Table 3: transactions
-- Tracks issuing and returning of books with due dates & fines
-- ========================================================
CREATE TABLE transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    book_id INT NOT NULL,
    member_id INT NOT NULL,
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    return_date DATE NULL,
    fine_amount DECIMAL(6, 2) DEFAULT 0.00,
    status VARCHAR(20) NOT NULL DEFAULT 'ISSUED', -- 'ISSUED' or 'RETURNED'
    CONSTRAINT fk_trans_book FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    CONSTRAINT fk_trans_member FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
);

-- ========================================================
-- Sample Data Insertion (DML)
-- ========================================================

-- Inserting Sample Books
INSERT INTO books (title, author, category, isbn, total_copies, available_copies, added_date) VALUES
('Introduction to Algorithms (CLRS)', 'Thomas H. Cormen', 'Computer Science', '9780262033848', 5, 4, '2026-01-10'),
('Clean Code', 'Robert C. Martin', 'Computer Science', '9780132350884', 4, 3, '2026-01-15'),
('Core Java Volume I: Fundamentals', 'Cay S. Horstmann', 'Programming', '9780135166307', 6, 6, '2026-01-20'),
('Database System Concepts', 'Abraham Silberschatz', 'Database', '9780073523323', 5, 4, '2026-02-01'),
('Operating System Concepts', 'Peter B. Galvin', 'Computer Science', '9781119800361', 4, 4, '2026-02-10'),
('Computer Networks', 'Andrew S. Tanenbaum', 'Networking', '9780132126953', 3, 3, '2026-02-15'),
('Design Patterns (GoF)', 'Erich Gamma et al.', 'Software Engg', '9780201633610', 3, 2, '2026-02-20');

-- Inserting Sample Members
INSERT INTO members (roll_no, name, department, email, phone, join_date) VALUES
('CS202601', 'Aditya Sharma', 'Computer Science', 'aditya@cllg.edu', '9876543210', '2026-01-05'),
('CS202602', 'Rahul Verma', 'Computer Science', 'rahul.v@cllg.edu', '9876543211', '2026-01-06'),
('IT202605', 'Priya Patel', 'Information Tech', 'priya.p@cllg.edu', '9876543212', '2026-01-08'),
('EC202611', 'Ananya Gupta', 'Electronics', 'ananya.g@cllg.edu', '9876543213', '2026-01-12'),
('ME202609', 'Vikas Kumar', 'Mechanical', 'vikas.k@cllg.edu', '9876543214', '2026-01-15');

-- Inserting Sample Transactions
INSERT INTO transactions (book_id, member_id, issue_date, due_date, return_date, fine_amount, status) VALUES
(1, 1, '2026-09-15', '2026-09-29', '2026-09-28', 0.00, 'RETURNED'),
(2, 2, '2026-10-01', '2026-10-15', NULL, 0.00, 'ISSUED'),
(4, 3, '2026-09-20', '2026-10-04', NULL, 45.00, 'ISSUED'),
(7, 1, '2026-10-05', '2026-10-19', NULL, 0.00, 'ISSUED');

-- ========================================================
-- USEFUL QUERIES FOR VIVA & EVALUATION (100 MARKS)
-- ========================================================

-- Query 1: View all active issued books with student name and book title (INNER JOIN)
SELECT 
    t.id AS Transaction_ID,
    m.roll_no AS Student_Roll,
    m.name AS Student_Name,
    b.title AS Book_Title,
    t.issue_date AS Issue_Date,
    t.due_date AS Due_Date,
    t.status AS Status
FROM transactions t
INNER JOIN members m ON t.member_id = m.id
INNER JOIN books b ON t.book_id = b.id
WHERE t.status = 'ISSUED';

-- Query 2: Find all overdue books (due_date past current date and status = 'ISSUED')
SELECT 
    t.id AS Transaction_ID,
    m.name AS Student_Name,
    m.phone AS Contact_Number,
    b.title AS Book_Title,
    t.due_date AS Due_Date,
    DATEDIFF(CURRENT_DATE, t.due_date) AS Days_Overdue,
    (DATEDIFF(CURRENT_DATE, t.due_date) * 5.00) AS Estimated_Fine
FROM transactions t
INNER JOIN members m ON t.member_id = m.id
INNER JOIN books b ON t.book_id = b.id
WHERE t.status = 'ISSUED' AND t.due_date < CURRENT_DATE;

-- Query 3: Count of total books per category (GROUP BY)
SELECT 
    category,
    COUNT(*) AS total_titles,
    SUM(total_copies) AS total_inventory_copies,
    SUM(available_copies) AS currently_available
FROM books
GROUP BY category;

-- Query 4: Total fine collected and pending fine
SELECT 
    status,
    SUM(fine_amount) AS total_fine
FROM transactions
GROUP BY status;
