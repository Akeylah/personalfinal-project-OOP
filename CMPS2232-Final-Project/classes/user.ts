export class User {
    private id: number;
    private name: string;
    private email: string;
    private password: string;
    private role: string;
    private createdAt: Date;

    constructor(id: number, name: string, email: string, password: string, role: string) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.password = password;
        this.role = role;
        this.createdAt = new Date();
    }

    // Getters
    getId(): number {
        return this.id;
    }

    getName(): string {
        return this.name;
    }

    getEmail(): string {
        return this.email;
    }

    getRole(): string {
        return this.role;
    }

    getCreatedAt(): Date {
        return this.createdAt;
    }

    // Setters
    setName(name: string): void {
        this.name = name;
    }

    setEmail(email: string): void {
        this.email = email;
    }

    setPassword(password: string): void {
        this.password = password;
    }

    // Methods
    isAdmin(): boolean {
        return this.role === 'admin';
    }

    isCustomer(): boolean {
        return this.role === 'customer';
    }

    toString(): string {
        return `User: ${this.name} (${this.email}) - Role: ${this.role}`;
    }
}