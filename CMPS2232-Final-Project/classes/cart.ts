import CartItem from "./cartitems";

class Cart {
  private cartId: number;
  private userId: number;
  private items: CartItem[] = [];

  constructor(cartId: number, userId: number) {
    this.cartId = cartId;
    this.userId = userId;
  }

  public getCartId(): number {
    return this.cartId;
  }

  public getUserId(): number {
    return this.userId;
  }

  public addItem(item: CartItem): void {
    const existing = this.items.find(i => i.getItemId() === item.getItemId());

    if (existing) {
      existing.setQuantity(existing.getQuantity() + item.getQuantity());
    } else {
      this.items.push(item);
    }
  }

  public removeItem(itemId: number): void {
    this.items = this.items.filter(item => item.getItemId() !== itemId);
  }

  public getItems(): CartItem[] {
    return this.items;
  }

  public getTotal(): number {
    return this.items.reduce((total, item) => total + item.getSubtotal(), 0);
  }

  public clearCart(): void {
    this.items = [];
  }

  public getCartSummary(): string {
    return `Cart ${this.cartId} (User ${this.userId}) has ${this.items.length} items.`;
  }
}

export default Cart;