package models;

/**
 * Model class representing a Library Member (Student / Faculty).
 */
public class Member {
    private int id;
    private String rollNo;
    private String name;
    private String department;
    private String email;
    private String phone;
    private String joinDate;

    public Member() {}

    public Member(int id, String rollNo, String name, String department, String email, String phone, String joinDate) {
        this.id = id;
        this.rollNo = rollNo;
        this.name = name;
        this.department = department;
        this.email = email;
        this.phone = phone;
        this.joinDate = joinDate;
    }

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public String getRollNo() { return rollNo; }
    public void setRollNo(String rollNo) { this.rollNo = rollNo; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getJoinDate() { return joinDate; }
    public void setJoinDate(String joinDate) { this.joinDate = joinDate; }

    public String toJson() {
        return "{"
                + "\"id\":" + id + ","
                + "\"rollNo\":\"" + escapeJson(rollNo) + "\","
                + "\"name\":\"" + escapeJson(name) + "\","
                + "\"department\":\"" + escapeJson(department) + "\","
                + "\"email\":\"" + escapeJson(email) + "\","
                + "\"phone\":\"" + escapeJson(phone) + "\","
                + "\"joinDate\":\"" + escapeJson(joinDate) + "\""
                + "}";
    }

    private static String escapeJson(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n").replace("\r", "");
    }
}
