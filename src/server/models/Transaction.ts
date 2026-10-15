import { Transaction as ITransaction, TransactionStatus } from '../../shared/types';

/**
 * Model class representing a Book Issue/Return Transaction.
 * Fully typed TypeScript implementation.
 */
export class Transaction implements ITransaction {
    public id: number;
    public bookId: number;
    public bookTitle: string;
    public memberId: number;
    public memberName: string;
    public memberRollNo: string;
    public issueDate: string;
    public dueDate: string;
    public returnDate: string | null;
    public fineAmount: number;
    public status: TransactionStatus;

    constructor(
        id: number,
        bookId: number,
        bookTitle: string,
        memberId: number,
        memberName: string,
        memberRollNo: string,
        issueDate: string,
        dueDate: string,
        returnDate: string | null = null,
        fineAmount: number = 0.0,
        status: TransactionStatus = 'ISSUED'
    ) {
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

    public toJSON(): ITransaction {
        return {
            id: this.id,
            bookId: this.bookId,
            bookTitle: this.bookTitle,
            memberId: this.memberId,
            memberName: this.memberName,
            memberRollNo: this.memberRollNo,
            issueDate: this.issueDate,
            dueDate: this.dueDate,
            returnDate: this.returnDate,
            fineAmount: this.fineAmount,
            status: this.status
        };
    }
}
