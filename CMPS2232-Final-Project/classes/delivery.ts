class Delivery {
  private deliveryId: number;
  private orderId: number;
  private address: string;
  private deliveryFee: number;

  constructor(deliveryId: number, orderId: number, address: string, deliveryFee: number) {
    this.deliveryId = deliveryId;
    this.orderId = orderId;
    this.address = address;
    this.deliveryFee = deliveryFee;
  }

  public getDeliveryId(): number {
    return this.deliveryId;
  }

  public getOrderId(): number {
    return this.orderId;
  }

  public getAddress(): string {
    return this.address;
  }

  public getDeliveryFee(): number {
    return this.deliveryFee;
  }
}

export default Delivery;