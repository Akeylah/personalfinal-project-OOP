class CartItem {
  private itemId: number;
  private name: string;
  private price: number;
  private quantity: number;

  constructor(itemId: number, name: string, price: number, quantity: number) {
    this.itemId = itemId;
    this.name = name;
    this.price = price;
    this.quantity = quantity;
  }

  public getItemId(): number {
    return this.itemId;
  }

  public getQuantity(): number {
    return this.quantity;
  }

  public setQuantity(quantity: number): void {
    this.quantity = quantity;
  }

  public getSubtotal(): number {
    return this.price * this.quantity;
  }

  public getName(): string {
    return this.name;
  }

  public getPrice(): number {
    return this.price;
  }
}

export default CartItem;