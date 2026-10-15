import { Book as IBook } from '../../shared/types';

/**
 * Model class representing a Book in the Library.
 * Fully typed TypeScript implementation.
 */
export class Book implements IBook {
    public id: number;
    public title: string;
    public author: string;
    public category: string;
    public isbn: string;
    public totalCopies: number;
    public availableCopies: number;
    public addedDate: string;

    constructor(
        id: number,
        title: string,
        author: string,
        category: string,
        isbn: string,
        totalCopies: number,
        availableCopies: number,
        addedDate: string
    ) {
        this.id = id;
        this.title = title;
        this.author = author;
        this.category = category;
        this.isbn = isbn;
        this.totalCopies = totalCopies;
        this.availableCopies = availableCopies;
        this.addedDate = addedDate;
    }

    /**
     * Converts to JSON plain object
     */
    public toJSON(): IBook {
        return {
            id: this.id,
            title: this.title,
            author: this.author,
            category: this.category,
            isbn: this.isbn,
            totalCopies: this.totalCopies,
            availableCopies: this.availableCopies,
            addedDate: this.addedDate
        };
    }
}
