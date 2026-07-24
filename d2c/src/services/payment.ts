// D2C Razorpay payment.
//
// Flow: orders are created (pending) -> we ask the backend for a Razorpay
// order (amount is computed server-side from the gold rate) -> open the
// Razorpay checkout sheet -> verify the signature on the backend, which marks
// the orders paid.
//
// The native `react-native-razorpay` module is loaded defensively so the app
// still runs if it hasn't been installed/rebuilt yet — in that case checkout
// returns { skipped: true } and the orders simply stay 'pending' (a screen can
// then show "payment pending" and let the admin follow up).
import { createRazorpayPaymentOrder, verifyRazorpayPayment } from './Api';

let RazorpayCheckout: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  RazorpayCheckout = require('react-native-razorpay').default;
} catch (e) {
  RazorpayCheckout = null;
}

export const isRazorpayAvailable = (): boolean => !!RazorpayCheckout;

export type PayResult =
  | { success: true }
  | { success: false; skipped?: boolean; cancelled?: boolean; message: string };

export const payForOrders = async (
  orderIds: number[],
  buyer: { name?: string; email?: string; contact?: string },
  token: string,
): Promise<PayResult> => {
  if (!orderIds || orderIds.length === 0) {
    return { success: false, message: 'No orders to pay for' };
  }

  // Native module not present yet (needs install + rebuild) — don't crash.
  if (!RazorpayCheckout) {
    return {
      success: false,
      skipped: true,
      message: 'Payment module not installed. Orders saved as pending.',
    };
  }

  // 1) Create the Razorpay order (server prices it authoritatively).
  let created: any;
  try {
    created = await createRazorpayPaymentOrder({ orderIds }, token);
  } catch (e: any) {
    return { success: false, message: e?.error || 'Could not start payment' };
  }
  if (!created?.order?.id) {
    return { success: false, message: 'Could not start payment' };
  }

  // 2) Open the Razorpay checkout sheet.
  const options = {
    key: created.key,
    order_id: created.order.id,
    amount: created.order.amount,
    currency: created.order.currency || 'INR',
    name: 'Amrut Jewels',
    description: 'Order payment',
    prefill: {
      name: buyer.name || '',
      email: buyer.email || '',
      contact: buyer.contact || '',
    },
    theme: { color: '#5d0829' },
  };

  let paymentData: any;
  try {
    paymentData = await RazorpayCheckout.open(options);
  } catch (err: any) {
    return {
      success: false,
      cancelled: true,
      message: err?.description || 'Payment cancelled',
    };
  }

  // 3) Verify the signature server-side (marks the orders paid).
  try {
    await verifyRazorpayPayment(
      {
        razorpay_order_id: paymentData.razorpay_order_id,
        razorpay_payment_id: paymentData.razorpay_payment_id,
        razorpay_signature: paymentData.razorpay_signature,
        orderIds,
      },
      token,
    );
    return { success: true };
  } catch (e: any) {
    return { success: false, message: e?.error || 'Payment verification failed' };
  }
};
