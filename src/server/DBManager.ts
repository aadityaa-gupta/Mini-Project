import fs from 'fs';
import path from 'path';
import { Book } from './models/Book';
import { Member } from './models/Member';
import { Transaction } from './models/Transaction';
import { StatsResponse } from '../shared/types';
import { firebaseService } from './firebaseService';

/**
 * DBManager (TypeScript Database & Data Access Layer)
 * -------------------------------------------------------------
 * 1. Simulates and logs authentic SQL Queries to the console.
 * 2. Connects to Google Cloud Firestore (Firebase) for cloud persistence.
 * 3. Persists all records (books, members, transactions) into CSV data directory.
 * 4. Provides clean CRUD operations for books, members, issues, and returns.
 * 5. Pre-loaded with standard college library sample records.
 */
export class DBManager {
    private root: string;
    private dataDir: string;
    private booksFile: string;
    private membersFile: string;
    private transactionsFile: string;

    private books: Map<number, Book> = new Map();
    private members: Map<number, Member> = new Map();
    private transactions: Map<number, Transaction> = new Map();

    private nextBookId: number = 1;
    private nextMemberId: number = 1;
    private nextTransactionId: number = 1;

    constructor(baseDir?: string) {
        this.root = baseDir || process.cwd();
        const isVercel = Boolean(process.env.VERCEL);
        const sourceDataDir = path.join(this.root, 'data');
        this.dataDir = isVercel ? path.join('/tmp', 'data') : sourceDataDir;
        this.booksFile = path.join(this.dataDir, 'books.csv');
        this.membersFile = path.join(this.dataDir, 'members.csv');
        this.transactionsFile = path.join(this.dataDir, 'transactions.csv');

        this.initDataDirectory();
        this.loadOrSeedData();
        // Asynchronously sync with Firebase Cloud Firestore
        this.syncWithFirebase();
    }

    private initDataDirectory(): void {
        try {
            if (!fs.existsSync(this.dataDir)) {
                fs.mkdirSync(this.dataDir, { recursive: true });
            }
        } catch (e: any) {
            console.warn('[DBManager] initDataDirectory notice:', e?.message);
        }
    }

    /**
     * Loads existing data from files, or seeds realistic default college data.
     */
    private loadOrSeedData(): void {
        const isVercel = Boolean(process.env.VERCEL);
        const sourceDataDir = path.join(this.root, 'data');

        // On Vercel, copy seed files from source data folder to /tmp/data if not already present
        if (isVercel && this.dataDir !== sourceDataDir) {
            try {
                if (!fs.existsSync(this.dataDir)) {
                    fs.mkdirSync(this.dataDir, { recursive: true });
                }
                const files = ['books.csv', 'members.csv', 'transactions.csv'];
                for (const f of files) {
                    const src = path.join(sourceDataDir, f);
                    const dest = path.join(this.dataDir, f);
                    if (fs.existsSync(src) && !fs.existsSync(dest)) {
                        fs.copyFileSync(src, dest);
                    }
                }
            } catch (err: any) {
                console.warn('[DBManager] Notice: Could not sync to /tmp, using in-memory defaults:', err?.message);
            }
        }

        const hasBooks = fs.existsSync(this.booksFile);
        const hasMembers = fs.existsSync(this.membersFile);
        const hasTrans = fs.existsSync(this.transactionsFile);

        if (hasBooks && hasMembers && hasTrans) {
            this.loadBooks();
            this.loadMembers();
            this.loadTransactions();
            console.log(`[DBManager] Loaded existing database records from ${this.dataDir}/`);
        } else {
            console.log('[DBManager] Initializing new database with default college library data...');
            this.seedDefaultData();
            this.saveAll();
        }
    }

