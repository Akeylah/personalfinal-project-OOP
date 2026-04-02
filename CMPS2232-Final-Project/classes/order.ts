import OrderItem from "./orderitems";

type OrderStatus = "pending" | "preparing" | "ready" | "completed" | "cancelled";
type OrderType = "pickup" | "delivery";

class Order {
  private orderId: number;
  private userId: number;
  private items: OrderItem[] = [];
  private status: OrderStatus;
  private orderType: OrderType;
  private totalPrice: number;

  constructor(orderId: number, userId: number, orderType: OrderType) {
    this.orderId = orderId;
    this.userId = userId;
    this.orderType = orderType;
    this.status = "pending";
    this.totalPrice = 0;
  }

  public getOrderId(): number {
    return this.orderId;
  }

  public getStatus(): OrderStatus {
    return this.status;
  }

  public getItems(): OrderItem[] {
    return this.items;
  }

  public getTotalPrice(): number {
    return this.totalPrice;
  }

  public getOrderType(): OrderType {
    return this.orderType;
  }

  public addItem(item: OrderItem): void {
    this.items.push(item);
    this.calculateTotal();
  }

  public removeItem(itemId: number): void {
    this.items = this.items.filter(item => item.getItemId() !== itemId);
    this.calculateTotal();
  }

  private calculateTotal(): void {
    this.totalPrice = this.items.reduce((total, item) => total + item.getSubtotal(), 0);
  }

  public updateStatus(status: OrderStatus): void {
    this.status = status;
  }

  public getOrderSummary(): string {
    return `Order #${this.orderId} - Type: ${this.orderType} - Status: ${this.status} - Total: $${this.totalPrice}`;
  }
}

export default Order;