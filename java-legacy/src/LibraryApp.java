import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;
import models.Book;
import models.Member;
import models.Transaction;

import java.io.*;
import java.net.InetSocketAddress;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.Executors;

/**
 * ====================================================================
 * COLLEGE MINI PROJECT: LIBRARY MANAGEMENT SYSTEM (100 MARKS)
 * Student: Aditya
 * Main Application Class: LibraryApp.java
 *
 * Built with Pure Standard Java (JDK built-in HttpServer)
 * ZERO external npm, ZERO node.js, ZERO heavy frameworks.
 * ====================================================================
 */
public class LibraryApp {

    private static final int PORT = 8080;
    private static final String WEB_DIR = "web";
    private static DBManager db;

    public static void main(String[] args) throws IOException {
        System.out.println("==================================================================");
        System.out.println("   COLLEGE MINI PROJECT: LIBRARY MANAGEMENT SYSTEM (100 MARKS)   ");
        System.out.println("   Developer: Aditya | Tech: Java + HTML5 + CSS3 + SQL           ");
        System.out.println("==================================================================");

        // 1. Initialize Database Access Layer
        db = new DBManager();

        // 2. Create Built-in HTTP Server on Port 8080
        HttpServer server = HttpServer.create(new InetSocketAddress(PORT), 0);
        server.setExecutor(Executors.newFixedThreadPool(10)); // Multi-threaded request pool

        // 3. Register HTTP Route Handlers
        // Static Web UI Files
        server.createContext("/", new StaticFileHandler());

        // REST API Endpoints
        server.createContext("/api/stats", new StatsHandler());
        server.createContext("/api/books", new BooksHandler());
        server.createContext("/api/members", new MembersHandler());
        server.createContext("/api/transactions", new TransactionsHandler());
        server.createContext("/api/issue", new IssueBookHandler());
        server.createContext("/api/return", new ReturnBookHandler());

        // 4. Start Server
        server.start();

        System.out.println("\n>>> SUCCESS: Library Management Server is RUNNING!");
        System.out.println(">>> Local Web Dashboard: http://127.0.0.1:" + PORT + " (or http://localhost:" + PORT + ")");
        System.out.println(">>> Press Ctrl+C in terminal to stop server.\n");
        System.out.println("------------------------------------------------------------------");
        System.out.println("SQL LOG STREAM (Queries will display here during UI actions):");
        System.out.println("------------------------------------------------------------------");

        // 5. Automatically open browser once server is confirmed active
        try {
            if (java.awt.Desktop.isDesktopSupported() && java.awt.Desktop.getDesktop().isSupported(java.awt.Desktop.Action.BROWSE)) {
                java.awt.Desktop.getDesktop().browse(new java.net.URI("http://127.0.0.1:" + PORT));
            } else {
                new ProcessBuilder("cmd", "/c", "start", "http://127.0.0.1:" + PORT).start();
            }
        } catch (Exception ignored) {}
    }

    // -----------------------------------------------------------------------
    // HANDLER 1: Static Web Files (HTML, CSS, JS)
    // -----------------------------------------------------------------------
    static class StaticFileHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            String path = exchange.getRequestURI().getPath();
            if (path == null || path.equals("/") || path.isEmpty()) {
                path = "/index.html";
            }

            File file = new File(WEB_DIR, path.substring(1));
            if (!file.exists() || file.isDirectory()) {
                sendResponse(exchange, 404, "text/plain", "404 Not Found");
                return;
            }

            String contentType = "text/plain";
            if (path.endsWith(".html")) contentType = "text/html; charset=UTF-8";
            else if (path.endsWith(".css")) contentType = "text/css; charset=UTF-8";
            else if (path.endsWith(".js")) contentType = "application/javascript; charset=UTF-8";
            else if (path.endsWith(".png")) contentType = "image/png";
            else if (path.endsWith(".svg")) contentType = "image/svg+xml";