    /**
     * Syncs records bidirectionally with Firebase Cloud Firestore.
     */
    public async syncWithFirebase(): Promise<void> {
        try {
            console.log('[DBManager] Connecting to Firebase Cloud Firestore (Project: mini-2b749)...');
            const fbBooks = await firebaseService.fetchBooks();
            const fbMembers = await firebaseService.fetchMembers();
            const fbTrans = await firebaseService.fetchTransactions();

            const hasRemoteData = (fbBooks && fbBooks.length > 0) || 
                                  (fbMembers && fbMembers.length > 0) || 
                                  (fbTrans && fbTrans.length > 0);

            if (hasRemoteData) {
                if (fbBooks && fbBooks.length > 0) {
                    this.books.clear();
                    fbBooks.forEach(b => this.addBookInternal(b));
                }
                if (fbMembers && fbMembers.length > 0) {
                    this.members.clear();
                    fbMembers.forEach(m => this.addMemberInternal(m));
                }
                if (fbTrans && fbTrans.length > 0) {
                    this.transactions.clear();
                    fbTrans.forEach(t => this.addTransactionInternal(t));
                }
                this.saveAll();
                console.log(`[DBManager] Successfully synced ${this.books.size} books, ${this.members.size} members, and ${this.transactions.size} transactions from Cloud Firestore!`);
            } else if (fbBooks !== null && fbMembers !== null && fbTrans !== null) {
                // Connected but collection is empty in Firestore: Seed local data to Firestore
                console.log('[DBManager] Firestore is connected. Seeding initial records to Cloud Firestore...');
                await firebaseService.seedInitialData(
                    Array.from(this.books.values()),
                    Array.from(this.members.values()),
                    Array.from(this.transactions.values())
                );
            }
        } catch (e: any) {
            console.warn('[DBManager] Firebase sync notice:', e?.message);
        }
    }

    private seedDefaultData(): void {
        // Seed Books
        this.addBookInternal(new Book(1, 'Introduction to Algorithms (CLRS)', 'Thomas H. Cormen', 'Computer Science', '9780262033848', 5, 4, '2026-01-10'));
        this.addBookInternal(new Book(2, 'Clean Code: A Handbook of Agile Craftsmanship', 'Robert C. Martin', 'Computer Science', '9780132350884', 4, 3, '2026-01-15'));
        this.addBookInternal(new Book(3, 'Core Java Volume I: Fundamentals', 'Cay S. Horstmann', 'Programming', '9780135166307', 6, 6, '2026-01-20'));
        this.addBookInternal(new Book(4, 'Database System Concepts', 'Abraham Silberschatz', 'Database', '9780073523323', 5, 4, '2026-02-01'));
        this.addBookInternal(new Book(5, 'Operating System Concepts', 'Peter B. Galvin', 'Computer Science', '9781119800361', 4, 4, '2026-02-10'));
        this.addBookInternal(new Book(6, 'Computer Networks', 'Andrew S. Tanenbaum', 'Networking', '9780132126953', 3, 3, '2026-02-15'));
        this.addBookInternal(new Book(7, 'Design Patterns: Elements of Reusable Object-Oriented Software', 'Erich Gamma et al.', 'Software Engg', '9780201633610', 3, 2, '2026-02-20'));
        this.nextBookId = 8;

        // Seed Members
        this.addMemberInternal(new Member(1, 'CS202601', 'Aditya Sharma', 'Computer Science', 'aditya@cllg.edu', '9876543210', '2026-01-05'));
        this.addMemberInternal(new Member(2, 'CS202602', 'Rahul Verma', 'Computer Science', 'rahul.v@cllg.edu', '9876543211', '2026-01-06'));
        this.addMemberInternal(new Member(3, 'IT202605', 'Priya Patel', 'Information Tech', 'priya.p@cllg.edu', '9876543212', '2026-01-08'));
        this.addMemberInternal(new Member(4, 'EC202611', 'Ananya Gupta', 'Electronics', 'ananya.g@cllg.edu', '9876543213', '2026-01-12'));
        this.addMemberInternal(new Member(5, 'ME202609', 'Vikas Kumar', 'Mechanical', 'vikas.k@cllg.edu', '9876543214', '2026-01-15'));
        this.nextMemberId = 6;

        // Seed Transactions
        this.addTransactionInternal(new Transaction(1, 1, 'Introduction to Algorithms (CLRS)', 1, 'Aditya Sharma', 'CS202601', '2026-09-15', '2026-09-29', '2026-09-28', 0.00, 'RETURNED'));
        this.addTransactionInternal(new Transaction(2, 2, 'Clean Code: A Handbook of Agile Craftsmanship', 2, 'Rahul Verma', 'CS202602', '2026-10-01', '2026-10-15', null, 0.00, 'ISSUED'));
        this.addTransactionInternal(new Transaction(3, 4, 'Database System Concepts', 3, 'Priya Patel', 'IT202605', '2026-09-20', '2026-10-04', null, 45.00, 'ISSUED'));
        this.addTransactionInternal(new Transaction(4, 7, 'Design Patterns: Elements of Reusable Object-Oriented Software', 1, 'Aditya Sharma', 'CS202601', '2026-10-05', '2026-10-19', null, 0.00, 'ISSUED'));
        this.nextTransactionId = 5;
    }

