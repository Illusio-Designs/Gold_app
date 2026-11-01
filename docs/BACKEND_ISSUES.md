# Backend issues — plain-language list

A check of the backend for the three kinds of users: **shops (B2B)**, **customers (B2C)**
and **you (admin)**. Each item says, in simple words, what's wrong, what happens because
of it, and — importantly — **whether the mobile apps need any change**.

> **Short answer on the apps:** No. The B2B and B2C apps do **not** need any
> change for any of these fixes. All of them are repairs inside the server only.
> The apps keep calling the same things the same way; they just start getting the
> correct, safe response. (Details on each are in the "App change?" line below.)

---

## 🔴 Must fix before going live

### 1. Anyone on the internet can make themselves an "admin" — ✅ FIXED
- **What's wrong:** The public sign-up accepts whatever account *type* the caller asks
  for. So a stranger can sign up as an **admin** and get full control of your dashboard.
- **Why it matters:** This is a complete security hole — someone could take over the
  whole system, see every order and customer, and delete data.
- **The fix:** On public sign-up, the server forces the type to "shop" or "customer"
  and never lets anyone become an admin that way. Admins are only created by you from
  inside the dashboard.
- **App change?** **No.** The shop app already signs people up as "shop" and the
  customer app as "customer" — exactly what the fix keeps allowing. Nothing to change.

### 2. Placing an order for a single product is broken — ✅ FIXED
- **What's wrong:** When someone orders one product (not from the cart), the server hits
  an internal error and never finishes. The stock gets held, but the customer just sees
  it hang with no confirmation.
- **Why it matters:** A core action — buying one item — silently fails.
- **The fix:** Correct the one wrong reference inside the order code so the order saves
  and returns a proper confirmation.
- **App change?** **No.** The apps already send the order correctly; the server was
  mishandling it. After the fix the same request just works.

---

## 🟠 Important

### 3. Login can hand out a pass without really checking the code, and lets blocked users in — ✅ FIXED
- **What's wrong:** The phone-login step trusts the phone number alone and hands out a
  long-lived login pass, and it skips the "is this shop approved?" check.
- **Why it matters:** A not-yet-approved (or rejected) shop could still get in.
- **The fix:** Re-apply the "approved only" rule on login.
- **App change?** **No.** The actual OTP code is already checked inside the apps by the
  SMS widget before the server is called, so that part is covered. Adding the "approved
  only" gate back is a server rule — the apps don't need to change; a blocked user simply
  gets a clear "not approved yet" message, which is the intended behaviour.

### 4. Accounts you create from the dashboard can never log in — ✅ FIXED
- **What's wrong:** When an account is created through one older path, the password gets
  scrambled twice, so the real password never matches and the person is locked out.
- **Why it matters:** Staff/customer accounts you add by hand are unusable.
- **The fix:** Scramble the password only once. (The newer "add system user" button you
  now have already does this correctly.)
- **App change?** **No.** This is entirely inside the server.

### 5. The search on the storefront crashes — ✅ FIXED
- **What's wrong:** Search asks the database for columns that don't exist, so it errors
  out every time.
- **Why it matters:** Customers/shops can't search the catalogue.
- **The fix:** Remove the made-up columns and calculate the one real value ("less weight")
  from numbers we already have.
- **App change?** **No.** The apps already call search the same way and just show whatever
  comes back — after the fix they get results instead of an error.

---

## 🟡 Worth fixing

### 6. Admin user lists quietly include passwords — ✅ FIXED
- **What's wrong:** When the dashboard loads the user list, the server also sends the
  scrambled passwords, reset codes and OTPs along with it — more than should ever leave
  the server.
- **The fix:** Send only the fields the screen needs.
- **App change?** **No** (admin/dashboard only).

### 7. Store statistics are open to any logged-in user — ✅ FIXED
- **What's wrong:** The store-wide stats page isn't limited to admins — any logged-in
  shop could read it.
- **The fix:** Lock it to admins only.
- **App change?** **No.** The apps don't use this; it's a dashboard number.

### 8. "mark amount" on products — ✅ NOT AN ISSUE (by design)
- **Clarified:** `mark_amount` is **not** a hidden wholesale price. It is a product cost
  component — the charge for diamonds, stones and other materials set in the piece — so it
  is meant to travel with the product and be visible to everyone.
- **Decision:** Leave it exactly as-is. No gating. No code change.

### 9. "Mark one notification as read" saves it against nobody — ✅ FIXED
- **What's wrong:** One of the notification routes is missing the user, so the "read"
  mark is saved against an empty user.
- **The fix:** Use the logged-in user automatically.
- **App change?** **No.** The apps already have working "mark read" calls they use; this
  fixes the stray one on the server side.

---

## 🟢 Minor / tidy-up — ✅ FIXED

- A product removed from the cart and added again can stay hidden. — *fixed: re-add now
  resets the item's status (and quantity) instead of only bumping quantity on a removed row.*
- A logged-in customer can accidentally be shown the admin version of a product. — *fixed:
  `getAllProducts` now checks the real user type via `optionalAuth`, so only genuine admins
  get the full catalogue; shops/customers get the available-only storefront view.*
- A couple of real-time "order updated" pings go to an empty channel, so they're never
  delivered. — *fixed: `updateOrder` emits to `user_${user_id}` instead of the non-existent
  `business_user_id`.*
- A "mark read" route doesn't check the notification is really yours. — *fixed: marking read
  only applies if the notification is addressed to you or is a global broadcast.*

None of these needed an app change.

---

## ✅ Already correct (no action)

Order and cart ownership · only approved shops can order · prices are worked out on the
server (can't be faked by the app) · payment can't be replayed or stolen · stock is held
safely during checkout · order numbers · no database-injection holes · notifications fail
safely · account-deletion is properly gated · routes are ordered correctly.

---

## Bottom line

- **Fix 1 and 2 first** — they're the live-blocking ones.
- **None of the eleven fixes require any change to the B2B or B2C apps.** They all live
  inside the server. The apps keep working exactly as they do now and simply start getting
  the correct, safe responses.
