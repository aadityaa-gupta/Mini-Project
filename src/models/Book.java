package models;

/**
 * Model class representing a Book in the Library.
 * Pure Java POJO (Plain Old Java Object) - No external libraries needed.
 */
public class Book {
    private int id;
    private String title;
    private String author;
    private String category;
    private String isbn;
    private int totalCopies;
    private int availableCopies;
    private String addedDate;

    // Default Constructor
    public Book() {}

    // Parameterized Constructor
    public Book(int id, String title, String author, String category, String isbn, int totalCopies, int availableCopies, String addedDate) {
        this.id = id;
        this.title = title;
        this.author = author;
        this.category = category;
        this.isbn = isbn;
        this.totalCopies = totalCopies;
        this.availableCopies = availableCopies;
        this.addedDate = addedDate;
    }

    // Getters and Setters
    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getAuthor() { return author; }
    public void setAuthor(String author) { this.author = author; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getIsbn() { return isbn; }
    public void setIsbn(String isbn) { this.isbn = isbn; }

    public int getTotalCopies() { return totalCopies; }
    public void setTotalCopies(int totalCopies) { this.totalCopies = totalCopies; }

    public int getAvailableCopies() { return availableCopies; }
    public void setAvailableCopies(int availableCopies) { this.availableCopies = availableCopies; }

    public String getAddedDate() { return addedDate; }
    public void setAddedDate(String addedDate) { this.addedDate = addedDate; }

    /**
     * Converts this Book object to JSON format string without external libraries.
     */
    public String toJson() {
        return "{"
                + "\"id\":" + id + ","
                + "\"title\":\"" + escapeJson(title) + "\","
                + "\"author\":\"" + escapeJson(author) + "\","
                + "\"category\":\"" + escapeJson(category) + "\","
                + "\"isbn\":\"" + escapeJson(isbn) + "\","
                + "\"totalCopies\":" + totalCopies + ","
                + "\"availableCopies\":" + availableCopies + ","
                + "\"addedDate\":\"" + escapeJson(addedDate) + "\""
                + "}";
    }

    private static String escapeJson(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n").replace("\r", "");
    }
}