    private addBookInternal(b: Book): void {
        this.books.set(b.id, b);
        if (b.id >= this.nextBookId) this.nextBookId = b.id + 1;
    }

    private addMemberInternal(m: Member): void {
        this.members.set(m.id, m);
        if (m.id >= this.nextMemberId) this.nextMemberId = m.id + 1;
    }

    private addTransactionInternal(t: Transaction): void {
        this.transactions.set(t.id, t);
        if (t.id >= this.nextTransactionId) this.nextTransactionId = t.id + 1;
    }

    // -----------------------------------------------------------------------------------
    // SQL LOGGING & CRUD OPERATIONS
    // -----------------------------------------------------------------------------------

    public getAllBooks(): Book[] {
        console.log('[SQL LOG]: SELECT * FROM books ORDER BY id DESC;');
        const list = Array.from(this.books.values());
        list.reverse();
        return list;
    }

    public getBookById(id: number): Book | undefined {
        console.log(`[SQL LOG]: SELECT * FROM books WHERE id = ${id};`);
        return this.books.get(id);
    }

    public addBook(title: string, author: string, category: string, isbn: string, copies: number): Book {
        const today = new Date().toISOString().split('T')[0];
        const b = new Book(this.nextBookId++, title, author, category, isbn, copies, copies, today);
        this.books.set(b.id, b);

        console.log(
            `[SQL LOG]: INSERT INTO books (id, title, author, category, isbn, total_copies, available_copies, added_date) ` +
            `VALUES (${b.id}, '${title.replace(/'/g, "''")}', '${author.replace(/'/g, "''")}', '${category}', '${isbn}', ${copies}, ${copies}, '${today}');`
        );

        this.saveBooks();
        firebaseService.saveBook(b);
        return b;
    }

    public deleteBook(id: number): boolean {
        if (!this.books.has(id)) return false;

        // Check if currently issued
        for (const t of this.transactions.values()) {
            if (t.bookId === id && t.status === 'ISSUED') {
                console.log(`[SQL CONSTRAINT ERROR]: Cannot delete book id=${id}. Copies are currently issued!`);
                return false;
            }
        }

        this.books.delete(id);
        console.log(`[SQL LOG]: DELETE FROM books WHERE id = ${id};`);
        this.saveBooks();
        firebaseService.deleteBook(id);
        return true;
    }

    public getAllMembers(): Member[] {
        console.log('[SQL LOG]: SELECT * FROM members ORDER BY id DESC;');
        const list = Array.from(this.members.values());
        list.reverse();
        return list;
    }

    public getMemberById(id: number): Member | undefined {
        console.log(`[SQL LOG]: SELECT * FROM members WHERE id = ${id};`);
        return this.members.get(id);
    }

