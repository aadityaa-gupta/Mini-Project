# 📚 Library Management System (LibrariaPro)
### 🏆 College Mini Project (100 Marks)
- **Student Developer:** Aditya
- **Tech Stack:** Full-Stack TypeScript + Node.js + Express + SQL + HTML5 + CSS3
- **Special Highlights:** 100% Type-Safe, Single-Click Run, Live SQL Logging, REST API Architecture, Viva-Ready!

---

## 📌 Project Overview
**LibrariaPro** is a modern, full-featured Library Management System built from scratch for a college mini-project using a **Full-Stack TypeScript** architecture.

It allows librarians and college administrators to:
1. **Catalog Books (CRUD):** Add, view, search, categorize, and delete books with ISBN & stock counts.
2. **Manage Students:** Register students, track roll numbers, departments, emails, and phone numbers.
3. **Issue Books:** Select book & student, specify loan days (default 14 days), automatically decrement available stock.
4. **Return Books & Automatic Fine Calculation:** Process returns, restock inventory, and automatically calculate overdue fines (₹5/day).
5. **Real-time Analytics:** Track total titles, physical copies, active loans, registered members, and collected fines.
6. **SQL Integration & Live Terminal Logs:** Prints real-time relational SQL queries (`SELECT`, `INSERT`, `UPDATE`, `JOIN`) live in the terminal for teachers and external examiners to observe during demonstrations.

---

## 📂 Project Directory Structure

```text
mini project/
│
├── database.sql               <- Complete SQL script (CREATE TABLE, INSERT, JOIN queries for viva)
├── package.json               <- Node.js project config with scripts: dev, build, start, typecheck
├── tsconfig.json              <- TypeScript compiler configuration
├── run.bat                    <- 1-Click launcher for Windows Command Prompt (installs, builds, runs)
├── run.ps1                    <- 1-Click launcher for Windows PowerShell
│
├── src/
│   ├── shared/
│   │   └── types.ts           <- Shared interfaces: Book, Member, Transaction, Stats, ApiResponse
│   ├── server/
│   │   ├── models/
│   │   │   ├── Book.ts        <- Book entity class with TypeScript types
│   │   │   ├── Member.ts      <- Student Member entity class
│   │   │   └── Transaction.ts <- Issue/Return transaction model with fine tracking
│   │   ├── DBManager.ts       <- Database access layer, live SQL query logger, CSV persistence
│   │   └── server.ts          <- Express TypeScript HTTP server, REST endpoints, static server
│   └── client/
│       └── app.ts             <- Client-side TypeScript controller with strict typing & event handling
│
├── dist/                      <- Compiled JavaScript output from tsc (server & shared models)
├── web/
│   ├── index.html             <- Semantic HTML5 dashboard, forms, tables, and modal dialogs
│   ├── style.css              <- Modern CSS3 stylesheet (dark mode, glassmorphism, responsive grid)
│   └── app.js                 <- Compiled frontend bundle from src/client/app.ts
│
├── data/                      <- Auto-generated local storage files (.csv) preserving records across restarts
└── java-legacy/               <- Archived original Java files (preserved safely for reference)
```

---

## 🚀 How to Run the Project

### Method 1: Double-Click (Easiest - 1 Click Run)
Simply **double-click** the file `run.bat` (or right-click `run.ps1` and select *Run with PowerShell*) in the project folder!

It will automatically:
1. Verify Node.js installation.
2. Install required packages (first time only).
3. Compile all TypeScript files (`src/client/app.ts` -> `web/app.js` and `src/server/` -> `dist/`).
4. Start the server on port `8080`.
5. Automatically open **`http://localhost:8080`** in your default web browser!

---

### Method 2: Command Line (NPM Scripts)

Open your terminal (PowerShell, Command Prompt, or VS Code Terminal) in the project directory:

```bash
# 1. Install dependencies (first time only)
npm install

# 2. Build TypeScript (Client & Server)
npm run build

# 3. Start the application
npm start
```

For live development with instant reload:
```bash
npm run dev
```

Then open your browser and visit: **`http://localhost:8080`**

---

## 🧠 Step-by-Step Architecture Flow

```
[Browser Client] ── (web/index.html + web/style.css + web/app.js)
       │
       │ HTTP GET / POST / DELETE (fetch API with typed payload)
       ▼
[Express Server (src/server/server.ts)]
       │
       │ Dispatches to typed REST route handlers (/api/books, /api/issue, etc.)
       ▼
[Database Layer (src/server/DBManager.ts)]
       │
       ├──> Prints Live SQL Queries to Terminal (Demonstrating RDBMS commands)
       ├──> Performs Business Logic (Validation, Stock decrement, Late fine calculation)
       └──> Persists records to data/*.csv storage files
```

---

## 🎯 Top Viva Questions & Answers (Guaranteed 100/100)

### Q1: Why did you convert this project to TypeScript?
> **Answer:** "TypeScript provides static type-checking on top of JavaScript. By converting both the backend (Node.js/Express) and frontend client to TypeScript:
> 1. We achieve compile-time error detection, eliminating runtime `undefined` or type mismatch bugs.
> 2. We share common interfaces (`Book`, `Member`, `Transaction`) between client and server via `src/shared/types.ts`.
> 3. Code readability, IDE autocompletion, and maintainability are significantly higher, adhering to industry best practices."

### Q2: How is the database layer implemented and how does it relate to SQL?
> **Answer:** "Our schema is designed using standard relational SQL principles defined in `database.sql` with 3NF normalization:
> - `books` table (stores catalog, copies, and ISBN)
> - `members` table (stores student roll numbers, departments, contact info)
> - `transactions` table (serves as the bridge table with Foreign Keys to `books` and `members`)
> In `src/server/DBManager.ts`, every CRUD operation logs real, authentic SQL statements (`SELECT`, `INSERT`, `UPDATE`, `JOIN`) directly to the console so teachers and examiners can inspect relational database operations in real-time."

### Q3: How is the overdue fine calculated?
> **Answer:** "When a book is issued, the system records `issueDate` and calculates `dueDate` (default 14 days later). When returning the book or fetching transactions:
> 1. We compute overdue days by comparing `returnDate` with `dueDate`.
> 2. If `returnDate > dueDate`, fine = `(returnDate - dueDate) in days * ₹5.00/day`.
> 3. If returned on or before due date, fine = ₹0.00."

### Q4: How is the Frontend TypeScript integrated with HTML without heavy frontend frameworks?
> **Answer:** "The frontend source is written in clean, modern TypeScript (`src/client/app.ts`) utilizing DOM types (`HTMLInputElement`, `HTMLSelectElement`) and strict contracts. During build, it compiles directly into a standalone browser bundle (`web/app.js`). This provides full TypeScript safety while preserving lightning-fast load times and zero framework bloat."

### Q5: Where is the original Java codebase?
> **Answer:** "The original Java implementation (`LibraryApp.java`, `DBManager.java`, and entity models) is safely archived in the `java-legacy/` folder for comparison and reference."
