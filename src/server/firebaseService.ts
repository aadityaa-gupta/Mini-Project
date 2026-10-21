import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
    getFirestore,
    collection,
    getDocs,
    doc,
    setDoc,
    deleteDoc,
    Firestore
} from 'firebase/firestore';
import { firebaseConfig } from '../shared/firebaseConfig';
import { Book } from './models/Book';
import { Member } from './models/Member';
import { Transaction } from './models/Transaction';

/**
 * ===================================================================
 * Firebase Cloud Firestore Database Service
 * Handles live synchronization between LibrariaPro and Cloud Firestore
 * Project ID: mini-2b749
 * ===================================================================
 */
export class FirebaseService {
    private app: FirebaseApp | null = null;
    private db: Firestore | null = null;
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
            this.db = getFirestore(this.app);
            this.initialized = true;
            console.log('[Firebase] Cloud Firestore SDK initialized successfully (Project: mini-2b749)');
        } catch (error: any) {
            console.warn('[Firebase] Initialization warning:', error?.message);
            this.initialized = false;
        }
    }

    public getStatus(): { initialized: boolean; connected: boolean; projectId: string } {
        return {
            initialized: this.initialized,
            connected: this.isConnected,
            projectId: firebaseConfig.projectId
        };
    }

    // --- BOOKS ---

    public async fetchBooks(): Promise<Book[] | null> {
        if (!this.initialized || !this.db) return null;
        try {
            const booksCol = collection(this.db, 'books');
            const snap = await getDocs(booksCol);
            if (snap.empty) {
                this.isConnected = true;
                return [];
            }

            const list: Book[] = [];
            snap.forEach(d => {
                const data = d.data();
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
            });
            this.isConnected = true;
            console.log(`[Firebase] Successfully fetched ${list.length} books from Cloud Firestore.`);
            return list;
        } catch (err: any) {
            console.warn('[Firebase] Could not fetch books from Firestore (falling back to local cache):', err?.message);
            return null;
        }
    }

    public async saveBook(book: Book): Promise<void> {
        if (!this.initialized || !this.db) return;
        try {
            const docRef = doc(this.db, 'books', String(book.id));
            await setDoc(docRef, {
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
            console.log(`[Firebase Sync]: Saved Book ID ${book.id} ('${book.title}') to Cloud Firestore.`);
        } catch (err: any) {
            console.warn(`[Firebase Sync Error]: Failed to save book ${book.id}:`, err?.message);
        }
    }

    public async deleteBook(bookId: number): Promise<void> {
        if (!this.initialized || !this.db) return;
        try {
            const docRef = doc(this.db, 'books', String(bookId));
            await deleteDoc(docRef);
            console.log(`[Firebase Sync]: Deleted Book ID ${bookId} from Cloud Firestore.`);
        } catch (err: any) {
            console.warn(`[Firebase Sync Error]: Failed to delete book ${bookId}:`, err?.message);
        }
    }

    // --- MEMBERS ---

    public async fetchMembers(): Promise<Member[] | null> {
        if (!this.initialized || !this.db) return null;
        try {
            const membersCol = collection(this.db, 'members');
            const snap = await getDocs(membersCol);
            if (snap.empty) {
                this.isConnected = true;
                return [];
            }

            const list: Member[] = [];
            snap.forEach(d => {
                const data = d.data();
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
            });
            this.isConnected = true;
            console.log(`[Firebase] Successfully fetched ${list.length} members from Cloud Firestore.`);
            return list;
        } catch (err: any) {
            console.warn('[Firebase] Could not fetch members from Firestore (falling back to local cache):', err?.message);
            return null;
        }
    }

    public async saveMember(member: Member): Promise<void> {
        if (!this.initialized || !this.db) return;
        try {
            const docRef = doc(this.db, 'members', String(member.id));
            await setDoc(docRef, {
                id: member.id,
                rollNo: member.rollNo,
                name: member.name,
                department: member.department,
                email: member.email,
                phone: member.phone,
                joinDate: member.joinDate,
                updatedAt: new Date().toISOString()
            });
            console.log(`[Firebase Sync]: Saved Member ID ${member.id} ('${member.name}') to Cloud Firestore.`);
        } catch (err: any) {
            console.warn(`[Firebase Sync Error]: Failed to save member ${member.id}:`, err?.message);
        }
    }

    // --- TRANSACTIONS ---

    public async fetchTransactions(): Promise<Transaction[] | null> {
        if (!this.initialized || !this.db) return null;
        try {
            const transCol = collection(this.db, 'transactions');
            const snap = await getDocs(transCol);
            if (snap.empty) {
                this.isConnected = true;
                return [];
            }

            const list: Transaction[] = [];
            snap.forEach(d => {
                const data = d.data();
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
            });
            this.isConnected = true;
            console.log(`[Firebase] Successfully fetched ${list.length} transactions from Cloud Firestore.`);
            return list;
        } catch (err: any) {
            console.warn('[Firebase] Could not fetch transactions from Firestore (falling back to local cache):', err?.message);
            return null;
        }
    }

    public async saveTransaction(transaction: Transaction): Promise<void> {
        if (!this.initialized || !this.db) return;
        try {
            const docRef = doc(this.db, 'transactions', String(transaction.id));
            await setDoc(docRef, {
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
            console.log(`[Firebase Sync]: Saved Transaction ID ${transaction.id} to Cloud Firestore.`);
        } catch (err: any) {
            console.warn(`[Firebase Sync Error]: Failed to save transaction ${transaction.id}:`, err?.message);
        }
    }

    // --- SEED INITIAL DATA TO FIRESTORE ---

    public async seedInitialData(books: Book[], members: Member[], transactions: Transaction[]): Promise<void> {
        if (!this.initialized || !this.db) return;
        try {
            console.log('[Firebase] Uploading default college records to Cloud Firestore...');
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
            console.log('[Firebase] Cloud Firestore initialized with college library records!');
        } catch (err: any) {
            console.warn('[Firebase] Seeding warning:', err?.message);
        }
    }
}

export const firebaseService = new FirebaseService();
