import models.Book;
import models.Member;
import models.Transaction;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;

/**
 * DBManager (Database & Data Access Layer)
 * -------------------------------------------------------------
 * 1. Simulates and logs authentic SQL Queries to the console.
 * 2. Persists all records (books, members, transactions) into a local data directory.
 * 3. Provides clean CRUD operations for books, members, issues, and returns.
 * 4. Pre-loaded with standard college library sample records.
 */
public class DBManager {

    private static final String DATA_DIR = "data";
    private static final String BOOKS_FILE = DATA_DIR + File.separator + "books.csv";
    private static final String MEMBERS_FILE = DATA_DIR + File.separator + "members.csv";
    private static final String TRANSACTIONS_FILE = DATA_DIR + File.separator + "transactions.csv";

    // In-memory caching for ultra-fast query performance
    private final Map<Integer, Book> books = new LinkedHashMap<>();
    private final Map<Integer, Member> members = new LinkedHashMap<>();
    private final Map<Integer, Transaction> transactions = new LinkedHashMap<>();

    private int nextBookId = 1;
    private int nextMemberId = 1;
    private int nextTransactionId = 1;

    public DBManager() {
        initDataDirectory();
        loadOrSeedData();
    }

    private void initDataDirectory() {
        File dir = new File(DATA_DIR);
        if (!dir.exists()) {
            dir.mkdirs();
        }
    }

    /**
     * Loads existing data from files, or seeds realistic default college data.
     */
    private void loadOrSeedData() {
        File bFile = new File(BOOKS_FILE);
        File mFile = new File(MEMBERS_FILE);
        File tFile = new File(TRANSACTIONS_FILE);

        if (bFile.exists() && mFile.exists() && tFile.exists()) {
            loadBooks();
            loadMembers();
            loadTransactions();
            System.out.println("[DBManager] Loaded existing database records from " + DATA_DIR + "/");
        } else {
            System.out.println("[DBManager] Initializing new database with default college library data...");
            seedDefaultData();
            saveAll();
        }
    }

    private void seedDefaultData() {
        // Seed Books
        addBookInternal(new Book(1, "Introduction to Algorithms (CLRS)", "Thomas H. Cormen", "Computer Science", "9780262033848", 5, 4, "2026-01-10"));
        addBookInternal(new Book(2, "Clean Code: A Handbook of Agile Craftsmanship", "Robert C. Martin", "Computer Science", "9780132350884", 4, 3, "2026-01-15"));
        addBookInternal(new Book(3, "Core Java Volume I: Fundamentals", "Cay S. Horstmann", "Programming", "9780135166307", 6, 6, "2026-01-20"));
        addBookInternal(new Book(4, "Database System Concepts", "Abraham Silberschatz", "Database", "9780073523323", 5, 4, "2026-02-01"));
        addBookInternal(new Book(5, "Operating System Concepts", "Peter B. Galvin", "Computer Science", "9781119800361", 4, 4, "2026-02-10"));
        addBookInternal(new Book(6, "Computer Networks", "Andrew S. Tanenbaum", "Networking", "9780132126953", 3, 3, "2026-02-15"));
        addBookInternal(new Book(7, "Design Patterns: Elements of Reusable Object-Oriented Software", "Erich Gamma et al.", "Software Engg", "9780201633610", 3, 2, "2026-02-20"));
        nextBookId = 8;

        // Seed Members
        addMemberInternal(new Member(1, "CS202601", "Aditya Sharma", "Computer Science", "aditya@cllg.edu", "9876543210", "2026-01-05"));
        addMemberInternal(new Member(2, "CS202602", "Rahul Verma", "Computer Science", "rahul.v@cllg.edu", "9876543211", "2026-01-06"));
        addMemberInternal(new Member(3, "IT202605", "Priya Patel", "Information Tech", "priya.p@cllg.edu", "9876543212", "2026-01-08"));
        addMemberInternal(new Member(4, "EC202611", "Ananya Gupta", "Electronics", "ananya.g@cllg.edu", "9876543213", "2026-01-12"));
        addMemberInternal(new Member(5, "ME202609", "Vikas Kumar", "Mechanical", "vikas.k@cllg.edu", "9876543214", "2026-01-15"));
        nextMemberId = 6;

        // Seed Transactions
        addTransactionInternal(new Transaction(1, 1, "Introduction to Algorithms (CLRS)", 1, "Aditya Sharma", "CS202601", "2026-09-15", "2026-09-29", "2026-09-28", 0.00, "RETURNED"));
        addTransactionInternal(new Transaction(2, 2, "Clean Code: A Handbook of Agile Craftsmanship", 2, "Rahul Verma", "CS202602", "2026-10-01", "2026-10-15", null, 0.00, "ISSUED"));
        addTransactionInternal(new Transaction(3, 4, "Database System Concepts", 3, "Priya Patel", "IT202605", "2026-09-20", "2026-10-04", null, 45.00, "ISSUED"));
        addTransactionInternal(new Transaction(4, 7, "Design Patterns: Elements of Reusable Object-Oriented Software", 1, "Aditya Sharma", "CS202601", "2026-10-05", "2026-10-19", null, 0.00, "ISSUED"));
        nextTransactionId = 5;
    }