    public addMember(rollNo: string, name: string, department: string, email: string, phone: string): Member {
        const today = new Date().toISOString().split('T')[0];
        const m = new Member(this.nextMemberId++, rollNo, name, department, email, phone, today);
        this.members.set(m.id, m);

        console.log(
            `[SQL LOG]: INSERT INTO members (id, roll_no, name, department, email, phone, join_date) ` +
            `VALUES (${m.id}, '${rollNo}', '${name.replace(/'/g, "''")}', '${department}', '${email}', '${phone}', '${today}');`
        );

        this.saveMembers();
        firebaseService.saveMember(m);
        return m;
    }

    public getAllTransactions(): Transaction[] {
        console.log(
            '[SQL LOG]: SELECT t.id, t.book_id, b.title, t.member_id, m.name, m.roll_no, ' +
            't.issue_date, t.due_date, t.return_date, t.fine_amount, t.status ' +
            'FROM transactions t ' +
            'JOIN books b ON t.book_id = b.id ' +
            'JOIN members m ON t.member_id = m.id ' +
            'ORDER BY t.id DESC;'
        );

        // Dynamically recalculate estimated fine for active issued books (₹5 per overdue day)
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (const t of this.transactions.values()) {
            if (t.status === 'ISSUED') {
                try {
                    const dueDate = new Date(t.dueDate);
                    dueDate.setHours(0, 0, 0, 0);
                    if (today.getTime() > dueDate.getTime()) {
                        const diffTime = today.getTime() - dueDate.getTime();
                        const daysOverdue = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                        t.fineAmount = daysOverdue * 5.0; // ₹5 per day fine
                    } else {
                        t.fineAmount = 0.0;
                    }
                } catch {
                    t.fineAmount = 0.0;
                }
            }
        }

        const list = Array.from(this.transactions.values());
        list.reverse();
        return list;
    }

    /**
     * Issues a book to a member.
     * Decrements available_copies in books table.
     */
    public issueBook(bookId: number, memberId: number, loanDays: number = 14): Transaction | null {
        const b = this.books.get(bookId);
        const m = this.members.get(memberId);

        if (!b || !m) {
            console.log('[SQL ERROR]: Invalid bookId or memberId');
            return null;
        }

        if (b.availableCopies <= 0) {
            console.log(`[SQL ERROR]: Book '${b.title}' is out of stock!`);
            return null;
        }

        // Deduct 1 available copy
        b.availableCopies -= 1;
        console.log(`[SQL LOG]: UPDATE books SET available_copies = ${b.availableCopies} WHERE id = ${b.id};`);

        const now = new Date();
        const issueDate = now.toISOString().split('T')[0];
        const due = new Date();
        due.setDate(now.getDate() + (loanDays > 0 ? loanDays : 14));
        const dueDate = due.toISOString().split('T')[0];

        const t = new Transaction(
            this.nextTransactionId++,
            b.id,
            b.title,
            m.id,
            m.name,
            m.rollNo,
            issueDate,
            dueDate,
            null,
            0.0,
            'ISSUED'
        );

        this.transactions.set(t.id, t);
        console.log(
            `[SQL LOG]: INSERT INTO transactions (id, book_id, member_id, issue_date, due_date, status) ` +
            `VALUES (${t.id}, ${b.id}, ${m.id}, '${issueDate}', '${dueDate}', 'ISSUED');`
        );

        this.saveBooks();
        this.saveTransactions();
        firebaseService.saveTransaction(t);
        firebaseService.saveBook(b);
        return t;
    }

