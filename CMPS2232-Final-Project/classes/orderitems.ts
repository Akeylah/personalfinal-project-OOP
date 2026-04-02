class OrderItem {
  private itemId: number;
  private name: string;
  private quantity: number;
  private price: number;

  constructor(itemId: number, name: string, quantity: number, price: number) {
    this.itemId = itemId;
    this.name = name;
    this.quantity = quantity;
    this.price = price;
  }

  public getItemId(): number {
    return this.itemId;
  }

  public getName(): string {
    return this.name;
  }

  public getQuantity(): number {
    return this.quantity;
  }

  public getPrice(): number {
    return this.price;
  }

  public setQuantity(quantity: number): void {
    this.quantity = quantity;
  }

  public getSubtotal(): number {
    return this.quantity * this.price;
  }
}

export default OrderItem;