    private void addBookInternal(Book b) {
        books.put(b.getId(), b);
        if (b.getId() >= nextBookId) nextBookId = b.getId() + 1;
    }

    private void addMemberInternal(Member m) {
        members.put(m.getId(), m);
        if (m.getId() >= nextMemberId) nextMemberId = m.getId() + 1;
    }

    private void addTransactionInternal(Transaction t) {
        transactions.put(t.getId(), t);
        if (t.getId() >= nextTransactionId) nextTransactionId = t.getId() + 1;
    }

    // -----------------------------------------------------------------------------------
    // SQL LOGGING & CRUD OPERATIONS
    // -----------------------------------------------------------------------------------

    public synchronized List<Book> getAllBooks() {
        System.out.println("[SQL LOG]: SELECT * FROM books ORDER BY id DESC;");
        List<Book> list = new ArrayList<>(books.values());
        Collections.reverse(list);
        return list;
    }

    public synchronized Book getBookById(int id) {
        System.out.println("[SQL LOG]: SELECT * FROM books WHERE id = " + id + ";");
        return books.get(id);
    }

    public synchronized Book addBook(String title, String author, String category, String isbn, int copies) {
        String today = LocalDate.now().toString();
        Book b = new Book(nextBookId++, title, author, category, isbn, copies, copies, today);
        books.put(b.getId(), b);

        System.out.printf("[SQL LOG]: INSERT INTO books (id, title, author, category, isbn, total_copies, available_copies, added_date) "
                + "VALUES (%d, '%s', '%s', '%s', '%s', %d, %d, '%s');%n",
                b.getId(), title.replace("'", "''"), author.replace("'", "''"), category, isbn, copies, copies, today);

        saveBooks();
        return b;
    }

    public synchronized boolean deleteBook(int id) {
        if (!books.containsKey(id)) return false;
        // Check if currently issued
        for (Transaction t : transactions.values()) {
            if (t.getBookId() == id && "ISSUED".equalsIgnoreCase(t.getStatus())) {
                System.out.println("[SQL CONSTRAINT ERROR]: Cannot delete book id=" + id + ". Copies are currently issued!");
                return false;
            }
        }
        books.remove(id);
        System.out.println("[SQL LOG]: DELETE FROM books WHERE id = " + id + ";");
        saveBooks();
        return true;
    }

    public synchronized List<Member> getAllMembers() {
        System.out.println("[SQL LOG]: SELECT * FROM members ORDER BY id DESC;");
        List<Member> list = new ArrayList<>(members.values());
        Collections.reverse(list);
        return list;
    }

    public synchronized Member addMember(String rollNo, String name, String department, String email, String phone) {
        String today = LocalDate.now().toString();
        Member m = new Member(nextMemberId++, rollNo, name, department, email, phone, today);
        members.put(m.getId(), m);

        System.out.printf("[SQL LOG]: INSERT INTO members (id, roll_no, name, department, email, phone, join_date) "
                + "VALUES (%d, '%s', '%s', '%s', '%s', '%s', '%s');%n",
                m.getId(), rollNo, name.replace("'", "''"), department, email, phone, today);

        saveMembers();
        return m;
    }

