/**
 * ===================================================================
 * COLLEGE MINI PROJECT: LIBRARY MANAGEMENT SYSTEM (100 MARKS)
 * Student: Aditya
 * Frontend Logic: Pure TypeScript (app.ts)
 * Features: Type-Safe REST API client, Live Search, Modals, Toasts
 * ===================================================================
 */

import { Book, Member, Transaction, StatsResponse, ApiResponse } from '../shared/types';

// Declare globals on Window for HTML inline handlers
declare global {
    interface Window {
        openModal: (id: string) => void;
        closeModal: (id: string) => void;
        quickIssueBook: (bookId: number) => void;
        handleDeleteBook: (id: number, title: string) => Promise<void>;
        handleAddBook: (e: Event) => Promise<void>;
        handleAddMember: (e: Event) => Promise<void>;
        handleIssueBook: (e: Event) => Promise<void>;
        handleReturnBook: (e: Event) => Promise<void>;
        filterBooks: () => void;
        filterMembers: () => void;
        filterTransactions: () => void;
        updateReturnFinePreview: () => void;
        switchTab: (tabId: string) => void;
    }
}

// Application State Cache
let booksCache: Book[] = [];
let membersCache: Member[] = [];
let transactionsCache: Transaction[] = [];

// Initialize application on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    initExpectedDueDate();
    initEventListeners();
    loadAllData();
});

// -------------------------------------------------------------------
// 1. NAVIGATION & TABS
// -------------------------------------------------------------------

function initTabs(): void {
    const tabs = document.querySelectorAll<HTMLElement>('.nav-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.getAttribute('data-tab');
            if (target) {
                switchTab(target);
            }
        });
    });
}

export function switchTab(tabId: string): void {
    // Update Tab Buttons
    document.querySelectorAll<HTMLElement>('.nav-tab').forEach(tab => {
        if (tab.getAttribute('data-tab') === tabId) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });

    // Update Tab Panes
    document.querySelectorAll<HTMLElement>('.tab-pane').forEach(pane => {
        pane.classList.remove('active');
    });

    const activePane = document.getElementById(`tab-${tabId}`);
    if (activePane) {
        activePane.classList.add('active');
    }

    // Refresh data when switching tabs
    if (tabId === 'dashboard') loadStats();
    if (tabId === 'books') loadBooks();
    if (tabId === 'members') loadMembers();
    if (tabId === 'transactions') loadTransactions();
}

// -------------------------------------------------------------------
// 2. DATA LOADERS & REST API CALLS
// -------------------------------------------------------------------

export async function loadAllData(): Promise<void> {
    await Promise.all([
        loadStats(),
        loadBooks(),
        loadMembers(),
        loadTransactions()
    ]);
}

/**
 * Loads Dashboard Metrics from /api/stats
 */
export async function loadStats(): Promise<void> {
    try {
        const res = await fetch('/api/stats');
        if (!res.ok) throw new Error('Network error');
        const data: StatsResponse = await res.json();

        setElementText('stat-total-titles', String(data.totalTitles || 0));
        setElementText('stat-total-copies', `${data.totalCopies || 0} Total Physical Copies`);
        setElementText('stat-available-copies', String(data.availableCopies || 0));
        setElementText('stat-issued-books', String(data.issuedBooks || 0));
        setElementText('stat-total-members', String(data.totalMembers || 0));
        setElementText('stat-total-fine', `₹${parseFloat(String(data.totalFine || 0)).toFixed(2)}`);
    } catch (err) {
        console.error('Error fetching stats:', err);
    }
}

/**
 * Loads Books Catalog from /api/books
 */
export async function loadBooks(): Promise<void> {
    const tbody = document.getElementById('booksTableBody');
    try {
        const res = await fetch('/api/books');
        if (!res.ok) throw new Error('Failed to load books');
        booksCache = await res.json();

        renderBooksTable(booksCache);
        populateIssueBooksDropdown(booksCache);
        setElementText('bookCountBadge', String(booksCache.length));
    } catch (err) {
        console.error('Error fetching books:', err);
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="9" class="text-center" style="color:var(--danger)">Error loading books</td></tr>`;
        }
    }
}

/**
 * Loads Members from /api/members
 */
export async function loadMembers(): Promise<void> {
    const tbody = document.getElementById('membersTableBody');
    try {
        const res = await fetch('/api/members');
        if (!res.ok) throw new Error('Failed to load members');
        membersCache = await res.json();

        renderMembersTable(membersCache);
        populateIssueMembersDropdown(membersCache);
        setElementText('memberCountBadge', String(membersCache.length));
    } catch (err) {
        console.error('Error fetching members:', err);
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="7" class="text-center" style="color:var(--danger)">Error loading members</td></tr>`;
        }
    }
}

