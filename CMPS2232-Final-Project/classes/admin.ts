import User from "./user.ts";

class Admin extends User {
  constructor(userId: number, username: string, password: string, email: string) {
    super(userId, username, password, email, "admin");
  }

  public viewAllOrders(): string {
    return "Displaying all orders...";
  }

  public updateOrderStatus(orderId: number, status: string): string {
    return `Order ${orderId} updated to status: ${status}`;
  }

  public addMenuItem(name: string, price: number): string {
    return `Menu item '${name}' added with price $${price}`;
  }

  public removeMenuItem(itemId: number): string {
    return `Menu item with ID ${itemId} removed`;
  }

  public viewUsers(): string {
    return "Displaying all users...";
  }
}

export default Admin;