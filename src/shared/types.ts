/**
 * ===================================================================
 * COLLEGE MINI PROJECT: LIBRARY MANAGEMENT SYSTEM (100 MARKS)
 * Student Developer: Aditya
 * Tech Stack: Full-Stack TypeScript (Node.js + Express + Vanilla TS)
 * Shared TypeScript Types & Data Models
 * ===================================================================
 */

export interface Book {
    id: number;
    title: string;
    author: string;
    category: string;
    isbn: string;
    totalCopies: number;
    availableCopies: number;
    addedDate: string;
}

export interface Member {
    id: number;
    rollNo: string;
    name: string;
    department: string;
    email: string;
    phone: string;
    joinDate: string;
}

export type TransactionStatus = 'ISSUED' | 'RETURNED';

export interface Transaction {
    id: number;
    bookId: number;
    bookTitle: string;
    memberId: number;
    memberName: string;
    memberRollNo: string;
    issueDate: string;
    dueDate: string;
    returnDate: string | null;
    fineAmount: number;
    status: TransactionStatus;
}

export interface StatsResponse {
    totalTitles: number;
    totalCopies: number;
    availableCopies: number;
    issuedBooks: number;
    totalMembers: number;
    totalFine: string;
}

export interface ApiResponse<T = unknown> {
    success: boolean;
    message?: string;
    data?: T;
    book?: Book;
    member?: Member;
    transaction?: Transaction;
}
