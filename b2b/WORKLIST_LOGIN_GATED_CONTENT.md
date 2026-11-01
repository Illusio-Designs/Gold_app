# Work List — Login-Gated Screen Content (B2B App)

**App:** B2B (`/b2b`)
**Branch:** `claude/code-updates-review-4lp01q`
**Status:** Planned (not started)

## Goal

When the user is **not logged in**, the **screen content itself** should display
**"Please login to see content"** — an in-screen empty state, **not** a popup/modal.

This applies to the **B2B app only**.

## Scope

| Screen | Behavior when logged out |
|--------|--------------------------|
| **Profile** | Screen body shows "Please login to see content" + Login button (instead of the fake profile: dummy name, avatar, Edit/Custom/Delete/Logout menu). |
| **Cart** | Screen body shows "Please login to see content" + Login button (instead of the empty-cart / cart items view). |
| **Add to Cart** | A guest tapping "Add to cart" is sent to login instead of silently adding. |

> Note: This is the **on-screen content**, not the existing `LoginPromptModal`
> popup. Guests should not see broken/fake content behind a dismissable modal.

## Tasks

- [ ] **1. Build reusable `LoginRequiredState` component** (B2B)
  - Full-screen centered state: lock icon + "Please login to see content" + Login button.
  - Reuse existing design tokens (maroon `#5D0829`, accent `#C09E83`, responsive helpers).
  - Login button navigates to `Login` screen.

- [ ] **2. Gate Profile screen** (`b2b/src/screens/Profile.tsx`)
  - Use `isLoggedIn` from `useLoginPrompt`.
  - When logged out, render `LoginRequiredState` in the body (keep `CustomHeader`).
  - Replace/complement the current `LoginPromptModal` on this screen.

- [ ] **3. Gate Cart screen** (`b2b/src/screens/Cart.tsx`)
  - When logged out, render `LoginRequiredState` in the body (keep `CustomHeader`).

- [ ] **4. Guard Add-to-Cart action**
  - `b2b/src/screens/Product.tsx` (`addToCartDirectly`)
  - `b2b/src/screens/ProductDetail.tsx` (`handleAddToCart`)
  - Check login first; if guest, prompt/redirect to Login instead of adding.

- [ ] **5. Verify flow**
  - Guest → Profile shows message → tap Login → after login, Profile shows real content.
  - Guest → Cart shows message.
  - Guest → Add to cart → redirected to login.

- [ ] **6. Commit, push, build**
  - Commit to `claude/code-updates-review-4lp01q`, push, trigger iOS + Android builds.

## Notes / Findings

- B2B already has `useLoginPrompt` hook (exposes `isLoggedIn`, `checkAndPromptLogin`,
  `checkLoginStatus`) and a `LoginPromptModal` component.
- Profile currently calls `checkAndPromptLogin()` on focus → shows the popup, but the
  fake profile still renders behind it. This work replaces that with an in-screen state.
- Icon available: `SquareLock02Icon` from `@hugeicons/core-free-icons`.
