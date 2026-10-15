package models;

/**
 * Model class representing a Book Issue/Return Transaction.
 */
public class Transaction {
    private int id;
    private int bookId;
    private String bookTitle;
    private int memberId;
    private String memberName;
    private String memberRollNo;
    private String issueDate;
    private String dueDate;
    private String returnDate; // null or "YYYY-MM-DD"
    private double fineAmount;
    private String status;     // "ISSUED" or "RETURNED"

    public Transaction() {}

    public Transaction(int id, int bookId, String bookTitle, int memberId, String memberName,
                       String memberRollNo, String issueDate, String dueDate, String returnDate,
                       double fineAmount, String status) {
        this.id = id;
        this.bookId = bookId;
        this.bookTitle = bookTitle;
        this.memberId = memberId;
        this.memberName = memberName;
        this.memberRollNo = memberRollNo;
        this.issueDate = issueDate;
        this.dueDate = dueDate;
        this.returnDate = returnDate;
        this.fineAmount = fineAmount;
        this.status = status;
    }

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public int getBookId() { return bookId; }
    public void setBookId(int bookId) { this.bookId = bookId; }

    public String getBookTitle() { return bookTitle; }
    public void setBookTitle(String bookTitle) { this.bookTitle = bookTitle; }

    public int getMemberId() { return memberId; }
    public void setMemberId(int memberId) { this.memberId = memberId; }

    public String getMemberName() { return memberName; }
    public void setMemberName(String memberName) { this.memberName = memberName; }

    public String getMemberRollNo() { return memberRollNo; }
    public void setMemberRollNo(String memberRollNo) { this.memberRollNo = memberRollNo; }

    public String getIssueDate() { return issueDate; }
    public void setIssueDate(String issueDate) { this.issueDate = issueDate; }

    public String getDueDate() { return dueDate; }
    public void setDueDate(String dueDate) { this.dueDate = dueDate; }

    public String getReturnDate() { return returnDate; }
    public void setReturnDate(String returnDate) { this.returnDate = returnDate; }

    public double getFineAmount() { return fineAmount; }
    public void setFineAmount(double fineAmount) { this.fineAmount = fineAmount; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String toJson() {
        return "{"
                + "\"id\":" + id + ","
                + "\"bookId\":" + bookId + ","
                + "\"bookTitle\":\"" + escapeJson(bookTitle) + "\","
                + "\"memberId\":" + memberId + ","
                + "\"memberName\":\"" + escapeJson(memberName) + "\","
                + "\"memberRollNo\":\"" + escapeJson(memberRollNo) + "\","
                + "\"issueDate\":\"" + escapeJson(issueDate) + "\","
                + "\"dueDate\":\"" + escapeJson(dueDate) + "\","
                + "\"returnDate\":" + (returnDate == null ? "null" : "\"" + escapeJson(returnDate) + "\"") + ","
                + "\"fineAmount\":" + String.format(java.util.Locale.US, "%.2f", fineAmount) + ","
                + "\"status\":\"" + escapeJson(status) + "\""
                + "}";
    }

    private static String escapeJson(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n").replace("\r", "");
    }
}
