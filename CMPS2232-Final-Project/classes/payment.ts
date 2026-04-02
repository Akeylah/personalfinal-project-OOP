type PaymentMethod = "cash_on_delivery" | "pickup_payment";
type PaymentStatus = "pending" | "paid";

class Payment {
  private paymentId: number;
  private orderId: number;
  private method: PaymentMethod;
  private status: PaymentStatus;

  constructor(paymentId: number, orderId: number, method: PaymentMethod) {
    this.paymentId = paymentId;
    this.orderId = orderId;
    this.method = method;
    this.status = "pending";
  }

  public processPayment(): void {
    this.status = "paid";
  }

  public getStatus(): PaymentStatus {
    return this.status;
  }

  public getMethod(): PaymentMethod {
    return this.method;
  }

  public getPaymentId(): number {
    return this.paymentId;
  }

  public getOrderId(): number {
    return this.orderId;
  }
}

export default Payment;