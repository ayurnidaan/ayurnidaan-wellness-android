export type RazorpayCheckoutOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  theme?: { color?: string };
};

export type RazorpayPaymentSuccess = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

export async function openNativeRazorpayCheckout(_options: RazorpayCheckoutOptions): Promise<RazorpayPaymentSuccess> {
  throw new Error('Native Razorpay checkout is unavailable on this platform.');
}
