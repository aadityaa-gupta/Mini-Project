import { Member as IMember } from '../../shared/types';

/**
 * Model class representing a Library Member (Student / Faculty).
 * Fully typed TypeScript implementation.
 */
export class Member implements IMember {
    public id: number;
    public rollNo: string;
    public name: string;
    public department: string;
    public email: string;
    public phone: string;
    public joinDate: string;

    constructor(
        id: number,
        rollNo: string,
        name: string,
        department: string,
        email: string,
        phone: string,
        joinDate: string
    ) {
        this.id = id;
        this.rollNo = rollNo;
        this.name = name;
        this.department = department;
        this.email = email;
        this.phone = phone;
        this.joinDate = joinDate;
    }

    public toJSON(): IMember {
        return {
            id: this.id,
            rollNo: this.rollNo,
            name: this.name,
            department: this.department,
            email: this.email,
            phone: this.phone,
            joinDate: this.joinDate
        };
    }
}