/**
 * Loads Transactions from /api/transactions
 */
export async function loadTransactions(): Promise<void> {
    const tbody = document.getElementById('transactionsTableBody');
    try {
        const res = await fetch('/api/transactions');
        if (!res.ok) throw new Error('Failed to load transactions');
        transactionsCache = await res.json();

        renderTransactionsTable(transactionsCache);
        renderDashboardRecentLoans(transactionsCache);
        populateReturnTransactionsDropdown(transactionsCache);
    } catch (err) {
        console.error('Error fetching transactions:', err);
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="9" class="text-center" style="color:var(--danger)">Error loading transactions</td></tr>`;
        }
    }
}

// -------------------------------------------------------------------
// 3. TABLE RENDERING FUNCTIONS
// -------------------------------------------------------------------

export function renderBooksTable(list: Book[]): void {
    const tbody = document.getElementById('booksTableBody');
    if (!tbody) return;

    if (!list || list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" class="text-center">No books found in library.</td></tr>`;
        return;
    }

    tbody.innerHTML = list.map(b => {
        let badgeClass = 'badge-in-stock';
        let badgeText = 'In Stock';
        if (b.availableCopies === 0) {
            badgeClass = 'badge-out-of-stock';
            badgeText = 'Out of Stock';
        } else if (b.availableCopies <= 2) {
            badgeClass = 'badge-low-stock';
            badgeText = 'Low Stock';
        }

        return `
            <tr>
                <td><strong>#${b.id}</strong></td>
                <td><strong style="color:#fff">${escapeHtml(b.title)}</strong></td>
                <td>${escapeHtml(b.author)}</td>
                <td><span class="badge badge-info">${escapeHtml(b.category)}</span></td>
                <td><code style="font-family:var(--font-mono);font-size:0.8rem">${escapeHtml(b.isbn || 'N/A')}</code></td>
                <td>${b.totalCopies}</td>
                <td><strong>${b.availableCopies}</strong></td>
                <td><span class="badge ${badgeClass}">${badgeText}</span></td>
                <td>
                    ${b.availableCopies > 0 ? `<button class="btn-issue-sm" onclick="quickIssueBook(${b.id})">Issue</button>` : ''}
                    <button class="btn-danger-sm" onclick="handleDeleteBook(${b.id}, '${escapeHtml(b.title)}')">Delete</button>
                </td>
            </tr>
        `;
    }).join('');
}

export function renderMembersTable(list: Member[]): void {
    const tbody = document.getElementById('membersTableBody');
    if (!tbody) return;

    if (!list || list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center">No registered members found.</td></tr>`;
        return;
    }

    tbody.innerHTML = list.map(m => `
        <tr>
            <td><strong>#${m.id}</strong></td>
            <td><code style="font-family:var(--font-mono);color:#a5b4fc">${escapeHtml(m.rollNo)}</code></td>
            <td><strong style="color:#fff">${escapeHtml(m.name)}</strong></td>
            <td><span class="badge badge-info">${escapeHtml(m.department)}</span></td>
            <td>${escapeHtml(m.email)}</td>
            <td>${escapeHtml(m.phone)}</td>
            <td>${escapeHtml(m.joinDate)}</td>
        </tr>
    `).join('');
}

export function renderTransactionsTable(list: Transaction[]): void {
    const tbody = document.getElementById('transactionsTableBody');
    if (!tbody) return;

    if (!list || list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" class="text-center">No transaction records found.</td></tr>`;
        return;
    }

    tbody.innerHTML = list.map(t => {
        const isIssued = t.status === 'ISSUED';
        const isOverdue = isIssued && new Date(t.dueDate) < new Date();
        const badgeClass = !isIssued ? 'badge-returned' : (isOverdue ? 'badge-overdue' : 'badge-issued');
        const statusText = !isIssued ? 'RETURNED' : (isOverdue ? 'OVERDUE' : 'ISSUED');

        return `
            <tr>
                <td><strong>#${t.id}</strong></td>
                <td><code style="font-family:var(--font-mono)">${escapeHtml(t.memberRollNo)}</code></td>
                <td><strong style="color:#fff">${escapeHtml(t.memberName)}</strong></td>
                <td>${escapeHtml(t.bookTitle)}</td>
                <td>${escapeHtml(t.issueDate)}</td>
                <td>${escapeHtml(t.dueDate)}</td>
                <td>${t.returnDate ? escapeHtml(t.returnDate) : '<em style="color:var(--text-muted)">Pending</em>'}</td>
                <td><strong style="color:${t.fineAmount > 0 ? '#fbbf24' : 'var(--text-secondary)'}">₹${t.fineAmount.toFixed(2)}</strong></td>
                <td><span class="badge ${badgeClass}">${statusText}</span></td>
            </tr>
        `;
    }).join('');
}

