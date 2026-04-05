import { User } from "./user";
import Order from "./order";

class Customer extends User {
  private orders: Order[] = [];

  constructor(userId: number, username: string, password: string, email: string) {
    super(userId, username, password, email, "customer");
  }

  public placeOrder(order: Order): void {
    this.orders.push(order);
  }

  public viewOrders(): Order[] {
    return this.orders;
  }

  public getOrderById(orderId: number): Order | undefined {
    return this.orders.find(order => order.getOrderId() === orderId);
  }
}

export default Customer;