    public synchronized List<Transaction> getAllTransactions() {
        System.out.println("[SQL LOG]: SELECT t.id, t.book_id, b.title, t.member_id, m.name, m.roll_no, "
                + "t.issue_date, t.due_date, t.return_date, t.fine_amount, t.status "
                + "FROM transactions t "
                + "JOIN books b ON t.book_id = b.id "
                + "JOIN members m ON t.member_id = m.id "
                + "ORDER BY t.id DESC;");

        // Dynamically recalculate estimated fine for active issued books
        LocalDate today = LocalDate.now();
        for (Transaction t : transactions.values()) {
            if ("ISSUED".equalsIgnoreCase(t.getStatus())) {
                try {
                    LocalDate dueDate = LocalDate.parse(t.getDueDate());
                    if (today.isAfter(dueDate)) {
                        long daysOverdue = ChronoUnit.DAYS.between(dueDate, today);
                        double fine = daysOverdue * 5.0; // Rs 5 per day fine
                        t.setFineAmount(fine);
                    } else {
                        t.setFineAmount(0.0);
                    }
                } catch (Exception ignored) {}
            }
        }

        List<Transaction> list = new ArrayList<>(transactions.values());
        Collections.reverse(list);
        return list;
    }

    /**
     * Issues a book to a member.
     * Decrements available_copies in books table.
     */
    public synchronized Transaction issueBook(int bookId, int memberId, int loanDays) {
        Book b = books.get(bookId);
        Member m = members.get(memberId);

        if (b == null || m == null) {
            System.out.println("[SQL ERROR]: Invalid bookId or memberId");
            return null;
        }

        if (b.getAvailableCopies() <= 0) {
            System.out.println("[SQL ERROR]: Book '" + b.getTitle() + "' is out of stock!");
            return null;
        }

        // Deduct 1 available copy
        b.setAvailableCopies(b.getAvailableCopies() - 1);
        System.out.printf("[SQL LOG]: UPDATE books SET available_copies = %d WHERE id = %d;%n", b.getAvailableCopies(), b.getId());

        LocalDate issueDate = LocalDate.now();
        LocalDate dueDate = issueDate.plusDays(loanDays > 0 ? loanDays : 14);

        Transaction t = new Transaction(
                nextTransactionId++,
                b.getId(),
                b.getTitle(),
                m.getId(),
                m.getName(),
                m.getRollNo(),
                issueDate.toString(),
                dueDate.toString(),
                null,
                0.00,
                "ISSUED"
        );

        transactions.put(t.getId(), t);
        System.out.printf("[SQL LOG]: INSERT INTO transactions (id, book_id, member_id, issue_date, due_date, status) "
                + "VALUES (%d, %d, %d, '%s', '%s', 'ISSUED');%n",
                t.getId(), b.getId(), m.getId(), issueDate, dueDate);

        saveBooks();
        saveTransactions();
        return t;
    }

    /**
     * Returns a book.
     * Increments available_copies in books table, calculates fine if overdue.
     */
    public synchronized Transaction returnBook(int transactionId) {
        Transaction t = transactions.get(transactionId);
        if (t == null) {
            System.out.println("[SQL ERROR]: Transaction not found with id = " + transactionId);
            return null;
        }

        if ("RETURNED".equalsIgnoreCase(t.getStatus())) {
            System.out.println("[SQL WARNING]: Transaction " + transactionId + " already returned.");
            return t;
        }

        LocalDate returnDate = LocalDate.now();
        double fine = 0.0;
        try {
            LocalDate dueDate = LocalDate.parse(t.getDueDate());
            if (returnDate.isAfter(dueDate)) {
                long daysOverdue = ChronoUnit.DAYS.between(dueDate, returnDate);
                fine = daysOverdue * 5.0; // Rs 5 / day
            }
        } catch (Exception ignored) {}

        t.setReturnDate(returnDate.toString());
        t.setFineAmount(fine);
        t.setStatus("RETURNED");

        // Increase available copies back in inventory
        Book b = books.get(t.getBookId());
        if (b != null) {
            b.setAvailableCopies(Math.min(b.getTotalCopies(), b.getAvailableCopies() + 1));
            System.out.printf("[SQL LOG]: UPDATE books SET available_copies = %d WHERE id = %d;%n", b.getAvailableCopies(), b.getId());
        }

        System.out.printf("[SQL LOG]: UPDATE transactions SET return_date = '%s', fine_amount = %.2f, status = 'RETURNED' WHERE id = %d;%n",
                returnDate, fine, t.getId());

        saveBooks();
        saveTransactions();
        return t;
    }