export function renderDashboardRecentLoans(list: Transaction[]): void {
    const tbody = document.getElementById('dashboard-recent-tbody');
    if (!tbody) return;

    const active = list.filter(t => t.status === 'ISSUED').slice(0, 5);

    if (active.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center">No active book loans at the moment.</td></tr>`;
        return;
    }

    tbody.innerHTML = active.map(t => {
        const isOverdue = new Date(t.dueDate) < new Date();
        return `
            <tr>
                <td><strong style="color:#fff">${escapeHtml(t.memberName)}</strong><br><small style="color:var(--text-muted)">${escapeHtml(t.memberRollNo)}</small></td>
                <td>${escapeHtml(t.bookTitle)}</td>
                <td><span style="color:${isOverdue ? 'var(--danger)' : 'var(--text-secondary)'}">${escapeHtml(t.dueDate)}</span></td>
                <td><strong style="color:${t.fineAmount > 0 ? '#fbbf24' : 'var(--text-secondary)'}">₹${t.fineAmount.toFixed(2)}</strong></td>
            </tr>
        `;
    }).join('');
}

// -------------------------------------------------------------------
// 4. DROPDOWN POPULATORS
// -------------------------------------------------------------------

export function populateIssueBooksDropdown(books: Book[]): void {
    const select = document.getElementById('issueBookSelect') as HTMLSelectElement | null;
    if (!select) return;

    select.innerHTML = '<option value="">-- Choose Available Book --</option>';
    books.filter(b => b.availableCopies > 0).forEach(b => {
        const opt = document.createElement('option');
        opt.value = String(b.id);
        opt.textContent = `${b.title} (${b.availableCopies} available)`;
        select.appendChild(opt);
    });
}

export function populateIssueMembersDropdown(members: Member[]): void {
    const select = document.getElementById('issueMemberSelect') as HTMLSelectElement | null;
    if (!select) return;

    select.innerHTML = '<option value="">-- Choose Student Member --</option>';
    members.forEach(m => {
        const opt = document.createElement('option');
        opt.value = String(m.id);
        opt.textContent = `${m.name} (${m.rollNo} - ${m.department})`;
        select.appendChild(opt);
    });
}

export function populateReturnTransactionsDropdown(transactions: Transaction[]): void {
    const select = document.getElementById('returnTransactionSelect') as HTMLSelectElement | null;
    if (!select) return;

    select.innerHTML = '<option value="">-- Choose Active Loan --</option>';
    const issuedLoans = transactions.filter(t => t.status === 'ISSUED');

    issuedLoans.forEach(t => {
        const opt = document.createElement('option');
        opt.value = String(t.id);
        opt.textContent = `#${t.id}: ${t.memberName} - "${t.bookTitle}" (Due: ${t.dueDate})`;
        select.appendChild(opt);
    });

    updateReturnFinePreview();
}

export function updateReturnFinePreview(): void {
    const select = document.getElementById('returnTransactionSelect') as HTMLSelectElement | null;
    if (!select) return;

    const transId = parseInt(select.value, 10);
    const trans = transactionsCache.find(t => t.id === transId);

    if (trans) {
        setElementText('fineBorrowerName', `${trans.memberName} (${trans.memberRollNo})`);
        setElementText('fineDueDate', trans.dueDate);
        setElementText('finePenaltyAmount', `₹${parseFloat(String(trans.fineAmount)).toFixed(2)}`);
    } else {
        setElementText('fineBorrowerName', '-');
        setElementText('fineDueDate', '-');
        setElementText('finePenaltyAmount', '₹0.00');
    }
}

// -------------------------------------------------------------------
// 5. USER ACTIONS & FORM HANDLERS
// -------------------------------------------------------------------

export async function handleAddBook(e: Event): Promise<void> {
    e.preventDefault();
    const title = getInputValue('bookTitle');
    const author = getInputValue('bookAuthor');
    const category = getInputValue('bookCategory');
    const copies = getInputValue('bookCopies');
    const isbn = getInputValue('bookIsbn');

    try {
        const res = await fetch('/api/books', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, author, category, copies, isbn })
        });
        const data: ApiResponse = await res.json();
        if (data.success) {
            showToast('Book added successfully to library database!', 'success');
            closeModal('addBookModal');
            const form = document.getElementById('addBookForm') as HTMLFormElement | null;
            if (form) form.reset();
            await loadBooks();
            await loadStats();
        } else {
            showToast(data.message || 'Failed to add book', 'error');
        }
    } catch {
        showToast('Error connecting to backend server', 'error');
    }
}

