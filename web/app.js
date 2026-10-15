/**
 * ===================================================================
 * COLLEGE MINI PROJECT: LIBRARY MANAGEMENT SYSTEM (100 MARKS)
 * Student: Aditya
 * Frontend Logic: Pure Vanilla JavaScript (app.js)
 * ZERO frameworks, ZERO npm - Clean, Readable, Viva Ready
 * ===================================================================
 */

// Application State Cache
let booksCache = [];
let membersCache = [];
let transactionsCache = [];

// Initialize application on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    initExpectedDueDate();
    loadAllData();
});

// -------------------------------------------------------------------
// 1. NAVIGATION & TABS
// -------------------------------------------------------------------

function initTabs() {
    const tabs = document.querySelectorAll('.nav-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.getAttribute('data-tab');
            switchTab(target);
        });
    });
}

function switchTab(tabId) {
    // Update Tab Buttons
    document.querySelectorAll('.nav-tab').forEach(tab => {
        if (tab.getAttribute('data-tab') === tabId) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });

    // Update Tab Panes
    document.querySelectorAll('.tab-pane').forEach(pane => {
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

async function loadAllData() {
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
async function loadStats() {
    try {
        const res = await fetch('/api/stats');
        if (!res.ok) throw new Error('Network error');
        const data = await res.json();

        document.getElementById('stat-total-titles').innerText = data.totalTitles || 0;
        document.getElementById('stat-total-copies').innerText = `${data.totalCopies || 0} Total Physical Copies`;
        document.getElementById('stat-available-copies').innerText = data.availableCopies || 0;
        document.getElementById('stat-issued-books').innerText = data.issuedBooks || 0;
        document.getElementById('stat-total-members').innerText = data.totalMembers || 0;
        document.getElementById('stat-total-fine').innerText = `₹${parseFloat(data.totalFine || 0).toFixed(2)}`;
    } catch (err) {
        console.error('Error fetching stats:', err);
    }
}

/**
 * Loads Books Catalog from /api/books
 */
async function loadBooks() {
    try {
        const res = await fetch('/api/books');
        if (!res.ok) throw new Error('Failed to load books');
        booksCache = await res.json();

        renderBooksTable(booksCache);
        populateIssueBooksDropdown(booksCache);
        document.getElementById('bookCountBadge').innerText = booksCache.length;
    } catch (err) {
        console.error('Error fetching books:', err);
        document.getElementById('booksTableBody').innerHTML = `<tr><td colspan="9" class="text-center" style="color:var(--danger)">Error loading books</td></tr>`;
    }
}

/**
 * Loads Members from /api/members
 */
async function loadMembers() {
    try {
        const res = await fetch('/api/members');
        if (!res.ok) throw new Error('Failed to load members');
        membersCache = await res.json();

        renderMembersTable(membersCache);
        populateIssueMembersDropdown(membersCache);
        document.getElementById('memberCountBadge').innerText = membersCache.length;
    } catch (err) {
        console.error('Error fetching members:', err);
        document.getElementById('membersTableBody').innerHTML = `<tr><td colspan="7" class="text-center" style="color:var(--danger)">Error loading members</td></tr>`;
    }
}

/**
 * Loads Transactions from /api/transactions
 */
async function loadTransactions() {
    try {
        const res = await fetch('/api/transactions');
        if (!res.ok) throw new Error('Failed to load transactions');
        transactionsCache = await res.json();

        renderTransactionsTable(transactionsCache);
        renderDashboardRecentLoans(transactionsCache);
        populateReturnTransactionsDropdown(transactionsCache);
    } catch (err) {
        console.error('Error fetching transactions:', err);
        document.getElementById('transactionsTableBody').innerHTML = `<tr><td colspan="9" class="text-center" style="color:var(--danger)">Error loading transactions</td></tr>`;
    }
}

// -------------------------------------------------------------------
// 3. TABLE RENDERING FUNCTIONS
// -------------------------------------------------------------------

function renderBooksTable(list) {
    const tbody = document.getElementById('booksTableBody');
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

function renderMembersTable(list) {
    const tbody = document.getElementById('membersTableBody');
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

function renderTransactionsTable(list) {
    const tbody = document.getElementById('transactionsTableBody');
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

function renderDashboardRecentLoans(list) {
    const tbody = document.getElementById('dashboard-recent-tbody');
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

function populateIssueBooksDropdown(books) {
    const select = document.getElementById('issueBookSelect');
    select.innerHTML = '<option value="">-- Choose Available Book --</option>';
    books.filter(b => b.availableCopies > 0).forEach(b => {
        const opt = document.createElement('option');
        opt.value = b.id;
        opt.textContent = `${b.title} (${b.availableCopies} available)`;
        select.appendChild(opt);
    });
}

function populateIssueMembersDropdown(members) {
    const select = document.getElementById('issueMemberSelect');
    select.innerHTML = '<option value="">-- Choose Student Member --</option>';
    members.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m.id;
        opt.textContent = `${m.name} (${m.rollNo} - ${m.department})`;
        select.appendChild(opt);
    });
}

function populateReturnTransactionsDropdown(transactions) {
    const select = document.getElementById('returnTransactionSelect');
    select.innerHTML = '<option value="">-- Choose Active Loan --</option>';
    const issuedLoans = transactions.filter(t => t.status === 'ISSUED');

    issuedLoans.forEach(t => {
        const opt = document.createElement('option');
        opt.value = t.id;
        opt.textContent = `#${t.id}: ${t.memberName} - "${t.bookTitle}" (Due: ${t.dueDate})`;
        select.appendChild(opt);
    });

    updateReturnFinePreview();
}

function updateReturnFinePreview() {
    const select = document.getElementById('returnTransactionSelect');
    const transId = parseInt(select.value);
    const trans = transactionsCache.find(t => t.id === transId);

    if (trans) {
        document.getElementById('fineBorrowerName').innerText = `${trans.memberName} (${trans.memberRollNo})`;
        document.getElementById('fineDueDate').innerText = trans.dueDate;
        document.getElementById('finePenaltyAmount').innerText = `₹${parseFloat(trans.fineAmount).toFixed(2)}`;
    } else {
        document.getElementById('fineBorrowerName').innerText = '-';
        document.getElementById('fineDueDate').innerText = '-';
        document.getElementById('finePenaltyAmount').innerText = '₹0.00';
    }
}

// -------------------------------------------------------------------
// 5. USER ACTIONS & FORM HANDLERS
// -------------------------------------------------------------------

async function handleAddBook(e) {
    e.preventDefault();
    const title = document.getElementById('bookTitle').value.trim();
    const author = document.getElementById('bookAuthor').value.trim();
    const category = document.getElementById('bookCategory').value;
    const copies = document.getElementById('bookCopies').value;
    const isbn = document.getElementById('bookIsbn').value.trim();

    try {
        const res = await fetch('/api/books', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, author, category, copies, isbn })
        });
        const data = await res.json();
        if (data.success) {
            showToast('Book added successfully to library database!', 'success');
            closeModal('addBookModal');
            document.getElementById('addBookForm').reset();
            await loadBooks();
            await loadStats();
        } else {
            showToast(data.message || 'Failed to add book', 'error');
        }
    } catch (err) {
        showToast('Error connecting to backend server', 'error');
    }
}

async function handleDeleteBook(id, title) {
    if (!confirm(`Are you sure you want to remove "${title}" from the library inventory?`)) return;

    try {
        const res = await fetch(`/api/books?id=${id}`, {
            method: 'DELETE'
        });
        const data = await res.json();
        if (data.success) {
            showToast('Book removed from database', 'success');
            await loadBooks();
            await loadStats();
        } else {
            showToast(data.message || 'Cannot delete book', 'error');
        }
    } catch (err) {
        showToast('Server connection error', 'error');
    }
}

async function handleAddMember(e) {
    e.preventDefault();
    const rollNo = document.getElementById('memberRollNo').value.trim();
    const name = document.getElementById('memberName').value.trim();
    const department = document.getElementById('memberDept').value;
    const phone = document.getElementById('memberPhone').value.trim();
    const email = document.getElementById('memberEmail').value.trim();

    try {
        const res = await fetch('/api/members', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rollNo, name, department, phone, email })
        });
        const data = await res.json();
        if (data.success) {
            showToast('Student member registered successfully!', 'success');
            closeModal('addMemberModal');
            document.getElementById('addMemberForm').reset();
            await loadMembers();
            await loadStats();
        } else {
            showToast(data.message || 'Registration failed', 'error');
        }
    } catch (err) {
        showToast('Server connection error', 'error');
    }
}

