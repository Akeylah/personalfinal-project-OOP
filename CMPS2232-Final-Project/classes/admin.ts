import { User } from "./user";

class Admin extends User {
  constructor(id: number, name: string, email: string, password: string) {
    super(id, name, email, password, "admin");
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