export async function handleDeleteBook(id: number, title: string): Promise<void> {
    if (!confirm(`Are you sure you want to remove "${title}" from the library inventory?`)) return;

    try {
        const res = await fetch(`/api/books?id=${id}`, {
            method: 'DELETE'
        });
        const data: ApiResponse = await res.json();
        if (data.success) {
            showToast('Book removed from database', 'success');
            await loadBooks();
            await loadStats();
        } else {
            showToast(data.message || 'Cannot delete book', 'error');
        }
    } catch {
        showToast('Server connection error', 'error');
    }
}

export async function handleAddMember(e: Event): Promise<void> {
    e.preventDefault();
    const rollNo = getInputValue('memberRollNo');
    const name = getInputValue('memberName');
    const department = getInputValue('memberDept');
    const phone = getInputValue('memberPhone');
    const email = getInputValue('memberEmail');

    try {
        const res = await fetch('/api/members', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rollNo, name, department, phone, email })
        });
        const data: ApiResponse = await res.json();
        if (data.success) {
            showToast('Student member registered successfully!', 'success');
            closeModal('addMemberModal');
            const form = document.getElementById('addMemberForm') as HTMLFormElement | null;
            if (form) form.reset();
            await loadMembers();
            await loadStats();
        } else {
            showToast(data.message || 'Registration failed', 'error');
        }
    } catch {
        showToast('Server connection error', 'error');
    }
}

export async function handleIssueBook(e: Event): Promise<void> {
    e.preventDefault();
    const bookId = getInputValue('issueBookSelect');
    const memberId = getInputValue('issueMemberSelect');
    const days = getInputValue('issueDays');

    if (!bookId || !memberId) {
        showToast('Please select both a book and a student.', 'error');
        return;
    }

    try {
        const res = await fetch('/api/issue', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bookId, memberId, days })
        });
        const data: ApiResponse = await res.json();
        if (data.success) {
            showToast(data.message || 'Book issued successfully!', 'success');
            const form = document.getElementById('issueBookForm') as HTMLFormElement | null;
            if (form) form.reset();
            initExpectedDueDate();
            await loadAllData();
        } else {
            showToast(data.message || 'Could not issue book', 'error');
        }
    } catch {
        showToast('Server communication error', 'error');
    }
}

export async function handleReturnBook(e: Event): Promise<void> {
    e.preventDefault();
    const transactionId = getInputValue('returnTransactionSelect');

    if (!transactionId) {
        showToast('Please select a borrowed book to return.', 'error');
        return;
    }

    try {
        const res = await fetch('/api/return', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ transactionId })
        });
        const data: ApiResponse = await res.json();
        if (data.success) {
            const fine = data.transaction ? data.transaction.fineAmount : 0;
            const msg = fine > 0 ? `Book returned! Overdue fine of ₹${fine.toFixed(2)} applied.` : 'Book returned successfully!';
            showToast(msg, 'success');
            const form = document.getElementById('returnBookForm') as HTMLFormElement | null;
            if (form) form.reset();
            updateReturnFinePreview();
            await loadAllData();
        } else {
            showToast(data.message || 'Return failed', 'error');
        }
    } catch {
        showToast('Server error during return', 'error');
    }
}

export function quickIssueBook(bookId: number): void {
    switchTab('issue-return');
    setTimeout(() => {
        const select = document.getElementById('issueBookSelect') as HTMLSelectElement | null;
        if (select) {
            select.value = String(bookId);
        }
    }, 100);
}

// -------------------------------------------------------------------
// 6. LIVE SEARCH & FILTERING
// -------------------------------------------------------------------

export function filterBooks(): void {
    const q = getInputValue('bookSearchInput').toLowerCase();
    const cat = getInputValue('bookCategoryFilter');

    const filtered = booksCache.filter(b => {
        const matchesQ = b.title.toLowerCase().includes(q) ||
                         b.author.toLowerCase().includes(q) ||
                         (b.isbn && b.isbn.toLowerCase().includes(q));
        const matchesCat = !cat || b.category === cat;
        return matchesQ && matchesCat;
    });

    renderBooksTable(filtered);
}

