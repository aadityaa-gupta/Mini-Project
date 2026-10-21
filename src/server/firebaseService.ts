import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
    getDatabase,
    ref,
    set,
    get,
    remove,
    Database
} from 'firebase/database';
import { firebaseConfig } from '../shared/firebaseConfig';
import { Book } from './models/Book';
import { Member } from './models/Member';
import { Transaction } from './models/Transaction';

/**
 * ===================================================================
 * Firebase Realtime Database Service
 * Connects to: https://mini-2b749-default-rtdb.asia-southeast1.firebasedatabase.app
 * ===================================================================
 */
export class FirebaseService {
    private app: FirebaseApp | null = null;
    private db: Database | null = null;
    private initialized: boolean = false;
    private isConnected: boolean = false;

    constructor() {
        this.init();
    }

    private init(): void {
        try {
            if (!getApps().length) {
                this.app = initializeApp(firebaseConfig);
            } else {
                this.app = getApp();
            }
            this.db = getDatabase(this.app, firebaseConfig.databaseURL);
            this.initialized = true;
            console.log('[Firebase] Realtime Database initialized successfully!');
            console.log(`[Firebase] DB URL: ${firebaseConfig.databaseURL}`);
        } catch (error: any) {
            console.warn('[Firebase] Initialization warning:', error?.message);
            this.initialized = false;
        }
    }

    public getStatus(): { initialized: boolean; connected: boolean; databaseURL: string } {
        return {
            initialized: this.initialized,
            connected: this.isConnected,
            databaseURL: firebaseConfig.databaseURL
        };
    }

    // --- BOOKS ---

    public async fetchBooks(): Promise<Book[] | null> {
        if (!this.initialized || !this.db) return null;
        try {
            const snapshot = await get(ref(this.db, 'books'));
            if (!snapshot.exists()) {
                this.isConnected = true;
                return [];
            }

            const val = snapshot.val();
            const list: Book[] = [];
            const rawItems = Array.isArray(val) ? val : Object.values(val);

            for (const data of rawItems) {
                if (!data) continue;
                list.push(
                    new Book(
                        Number(data.id),
                        String(data.title || ''),
                        String(data.author || ''),
                        String(data.category || 'General'),
                        String(data.isbn || ''),
                        Number(data.totalCopies || 1),
                        Number(data.availableCopies || 1),
                        String(data.addedDate || new Date().toISOString().split('T')[0])
                    )
                );
            }

            this.isConnected = true;
            console.log(`[Firebase] Fetched ${list.length} books from Realtime Database.`);
            return list;
        } catch (err: any) {
            console.warn('[Firebase] Could not fetch books from Realtime Database:', err?.message);
            return null;
        }
    }

    public async saveBook(book: Book): Promise<void> {
        if (!this.initialized || !this.db) return;
        try {
            await set(ref(this.db, `books/${book.id}`), {
                id: book.id,
                title: book.title,
                author: book.author,
                category: book.category,
                isbn: book.isbn,
                totalCopies: book.totalCopies,
                availableCopies: book.availableCopies,
                addedDate: book.addedDate,
                updatedAt: new Date().toISOString()
            });
            this.isConnected = true;
            console.log(`[Firebase Sync]: Saved Book #${book.id} ('${book.title}') to Realtime Database.`);
        } catch (err: any) {
            console.warn(`[Firebase Sync Error]: Failed to save book #${book.id}:`, err?.message);
        }
    }

    public async deleteBook(bookId: number): Promise<void> {
        if (!this.initialized || !this.db) return;
        try {
            await remove(ref(this.db, `books/${bookId}`));
            this.isConnected = true;
            console.log(`[Firebase Sync]: Deleted Book #${bookId} from Realtime Database.`);
        } catch (err: any) {
            console.warn(`[Firebase Sync Error]: Failed to delete book #${bookId}:`, err?.message);
        }
    }

    // --- MEMBERS ---

