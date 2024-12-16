declare module "@paystack/inline-js" {
  export interface PaystackOptions {
    key: string;
    email: string;
    amount: number;
    currency?: string;
    ref?: string;
    onSuccess?: (response: PaystackResponse) => void;
    onCancel?: () => void;
    metadata?: Record<string, unknown>;
  }

  export interface PaystackResponse {
    reference: string;
    status: "success" | "failed";
    trans: string;
    transaction: string;
    message: string;
  }

  export interface PaystackInstance {
    onCancel: () => void;
    onSuccess: (response: PaystackResponse) => Promise<void>;
    newTransaction(options: PaystackOptions): void;
  }

  export interface PaystackConstructor {
    setup(arg0: {
      key: string;
      email: string;
      amount: number;
      currency: string;
      callback: (response: PaystackResponse) => Promise<void>;
      onClose: () => void;
    }): unknown;
    new (): PaystackInstance;
  }

  const Paystack: PaystackConstructor;
  export default Paystack;
}