export function filterMembers(): void {
    const q = getInputValue('memberSearchInput').toLowerCase();
    const filtered = membersCache.filter(m => {
        return m.name.toLowerCase().includes(q) ||
               m.rollNo.toLowerCase().includes(q) ||
               m.department.toLowerCase().includes(q);
    });
    renderMembersTable(filtered);
}

export function filterTransactions(): void {
    const q = getInputValue('transactionSearchInput').toLowerCase();
    const status = getInputValue('transactionStatusFilter');

    const filtered = transactionsCache.filter(t => {
        const matchesQ = t.memberName.toLowerCase().includes(q) ||
                         t.memberRollNo.toLowerCase().includes(q) ||
                         t.bookTitle.toLowerCase().includes(q);
        const matchesStatus = !status || t.status === status;
        return matchesQ && matchesStatus;
    });

    renderTransactionsTable(filtered);
}

// -------------------------------------------------------------------
// 7. MODALS, TOASTS & UTILS
// -------------------------------------------------------------------

export function openModal(id: string): void {
    const m = document.getElementById(id);
    if (m) m.classList.add('active');
}

export function closeModal(id: string): void {
    const m = document.getElementById(id);
    if (m) m.classList.remove('active');
}

export function showToast(msg: string, type: 'success' | 'error' = 'success'): void {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icon = type === 'success' ? '✅' : '⚠️';
    toast.innerHTML = `<span>${icon}</span> <span>${escapeHtml(msg)}</span>`;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

function initExpectedDueDate(): void {
    const daysInput = document.getElementById('issueDays') as HTMLInputElement | null;
    if (!daysInput) return;

    function updatePreview(): void {
        const days = parseInt(daysInput!.value, 10) || 14;
        const d = new Date();
        d.setDate(d.getDate() + days);
        const formatted = d.toISOString().split('T')[0];
        setElementText('expectedDueDateText', formatted);
    }

    daysInput.addEventListener('input', updatePreview);
    updatePreview();
}

function initEventListeners(): void {
    // Window click for modal background
    window.addEventListener('click', (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target && target.classList.contains('modal-overlay')) {
            target.classList.remove('active');
        }
    });

    // Form Submissions
    const addBookForm = document.getElementById('addBookForm');
    if (addBookForm) addBookForm.addEventListener('submit', handleAddBook);

    const addMemberForm = document.getElementById('addMemberForm');
    if (addMemberForm) addMemberForm.addEventListener('submit', handleAddMember);

    const issueBookForm = document.getElementById('issueBookForm');
    if (issueBookForm) issueBookForm.addEventListener('submit', handleIssueBook);

    const returnBookForm = document.getElementById('returnBookForm');
    if (returnBookForm) returnBookForm.addEventListener('submit', handleReturnBook);

    // Filter Inputs
    const bookSearch = document.getElementById('bookSearchInput');
    if (bookSearch) bookSearch.addEventListener('input', filterBooks);

    const bookCat = document.getElementById('bookCategoryFilter');
    if (bookCat) bookCat.addEventListener('change', filterBooks);

    const memberSearch = document.getElementById('memberSearchInput');
    if (memberSearch) memberSearch.addEventListener('input', filterMembers);

    const transSearch = document.getElementById('transactionSearchInput');
    if (transSearch) transSearch.addEventListener('input', filterTransactions);

    const transStatus = document.getElementById('transactionStatusFilter');
    if (transStatus) transStatus.addEventListener('change', filterTransactions);

    const returnSelect = document.getElementById('returnTransactionSelect');
    if (returnSelect) returnSelect.addEventListener('change', updateReturnFinePreview);
}

// Helpers
function escapeHtml(str: string | null | undefined): string {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function getInputValue(id: string): string {
    const el = document.getElementById(id) as HTMLInputElement | HTMLSelectElement | null;
    return el ? el.value.trim() : '';
}

function setElementText(id: string, text: string): void {
    const el = document.getElementById(id);
    if (el) el.innerText = text;
}

// Bind to window for HTML inline attribute compatibility
window.openModal = openModal;
window.closeModal = closeModal;
window.quickIssueBook = quickIssueBook;
window.handleDeleteBook = handleDeleteBook;
window.handleAddBook = handleAddBook;
window.handleAddMember = handleAddMember;
window.handleIssueBook = handleIssueBook;
window.handleReturnBook = handleReturnBook;
window.filterBooks = filterBooks;
window.filterMembers = filterMembers;
window.filterTransactions = filterTransactions;
window.updateReturnFinePreview = updateReturnFinePreview;
window.switchTab = switchTab;