async function handleIssueBook(e) {
    e.preventDefault();
    const bookId = document.getElementById('issueBookSelect').value;
    const memberId = document.getElementById('issueMemberSelect').value;
    const days = document.getElementById('issueDays').value;

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
        const data = await res.json();
        if (data.success) {
            showToast(data.message, 'success');
            document.getElementById('issueBookForm').reset();
            initExpectedDueDate();
            await loadAllData();
        } else {
            showToast(data.message || 'Could not issue book', 'error');
        }
    } catch (err) {
        showToast('Server communication error', 'error');
    }
}

async function handleReturnBook(e) {
    e.preventDefault();
    const transactionId = document.getElementById('returnTransactionSelect').value;

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
        const data = await res.json();
        if (data.success) {
            const fine = data.transaction ? data.transaction.fineAmount : 0;
            const msg = fine > 0 ? `Book returned! Overdue fine of ₹${fine.toFixed(2)} applied.` : 'Book returned successfully!';
            showToast(msg, 'success');
            document.getElementById('returnBookForm').reset();
            updateReturnFinePreview();
            await loadAllData();
        } else {
            showToast(data.message || 'Return failed', 'error');
        }
    } catch (err) {
        showToast('Server error during return', 'error');
    }
}

function quickIssueBook(bookId) {
    switchTab('issue-return');
    setTimeout(() => {
        const select = document.getElementById('issueBookSelect');
        select.value = bookId;
    }, 100);
}