    /**
     * Returns dashboard statistics as JSON.
     */
    public synchronized String getStatsJson() {
        int totalBooksCount = 0;
        int totalAvailableCopies = 0;
        for (Book b : books.values()) {
            totalBooksCount += b.getTotalCopies();
            totalAvailableCopies += b.getAvailableCopies();
        }

        int activeIssuedCount = 0;
        double totalFine = 0.0;
        for (Transaction t : transactions.values()) {
            if ("ISSUED".equalsIgnoreCase(t.getStatus())) {
                activeIssuedCount++;
            }
            totalFine += t.getFineAmount();
        }

        System.out.println("[SQL LOG]: SELECT COUNT(*) FROM books; SELECT COUNT(*) FROM members; SELECT SUM(fine_amount) FROM transactions;");

        return "{"
                + "\"totalTitles\":" + books.size() + ","
                + "\"totalCopies\":" + totalBooksCount + ","
                + "\"availableCopies\":" + totalAvailableCopies + ","
                + "\"issuedBooks\":" + activeIssuedCount + ","
                + "\"totalMembers\":" + members.size() + ","
                + "\"totalFine\":" + String.format(Locale.US, "%.2f", totalFine)
                + "}";
    }

    // -----------------------------------------------------------------------------------
    // FILE PERSISTENCE HELPERS (CSV Format - No 3rd Party Libs)
    // -----------------------------------------------------------------------------------

    private synchronized void saveAll() {
        saveBooks();
        saveMembers();
        saveTransactions();
    }

    private synchronized void saveBooks() {
        try (PrintWriter pw = new PrintWriter(new OutputStreamWriter(new FileOutputStream(BOOKS_FILE), StandardCharsets.UTF_8))) {
            for (Book b : books.values()) {
                pw.println(escapeCsv(String.valueOf(b.getId())) + ","
                        + escapeCsv(b.getTitle()) + ","
                        + escapeCsv(b.getAuthor()) + ","
                        + escapeCsv(b.getCategory()) + ","
                        + escapeCsv(b.getIsbn()) + ","
                        + b.getTotalCopies() + ","
                        + b.getAvailableCopies() + ","
                        + escapeCsv(b.getAddedDate()));
            }
        } catch (Exception e) {
            System.err.println("[Error saving books]: " + e.getMessage());
        }
    }

    private synchronized void loadBooks() {
        books.clear();
        try (BufferedReader br = new BufferedReader(new InputStreamReader(new FileInputStream(BOOKS_FILE), StandardCharsets.UTF_8))) {
            String line;
            while ((line = br.readLine()) != null) {
                if (line.trim().isEmpty()) continue;
                String[] p = parseCsvLine(line);
                if (p.length >= 8) {
                    Book b = new Book(
                            Integer.parseInt(p[0]),
                            p[1], p[2], p[3], p[4],
                            Integer.parseInt(p[5]),
                            Integer.parseInt(p[6]),
                            p[7]
                    );
                    addBookInternal(b);
                }
            }
        } catch (Exception e) {
            System.err.println("[Error reading books]: " + e.getMessage());
        }
    }