            byte[] bytes = Files.readAllBytes(file.toPath());
            exchange.getResponseHeaders().set("Content-Type", contentType);
            exchange.sendResponseHeaders(200, bytes.length);
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(bytes);
            }
        }
    }

    // -----------------------------------------------------------------------
    // HANDLER 2: Dashboard Stats API (/api/stats)
    // -----------------------------------------------------------------------
    static class StatsHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                handleOptions(exchange);
                return;
            }
            String json = db.getStatsJson();
            sendJsonResponse(exchange, 200, json);
        }
    }

    // -----------------------------------------------------------------------
    // HANDLER 3: Books API (/api/books) - GET all, POST add, POST/DELETE remove
    // -----------------------------------------------------------------------
    static class BooksHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            String method = exchange.getRequestMethod().toUpperCase();
            if ("OPTIONS".equals(method)) {
                handleOptions(exchange);
                return;
            }

            if ("GET".equals(method)) {
                List<Book> list = db.getAllBooks();
                StringBuilder sb = new StringBuilder("[");
                for (int i = 0; i < list.size(); i++) {
                    sb.append(list.get(i).toJson());
                    if (i < list.size() - 1) sb.append(",");
                }
                sb.append("]");
                sendJsonResponse(exchange, 200, sb.toString());

            } else if ("POST".equals(method)) {
                // Check if delete or add
                String path = exchange.getRequestURI().getPath();
                Map<String, String> body = parseRequestBody(exchange);

                if (path.endsWith("/delete") || "delete".equalsIgnoreCase(body.get("_action"))) {
                    int id = Integer.parseInt(body.get("id"));
                    boolean success = db.deleteBook(id);
                    if (success) {
                        sendJsonResponse(exchange, 200, "{\"success\":true,\"message\":\"Book deleted successfully\"}");
                    } else {
                        sendJsonResponse(exchange, 400, "{\"success\":false,\"message\":\"Cannot delete book. Copies are currently issued or book not found.\"}");
                    }
                    return;
                }

                // Add Book
                String title = body.getOrDefault("title", "").trim();
                String author = body.getOrDefault("author", "").trim();
                String category = body.getOrDefault("category", "General").trim();
                String isbn = body.getOrDefault("isbn", "").trim();
                int copies = 1;
                try {
                    copies = Integer.parseInt(body.getOrDefault("copies", "1"));
                } catch (Exception ignored) {}

                if (title.isEmpty() || author.isEmpty()) {
                    sendJsonResponse(exchange, 400, "{\"success\":false,\"message\":\"Title and Author are required.\"}");
                    return;
                }

                Book added = db.addBook(title, author, category, isbn, copies);
                sendJsonResponse(exchange, 201, "{\"success\":true,\"book\":" + added.toJson() + "}");

            } else if ("DELETE".equals(method)) {
                String query = exchange.getRequestURI().getQuery();
                Map<String, String> qp = parseQueryParams(query);
                int id = Integer.parseInt(qp.getOrDefault("id", "0"));
                boolean success = db.deleteBook(id);
                if (success) {
                    sendJsonResponse(exchange, 200, "{\"success\":true,\"message\":\"Book deleted\"}");
                } else {
                    sendJsonResponse(exchange, 400, "{\"success\":false,\"message\":\"Cannot delete issued book or invalid ID\"}");
                }
            } else {
                sendResponse(exchange, 405, "text/plain", "Method Not Allowed");
            }
        }
    }

    // -----------------------------------------------------------------------
    // HANDLER 4: Members API (/api/members) - GET all, POST add
    // -----------------------------------------------------------------------
    static class MembersHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            String method = exchange.getRequestMethod().toUpperCase();
            if ("OPTIONS".equals(method)) {
                handleOptions(exchange);
                return;
            }

            if ("GET".equals(method)) {
                List<Member> list = db.getAllMembers();
                StringBuilder sb = new StringBuilder("[");
                for (int i = 0; i < list.size(); i++) {
                    sb.append(list.get(i).toJson());
                    if (i < list.size() - 1) sb.append(",");
                }
                sb.append("]");
                sendJsonResponse(exchange, 200, sb.toString());

            } else if ("POST".equals(method)) {
                Map<String, String> body = parseRequestBody(exchange);
                String rollNo = body.getOrDefault("rollNo", "").trim();
                String name = body.getOrDefault("name", "").trim();
                String dept = body.getOrDefault("department", "CSE").trim();
                String email = body.getOrDefault("email", "").trim();
                String phone = body.getOrDefault("phone", "").trim();

                if (rollNo.isEmpty() || name.isEmpty()) {
                    sendJsonResponse(exchange, 400, "{\"success\":false,\"message\":\"Roll Number and Name are required.\"}");
                    return;
                }

                Member added = db.addMember(rollNo, name, dept, email, phone);
                sendJsonResponse(exchange, 201, "{\"success\":true,\"member\":" + added.toJson() + "}");
            } else {
                sendResponse(exchange, 405, "text/plain", "Method Not Allowed");
            }
        }
    }

    // -----------------------------------------------------------------------
    // HANDLER 5: Transactions API (/api/transactions) - GET history
    // -----------------------------------------------------------------------
    static class TransactionsHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                handleOptions(exchange);
                return;
            }

            List<Transaction> list = db.getAllTransactions();
            StringBuilder sb = new StringBuilder("[");
            for (int i = 0; i < list.size(); i++) {
                sb.append(list.get(i).toJson());
                if (i < list.size() - 1) sb.append(",");
            }
            sb.append("]");
            sendJsonResponse(exchange, 200, sb.toString());
        }
    }

    // -----------------------------------------------------------------------
    // HANDLER 6: Issue Book API (/api/issue) - POST
    // -----------------------------------------------------------------------
    static class IssueBookHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                handleOptions(exchange);
                return;
            }

            if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendResponse(exchange, 405, "text/plain", "Method Not Allowed");
                return;
            }

            Map<String, String> body = parseRequestBody(exchange);
            try {
                int bookId = Integer.parseInt(body.get("bookId"));
                int memberId = Integer.parseInt(body.get("memberId"));
                int loanDays = 14;
                if (body.containsKey("days")) {
                    loanDays = Integer.parseInt(body.get("days"));
                }

                Transaction t = db.issueBook(bookId, memberId, loanDays);
                if (t != null) {
                    sendJsonResponse(exchange, 200, "{\"success\":true,\"message\":\"Book issued successfully!\",\"transaction\":" + t.toJson() + "}");
                } else {
                    sendJsonResponse(exchange, 400, "{\"success\":false,\"message\":\"Unable to issue book. Book may be out of stock or IDs invalid.\"}");
                }
            } catch (Exception e) {
                sendJsonResponse(exchange, 400, "{\"success\":false,\"message\":\"Invalid request parameters: " + e.getMessage() + "\"}");
            }
        }
    }

    // -----------------------------------------------------------------------
    // HANDLER 7: Return Book API (/api/return) - POST
    // -----------------------------------------------------------------------
    static class ReturnBookHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                handleOptions(exchange);
                return;
            }

            if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendResponse(exchange, 405, "text/plain", "Method Not Allowed");
                return;
            }

            Map<String, String> body = parseRequestBody(exchange);
            try {
                int transactionId = Integer.parseInt(body.get("transactionId"));
                Transaction t = db.returnBook(transactionId);
                if (t != null) {
                    sendJsonResponse(exchange, 200, "{\"success\":true,\"message\":\"Book returned successfully!\",\"transaction\":" + t.toJson() + "}");
                } else {
                    sendJsonResponse(exchange, 400, "{\"success\":false,\"message\":\"Transaction ID not found.\"}");
                }
            } catch (Exception e) {
                sendJsonResponse(exchange, 400, "{\"success\":false,\"message\":\"Invalid request: " + e.getMessage() + "\"}");
            }
        }
    }

    // -----------------------------------------------------------------------
    // UTILITY METHODS: Request parsing and HTTP helpers
    // -----------------------------------------------------------------------

    private static void handleOptions(HttpExchange exchange) throws IOException {
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
        exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type");
        exchange.sendResponseHeaders(204, -1);
    }

    private static void sendJsonResponse(HttpExchange exchange, int statusCode, String json) throws IOException {
        sendResponse(exchange, statusCode, "application/json; charset=UTF-8", json);
    }

    private static void sendResponse(HttpExchange exchange, int statusCode, String contentType, String body) throws IOException {
        byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", contentType);
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        exchange.sendResponseHeaders(statusCode, bytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(bytes);
        }
    }

    /**
     * Parses request body supporting JSON format or Form URL-encoded format.
     */
    private static Map<String, String> parseRequestBody(HttpExchange exchange) throws IOException {
        Map<String, String> map = new HashMap<>();
        InputStream is = exchange.getRequestBody();
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        byte[] buffer = new byte[1024];
        int len;
        while ((len = is.read(buffer)) != -1) {
            baos.write(buffer, 0, len);
        }
        String body = baos.toString(StandardCharsets.UTF_8).trim();

        if (body.isEmpty()) return map;

        // Check if JSON format: {"key":"val", "num": 12}
        if (body.startsWith("{") && body.endsWith("}")) {
            String content = body.substring(1, body.length() - 1).trim();
            // Simple robust JSON key-value extraction for string and primitive values
            StringBuilder cur = new StringBuilder();
            boolean inQuote = false;
            List<String> pairs = new java.util.ArrayList<>();
            for (int i = 0; i < content.length(); i++) {
                char c = content.charAt(i);
                if (c == '\"') inQuote = !inQuote;
                if (c == ',' && !inQuote) {
                    pairs.add(cur.toString());
                    cur.setLength(0);
                } else {
                    cur.append(c);
                }
            }
            if (cur.length() > 0) pairs.add(cur.toString());

            for (String pair : pairs) {
                int colonIdx = pair.indexOf(':');
                if (colonIdx > 0) {
                    String k = pair.substring(0, colonIdx).trim().replace("\"", "");
                    String v = pair.substring(colonIdx + 1).trim().replace("\"", "");
                    map.put(k, v);
                }
            }
        } else {
            // Form URL Encoded: key=val&key2=val2
            String[] pairs = body.split("&");
            for (String pair : pairs) {
                String[] kv = pair.split("=");
                if (kv.length >= 2) {
                    map.put(URLDecoder.decode(kv[0], StandardCharsets.UTF_8),
                            URLDecoder.decode(kv[1], StandardCharsets.UTF_8));
                } else if (kv.length == 1) {
                    map.put(URLDecoder.decode(kv[0], StandardCharsets.UTF_8), "");
                }
            }
        }
        return map;
    }

    private static Map<String, String> parseQueryParams(String query) {
        Map<String, String> map = new HashMap<>();
        if (query == null || query.isEmpty()) return map;
        String[] pairs = query.split("&");
        for (String pair : pairs) {
            String[] kv = pair.split("=");
            if (kv.length >= 2) {
                map.put(URLDecoder.decode(kv[0], StandardCharsets.UTF_8),
                        URLDecoder.decode(kv[1], StandardCharsets.UTF_8));
            }
        }
        return map;
    }
}