// -------------------------------------------------------------------
// 6. LIVE SEARCH & FILTERING
// -------------------------------------------------------------------

function filterBooks() {
    const q = document.getElementById('bookSearchInput').value.toLowerCase();
    const cat = document.getElementById('bookCategoryFilter').value;

    const filtered = booksCache.filter(b => {
        const matchesQ = b.title.toLowerCase().includes(q) ||
                         b.author.toLowerCase().includes(q) ||
                         (b.isbn && b.isbn.toLowerCase().includes(q));
        const matchesCat = !cat || b.category === cat;
        return matchesQ && matchesCat;
    });

    renderBooksTable(filtered);
}

function filterMembers() {
    const q = document.getElementById('memberSearchInput').value.toLowerCase();
    const filtered = membersCache.filter(m => {
        return m.name.toLowerCase().includes(q) ||
               m.rollNo.toLowerCase().includes(q) ||
               m.department.toLowerCase().includes(q);
    });
    renderMembersTable(filtered);
}

function filterTransactions() {
    const q = document.getElementById('transactionSearchInput').value.toLowerCase();
    const status = document.getElementById('transactionStatusFilter').value;

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

function openModal(id) {
    const m = document.getElementById(id);
    if (m) m.classList.add('active');
}

function closeModal(id) {
    const m = document.getElementById(id);
    if (m) m.classList.remove('active');
}

// Close modal if user clicks outside of box
window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
        e.target.classList.remove('active');
    }
});

function showToast(msg, type = 'success') {
    const container = document.getElementById('toastContainer');
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

function initExpectedDueDate() {
    const daysInput = document.getElementById('issueDays');
    if (!daysInput) return;

    function updatePreview() {
        const days = parseInt(daysInput.value) || 14;
        const d = new Date();
        d.setDate(d.getDate() + days);
        const formatted = d.toISOString().split('T')[0];
        document.getElementById('expectedDueDateText').innerText = formatted;
    }

    daysInput.addEventListener('input', updatePreview);
    updatePreview();
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