    public async fetchMembers(): Promise<Member[] | null> {
        if (!this.initialized || !this.db) return null;
        try {
            const snapshot = await get(ref(this.db, 'members'));
            if (!snapshot.exists()) {
                this.isConnected = true;
                return [];
            }

            const val = snapshot.val();
            const list: Member[] = [];
            const rawItems = Array.isArray(val) ? val : Object.values(val);

            for (const data of rawItems) {
                if (!data) continue;
                list.push(
                    new Member(
                        Number(data.id),
                        String(data.rollNo || ''),
                        String(data.name || ''),
                        String(data.department || 'CSE'),
                        String(data.email || ''),
                        String(data.phone || ''),
                        String(data.joinDate || new Date().toISOString().split('T')[0])
                    )
                );
            }

            this.isConnected = true;
            console.log(`[Firebase] Fetched ${list.length} members from Realtime Database.`);
            return list;
        } catch (err: any) {
            console.warn('[Firebase] Could not fetch members from Realtime Database:', err?.message);
            return null;
        }
    }

    public async saveMember(member: Member): Promise<void> {
        if (!this.initialized || !this.db) return;
        try {
            await set(ref(this.db, `members/${member.id}`), {
                id: member.id,
                rollNo: member.rollNo,
                name: member.name,
                department: member.department,
                email: member.email,
                phone: member.phone,
                joinDate: member.joinDate,
                updatedAt: new Date().toISOString()
            });
            this.isConnected = true;
            console.log(`[Firebase Sync]: Saved Member #${member.id} ('${member.name}') to Realtime Database.`);
        } catch (err: any) {
            console.warn(`[Firebase Sync Error]: Failed to save member #${member.id}:`, err?.message);
        }
    }

    // --- TRANSACTIONS ---

    public async fetchTransactions(): Promise<Transaction[] | null> {
        if (!this.initialized || !this.db) return null;
        try {
            const snapshot = await get(ref(this.db, 'transactions'));
            if (!snapshot.exists()) {
                this.isConnected = true;
                return [];
            }

            const val = snapshot.val();
            const list: Transaction[] = [];
            const rawItems = Array.isArray(val) ? val : Object.values(val);

            for (const data of rawItems) {
                if (!data) continue;
                list.push(
                    new Transaction(
                        Number(data.id),
                        Number(data.bookId),
                        String(data.bookTitle || ''),
                        Number(data.memberId),
                        String(data.memberName || ''),
                        String(data.memberRollNo || ''),
                        String(data.issueDate || ''),
                        String(data.dueDate || ''),
                        data.returnDate ? String(data.returnDate) : null,
                        Number(data.fineAmount || 0),
                        (data.status === 'RETURNED' ? 'RETURNED' : 'ISSUED')
                    )
                );
            }

            this.isConnected = true;
            console.log(`[Firebase] Fetched ${list.length} transactions from Realtime Database.`);
            return list;
        } catch (err: any) {
            console.warn('[Firebase] Could not fetch transactions from Realtime Database:', err?.message);
            return null;
        }
    }

    public async saveTransaction(transaction: Transaction): Promise<void> {
        if (!this.initialized || !this.db) return;
        try {
            await set(ref(this.db, `transactions/${transaction.id}`), {
                id: transaction.id,
                bookId: transaction.bookId,
                bookTitle: transaction.bookTitle,
                memberId: transaction.memberId,
                memberName: transaction.memberName,
                memberRollNo: transaction.memberRollNo,
                issueDate: transaction.issueDate,
                dueDate: transaction.dueDate,
                returnDate: transaction.returnDate,
                fineAmount: transaction.fineAmount,
                status: transaction.status,
                updatedAt: new Date().toISOString()
            });
            this.isConnected = true;
            console.log(`[Firebase Sync]: Saved Transaction #${transaction.id} to Realtime Database.`);
        } catch (err: any) {
            console.warn(`[Firebase Sync Error]: Failed to save transaction #${transaction.id}:`, err?.message);
        }
    }

    // --- SEED INITIAL DATA TO REALTIME DATABASE ---

    public async seedInitialData(books: Book[], members: Member[], transactions: Transaction[]): Promise<void> {
        if (!this.initialized || !this.db) return;
        try {
            console.log('[Firebase] Uploading default college records to Realtime Database...');
            for (const b of books) {
                await this.saveBook(b);
            }
            for (const m of members) {
                await this.saveMember(m);
            }
            for (const t of transactions) {
                await this.saveTransaction(t);
            }
            this.isConnected = true;
            console.log('[Firebase] Realtime Database populated successfully!');
        } catch (err: any) {
            console.warn('[Firebase] Seeding warning:', err?.message);
        }
    }
}

export const firebaseService = new FirebaseService();
