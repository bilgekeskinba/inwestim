# Inwestim MVP — Manual Test-Case Inventory

> **Scope:** Covers the **currently implemented** MVP only. Tokenized ownership and the
> secondary marketplace are **not** implemented and are not tested as features. Blockchain
> transfers that are manual/admin-controlled are called out explicitly.
> See [`FLOWS.md`](./FLOWS.md) for the flows these cases exercise.
>
> **Priority:** Critical / High / Medium / Low   ·   **Type:** Positive / Negative / Security / Regression / RLS
> **Automation Candidate:** Yes / No (recommended tooling in [§ Automation Candidates](#3-automation-candidates))

**Modules:** [A. Authentication](#a-authentication) · [B. Profiles & roles](#b-profiles-and-roles) ·
[C. Public properties](#c-public-properties) · [D. Admin property CRUD](#d-admin-property-crud) ·
[E. Property documents](#e-property-documents) · [F. Investment requests](#f-investment-requests) ·
[G. Investment approval & rejection](#g-investment-approval-and-rejection) · [H. Active positions & lots](#h-active-positions-and-lots) ·
[I. Distribution calculation](#i-distribution-calculation) · [J. Distribution payment](#j-distribution-payment) ·
[K. Distribution history](#k-distribution-history) · [L. Wallet ledger](#l-wallet-ledger) ·
[M. Deposit requests](#m-deposit-requests) · [N. On-chain deposit verification](#n-on-chain-deposit-verification) ·
[O. Withdrawal requests](#o-withdrawal-requests) · [P. Treasury reconciliation](#p-treasury-reconciliation) ·
[Q. Navigation & route protection](#q-navigation-and-route-protection) · [R. Responsive & UI regression](#r-responsive-and-ui-regression) ·
[S. RLS & security](#s-rls-and-security) · [T. Idempotency & duplicate protection](#t-idempotency-and-duplicate-protection)

---

## A. Authentication

### AUTH-01
| Field | Value |
|---|---|
| Test Case ID | AUTH-01 |
| Module | A. Authentication |
| Title | Successful registration creates a Supabase Auth user |
| Preconditions | No account exists for the test email |
| Test Data | name="Jane Doe", email=`new+{ts}@example.com`, password="Passw0rd!", confirm="Passw0rd!", interest="Residential" |
| Steps | 1. Open `/register`. 2. Fill all fields with matching passwords. 3. Submit. |
| Expected Result | `supabase.auth.signUp` succeeds; `full_name`/`interest` stored in user metadata; redirected to `/verify-email`; email stashed in `sessionStorage.verifyEmail`. No `profiles` row yet. |
| Priority | Critical |
| Type | Positive |
| Automation Candidate | Yes |

### AUTH-02
| Field | Value |
|---|---|
| Test Case ID | AUTH-02 |
| Module | A. Authentication |
| Title | Duplicate registration is rejected |
| Preconditions | An account already exists for the email |
| Test Data | email of an existing user, valid matching passwords |
| Steps | 1. Open `/register`. 2. Register with the existing email. 3. Submit. |
| Expected Result | `signUp` returns an error; the error message is shown inline; no redirect to `/verify-email`. |
| Priority | Critical |
| Type | Negative |
| Automation Candidate | Yes |

### AUTH-03
| Field | Value |
|---|---|
| Test Case ID | AUTH-03 |
| Module | A. Authentication |
| Title | Registration validation — missing fields / password mismatch |
| Preconditions | None |
| Test Data | (a) blank required field; (b) password="A", confirm="B" |
| Steps | 1. Open `/register`. 2a. Leave a required field blank → submit. 2b. Enter mismatched passwords → submit. |
| Expected Result | (a) "Please fill in all required fields."; (b) "Passwords do not match."; no `signUp` call in either case. |
| Priority | High |
| Type | Negative |
| Automation Candidate | Yes |

### AUTH-04
| Field | Value |
|---|---|
| Test Case ID | AUTH-04 |
| Module | A. Authentication |
| Title | Verification email is sent on sign-up |
| Preconditions | Supabase project has email confirmation enabled |
| Test Data | New unique email |
| Steps | 1. Register a new account. 2. Inspect the inbox / Supabase Auth logs. |
| Expected Result | Supabase sends a confirmation email containing a verification link. |
| Priority | Critical |
| Type | Positive |
| Automation Candidate | No |

### AUTH-05
| Field | Value |
|---|---|
| Test Case ID | AUTH-05 |
| Module | A. Authentication |
| Title | Unverified login is blocked |
| Preconditions | Account registered but email not confirmed; project requires confirmation |
| Test Data | Registered-but-unverified credentials |
| Steps | 1. Open `/sign-in`. 2. Enter the unverified credentials. 3. Submit. |
| Expected Result | `signInWithPassword` returns an error (e.g. "Email not confirmed"); message shown; no redirect to `/dashboard`. |
| Priority | Critical |
| Type | Negative |
| Automation Candidate | No |

### AUTH-06
| Field | Value |
|---|---|
| Test Case ID | AUTH-06 |
| Module | A. Authentication |
| Title | Successful login redirects to dashboard |
| Preconditions | A verified account exists |
| Test Data | Verified credentials |
| Steps | 1. Open `/sign-in`. 2. Enter valid credentials. 3. Submit. |
| Expected Result | Session established; redirected to `/dashboard`. |
| Priority | Critical |
| Type | Positive |
| Automation Candidate | Yes |

### AUTH-07
| Field | Value |
|---|---|
| Test Case ID | AUTH-07 |
| Module | A. Authentication |
| Title | Invalid credentials are rejected |
| Preconditions | Account exists |
| Test Data | Correct email, wrong password |
| Steps | 1. Open `/sign-in`. 2. Enter wrong password. 3. Submit. |
| Expected Result | Error ("Invalid login credentials") shown; no session; stays on `/sign-in`. |
| Priority | Critical |
| Type | Negative |
| Automation Candidate | Yes |

### AUTH-08
| Field | Value |
|---|---|
| Test Case ID | AUTH-08 |
| Module | A. Authentication |
| Title | Logout clears the session |
| Preconditions | User signed in |
| Test Data | — |
| Steps | 1. Trigger logout (`/dashboard/logout`). 2. Attempt to open `/dashboard`. |
| Expected Result | Session cleared; opening a protected route redirects to `/sign-in`. |
| Priority | High |
| Type | Positive |
| Automation Candidate | Yes |

### AUTH-09
| Field | Value |
|---|---|
| Test Case ID | AUTH-09 |
| Module | A. Authentication |
| Title | Refresh keeps the session |
| Preconditions | User signed in on `/dashboard` |
| Test Data | — |
| Steps | 1. Reload the page (F5). 2. Observe. |
| Expected Result | Cookie-based session persists; dashboard re-renders without redirect to `/sign-in`. |
| Priority | High |
| Type | Regression |
| Automation Candidate | Yes |

### AUTH-10
| Field | Value |
|---|---|
| Test Case ID | AUTH-10 |
| Module | A. Authentication |
| Title | Verify-email demo screen accepts fixed code |
| Preconditions | Reached `/verify-email` after registering |
| Test Data | code="123456" (valid demo), code="000000" (invalid) |
| Steps | 1. Enter an incomplete code → submit. 2. Enter `000000` → submit. 3. Enter `123456` → submit. |
| Expected Result | 1. "Please enter the full 6-digit code." 2. "The code is invalid. Please try again." 3. Redirect to `/sign-in?verified=true` with success banner. (Screen is a demo; not wired to Supabase OTP.) |
| Priority | Medium |
| Type | Negative |
| Automation Candidate | Yes |

---

## B. Profiles and roles

### PROF-01
| Field | Value |
|---|---|
| Test Case ID | PROF-01 |
| Module | B. Profiles and roles |
| Title | Profile created on first dashboard access when missing |
| Preconditions | Verified user with no `profiles` row |
| Test Data | — |
| Steps | 1. Sign in. 2. Land on `/dashboard`. 3. Inspect `profiles`. |
| Expected Result | `ensureProfileExists` inserts `{id, email, full_name (from metadata), role:'user'}`; dashboard greets by name/email prefix. |
| Priority | Critical |
| Type | Positive |
| Automation Candidate | Yes |

### PROF-02
| Field | Value |
|---|---|
| Test Case ID | PROF-02 |
| Module | B. Profiles and roles |
| Title | Existing profile is reused, not duplicated |
| Preconditions | User already has a `profiles` row |
| Test Data | — |
| Steps | 1. Sign in and open `/dashboard` twice. 2. Count `profiles` rows for the user. |
| Expected Result | Exactly one row; `full_name` reused; a 23505 duplicate race is swallowed silently. |
| Priority | High |
| Type | Regression |
| Automation Candidate | Yes |

### PROF-03
| Field | Value |
|---|---|
| Test Case ID | PROF-03 |
| Module | B. Profiles and roles |
| Title | Display name falls back to email prefix |
| Preconditions | Profile has empty `full_name` |
| Test Data | email `sam@example.com`, no full_name |
| Steps | 1. Sign in with a profile lacking a name. 2. View the dashboard heading. |
| Expected Result | Heading shows "sam" (email local-part), never the full email; defaults to "investor" if none. |
| Priority | Low |
| Type | Positive |
| Automation Candidate | Yes |

### PROF-04
| Field | Value |
|---|---|
| Test Case ID | PROF-04 |
| Module | B. Profiles and roles |
| Title | Role gates admin vs. investor experience |
| Preconditions | One `role='admin'` and one `role='user'` account |
| Test Data | admin + user sessions |
| Steps | 1. As admin, open `/admin`. 2. As user, open `/admin`. |
| Expected Result | Admin sees the panel; user is redirected to `/dashboard` (see NAV/RLS). |
| Priority | Critical |
| Type | Security |
| Automation Candidate | Yes |

---

## C. Public properties

### PROP-01
| Field | Value |
|---|---|
| Test Case ID | PROP-01 |
| Module | C. Public properties |
| Title | Public listing shows only live properties |
| Preconditions | Properties exist in each status (draft/live/funded/exited) |
| Test Data | Mixed-status property set |
| Steps | 1. Open `/properties` (logged out). 2. Compare to DB. |
| Expected Result | Only `status='live'` properties render; draft/funded/exited are absent. |
| Priority | Critical |
| Type | Positive |
| Automation Candidate | Yes |

### PROP-02
| Field | Value |
|---|---|
| Test Case ID | PROP-02 |
| Module | C. Public properties |
| Title | Public cannot access a draft property detail |
| Preconditions | A `draft` property with known id |
| Test Data | Draft property id |
| Steps | 1. Navigate directly to `/properties/{draftId}` (logged out). |
| Expected Result | `getLivePropertyById` returns null → NotFound state (404); no draft data exposed. |
| Priority | Critical |
| Type | Security |
| Automation Candidate | Yes |

### PROP-03
| Field | Value |
|---|---|
| Test Case ID | PROP-03 |
| Module | C. Public properties |
| Title | Funded/exited property detail is hidden publicly |
| Preconditions | Funded and exited properties exist |
| Test Data | Funded id, exited id |
| Steps | 1. Open `/properties/{fundedId}` and `/properties/{exitedId}` logged out. |
| Expected Result | Both return NotFound (only `live` is public). |
| Priority | High |
| Type | Security |
| Automation Candidate | Yes |

### PROP-04
| Field | Value |
|---|---|
| Test Case ID | PROP-04 |
| Module | C. Public properties |
| Title | Admin can see all property statuses |
| Preconditions | Admin session; properties in all statuses |
| Test Data | — |
| Steps | 1. As admin open `/admin`. 2. Review the property list. |
| Expected Result | All statuses listed (no status filter) with correct status badges and stat counts. |
| Priority | High |
| Type | Positive |
| Automation Candidate | Yes |

### PROP-05
| Field | Value |
|---|---|
| Test Case ID | PROP-05 |
| Module | C. Public properties |
| Title | Live property detail renders public fields |
| Preconditions | A live property with documents |
| Test Data | Live property id |
| Steps | 1. Open `/properties/{liveId}`. 2. Review metrics + documents + CTA. |
| Expected Result | Title, location, target raise (`total_value`), minimum investment, expected return, monthly distribution, funding %, risk badge, public documents, and Start Investing button all render. |
| Priority | High |
| Type | Positive |
| Automation Candidate | Yes |

---

## D. Admin property CRUD

### PADM-01
| Field | Value |
|---|---|
| Test Case ID | PADM-01 |
| Module | D. Admin property CRUD |
| Title | Create a property |
| Preconditions | Admin session |
| Test Data | title="Test Villa", location="Lisbon", total_value=100000, minimum_investment=100, risk=medium, status=draft |
| Steps | 1. Open `/admin/properties/new`. 2. Fill fields. 3. Save. |
| Expected Result | INSERT into `properties` succeeds; redirect to `/admin`; new row visible with entered values. |
| Priority | Critical |
| Type | Positive |
| Automation Candidate | Yes |

### PADM-02
| Field | Value |
|---|---|
| Test Case ID | PADM-02 |
| Module | D. Admin property CRUD |
| Title | Edit a property |
| Preconditions | Admin session; existing property |
| Test Data | Change status draft→live, total_value 100000→120000 |
| Steps | 1. Open `/admin/properties/{id}/edit`. 2. Change values. 3. Save changes. |
| Expected Result | UPDATE by id persists; list reflects new status/values; property now public if set live. |
| Priority | Critical |
| Type | Positive |
| Automation Candidate | Yes |

### PADM-03
| Field | Value |
|---|---|
| Test Case ID | PADM-03 |
| Module | D. Admin property CRUD |
| Title | Delete a property (with confirm) |
| Preconditions | Admin session; deletable property |
| Test Data | Property id |
| Steps | 1. Click Delete. 2. Confirm the browser prompt. |
| Expected Result | DELETE by id; row removed; list refreshes. Cancelling the prompt performs no delete. |
| Priority | High |
| Type | Positive |
| Automation Candidate | Yes |

### PADM-04
| Field | Value |
|---|---|
| Test Case ID | PADM-04 |
| Module | D. Admin property CRUD |
| Title | Property form validation — title/location required |
| Preconditions | Admin session |
| Test Data | Blank title or blank location |
| Steps | 1. Open the new/edit form. 2. Leave title (or location) blank. 3. Save. |
| Expected Result | "Title and location are required."; no DB write. |
| Priority | Medium |
| Type | Negative |
| Automation Candidate | Yes |

### PADM-05
| Field | Value |
|---|---|
| Test Case ID | PADM-05 |
| Module | D. Admin property CRUD |
| Title | Numeric fields coerce safely |
| Preconditions | Admin session |
| Test Data | Leave total_value / funding_percentage blank or non-numeric |
| Steps | 1. Submit with empty numeric fields. |
| Expected Result | Blank/invalid numerics coerce to 0 (`Number(x)||0`); risk defaults "medium", status defaults "draft"; no crash. |
| Priority | Low |
| Type | Regression |
| Automation Candidate | Yes |

---

## E. Property documents

### DOC-01
| Field | Value |
|---|---|
| Test Case ID | DOC-01 |
| Module | E. Property documents |
| Title | Add a public document |
| Preconditions | Admin session; property exists |
| Test Data | title="Prospectus", type="prospectus", file_url="https://…/p.pdf", is_public=true |
| Steps | 1. Open property edit. 2. Add the document. |
| Expected Result | INSERT into `property_documents`; appears in admin list with Public badge and type badge. |
| Priority | High |
| Type | Positive |
| Automation Candidate | Yes |

### DOC-02
| Field | Value |
|---|---|
| Test Case ID | DOC-02 |
| Module | E. Property documents |
| Title | Public detail shows only public documents |
| Preconditions | Property has one public + one private document |
| Test Data | is_public=true and is_public=false docs |
| Steps | 1. Open public `/properties/{liveId}`. 2. Review documents. |
| Expected Result | Only the `is_public=true` document is shown; the private one is absent. |
| Priority | Critical |
| Type | Security |
| Automation Candidate | Yes |

### DOC-03
| Field | Value |
|---|---|
| Test Case ID | DOC-03 |
| Module | E. Property documents |
| Title | Private document visible to admin only |
| Preconditions | Property has a private document |
| Test Data | is_public=false doc |
| Steps | 1. As admin open property edit → see all docs. 2. As public, load the property detail. |
| Expected Result | Admin sees the private doc (Private badge); public detail never lists it. |
| Priority | High |
| Type | RLS |
| Automation Candidate | Yes |

### DOC-04
| Field | Value |
|---|---|
| Test Case ID | DOC-04 |
| Module | E. Property documents |
| Title | Document add validation |
| Preconditions | Admin session |
| Test Data | blank title / blank URL |
| Steps | 1. Submit with blank title. 2. Submit with blank URL. |
| Expected Result | "Enter a document title." / "Enter a file URL."; no insert. |
| Priority | Medium |
| Type | Negative |
| Automation Candidate | Yes |

### DOC-05
| Field | Value |
|---|---|
| Test Case ID | DOC-05 |
| Module | E. Property documents |
| Title | Delete a document |
| Preconditions | Admin session; document exists |
| Test Data | Document id |
| Steps | 1. Click Delete on the document. 2. Confirm the prompt. |
| Expected Result | DELETE by id; document removed from admin list and (if public) from the detail page. |
| Priority | Medium |
| Type | Positive |
| Automation Candidate | Yes |

---

## F. Investment requests

### INV-01
| Field | Value |
|---|---|
| Test Case ID | INV-01 |
| Module | F. Investment requests |
| Title | Valid investment request is created as pending |
| Preconditions | Logged-in user; live property |
| Test Data | amount ≥ minimum and ≤ remaining |
| Steps | 1. Start Investing. 2. Enter a valid amount → Review → Confirm. |
| Expected Result | INSERT `investments {user_id, property_id, amount, status:'pending'}`; redirect to `/dashboard`; pending request shown. |
| Priority | Critical |
| Type | Positive |
| Automation Candidate | Yes |

### INV-02
| Field | Value |
|---|---|
| Test Case ID | INV-02 |
| Module | F. Investment requests |
| Title | Amount below minimum is blocked |
| Preconditions | Logged-in user; property min=100 |
| Test Data | amount=50 |
| Steps | 1. Start Investing. 2. Enter 50 → Review. |
| Expected Result | "Minimum investment is $100.00."; no insert; stays on amount step. |
| Priority | Critical |
| Type | Negative |
| Automation Candidate | Yes |

### INV-03
| Field | Value |
|---|---|
| Test Case ID | INV-03 |
| Module | F. Investment requests |
| Title | Amount above remaining funding is blocked |
| Preconditions | Property with total_value and funding% so remaining is known |
| Test Data | total_value=100000, funding=90% → remaining=10000; amount=20000 |
| Steps | 1. Start Investing. 2. Enter 20000 → Review. |
| Expected Result | "Amount exceeds remaining funding ($10,000.00)."; no insert. |
| Priority | Critical |
| Type | Negative |
| Automation Candidate | Yes |

### INV-04
| Field | Value |
|---|---|
| Test Case ID | INV-04 |
| Module | F. Investment requests |
| Title | Zero / empty amount is blocked |
| Preconditions | Logged-in user |
| Test Data | amount blank or 0 |
| Steps | 1. Start Investing. 2. Leave amount blank → Review. |
| Expected Result | "Please enter an amount in USDC."; no insert. |
| Priority | Medium |
| Type | Negative |
| Automation Candidate | Yes |

### INV-05
| Field | Value |
|---|---|
| Test Case ID | INV-05 |
| Module | F. Investment requests |
| Title | Logged-out user is redirected to sign-in |
| Preconditions | No session |
| Test Data | — |
| Steps | 1. Open a live property detail logged out. 2. Click Start Investing. |
| Expected Result | Redirect to `/sign-in`; modal does not open; no insert. |
| Priority | Critical |
| Type | Security |
| Automation Candidate | Yes |

### INV-06
| Field | Value |
|---|---|
| Test Case ID | INV-06 |
| Module | F. Investment requests |
| Title | Same user can invest in the same property multiple times |
| Preconditions | Logged-in user; live property |
| Test Data | Two valid amounts submitted sequentially |
| Steps | 1. Submit investment A. 2. Submit investment B on the same property. 3. Inspect `investments`. |
| Expected Result | Two separate pending rows (separate lots); the DB keeps each purchase distinct. |
| Priority | Critical |
| Type | Positive |
| Automation Candidate | Yes |

### INV-07
| Field | Value |
|---|---|
| Test Case ID | INV-07 |
| Module | F. Investment requests |
| Title | Estimated ownership displayed on review |
| Preconditions | Logged-in user |
| Test Data | amount=1000, total_value=100000 |
| Steps | 1. Enter amount → Review. |
| Expected Result | Ownership shows 1.00% (`amount/total_value×100`), status "Pending approval". |
| Priority | Low |
| Type | Positive |
| Automation Candidate | Yes |

---

## G. Investment approval and rejection

### APPR-01
| Field | Value |
|---|---|
| Test Case ID | APPR-01 |
| Module | G. Investment approval and rejection |
| Title | Approve stamps approved_at and eligible_from |
| Preconditions | Admin session; a pending investment |
| Test Data | Pending investment id |
| Steps | 1. Open `/admin` pending investments. 2. Approve. 3. Inspect the row. |
| Expected Result | `status='approved'`, `approved_at=now`, `eligible_from` set; funding recomputed; investment debit created. |
| Priority | Critical |
| Type | Positive |
| Automation Candidate | Yes |

### APPR-02
| Field | Value |
|---|---|
| Test Case ID | APPR-02 |
| Module | G. Investment approval and rejection |
| Title | eligible_from is exactly one day after approved_at |
| Preconditions | Admin session; pending investment |
| Test Data | — |
| Steps | 1. Approve. 2. Compute `eligible_from − approved_at`. |
| Expected Result | Difference = exactly 24h (`approved_at + DAY_MS`). |
| Priority | Critical |
| Type | Positive |
| Automation Candidate | Yes |

### APPR-03
| Field | Value |
|---|---|
| Test Case ID | APPR-03 |
| Module | G. Investment approval and rejection |
| Title | Approve creates one completed investment debit |
| Preconditions | Admin session; pending investment amount=1000 |
| Test Data | — |
| Steps | 1. Approve. 2. Query `wallet_transactions` for the reference. |
| Expected Result | One row: `type='investment', direction='debit', status='completed', amount=1000, reference_type='investment', reference_id=investment.id, description='Investment approved'`. |
| Priority | Critical |
| Type | Positive |
| Automation Candidate | Yes |

### APPR-04
| Field | Value |
|---|---|
| Test Case ID | APPR-04 |
| Module | G. Investment approval and rejection |
| Title | Funding percentage changes after approval |
| Preconditions | Property total_value=100000; approved-sum will be 25000 after approval |
| Test Data | Pending investment of 25000 |
| Steps | 1. Note funding %. 2. Approve. 3. Re-check funding %. |
| Expected Result | `funding_percentage = min(100, round(Σ approved / total_value × 100))` = 25%. |
| Priority | Critical |
| Type | Positive |
| Automation Candidate | Yes |

### APPR-05
| Field | Value |
|---|---|
| Test Case ID | APPR-05 |
| Module | G. Investment approval and rejection |
| Title | Reject creates no debit and no funding change |
| Preconditions | Admin session; pending investment |
| Test Data | — |
| Steps | 1. Reject the request. 2. Inspect ledger + property funding. |
| Expected Result | `status='rejected'`; no `wallet_transactions` row; funding unchanged; no `approved_at`/`eligible_from`. |
| Priority | Critical |
| Type | Negative |
| Automation Candidate | Yes |

### APPR-06
| Field | Value |
|---|---|
| Test Case ID | APPR-06 |
| Module | G. Investment approval and rejection |
| Title | Funding sync is skipped when total_value is 0/missing |
| Preconditions | Property with total_value=0; pending investment |
| Test Data | — |
| Steps | 1. Approve the investment. 2. Inspect funding + ledger. |
| Expected Result | Funding left unchanged (guard), but status/timestamps/debit still applied; no crash. |
| Priority | Medium |
| Type | Regression |
| Automation Candidate | Yes |

### APPR-07
| Field | Value |
|---|---|
| Test Case ID | APPR-07 |
| Module | G. Investment approval and rejection |
| Title | Non-admin cannot approve investments |
| Preconditions | Regular user session/token |
| Test Data | Another user's pending investment id |
| Steps | 1. As a non-admin, attempt an UPDATE to `investments.status='approved'` via the API. |
| Expected Result | RLS denies the update; no status change; no debit. |
| Priority | Critical |
| Type | Security |
| Automation Candidate | Yes |

---

## H. Active positions and lots

### POS-01
| Field | Value |
|---|---|
| Test Case ID | POS-01 |
| Module | H. Active positions and lots |
| Title | Approved lots grouped by property with correct totals |
| Preconditions | User with 2 approved lots on property P (1000 + 500) and 1 on property Q |
| Test Data | Lots as above |
| Steps | 1. Open `/dashboard`. 2. Review Active Positions. |
| Expected Result | Property P row: total 1500, purchase count 2, latest date = max(created_at); Q separate. Sorted by total desc. |
| Priority | Critical |
| Type | Positive |
| Automation Candidate | Yes |

### POS-02
| Field | Value |
|---|---|
| Test Case ID | POS-02 |
| Module | H. Active positions and lots |
| Title | Active Positions count = distinct properties, not lots |
| Preconditions | User with 2 lots on P and 1 on Q (3 lots, 2 properties) |
| Test Data | — |
| Steps | 1. Open `/dashboard`. 2. Read "Active Positions". |
| Expected Result | Count = 2 (distinct properties); Portfolio Value = Σ all approved lot amounts. |
| Priority | High |
| Type | Positive |
| Automation Candidate | Yes |

### POS-03
| Field | Value |
|---|---|
| Test Case ID | POS-03 |
| Module | H. Active positions and lots |
| Title | Position detail lists lots individually |
| Preconditions | User with 2 approved lots on property P |
| Test Data | — |
| Steps | 1. Open `/dashboard/positions/{P}`. 2. Review "Investment lots". |
| Expected Result | Each lot shown separately with amount, purchased, approved, eligible-from dates; totals + purchase count match. |
| Priority | High |
| Type | Positive |
| Automation Candidate | Yes |

### POS-04
| Field | Value |
|---|---|
| Test Case ID | POS-04 |
| Module | H. Active positions and lots |
| Title | Pending lots excluded from active positions |
| Preconditions | User with a pending investment only |
| Test Data | — |
| Steps | 1. Open `/dashboard`. |
| Expected Result | Pending appears under pending requests only; Active Positions empty; portfolio value 0. |
| Priority | Medium |
| Type | Regression |
| Automation Candidate | Yes |

### POS-05
| Field | Value |
|---|---|
| Test Case ID | POS-05 |
| Module | H. Active positions and lots |
| Title | Position page for a property with no approved lots |
| Preconditions | User with no approved lot on the target property |
| Test Data | Property id with no approved lot for this user |
| Steps | 1. Open `/dashboard/positions/{id}`. |
| Expected Result | "No position found." empty state; no lots/distributions leaked. |
| Priority | Low |
| Type | Negative |
| Automation Candidate | Yes |

---

## I. Distribution calculation

### DIST-01
| Field | Value |
|---|---|
| Test Case ID | DIST-01 |
| Module | I. Distribution calculation |
| Title | Full-period lot earns full weight |
| Preconditions | Lot eligible before period start, open through period end |
| Test Data | amount=1000, eligible_from before start, 30-day period |
| Steps | 1. Create a cycle covering the period. 2. Inspect the lot's eligible_days/weight. |
| Expected Result | eligible_days=30, weight=30000. |
| Priority | Critical |
| Type | Positive |
| Automation Candidate | Yes |

### DIST-02
| Field | Value |
|---|---|
| Test Case ID | DIST-02 |
| Module | I. Distribution calculation |
| Title | Mid-period lot earns partial weight |
| Preconditions | Lot eligible from mid-period |
| Test Data | amount=1000, eligible_from = period start +15d, 30-day period |
| Steps | 1. Create the cycle. 2. Inspect eligible_days. |
| Expected Result | eligible_days=15, weight=15000 (overlap of active window with cycle). |
| Priority | Critical |
| Type | Positive |
| Automation Candidate | Yes |

### DIST-03
| Field | Value |
|---|---|
| Test Case ID | DIST-03 |
| Module | I. Distribution calculation |
| Title | Closed lot earns only up to closed_at |
| Preconditions | Lot with `closed_at` inside the period |
| Test Data | eligible_from before start, closed_at = start +10d, 30-day period |
| Steps | 1. Create the cycle. 2. Inspect eligible_days. |
| Expected Result | eligible_days=10 (earning ends at min(closed_at, period_end)). |
| Priority | High |
| Type | Positive |
| Automation Candidate | Yes |

### DIST-04
| Field | Value |
|---|---|
| Test Case ID | DIST-04 |
| Module | I. Distribution calculation |
| Title | Zero-eligible-day lots are ignored |
| Preconditions | Lot with eligible_from after period_end (or null eligible_from) |
| Test Data | eligible_from = period_end +1d; and a null-eligible_from lot |
| Steps | 1. Create the cycle including these lots. 2. Inspect payouts. |
| Expected Result | These lots produce no calculation/payout rows (0 days dropped). |
| Priority | Critical |
| Type | Negative |
| Automation Candidate | Yes |

### DIST-05
| Field | Value |
|---|---|
| Test Case ID | DIST-05 |
| Module | I. Distribution calculation |
| Title | Pro-rata amounts sum exactly to net distribution |
| Preconditions | Multiple eligible lots |
| Test Data | net=1000; lots A(1000,30d), B(1000,15d) |
| Steps | 1. Create the cycle. 2. Sum `rental_distributions.amount`. |
| Expected Result | A=666.67, B=333.33, Σ=1000.00 exactly. |
| Priority | Critical |
| Type | Positive |
| Automation Candidate | Yes |

### DIST-06
| Field | Value |
|---|---|
| Test Case ID | DIST-06 |
| Module | I. Distribution calculation |
| Title | Rounding remainder assigned to largest-weight lot |
| Preconditions | Lots whose rounded shares don't sum to net |
| Test Data | net=100; three equal lots (33.33×3=99.99) |
| Steps | 1. Create the cycle. 2. Inspect each amount + total. |
| Expected Result | Remainder (0.01) folded into the largest-weight lot; Σ=100.00 exactly. |
| Priority | High |
| Type | Positive |
| Automation Candidate | Yes |

### DIST-07
| Field | Value |
|---|---|
| Test Case ID | DIST-07 |
| Module | I. Distribution calculation |
| Title | No eligible lots blocks cycle creation |
| Preconditions | Property with no approved/eligible lots for the period |
| Test Data | Period where all lots have 0 eligible days |
| Steps | 1. Fill the cycle form with valid net. 2. Submit. |
| Expected Result | "No eligible investment lots for this period — nothing to distribute."; no cycle/calc/payout rows created. |
| Priority | Critical |
| Type | Negative |
| Automation Candidate | Yes |

### DIST-08
| Field | Value |
|---|---|
| Test Case ID | DIST-08 |
| Module | I. Distribution calculation |
| Title | Invalid period is rejected |
| Preconditions | Admin session |
| Test Data | period_end ≤ period_start; and missing dates |
| Steps | 1. Set end before start → submit. 2. Clear a date → submit. |
| Expected Result | "Period end must be after period start." / "Please set both period dates."; no DB write. |
| Priority | High |
| Type | Negative |
| Automation Candidate | Yes |

### DIST-09
| Field | Value |
|---|---|
| Test Case ID | DIST-09 |
| Module | I. Distribution calculation |
| Title | Net distribution ≤ 0 is rejected (gross − expenses) |
| Preconditions | Admin session |
| Test Data | gross=500, expenses=500 (net=0); and expenses>gross |
| Steps | 1. Enter values so net ≤ 0. 2. Submit. |
| Expected Result | "Net distribution (gross − expenses) must be greater than 0."; no DB write; live "Net distribution" preview updates. |
| Priority | Critical |
| Type | Negative |
| Automation Candidate | Yes |

### DIST-10
| Field | Value |
|---|---|
| Test Case ID | DIST-10 |
| Module | I. Distribution calculation |
| Title | Pending payouts and cycle status created on success |
| Preconditions | Admin session; eligible lots |
| Test Data | Valid period + net |
| Steps | 1. Create the cycle. 2. Inspect `distribution_cycles`, `distribution_calculations`, `rental_distributions`. |
| Expected Result | Cycle `status='calculated'` with `calculated_at`; one calc row + one payout (`status='pending'`) per eligible lot; payouts linked to calc ids. |
| Priority | Critical |
| Type | Positive |
| Automation Candidate | Yes |

### DIST-11
| Field | Value |
|---|---|
| Test Case ID | DIST-11 |
| Module | I. Distribution calculation |
| Title | Best-effort rollback on payout insert failure |
| Preconditions | Ability to force a `rental_distributions` insert error (e.g. RLS/constraint) |
| Test Data | Payout insert failing |
| Steps | 1. Trigger a cycle where the payout insert fails. 2. Inspect the tables. |
| Expected Result | `rollback()` deletes the calc rows and the cycle; error surfaced. (Note: orphan payout rows are not cleaned — verify none partially inserted.) |
| Priority | Medium |
| Type | Negative |
| Automation Candidate | No |

---

## J. Distribution payment

### PAY-01
| Field | Value |
|---|---|
| Test Case ID | PAY-01 |
| Module | J. Distribution payment |
| Title | Mark as Paid updates payouts and cycle |
| Preconditions | A `calculated` cycle with pending payouts |
| Test Data | — |
| Steps | 1. Click Mark as Paid. 2. Inspect the tables. |
| Expected Result | `rental_distributions` → `status='paid'`, `paid_at` set; `distribution_cycles` → `status='paid'`, `paid_at` set. |
| Priority | Critical |
| Type | Positive |
| Automation Candidate | Yes |

### PAY-02
| Field | Value |
|---|---|
| Test Case ID | PAY-02 |
| Module | J. Distribution payment |
| Title | Paid distribution creates one wallet credit per payout |
| Preconditions | Calculated cycle with 3 payouts across 2 users |
| Test Data | — |
| Steps | 1. Mark as Paid. 2. Query `wallet_transactions` for the payouts. |
| Expected Result | One credit per payout: `type='distribution', direction='credit', status='completed', reference_type='rental_distribution', reference_id=payout.id, description='Rental distribution payout'`; each user's payout separate. |
| Priority | Critical |
| Type | Positive |
| Automation Candidate | Yes |

### PAY-03
| Field | Value |
|---|---|
| Test Case ID | PAY-03 |
| Module | J. Distribution payment |
| Title | User Available Balance increases after payout |
| Preconditions | User with a payout of 250 in a paid cycle |
| Test Data | — |
| Steps | 1. Mark cycle paid. 2. As the user, open `/wallet`. |
| Expected Result | Available Balance increased by 250; distribution credit visible in Transaction History. |
| Priority | High |
| Type | Positive |
| Automation Candidate | Yes |

### PAY-04
| Field | Value |
|---|---|
| Test Case ID | PAY-04 |
| Module | J. Distribution payment |
| Title | Mark as Paid only affects pending payouts (re-click safe) |
| Preconditions | A cycle whose payouts are already paid |
| Test Data | — |
| Steps | 1. Click Mark as Paid again (if available). 2. Inspect payouts + ledger. |
| Expected Result | Update scoped to `status='pending'` affects 0 rows; no duplicate credits created. |
| Priority | High |
| Type | Regression |
| Automation Candidate | Yes |

### PAY-05
| Field | Value |
|---|---|
| Test Case ID | PAY-05 |
| Module | J. Distribution payment |
| Title | Cycle-status failure after payouts paid is surfaced |
| Preconditions | Force the `distribution_cycles` update to fail |
| Test Data | — |
| Steps | 1. Mark as Paid with the cycle update failing. |
| Expected Result | Alert "Payouts were marked paid, but the cycle status failed…"; payouts remain paid; no credits created (function returns before credit step). |
| Priority | Medium |
| Type | Negative |
| Automation Candidate | No |

---

## K. Distribution history

### HIST-01
| Field | Value |
|---|---|
| Test Case ID | HIST-01 |
| Module | K. Distribution history |
| Title | Dashboard history shows correct period and eligible days |
| Preconditions | User with distributions across statuses |
| Test Data | Paid + pending payouts |
| Steps | 1. Open `/dashboard`. 2. Review Distribution History. |
| Expected Result | Each row shows property, status badge, period (start–end), eligible days, paid date; newest first; all statuses listed. |
| Priority | High |
| Type | Positive |
| Automation Candidate | Yes |

### HIST-02
| Field | Value |
|---|---|
| Test Case ID | HIST-02 |
| Module | K. Distribution history |
| Title | Position-level distribution history filtered by property |
| Preconditions | User with distributions on P and Q |
| Test Data | — |
| Steps | 1. Open `/dashboard/positions/{P}`. 2. Review distribution history. |
| Expected Result | Only property P distributions shown, newest first, with period + eligible days + paid date. |
| Priority | Medium |
| Type | Positive |
| Automation Candidate | Yes |

### HIST-03
| Field | Value |
|---|---|
| Test Case ID | HIST-03 |
| Module | K. Distribution history |
| Title | Lifetime distributions counts only paid |
| Preconditions | User with one paid (100) + one pending (50) distribution |
| Test Data | — |
| Steps | 1. Open `/wallet`. 2. Read Lifetime Distributions. |
| Expected Result | Shows 100 (only `status='paid'` summed). |
| Priority | Medium |
| Type | Positive |
| Automation Candidate | Yes |

---

## L. Wallet ledger

### LEDG-01
| Field | Value |
|---|---|
| Test Case ID | LEDG-01 |
| Module | L. Wallet ledger |
| Title | Available Balance equals completed credits minus completed debits |
| Preconditions | User with completed deposit credit 1000, investment debit 400 |
| Test Data | — |
| Steps | 1. Open `/wallet`. 2. Read Available Balance. |
| Expected Result | Available = 600; derived from `wallet_transactions` (no stored balance column). |
| Priority | Critical |
| Type | Positive |
| Automation Candidate | Yes |

### LEDG-02
| Field | Value |
|---|---|
| Test Case ID | LEDG-02 |
| Module | L. Wallet ledger |
| Title | Pending Balance computed from pending rows |
| Preconditions | User with a `status='pending'` credit 200 (if seeded) |
| Test Data | — |
| Steps | 1. Seed/verify a pending ledger row. 2. Open `/wallet`. |
| Expected Result | Pending Balance = signed sum of pending rows (200); typically 0 in normal flows since writes use `completed`. |
| Priority | Medium |
| Type | Positive |
| Automation Candidate | Yes |

### LEDG-03
| Field | Value |
|---|---|
| Test Case ID | LEDG-03 |
| Module | L. Wallet ledger |
| Title | Negative balance displays correctly |
| Preconditions | User whose debits exceed credits (edge/test data) |
| Test Data | credit 100, debit 300 |
| Steps | 1. Open `/wallet`. |
| Expected Result | Available Balance renders as a negative USDC value without crashing. |
| Priority | Medium |
| Type | Regression |
| Automation Candidate | Yes |

### LEDG-04
| Field | Value |
|---|---|
| Test Case ID | LEDG-04 |
| Module | L. Wallet ledger |
| Title | Failed transactions excluded from both balances |
| Preconditions | User with a `status='failed'` ledger row |
| Test Data | failed credit 500 |
| Steps | 1. Open `/wallet`. |
| Expected Result | Failed row ignored in Available and Pending; still visible in history with its status badge. |
| Priority | High |
| Type | Regression |
| Automation Candidate | Yes |

### LEDG-05
| Field | Value |
|---|---|
| Test Case ID | LEDG-05 |
| Module | L. Wallet ledger |
| Title | Transaction signs and colors correct |
| Preconditions | User with a credit and a debit |
| Test Data | — |
| Steps | 1. Open `/wallet` history. |
| Expected Result | Credits show `+` (emerald), debits show `-` (rose); type capitalized; status badge + date/description shown. |
| Priority | Low |
| Type | Positive |
| Automation Candidate | Yes |

### LEDG-06
| Field | Value |
|---|---|
| Test Case ID | LEDG-06 |
| Module | L. Wallet ledger |
| Title | User sees only their own ledger |
| Preconditions | Two users each with transactions |
| Test Data | User A and User B |
| Steps | 1. As A open `/wallet`. 2. Attempt to read B's rows via the API. |
| Expected Result | A sees only A's rows; RLS blocks reading B's `wallet_transactions`. |
| Priority | Critical |
| Type | RLS |
| Automation Candidate | Yes |

---

## M. Deposit requests

### DEP-01
| Field | Value |
|---|---|
| Test Case ID | DEP-01 |
| Module | M. Deposit requests |
| Title | Valid deposit request (off-chain form) is created |
| Preconditions | Logged-in user; WalletConnect flag OFF |
| Test Data | amount=500, wallet_address filled, chain=polygon |
| Steps | 1. Open `/wallet`. 2. Submit the deposit form. |
| Expected Result | INSERT `deposit_requests {user_id, wallet_address, chain, asset, amount, status:'pending'}`; success message; request in "Your deposit requests". |
| Priority | Critical |
| Type | Positive |
| Automation Candidate | Yes |

### DEP-02
| Field | Value |
|---|---|
| Test Case ID | DEP-02 |
| Module | M. Deposit requests |
| Title | Deposit form validation (amount / wallet) |
| Preconditions | Logged-in user |
| Test Data | amount≤0; blank wallet |
| Steps | 1. Submit with amount 0. 2. Submit with blank wallet. |
| Expected Result | "Enter an amount greater than 0." / "Enter the wallet address you'll deposit from."; no insert. |
| Priority | High |
| Type | Negative |
| Automation Candidate | Yes |

### DEP-03
| Field | Value |
|---|---|
| Test Case ID | DEP-03 |
| Module | M. Deposit requests |
| Title | Blockchain deposit form requires valid tx hash format |
| Preconditions | WalletConnect flag ON; wallet connected on Polygon |
| Test Data | tx_hash="0x123" (too short) |
| Steps | 1. Enter amount + malformed hash. 2. Submit. |
| Expected Result | Rejected with a format error (`/^0x[a-fA-F0-9]{64}$/`); no insert. |
| Priority | High |
| Type | Negative |
| Automation Candidate | Yes |

### DEP-04
| Field | Value |
|---|---|
| Test Case ID | DEP-04 |
| Module | M. Deposit requests |
| Title | Duplicate tx_hash blocked at request time |
| Preconditions | A deposit with tx_hash X already exists |
| Test Data | Same tx_hash X |
| Steps | 1. Submit a blockchain deposit with hash X. |
| Expected Result | Blocked by the app pre-check and/or DB unique index (`23505`); message shown; no second row. |
| Priority | Critical |
| Type | Negative |
| Automation Candidate | Yes |

### DEP-05
| Field | Value |
|---|---|
| Test Case ID | DEP-05 |
| Module | M. Deposit requests |
| Title | Admin approve completes deposit and credits ledger |
| Preconditions | Admin session; a verified pending deposit (flag ON) amount=500 |
| Test Data | — |
| Steps | 1. Approve the deposit. 2. Inspect `deposit_requests` + ledger. |
| Expected Result | `deposit_requests.status='completed'` + `confirmed_at`; one `wallet_transactions` deposit credit (`completed`, reference to the deposit). |
| Priority | Critical |
| Type | Positive |
| Automation Candidate | Yes |

### DEP-06
| Field | Value |
|---|---|
| Test Case ID | DEP-06 |
| Module | M. Deposit requests |
| Title | Approve is disabled until verified (flag ON) |
| Preconditions | Admin session; unverified pending deposit; `REQUIRE_DEPOSIT_VERIFICATION` true |
| Test Data | — |
| Steps | 1. View the pending deposit. |
| Expected Result | Approve button disabled; note "Verification is required before approval." shown. |
| Priority | Critical |
| Type | Security |
| Automation Candidate | Yes |

### DEP-07
| Field | Value |
|---|---|
| Test Case ID | DEP-07 |
| Module | M. Deposit requests |
| Title | Verified deposit enables approval when flag is true |
| Preconditions | Admin session; deposit with `verification_status='verified'` |
| Test Data | — |
| Steps | 1. View the deposit. 2. Click Approve. |
| Expected Result | Approve enabled; approval completes deposit and credits ledger (see DEP-05). |
| Priority | Critical |
| Type | Positive |
| Automation Candidate | Yes |

### DEP-08
| Field | Value |
|---|---|
| Test Case ID | DEP-08 |
| Module | M. Deposit requests |
| Title | Reject creates no credit |
| Preconditions | Admin session; pending deposit |
| Test Data | — |
| Steps | 1. Reject the deposit. 2. Inspect ledger. |
| Expected Result | `deposit_requests.status='failed'`; no `wallet_transactions` row. |
| Priority | Critical |
| Type | Negative |
| Automation Candidate | Yes |

### DEP-09
| Field | Value |
|---|---|
| Test Case ID | DEP-09 |
| Module | M. Deposit requests |
| Title | Approve/Reject guarded to pending rows |
| Preconditions | A deposit already `completed` |
| Test Data | — |
| Steps | 1. Attempt to approve/reject the completed deposit (replayed request). |
| Expected Result | Update scoped `WHERE status='pending'` affects 0 rows; status unchanged; no extra credit. |
| Priority | High |
| Type | Regression |
| Automation Candidate | Yes |

### DEP-10
| Field | Value |
|---|---|
| Test Case ID | DEP-10 |
| Module | M. Deposit requests |
| Title | Deposit timeline reflects state |
| Preconditions | Deposits in pending / verified / completed / failed states |
| Test Data | — |
| Steps | 1. As the user open `/wallet`. 2. Review each deposit timeline. |
| Expected Result | Steps reflect: Request submitted → Tx hash provided → verification (verified/failed/pending) → approval (completed vs failed) → wallet credited. |
| Priority | Medium |
| Type | Positive |
| Automation Candidate | Yes |

---

## N. On-chain deposit verification

> Verification (`verifyDepositTransaction`) is **read-only** and never moves funds or
> auto-approves. Cases here assume a known on-chain tx or a mocked viem client.

### VER-01
| Field | Value |
|---|---|
| Test Case ID | VER-01 |
| Module | N. On-chain deposit verification |
| Title | Fully valid deposit verifies |
| Preconditions | A real/mocked tx: success, ≥12 confs, Polygon USDC, sender=wallet, to=treasury, exact amount |
| Test Data | Matching tx_hash |
| Steps | 1. Admin clicks Verify Tx. |
| Expected Result | `verification_status='verified'`; all checks pass; `verified_at` set. |
| Priority | Critical |
| Type | Positive |
| Automation Candidate | Yes |

### VER-02
| Field | Value |
|---|---|
| Test Case ID | VER-02 |
| Module | N. On-chain deposit verification |
| Title | Invalid / non-existent tx hash fails |
| Preconditions | tx_hash not found on the active network |
| Test Data | Unknown hash |
| Steps | 1. Verify. |
| Expected Result | "Transaction exists" fails; `verification_status='failed'`; failing check recorded. |
| Priority | High |
| Type | Negative |
| Automation Candidate | Yes |

### VER-03
| Field | Value |
|---|---|
| Test Case ID | VER-03 |
| Module | N. On-chain deposit verification |
| Title | Failed on-chain transaction fails verification |
| Preconditions | Tx with `receipt.status='reverted'` |
| Test Data | Reverted tx hash |
| Steps | 1. Verify. |
| Expected Result | "Transaction succeeded" check fails → `failed`. |
| Priority | High |
| Type | Negative |
| Automation Candidate | Yes |

### VER-04
| Field | Value |
|---|---|
| Test Case ID | VER-04 |
| Module | N. On-chain deposit verification |
| Title | Insufficient confirmations fails |
| Preconditions | Tx with confirmations < `MIN_DEPOSIT_CONFIRMATIONS` (12) |
| Test Data | Recent tx |
| Steps | 1. Verify. |
| Expected Result | "Minimum confirmations reached" fails with `n/12`; `failed`. |
| Priority | High |
| Type | Negative |
| Automation Candidate | Yes |

### VER-05
| Field | Value |
|---|---|
| Test Case ID | VER-05 |
| Module | N. On-chain deposit verification |
| Title | Wrong token fails |
| Preconditions | Tx transfers a non-USDC token |
| Test Data | Non-USDC transfer |
| Steps | 1. Verify. |
| Expected Result | "Token is official Polygon USDC" fails (no USDC Transfer log); `failed`. |
| Priority | High |
| Type | Negative |
| Automation Candidate | Yes |

### VER-06
| Field | Value |
|---|---|
| Test Case ID | VER-06 |
| Module | N. On-chain deposit verification |
| Title | Wrong sender fails |
| Preconditions | USDC transfer whose `from` ≠ request wallet_address |
| Test Data | Different sender |
| Steps | 1. Verify. |
| Expected Result | "Sender matches wallet address" fails; `failed`. |
| Priority | High |
| Type | Negative |
| Automation Candidate | Yes |

### VER-07
| Field | Value |
|---|---|
| Test Case ID | VER-07 |
| Module | N. On-chain deposit verification |
| Title | Wrong treasury recipient fails |
| Preconditions | USDC transfer whose `to` ≠ treasury |
| Test Data | Different recipient |
| Steps | 1. Verify. |
| Expected Result | "Recipient matches treasury" fails; `failed`. |
| Priority | High |
| Type | Negative |
| Automation Candidate | Yes |

### VER-08
| Field | Value |
|---|---|
| Test Case ID | VER-08 |
| Module | N. On-chain deposit verification |
| Title | Wrong amount fails |
| Preconditions | Transfer amount ≠ `parseUnits(request.amount, 6)` |
| Test Data | Mismatched amount |
| Steps | 1. Verify. |
| Expected Result | "Amount matches" fails; `failed`. |
| Priority | High |
| Type | Negative |
| Automation Candidate | Yes |

### VER-09
| Field | Value |
|---|---|
| Test Case ID | VER-09 |
| Module | N. On-chain deposit verification |
| Title | Wrong network configuration surfaced |
| Preconditions | Active network / treasury misconfigured (e.g. treasury unset) |
| Test Data | `NEXT_PUBLIC_TREASURY_ADDRESS` unset |
| Steps | 1. Verify. |
| Expected Result | "Treasury configured" fails with "Set NEXT_PUBLIC_TREASURY_ADDRESS"; `failed`. Verification only accepts Polygon (chainId 137). |
| Priority | Medium |
| Type | Negative |
| Automation Candidate | Yes |

### VER-10
| Field | Value |
|---|---|
| Test Case ID | VER-10 |
| Module | N. On-chain deposit verification |
| Title | Verification never changes deposit status |
| Preconditions | Pending deposit |
| Test Data | — |
| Steps | 1. Click Verify Tx (verified or failed). 2. Inspect `deposit_requests.status`. |
| Expected Result | `status` stays `pending`; only `verification_status/details/verified_at` change; no ledger write. |
| Priority | High |
| Type | Security |
| Automation Candidate | Yes |

---

## O. Withdrawal requests

### WD-01
| Field | Value |
|---|---|
| Test Case ID | WD-01 |
| Module | O. Withdrawal requests |
| Title | Request within available balance succeeds |
| Preconditions | User with available balance 1000 |
| Test Data | amount=400, destination wallet filled |
| Steps | 1. Open `/wallet`. 2. Submit the withdrawal form. |
| Expected Result | INSERT `withdrawal_requests {..., status:'pending'}`; success message; shows in "Your withdrawal requests". |
| Priority | Critical |
| Type | Positive |
| Automation Candidate | Yes |

### WD-02
| Field | Value |
|---|---|
| Test Case ID | WD-02 |
| Module | O. Withdrawal requests |
| Title | Request above available balance is blocked |
| Preconditions | User with available balance 300 |
| Test Data | amount=500 |
| Steps | 1. Submit the withdrawal form. |
| Expected Result | "Amount exceeds your available balance ($300.00)."; no insert. |
| Priority | Critical |
| Type | Negative |
| Automation Candidate | Yes |

### WD-03
| Field | Value |
|---|---|
| Test Case ID | WD-03 |
| Module | O. Withdrawal requests |
| Title | Withdrawal form validation (amount / destination) |
| Preconditions | Logged-in user |
| Test Data | amount≤0; blank destination |
| Steps | 1. Submit amount 0. 2. Submit blank destination. |
| Expected Result | "Enter an amount greater than 0." / "Enter the destination wallet address."; no insert. |
| Priority | High |
| Type | Negative |
| Automation Candidate | Yes |

### WD-04
| Field | Value |
|---|---|
| Test Case ID | WD-04 |
| Module | O. Withdrawal requests |
| Title | Approve does NOT debit the ledger |
| Preconditions | Admin session; pending withdrawal |
| Test Data | — |
| Steps | 1. Approve the withdrawal. 2. Inspect `withdrawal_requests` + ledger. |
| Expected Result | `status='approved'` + `approved_at`; NO `wallet_transactions` debit yet; user balance unchanged. |
| Priority | Critical |
| Type | Positive |
| Automation Candidate | Yes |

### WD-05
| Field | Value |
|---|---|
| Test Case ID | WD-05 |
| Module | O. Withdrawal requests |
| Title | Mark as Completed debits the ledger |
| Preconditions | Admin session; approved withdrawal amount=400; user balance ≥ 400 |
| Test Data | — |
| Steps | 1. Click Mark as Completed. 2. Inspect status + ledger + balance. |
| Expected Result | Balance re-checked, `status='completed'` + `completed_at`; one `wallet_transactions` withdrawal debit (`completed`); Available Balance decreases by 400. |
| Priority | Critical |
| Type | Positive |
| Automation Candidate | Yes |

### WD-06
| Field | Value |
|---|---|
| Test Case ID | WD-06 |
| Module | O. Withdrawal requests |
| Title | Completion blocked if balance changed |
| Preconditions | Approved withdrawal 400; user balance later reduced below 400 |
| Test Data | Balance now 300 |
| Steps | 1. Reduce balance (e.g. an investment debit). 2. Click Mark as Completed. |
| Expected Result | "Insufficient available balance at completion time."; no status change; no debit. |
| Priority | Critical |
| Type | Negative |
| Automation Candidate | Yes |

### WD-07
| Field | Value |
|---|---|
| Test Case ID | WD-07 |
| Module | O. Withdrawal requests |
| Title | Reject (pending) creates no debit |
| Preconditions | Admin session; pending withdrawal |
| Test Data | — |
| Steps | 1. Reject the withdrawal. 2. Inspect ledger. |
| Expected Result | `status='failed'`; no debit; balance unchanged. |
| Priority | High |
| Type | Negative |
| Automation Candidate | Yes |

### WD-08
| Field | Value |
|---|---|
| Test Case ID | WD-08 |
| Module | O. Withdrawal requests |
| Title | Cancel (approved) creates no debit |
| Preconditions | Admin session; approved withdrawal |
| Test Data | — |
| Steps | 1. Click Cancel. 2. Inspect ledger. |
| Expected Result | `status='cancelled'` (guarded from `approved`); no debit; balance unchanged. |
| Priority | High |
| Type | Negative |
| Automation Candidate | Yes |

### WD-09
| Field | Value |
|---|---|
| Test Case ID | WD-09 |
| Module | O. Withdrawal requests |
| Title | Withdrawal timeline reflects state |
| Preconditions | Withdrawals in pending/approved/completed/cancelled/failed |
| Test Data | — |
| Steps | 1. As the user open `/wallet`. 2. Review timelines. |
| Expected Result | Steps reflect: Request submitted → Admin approved → Payout processing → terminal (Completed/Failed/Cancelled) → Wallet debited. |
| Priority | Medium |
| Type | Positive |
| Automation Candidate | Yes |

### WD-10
| Field | Value |
|---|---|
| Test Case ID | WD-10 |
| Module | O. Withdrawal requests |
| Title | No automated on-chain payout occurs |
| Preconditions | Completed withdrawal |
| Test Data | — |
| Steps | 1. Complete a withdrawal. 2. Check for any on-chain transfer trigger. |
| Expected Result | Only a ledger debit is written; **no automated blockchain transfer** is performed (manual/admin-controlled — documented gap). |
| Priority | High |
| Type | Regression |
| Automation Candidate | No |

---

## P. Treasury reconciliation

### TRE-01
| Field | Value |
|---|---|
| Test Case ID | TRE-01 |
| Module | P. Treasury reconciliation |
| Title | Balanced deposit ledger |
| Preconditions | Completed deposits equal deposit credits |
| Test Data | Σ completed deposits = Σ deposit credits |
| Steps | 1. Open the admin treasury dashboard. |
| Expected Result | Deposit reconciliation shows "balanced"; difference = 0. |
| Priority | High |
| Type | Positive |
| Automation Candidate | Yes |

### TRE-02
| Field | Value |
|---|---|
| Test Case ID | TRE-02 |
| Module | P. Treasury reconciliation |
| Title | Deposit mismatch detected |
| Preconditions | A completed deposit with no matching credit (forced) |
| Test Data | Deposit completed, credit missing |
| Steps | 1. Open the treasury dashboard. |
| Expected Result | Status "mismatch"; non-zero difference; the deposit listed under "Missing ledger credit". |
| Priority | High |
| Type | Negative |
| Automation Candidate | Yes |

### TRE-03
| Field | Value |
|---|---|
| Test Case ID | TRE-03 |
| Module | P. Treasury reconciliation |
| Title | Missing deposit credit shown |
| Preconditions | As TRE-02 |
| Test Data | — |
| Steps | 1. Review the Missing ledger credits list. |
| Expected Result | Up to 5 completed deposits without a matching credit are listed with email/amount/date. |
| Priority | Medium |
| Type | Negative |
| Automation Candidate | Yes |

### TRE-04
| Field | Value |
|---|---|
| Test Case ID | TRE-04 |
| Module | P. Treasury reconciliation |
| Title | Balanced withdrawal ledger |
| Preconditions | Completed withdrawals equal withdrawal debits |
| Test Data | — |
| Steps | 1. Open the treasury dashboard. |
| Expected Result | Withdrawal reconciliation "balanced"; difference 0. |
| Priority | High |
| Type | Positive |
| Automation Candidate | Yes |

### TRE-05
| Field | Value |
|---|---|
| Test Case ID | TRE-05 |
| Module | P. Treasury reconciliation |
| Title | Withdrawal mismatch + missing debit shown |
| Preconditions | Completed withdrawal with no debit |
| Test Data | — |
| Steps | 1. Open the treasury dashboard. |
| Expected Result | Status "mismatch"; withdrawal in "Missing ledger debit" list. |
| Priority | High |
| Type | Negative |
| Automation Candidate | Yes |

### TRE-06
| Field | Value |
|---|---|
| Test Case ID | TRE-06 |
| Module | P. Treasury reconciliation |
| Title | Orphan withdrawal debit shown |
| Preconditions | A withdrawal debit whose reference_id is not a known withdrawal |
| Test Data | Orphan debit row |
| Steps | 1. Open the treasury dashboard. |
| Expected Result | The debit appears under "Orphan ledger debit". |
| Priority | Medium |
| Type | Negative |
| Automation Candidate | Yes |

### TRE-07
| Field | Value |
|---|---|
| Test Case ID | TRE-07 |
| Module | P. Treasury reconciliation |
| Title | Net treasury position calculation |
| Preconditions | Deposit credits 1000, withdrawal debits 300 |
| Test Data | — |
| Steps | 1. Open the treasury dashboard. |
| Expected Result | Net Treasury Position = 700 (Σ deposit credits − Σ withdrawal debits), rounded to 6dp. |
| Priority | High |
| Type | Positive |
| Automation Candidate | Yes |

### TRE-08
| Field | Value |
|---|---|
| Test Case ID | TRE-08 |
| Module | P. Treasury reconciliation |
| Title | Reconciliation is DB-only (no chain query) |
| Preconditions | Admin session |
| Test Data | — |
| Steps | 1. Open the treasury dashboard with RPC unavailable. |
| Expected Result | Metrics still render (computed from DB tables only); no blockchain dependency. |
| Priority | Low |
| Type | Regression |
| Automation Candidate | Yes |

---

## Q. Navigation and route protection

### NAV-01
| Field | Value |
|---|---|
| Test Case ID | NAV-01 |
| Module | Q. Navigation and route protection |
| Title | Unauthenticated protected-route access redirects to sign-in |
| Preconditions | No session |
| Test Data | `/dashboard`, `/wallet`, `/profile`, `/dashboard/positions/{id}` |
| Steps | 1. Open each protected route logged out. |
| Expected Result | Each redirects to `/sign-in`. |
| Priority | Critical |
| Type | Security |
| Automation Candidate | Yes |

### NAV-02
| Field | Value |
|---|---|
| Test Case ID | NAV-02 |
| Module | Q. Navigation and route protection |
| Title | Unauthenticated /admin redirects to sign-in |
| Preconditions | No session |
| Test Data | `/admin`, `/admin/properties/new` |
| Steps | 1. Open `/admin` logged out. |
| Expected Result | `requireAdmin` redirects to `/sign-in`. |
| Priority | Critical |
| Type | Security |
| Automation Candidate | Yes |

### NAV-03
| Field | Value |
|---|---|
| Test Case ID | NAV-03 |
| Module | Q. Navigation and route protection |
| Title | Non-admin /admin redirects to dashboard |
| Preconditions | Regular user session |
| Test Data | `/admin` |
| Steps | 1. As a non-admin open `/admin`. |
| Expected Result | Redirect to `/dashboard`; no admin data rendered. |
| Priority | Critical |
| Type | Security |
| Automation Candidate | Yes |

### NAV-04
| Field | Value |
|---|---|
| Test Case ID | NAV-04 |
| Module | Q. Navigation and route protection |
| Title | Public pages reachable without auth |
| Preconditions | No session |
| Test Data | `/`, `/properties`, `/properties/{liveId}`, `/about`, `/how-it-works`, `/contact` |
| Steps | 1. Open each public route logged out. |
| Expected Result | All render without redirect. |
| Priority | Medium |
| Type | Positive |
| Automation Candidate | Yes |

### NAV-05
| Field | Value |
|---|---|
| Test Case ID | NAV-05 |
| Module | Q. Navigation and route protection |
| Title | Authenticated user reaches app pages |
| Preconditions | Verified session |
| Test Data | `/dashboard`, `/wallet`, `/profile` |
| Steps | 1. Signed in, open each. |
| Expected Result | Pages render for the owner without redirect. |
| Priority | High |
| Type | Positive |
| Automation Candidate | Yes |

---

## R. Responsive and UI regression

### UI-01
| Field | Value |
|---|---|
| Test Case ID | UI-01 |
| Module | R. Responsive and UI regression |
| Title | Dashboard responsive layout |
| Preconditions | Signed-in user with positions |
| Test Data | Viewports: 375px, 768px, 1280px |
| Steps | 1. Open `/dashboard` at each width. |
| Expected Result | Metric grid, position cards, and history reflow without overflow/clipping. |
| Priority | Medium |
| Type | Regression |
| Automation Candidate | Yes |

### UI-02
| Field | Value |
|---|---|
| Test Case ID | UI-02 |
| Module | R. Responsive and UI regression |
| Title | Investment modal on mobile |
| Preconditions | Live property; mobile viewport |
| Test Data | 375px |
| Steps | 1. Start Investing. 2. Step through amount → review. |
| Expected Result | Modal centered, inputs usable, buttons reachable, close works. |
| Priority | Medium |
| Type | Regression |
| Automation Candidate | Yes |

### UI-03
| Field | Value |
|---|---|
| Test Case ID | UI-03 |
| Module | R. Responsive and UI regression |
| Title | Wallet page balance cards + histories |
| Preconditions | User with transactions, deposits, withdrawals |
| Test Data | Multiple viewports |
| Steps | 1. Open `/wallet`. 2. Review balance grid + timelines + history. |
| Expected Result | Four balance cards wrap cleanly; timelines/history readable on mobile. |
| Priority | Low |
| Type | Regression |
| Automation Candidate | Yes |

### UI-04
| Field | Value |
|---|---|
| Test Case ID | UI-04 |
| Module | R. Responsive and UI regression |
| Title | Status badges render for every status |
| Preconditions | Data across all status values |
| Test Data | investment/deposit/withdrawal/distribution statuses |
| Steps | 1. View lists containing each status. |
| Expected Result | Each status has a distinct, legible badge; unknown statuses fall back gracefully. |
| Priority | Low |
| Type | Regression |
| Automation Candidate | Yes |

### UI-05
| Field | Value |
|---|---|
| Test Case ID | UI-05 |
| Module | R. Responsive and UI regression |
| Title | Empty states render |
| Preconditions | New user with no data |
| Test Data | — |
| Steps | 1. Open `/dashboard` and `/wallet`. |
| Expected Result | Friendly empty states for positions, distributions, transactions, deposits, withdrawals; no broken layout. |
| Priority | Low |
| Type | Regression |
| Automation Candidate | Yes |

### UI-06
| Field | Value |
|---|---|
| Test Case ID | UI-06 |
| Module | R. Responsive and UI regression |
| Title | Remove diagnostic output before release |
| Preconditions | Properties list / dev logging present |
| Test Data | — |
| Steps | 1. Open `/properties`. 2. Inspect the page + console. |
| Expected Result | Regression check: the "Loaded N properties from Supabase" line and `getLiveProperties` console logs should not appear in production. |
| Priority | Low |
| Type | Regression |
| Automation Candidate | No |

---

## S. RLS and security

### RLS-01
| Field | Value |
|---|---|
| Test Case ID | RLS-01 |
| Module | S. RLS and security |
| Title | User cannot read another user's investments |
| Preconditions | Users A and B, each with investments |
| Test Data | B's user_id |
| Steps | 1. As A, query `investments` for B's rows via the API. |
| Expected Result | RLS returns no rows for B; A sees only their own. |
| Priority | Critical |
| Type | RLS |
| Automation Candidate | Yes |

### RLS-02
| Field | Value |
|---|---|
| Test Case ID | RLS-02 |
| Module | S. RLS and security |
| Title | User cannot read another user's wallet transactions |
| Preconditions | Users A and B with ledger rows |
| Test Data | B's user_id |
| Steps | 1. As A, query `wallet_transactions` for B. |
| Expected Result | RLS blocks; only A's rows returned. |
| Priority | Critical |
| Type | RLS |
| Automation Candidate | Yes |

### RLS-03
| Field | Value |
|---|---|
| Test Case ID | RLS-03 |
| Module | S. RLS and security |
| Title | User cannot update another profile |
| Preconditions | Users A and B |
| Test Data | B's profile id |
| Steps | 1. As A, attempt UPDATE `profiles` for B (e.g. set role='admin'). |
| Expected Result | RLS denies; B's profile unchanged; privilege escalation prevented. |
| Priority | Critical |
| Type | Security |
| Automation Candidate | Yes |

### RLS-04
| Field | Value |
|---|---|
| Test Case ID | RLS-04 |
| Module | S. RLS and security |
| Title | Anonymous cannot insert properties |
| Preconditions | No session (anon key only) |
| Test Data | Property payload |
| Steps | 1. Anonymously POST an insert to `properties`. |
| Expected Result | RLS denies the insert. |
| Priority | Critical |
| Type | Security |
| Automation Candidate | Yes |

### RLS-05
| Field | Value |
|---|---|
| Test Case ID | RLS-05 |
| Module | S. RLS and security |
| Title | Non-admin cannot approve investments |
| Preconditions | Regular user session |
| Test Data | A pending investment id |
| Steps | 1. As a non-admin, UPDATE `investments.status='approved'`. |
| Expected Result | RLS denies; no status change; no ledger debit. |
| Priority | Critical |
| Type | Security |
| Automation Candidate | Yes |

### RLS-06
| Field | Value |
|---|---|
| Test Case ID | RLS-06 |
| Module | S. RLS and security |
| Title | Non-admin cannot create distribution cycles |
| Preconditions | Regular user session |
| Test Data | Cycle payload |
| Steps | 1. As a non-admin, INSERT into `distribution_cycles` / `rental_distributions`. |
| Expected Result | RLS denies the inserts. |
| Priority | Critical |
| Type | Security |
| Automation Candidate | Yes |

### RLS-07
| Field | Value |
|---|---|
| Test Case ID | RLS-07 |
| Module | S. RLS and security |
| Title | Private documents hidden from non-owners/public |
| Preconditions | Private document exists |
| Test Data | is_public=false doc |
| Steps | 1. As anon/regular user query `property_documents` with is_public=false. |
| Expected Result | RLS returns only public rows to non-admins; private docs not exposed. |
| Priority | High |
| Type | RLS |
| Automation Candidate | Yes |

### RLS-08
| Field | Value |
|---|---|
| Test Case ID | RLS-08 |
| Module | S. RLS and security |
| Title | Admin policies allow admin operations |
| Preconditions | Admin session |
| Test Data | — |
| Steps | 1. As admin, read all pending investments/deposits/withdrawals and perform an approval. |
| Expected Result | Admin RLS policies permit the reads/writes (approve stamps status + ledger). Confirms admin policies are present and correct. |
| Priority | Critical |
| Type | RLS |
| Automation Candidate | Yes |

### RLS-09
| Field | Value |
|---|---|
| Test Case ID | RLS-09 |
| Module | S. RLS and security |
| Title | User cannot insert a wallet transaction for another user |
| Preconditions | Users A and B |
| Test Data | Ledger row with user_id=B |
| Steps | 1. As A, INSERT `wallet_transactions` with user_id=B (or a self-credit). |
| Expected Result | RLS prevents forging ledger entries / crediting oneself (writes restricted to admin policy). |
| Priority | Critical |
| Type | Security |
| Automation Candidate | Yes |

### RLS-10
| Field | Value |
|---|---|
| Test Case ID | RLS-10 |
| Module | S. RLS and security |
| Title | User cannot approve their own deposit/withdrawal |
| Preconditions | Regular user with a pending deposit and withdrawal |
| Test Data | Own request ids |
| Steps | 1. As the requesting user, attempt to set the deposit `completed` / withdrawal `approved`/`completed`. |
| Expected Result | RLS denies status transitions reserved for admins; no ledger credit/debit created. |
| Priority | Critical |
| Type | Security |
| Automation Candidate | Yes |

---

## T. Idempotency and duplicate protection

### IDEM-01
| Field | Value |
|---|---|
| Test Case ID | IDEM-01 |
| Module | T. Idempotency and duplicate protection |
| Title | Repeated investment approval does not duplicate the debit |
| Preconditions | Admin session; approved investment with an existing debit |
| Test Data | — |
| Steps | 1. Re-approve / re-trigger `createInvestmentDebit`. 2. Count debits. |
| Expected Result | Pre-check on `(reference_type='investment', reference_id, type='investment')` finds the row → exactly one debit remains. |
| Priority | Critical |
| Type | Regression |
| Automation Candidate | Yes |

### IDEM-02
| Field | Value |
|---|---|
| Test Case ID | IDEM-02 |
| Module | T. Idempotency and duplicate protection |
| Title | Repeated deposit approval does not duplicate the credit |
| Preconditions | Admin session; completed deposit with a credit |
| Test Data | — |
| Steps | 1. Re-run approval/credit (replay). 2. Count credits. |
| Expected Result | Idempotency check on `(deposit_request, reference_id, type='deposit')` → exactly one credit. |
| Priority | Critical |
| Type | Regression |
| Automation Candidate | Yes |

### IDEM-03
| Field | Value |
|---|---|
| Test Case ID | IDEM-03 |
| Module | T. Idempotency and duplicate protection |
| Title | Repeated distribution payment does not duplicate credits |
| Preconditions | Paid cycle with credits already created |
| Test Data | — |
| Steps | 1. Re-run Mark as Paid / `createDistributionCredits`. 2. Count credits per payout. |
| Expected Result | Already-credited payout ids skipped (`reference_type='rental_distribution'` + `reference_id`); one credit per payout. |
| Priority | Critical |
| Type | Regression |
| Automation Candidate | Yes |

### IDEM-04
| Field | Value |
|---|---|
| Test Case ID | IDEM-04 |
| Module | T. Idempotency and duplicate protection |
| Title | Repeated withdrawal completion does not duplicate the debit |
| Preconditions | Completed withdrawal with a debit |
| Test Data | — |
| Steps | 1. Replay completion / `createWithdrawalDebit`. 2. Count debits. |
| Expected Result | Pre-check on `(withdrawal_request, reference_id, type='withdrawal')` → exactly one debit. |
| Priority | Critical |
| Type | Regression |
| Automation Candidate | Yes |

### IDEM-05
| Field | Value |
|---|---|
| Test Case ID | IDEM-05 |
| Module | T. Idempotency and duplicate protection |
| Title | Repeated verification does not alter the ledger |
| Preconditions | Deposit already verified |
| Test Data | — |
| Steps | 1. Click Verify Tx repeatedly. 2. Inspect ledger + status. |
| Expected Result | Only `verification_status/details/verified_at` refresh; no `wallet_transactions` change; `status` stays `pending`. |
| Priority | High |
| Type | Regression |
| Automation Candidate | Yes |

### IDEM-06
| Field | Value |
|---|---|
| Test Case ID | IDEM-06 |
| Module | T. Idempotency and duplicate protection |
| Title | Duplicate tx_hash prevented at DB level |
| Preconditions | A deposit with tx_hash X exists |
| Test Data | tx_hash X |
| Steps | 1. Attempt a second deposit insert with hash X (bypassing the app pre-check). |
| Expected Result | DB unique index rejects with `23505`; no duplicate row. |
| Priority | High |
| Type | Negative |
| Automation Candidate | Yes |

### IDEM-07
| Field | Value |
|---|---|
| Test Case ID | IDEM-07 |
| Module | T. Idempotency and duplicate protection |
| Title | Status-guarded updates are safe on re-click |
| Preconditions | A deposit/withdrawal/payout already transitioned |
| Test Data | — |
| Steps | 1. Replay the transition (e.g. approve a non-pending deposit, mark-paid a non-pending payout). |
| Expected Result | `.eq("status", from)` guard matches 0 rows; no duplicate state change or ledger entry. |
| Priority | High |
| Type | Regression |
| Automation Candidate | Yes |

---

## 1. Regression Smoke Suite

Run these 15 critical cases before every release:

| # | Case | Why |
|---|---|---|
| 1 | AUTH-06 Successful login | Entry gate to the whole app |
| 2 | NAV-01 Unauthenticated redirect | Core access control |
| 3 | NAV-03 Non-admin /admin → dashboard | Admin isolation |
| 4 | PROP-01 Public sees live only | Prevents leaking non-live listings |
| 5 | PROP-02 Draft detail hidden | Direct-URL data-exposure guard |
| 6 | INV-01 Valid investment created | Primary revenue action |
| 7 | INV-05 Logged-out invest redirect | Auth guard on invest |
| 8 | APPR-02 eligible_from = approved_at + 1 day | Distribution correctness foundation |
| 9 | APPR-03 Approve creates one debit | Ledger integrity |
| 10 | DIST-05 Pro-rata sums to net exactly | Money-accuracy invariant |
| 11 | PAY-02 One credit per payout | Payout integrity |
| 12 | LEDG-01 Balance = credits − debits | Balance derivation |
| 13 | WD-05 / WD-06 Completion debits / blocked on low balance | Overdraft protection |
| 14 | DEP-05 / DEP-06 Approve credits / gated by verification | Money-in integrity |
| 15 | RLS-02 User can't read another's ledger | Data isolation |

---

## 2. Production Readiness Gaps

The following areas are **blocked or incomplete** in the current MVP; related tests cannot be
fully executed and are documented here as gaps rather than failures.

| Gap | Impact on testing |
|---|---|
| **Automated blockchain withdrawal is not implemented** | WD-10 can only assert "no on-chain transfer occurs". End-to-end payout verification (funds actually reaching the destination wallet) cannot be tested. Completion writes a ledger debit only; the real transfer is manual/admin-controlled. |
| **Tokenized ownership is not implemented** | No on-chain ownership tokens exist; ownership is a DB/ledger construct. Any token mint/transfer/balance tests are out of scope. |
| **Secondary marketplace is not implemented** | No listing/bid/settlement flows exist to test. |
| **KYC / AML is not implemented** | Identity/eligibility gating cannot be tested; investments and withdrawals proceed without identity checks. |
| **Server-side / private-RPC verification is not implemented** | Deposit verification runs client-side against a public/registry RPC. Tests cannot cover a trusted server-side verifier, rate-limited private RPC, or tamper-resistant confirmation. Verification result is advisory (UI-gated), not enforced inside the approval mutation. |
| **File upload / storage is not implemented** | Property documents are URL references only (`file_url`). There is no upload pipeline, virus scan, access-controlled storage, or signed-URL expiry to test. |
| **No DB transactions / atomicity** | Cycle creation, mark-as-paid, and completion have partial-failure windows (soft-fail ledger inserts, best-effort rollback). Reconciliation (module P) is the compensating control; true atomic guarantees cannot be asserted. |
| **Idempotency is application-level (read-then-insert)** | Except the deposit `tx_hash` unique index, ledger idempotency is not backed by DB uniqueness and is TOCTOU-racy under concurrency; high-concurrency duplicate-prevention cannot be guaranteed by test. |

---

## 3. Automation Candidates

| Layer | Tool | Scope |
|---|---|---|
| **UI / E2E** | **Playwright** | Auth (AUTH-01…09), navigation/route protection (NAV-*), investment request (INV-*), admin approve/reject and cycle flows, wallet balances, deposit/withdrawal request forms, responsive checks (UI-*). Drive real browser flows against a seeded Supabase test project. |
| **Calculation utilities** | **Vitest** | Pure functions in `lib/distribution.ts` — `eligibleDaysFor`, `calculateProrataDistribution` (DIST-01…06), rounding remainder, empty/guard branches. Fast, deterministic; no DB. Also cover balance-derivation math. |
| **RLS / authorization** | **Supabase integration tests** | Per-role clients (anon, user A, user B, admin) asserting allow/deny on `investments`, `wallet_transactions`, `profiles`, `properties`, `property_documents`, `distribution_*` (RLS-01…10, APPR-07, RLS-05/06). |
| **Ledger / reconciliation** | **Isolated integration tests** | Seed `deposit_requests`/`withdrawal_requests`/`wallet_transactions`, run the credit/debit + `getTreasuryOverview` logic, assert idempotency (IDEM-01…07) and reconciliation states (TRE-01…08) including missing/orphan detection. |
| **On-chain verification** | **Vitest + mocked viem client** | `verifyDepositTransaction` checks (VER-01…10) using stubbed `getTransactionReceipt`/`getBlockNumber` for each pass/fail branch — no live RPC needed. |

---

### Coverage summary

- **Total test cases:** 139
- **Modules covered:** 20 (A–T)
- **Critical cases:** all mandatory critical cases from the spec are included (auth, properties,
  investments, distribution, wallet, deposits, verification, withdrawals, treasury, RLS/security, idempotency).
