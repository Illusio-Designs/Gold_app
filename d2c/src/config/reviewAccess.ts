// Play Store / App Store reviewer demo login.
//
// A single pre-approved test account that lets store reviewers sign in WITHOUT a
// real SMS OTP (a reviewer can't receive the texted code). For this one phone
// number the app skips the MSG91 OTP and logs straight in via the backend, which
// already treats this number as an approved account. Every other phone still
// gets a genuine OTP, so real users and security are unaffected.
//
// Kept here in one place (not scattered through the login screen) so it is easy
// to change or remove between review cycles.

export const REVIEW_PHONE_NUMBER = '7600046416';
export const REVIEW_OTP_CODE = '123456';

// True if the given phone is the reviewer demo account. Compares on the last 10
// digits, so it matches whether or not a +91 / 91 / 0 prefix is present.
export function isReviewPhone(phone?: string): boolean {
  if (!phone) return false;
  const digits = String(phone).replace(/\D/g, '');
  return digits.slice(-10) === REVIEW_PHONE_NUMBER.slice(-10);
}
