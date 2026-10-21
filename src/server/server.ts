import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import { exec } from 'child_process';
import { DBManager } from './DBManager';
import { firebaseService } from './firebaseService';

/**
 * ====================================================================
 * COLLEGE MINI PROJECT: LIBRARY MANAGEMENT SYSTEM (100 MARKS)
 * Student Developer: Aditya
 * Main Server Application: server.ts
 *
 * Full-Stack TypeScript Architecture (Node.js + Express + TypeScript)
 * Features: Type-safe REST APIs, Live SQL query logging, Firebase persistence
 * ====================================================================
 */

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 8080;
const rootDir = process.cwd();
const webDir = path.join(rootDir, 'web');

// 1. Initialize Database Access Layer
const db = new DBManager(rootDir);

// 2. Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. Static Web Files
app.use(express.static(webDir));

// 4. REST API Endpoints

// GET /api/firebase-status
app.get(['/api/firebase-status', '/firebase-status'], (_req: Request, res: Response) => {
    res.json(firebaseService.getStatus());
});

// GET /api/stats
app.get(['/api/stats', '/stats'], (_req: Request, res: Response) => {
    try {
        const stats = db.getStats();
        res.json(stats);
    } catch (err: any) {
        res.status(500).json({ error: err?.message || 'Server error' });
    }
});

// GET /api/books
app.get(['/api/books', '/books'], (_req: Request, res: Response) => {
    try {
        const books = db.getAllBooks();
        res.json(books);
    } catch (err: any) {
        res.status(500).json({ error: err?.message || 'Server error' });
    }
});

// POST /api/books (Supports Add Book and Delete Book action)
app.post(['/api/books', '/books'], (req: Request, res: Response) => {
    try {
        const body = req.body || {};

        // Support delete action via POST
        if (body._action === 'delete' || req.path.endsWith('/delete')) {
            const id = parseInt(body.id, 10);
            const success = db.deleteBook(id);
            if (success) {
                res.status(200).json({ success: true, message: 'Book deleted successfully' });
            } else {
                res.status(400).json({
                    success: false,
                    message: 'Cannot delete book. Copies are currently issued or book not found.'
                });
            }
            return;
        }

        // Add Book
        const title = (body.title || '').trim();
        const author = (body.author || '').trim();
        const category = (body.category || 'General').trim();
        const isbn = (body.isbn || '').trim();
        const copies = parseInt(body.copies, 10) || 1;

        if (!title || !author) {
            res.status(400).json({ success: false, message: 'Title and Author are required.' });
            return;
        }

        const added = db.addBook(title, author, category, isbn, copies);
        res.status(201).json({ success: true, book: added });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err?.message || 'Failed to process book' });
    }
});

// DELETE /api/books?id=...
app.delete(['/api/books', '/books'], (req: Request, res: Response) => {
    try {
        const id = parseInt(req.query.id as string, 10);
        if (isNaN(id)) {
            res.status(400).json({ success: false, message: 'Invalid Book ID' });
            return;
        }

        const success = db.deleteBook(id);
        if (success) {
            res.status(200).json({ success: true, message: 'Book deleted' });
        } else {
            res.status(400).json({ success: false, message: 'Cannot delete issued book or invalid ID' });
        }
    } catch (err: any) {
        res.status(500).json({ success: false, message: err?.message || 'Failed to delete book' });
    }
});

// GET /api/members
app.get(['/api/members', '/members'], (_req: Request, res: Response) => {
    try {
        const members = db.getAllMembers();
        res.json(members);
    } catch (err: any) {
        res.status(500).json({ error: err?.message || 'Server error' });
    }
});

// POST /api/members
app.post(['/api/members', '/members'], (req: Request, res: Response) => {
    try {
        const body = req.body || {};
        const rollNo = (body.rollNo || '').trim();
        const name = (body.name || '').trim();
        const dept = (body.department || 'CSE').trim();
        const email = (body.email || '').trim();
        const phone = (body.phone || '').trim();

        if (!rollNo || !name) {
            res.status(400).json({ success: false, message: 'Roll Number and Name are required.' });
            return;
        }

        const added = db.addMember(rollNo, name, dept, email, phone);
        res.status(201).json({ success: true, member: added });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err?.message || 'Failed to add member' });
    }
});

// GET /api/transactions
app.get(['/api/transactions', '/transactions'], (_req: Request, res: Response) => {
    try {
        const transactions = db.getAllTransactions();
        res.json(transactions);
    } catch (err: any) {
        res.status(500).json({ error: err?.message || 'Server error' });
    }
});

// POST /api/issue
app.post(['/api/issue', '/issue'], (req: Request, res: Response) => {
    try {
        const body = req.body || {};
        const bookId = parseInt(body.bookId, 10);
        const memberId = parseInt(body.memberId, 10);
        const loanDays = parseInt(body.days, 10) || 14;

        if (isNaN(bookId) || isNaN(memberId)) {
            res.status(400).json({ success: false, message: 'Valid bookId and memberId are required' });
            return;
        }

        const t = db.issueBook(bookId, memberId, loanDays);
        if (t) {
            res.status(200).json({
                success: true,
                message: 'Book issued successfully!',
                transaction: t
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'Unable to issue book. Book may be out of stock or IDs invalid.'
            });
        }
    } catch (err: any) {
        res.status(500).json({ success: false, message: `Invalid request: ${err?.message}` });
    }
});

// POST /api/return
app.post(['/api/return', '/return'], (req: Request, res: Response) => {
    try {
        const body = req.body || {};
        const transactionId = parseInt(body.transactionId, 10);

        if (isNaN(transactionId)) {
            res.status(400).json({ success: false, message: 'Valid transactionId is required' });
            return;
        }

        const t = db.returnBook(transactionId);
        if (t) {
            res.status(200).json({
                success: true,
                message: 'Book returned successfully!',
                transaction: t
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'Transaction ID not found.'
            });
        }
    } catch (err: any) {
        res.status(500).json({ success: false, message: `Invalid request: ${err?.message}` });
    }
});

// Fallback to index.html for root or SPA navigation
app.use((_req: Request, res: Response) => {
    res.sendFile(path.join(webDir, 'index.html'));
});

// 5. Start Server (Only in local Node.js environment, Vercel Serverless handles execution automatically)
if (!process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log('==================================================================');
        console.log('   COLLEGE MINI PROJECT: LIBRARY MANAGEMENT SYSTEM (100 MARKS)   ');
        console.log('   Developer: Aditya | Tech: TypeScript + Node.js + Express + SQL ');
        console.log('   Cloud Database: Google Cloud Firestore (Firebase) Connected   ');
        console.log('==================================================================');
        console.log(`\n>>> SUCCESS: Library Management Server is RUNNING on port ${PORT}!`);
        console.log(`>>> Local Web Dashboard: http://127.0.0.1:${PORT} (or http://localhost:${PORT})`);
        console.log('>>> Press Ctrl+C in terminal to stop server.\n');
        console.log('------------------------------------------------------------------');
        console.log('SQL LOG STREAM (Queries will display here during UI actions):');
        console.log('------------------------------------------------------------------');

        // Automatically open browser on startup
        const url = `http://127.0.0.1:${PORT}`;
        const openCmd = process.platform === 'win32'
            ? `start "" "${url}"`
            : process.platform === 'darwin'
            ? `open "${url}"`
            : `xdg-open "${url}"`;

        exec(openCmd, (_err) => {
            // Silently ignore browser open errors (e.g. headless environments)
        });
    });
}

export default app;
export { app };