    private synchronized void saveMembers() {
        try (PrintWriter pw = new PrintWriter(new OutputStreamWriter(new FileOutputStream(MEMBERS_FILE), StandardCharsets.UTF_8))) {
            for (Member m : members.values()) {
                pw.println(escapeCsv(String.valueOf(m.getId())) + ","
                        + escapeCsv(m.getRollNo()) + ","
                        + escapeCsv(m.getName()) + ","
                        + escapeCsv(m.getDepartment()) + ","
                        + escapeCsv(m.getEmail()) + ","
                        + escapeCsv(m.getPhone()) + ","
                        + escapeCsv(m.getJoinDate()));
            }
        } catch (Exception e) {
            System.err.println("[Error saving members]: " + e.getMessage());
        }
    }

    private synchronized void loadMembers() {
        members.clear();
        try (BufferedReader br = new BufferedReader(new InputStreamReader(new FileInputStream(MEMBERS_FILE), StandardCharsets.UTF_8))) {
            String line;
            while ((line = br.readLine()) != null) {
                if (line.trim().isEmpty()) continue;
                String[] p = parseCsvLine(line);
                if (p.length >= 7) {
                    Member m = new Member(
                            Integer.parseInt(p[0]),
                            p[1], p[2], p[3], p[4], p[5], p[6]
                    );
                    addMemberInternal(m);
                }
            }
        } catch (Exception e) {
            System.err.println("[Error reading members]: " + e.getMessage());
        }
    }

    private synchronized void saveTransactions() {
        try (PrintWriter pw = new PrintWriter(new OutputStreamWriter(new FileOutputStream(TRANSACTIONS_FILE), StandardCharsets.UTF_8))) {
            for (Transaction t : transactions.values()) {
                pw.println(t.getId() + ","
                        + t.getBookId() + ","
                        + escapeCsv(t.getBookTitle()) + ","
                        + t.getMemberId() + ","
                        + escapeCsv(t.getMemberName()) + ","
                        + escapeCsv(t.getMemberRollNo()) + ","
                        + escapeCsv(t.getIssueDate()) + ","
                        + escapeCsv(t.getDueDate()) + ","
                        + escapeCsv(t.getReturnDate() == null ? "" : t.getReturnDate()) + ","
                        + t.getFineAmount() + ","
                        + escapeCsv(t.getStatus()));
            }
        } catch (Exception e) {
            System.err.println("[Error saving transactions]: " + e.getMessage());
        }
    }

    private synchronized void loadTransactions() {
        transactions.clear();
        try (BufferedReader br = new BufferedReader(new InputStreamReader(new FileInputStream(TRANSACTIONS_FILE), StandardCharsets.UTF_8))) {
            String line;
            while ((line = br.readLine()) != null) {
                if (line.trim().isEmpty()) continue;
                String[] p = parseCsvLine(line);
                if (p.length >= 11) {
                    String retDate = p[8].isEmpty() ? null : p[8];
                    Transaction t = new Transaction(
                            Integer.parseInt(p[0]),
                            Integer.parseInt(p[1]),
                            p[2],
                            Integer.parseInt(p[3]),
                            p[4],
                            p[5],
                            p[6],
                            p[7],
                            retDate,
                            Double.parseDouble(p[9]),
                            p[10]
                    );
                    addTransactionInternal(t);
                }
            }
        } catch (Exception e) {
            System.err.println("[Error reading transactions]: " + e.getMessage());
        }
    }

    private static String escapeCsv(String s) {
        if (s == null) return "\"\"";
        return "\"" + s.replace("\"", "\"\"") + "\"";
    }

    private static String[] parseCsvLine(String line) {
        List<String> list = new ArrayList<>();
        StringBuilder sb = new StringBuilder();
        boolean inQuotes = false;
        for (int i = 0; i < line.length(); i++) {
            char c = line.charAt(i);
            if (c == '\"') {
                if (inQuotes && i + 1 < line.length() && line.charAt(i + 1) == '\"') {
                    sb.append('\"');
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (c == ',' && !inQuotes) {
                list.add(sb.toString());
                sb.setLength(0);
            } else {
                sb.append(c);
            }
        }
        list.add(sb.toString());
        return list.toArray(new String[0]);
    }
}