    /**
     * Returns a book.
     * Increments available_copies in books table, calculates fine if overdue.
     */
    public returnBook(transactionId: number): Transaction | null {
        const t = this.transactions.get(transactionId);
        if (!t) {
            console.log(`[SQL ERROR]: Transaction not found with id = ${transactionId}`);
            return null;
        }

        if (t.status === 'RETURNED') {
            console.log(`[SQL WARNING]: Transaction ${transactionId} already returned.`);
            return t;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const returnDate = today.toISOString().split('T')[0];
        let fine = 0.0;

        try {
            const dueDate = new Date(t.dueDate);
            dueDate.setHours(0, 0, 0, 0);
            if (today.getTime() > dueDate.getTime()) {
                const diffTime = today.getTime() - dueDate.getTime();
                const daysOverdue = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                fine = daysOverdue * 5.0; // ₹5 / day
            }
        } catch {
            fine = 0.0;
        }

        t.returnDate = returnDate;
        t.fineAmount = fine;
        t.status = 'RETURNED';

        // Increase available copies back in inventory
        const b = this.books.get(t.bookId);
        if (b) {
            b.availableCopies = Math.min(b.totalCopies, b.availableCopies + 1);
            console.log(`[SQL LOG]: UPDATE books SET available_copies = ${b.availableCopies} WHERE id = ${b.id};`);
            firebaseService.saveBook(b);
        }

        console.log(
            `[SQL LOG]: UPDATE transactions SET return_date = '${returnDate}', fine_amount = ${fine.toFixed(2)}, status = 'RETURNED' WHERE id = ${t.id};`
        );

        this.saveBooks();
        this.saveTransactions();
        firebaseService.saveTransaction(t);
        return t;
    }

    /**
     * Returns dashboard statistics.
     */
    public getStats(): StatsResponse {
        let totalBooksCount = 0;
        let totalAvailableCopies = 0;
        for (const b of this.books.values()) {
            totalBooksCount += b.totalCopies;
            totalAvailableCopies += b.availableCopies;
        }

        let activeIssuedCount = 0;
        let totalFine = 0.0;
        for (const t of this.transactions.values()) {
            if (t.status === 'ISSUED') {
                activeIssuedCount++;
            }
            totalFine += t.fineAmount;
        }

        console.log('[SQL LOG]: SELECT COUNT(*) FROM books; SELECT COUNT(*) FROM members; SELECT SUM(fine_amount) FROM transactions;');

        return {
            totalTitles: this.books.size,
            totalCopies: totalBooksCount,
            availableCopies: totalAvailableCopies,
            issuedBooks: activeIssuedCount,
            totalMembers: this.members.size,
            totalFine: totalFine.toFixed(2),
            firebaseConnected: firebaseService.getStatus().connected
        };
    }

    // -----------------------------------------------------------------------------------
    // FILE PERSISTENCE HELPERS (CSV Format)
    // -----------------------------------------------------------------------------------

    private saveAll(): void {
        this.saveBooks();
        this.saveMembers();
        this.saveTransactions();
    }

    private saveBooks(): void {
        try {
            const lines: string[] = [];
            for (const b of this.books.values()) {
                lines.push(
                    [
                        DBManager.escapeCsv(String(b.id)),
                        DBManager.escapeCsv(b.title),
                        DBManager.escapeCsv(b.author),
                        DBManager.escapeCsv(b.category),
                        DBManager.escapeCsv(b.isbn),
                        String(b.totalCopies),
                        String(b.availableCopies),
                        DBManager.escapeCsv(b.addedDate)
                    ].join(',')
                );
            }
            fs.writeFileSync(this.booksFile, lines.join('\n'), 'utf-8');
        } catch (e: any) {
            console.error('[Error saving books]:', e?.message);
        }
    }

    private loadBooks(): void {
        this.books.clear();
        try {
            if (!fs.existsSync(this.booksFile)) return;
            const content = fs.readFileSync(this.booksFile, 'utf-8');
            const lines = content.split(/\r?\n/);
            for (const line of lines) {
                if (!line.trim()) continue;
                const p = DBManager.parseCsvLine(line);
                if (p.length >= 8) {
                    const b = new Book(
                        parseInt(p[0], 10),
                        p[1],
                        p[2],
                        p[3],
                        p[4],
                        parseInt(p[5], 10),
                        parseInt(p[6], 10),
                        p[7]
                    );
                    this.addBookInternal(b);
                }
            }
        } catch (e: any) {
            console.error('[Error reading books]:', e?.message);
        }
    }

    private saveMembers(): void {
        try {
            const lines: string[] = [];
            for (const m of this.members.values()) {
                lines.push(
                    [
                        DBManager.escapeCsv(String(m.id)),
                        DBManager.escapeCsv(m.rollNo),
                        DBManager.escapeCsv(m.name),
                        DBManager.escapeCsv(m.department),
                        DBManager.escapeCsv(m.email),
                        DBManager.escapeCsv(m.phone),
                        DBManager.escapeCsv(m.joinDate)
                    ].join(',')
                );
            }
            fs.writeFileSync(this.membersFile, lines.join('\n'), 'utf-8');
        } catch (e: any) {
            console.error('[Error saving members]:', e?.message);
        }
    }

    private loadMembers(): void {
        this.members.clear();
        try {
            if (!fs.existsSync(this.membersFile)) return;
            const content = fs.readFileSync(this.membersFile, 'utf-8');
            const lines = content.split(/\r?\n/);
            for (const line of lines) {
                if (!line.trim()) continue;
                const p = DBManager.parseCsvLine(line);
                if (p.length >= 7) {
                    const m = new Member(
                        parseInt(p[0], 10),
                        p[1],
                        p[2],
                        p[3],
                        p[4],
                        p[5],
                        p[6]
                    );
                    this.addMemberInternal(m);
                }
            }
        } catch (e: any) {
            console.error('[Error reading members]:', e?.message);
        }
    }

    private saveTransactions(): void {
        try {
            const lines: string[] = [];
            for (const t of this.transactions.values()) {
                lines.push(
                    [
                        String(t.id),
                        String(t.bookId),
                        DBManager.escapeCsv(t.bookTitle),
                        String(t.memberId),
                        DBManager.escapeCsv(t.memberName),
                        DBManager.escapeCsv(t.memberRollNo),
                        DBManager.escapeCsv(t.issueDate),
                        DBManager.escapeCsv(t.dueDate),
                        DBManager.escapeCsv(t.returnDate || ''),
                        t.fineAmount.toFixed(2),
                        DBManager.escapeCsv(t.status)
                    ].join(',')
                );
            }
            fs.writeFileSync(this.transactionsFile, lines.join('\n'), 'utf-8');
        } catch (e: any) {
            console.error('[Error saving transactions]:', e?.message);
        }
    }

    private loadTransactions(): void {
        this.transactions.clear();
        try {
            if (!fs.existsSync(this.transactionsFile)) return;
            const content = fs.readFileSync(this.transactionsFile, 'utf-8');
            const lines = content.split(/\r?\n/);
            for (const line of lines) {
                if (!line.trim()) continue;
                const p = DBManager.parseCsvLine(line);
                if (p.length >= 11) {
                    const retDate = p[8] === '' ? null : p[8];
                    const t = new Transaction(
                        parseInt(p[0], 10),
                        parseInt(p[1], 10),
                        p[2],
                        parseInt(p[3], 10),
                        p[4],
                        p[5],
                        p[6],
                        p[7],
                        retDate,
                        parseFloat(p[9]),
                        p[10] as 'ISSUED' | 'RETURNED'
                    );
                    this.addTransactionInternal(t);
                }
            }
        } catch (e: any) {
            console.error('[Error reading transactions]:', e?.message);
        }
    }

    public static escapeCsv(s: string | null | undefined): string {
        if (!s) return '""';
        return `"${s.replace(/"/g, '""')}"`;
    }

    public static parseCsvLine(line: string): string[] {
        const list: string[] = [];
        let cur = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const c = line.charAt(i);
            if (c === '"') {
                if (inQuotes && i + 1 < line.length && line.charAt(i + 1) === '"') {
                    cur += '"';
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (c === ',' && !inQuotes) {
                list.push(cur);
                cur = '';
            } else {
                cur += c;
            }
        }
        list.push(cur);
        return list;
    }
}
