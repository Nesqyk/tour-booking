Reviewing the auth and user-related backend files to summarize how login, roles, and routing work.

[5 tools called]

## Backend Auth, Customer, and Admin – How It Works

### High-Level Flow

- **Users table** stores login accounts (`email`, `password`, `user_type`).
- **Customers table** stores customer profile info, linked to a `user_id`.
- **AuthController** handles `register`, `login`, `logout`, and `me` (current user).
- **AuthMiddleware** reads the session and enforces roles: guest vs customer vs admin.
- **Other controllers** (e.g. `CustomerController`, `BookingController`) call AuthMiddleware helpers to protect routes.

---

## 1. API Routing Overview

File: `backend/api/index.php`

- The API URL pattern is: `public/api/index.php?_route=resource/action` (hidden by `.htaccess` as `/api/...`).
- Resources are mapped to controllers:

```php
$controllerMap = [
    'bookings'     => 'BookingController',
    'tours'        => 'TourController',
    'customers'    => 'CustomerController',
    'services'     => 'ServiceController',
    'destinations' => 'DestinationController',
    'fleet'        => 'FleetController',
    'auth'         => 'AuthController',
    'availability' => 'AvailabilityController'
];
```

- **Auth custom actions**:

```php
'auth' => [
    'register' => ['method' => 'POST', 'handler' => 'register'],
    'login'    => ['method' => 'POST', 'handler' => 'login'],
    'logout'   => ['method' => 'POST', 'handler' => 'logout'],
    'me'       => ['method' => 'GET',  'handler' => 'me']
]
```

So:
- `POST /api/auth/register` → `AuthController::register`
- `POST /api/auth/login` → `AuthController::login`
- `POST /api/auth/logout` → `AuthController::logout`
- `GET /api/auth/me` → `AuthController::me`

---

## 2. User Accounts (`User` model)

File: `backend/models/User.php`

- Talks to the `users` table via `Database::getInstance()`.

Key responsibilities:

- **Get user by email/ID**:

```php
public function getByEmail(string $email)
public function getById(int $id)
```

- **Check if email exists**:

```php
public function emailExists(string $email, ?int $excludeId = null): bool
```

- **Create a new user**:

```php
public function create(array $data): int
```

What it does during create:

1. Validates required fields: `email`, `password`, `user_type`.
2. Validates email format.
3. Enforces `user_type` to be either `admin` or `customer`.
4. Ensures the email is not already used.
5. Hashes the password with `password_hash`.
6. Inserts into `users` table and returns the new `id`.

- **Verify credentials (login)**:

```php
public function verifyCredentials(string $email, string $password)
```

Steps:

1. Fetch user by email.
2. If not found → fail.
3. Compare password with `password_verify`.
4. If ok, return a **safe** subset: `id`, `email`, `user_type`, `created_at` (no password).

So the `User` model is responsible for **account-level** data and secure password handling.

---

## 3. Customer Profiles (`Customer` model)

File: `backend/models/Customer.php`

- Talks to `customers` table; this is **profile + stats** for customer users.

Main responsibilities:

- CRUD: `getAll`, `getById`, `create`, `update`, `delete`.
- Linking to users:
  - `getByUserId(int $userId)`
  - `createFromUser(int $userId, string $email)`

### `createFromUser` – auto-creating / linking customers

This is how a `User` row gets a corresponding `Customer` row:

```php
public function createFromUser(int $userId, string $email): int
```

Logic:
1. If customer already exists for this `user_id` → return that ID.
2. Else if a customer with the same `email` exists:
   - Link that customer row to this `user_id`.
3. Else:
   - Insert a new customer with `user_id`, `email`, and empty names.

This is triggered in `AuthController` after registration and login, so every `customer` user ends up with a customer profile row.

### Customer stats

`getCustomerStats(int $customerId): array` returns:

- `total_bookings`
- `upcoming_bookings`
- `total_spent`
- `pending_payments`

This powers the customer dashboard stats.

---

## 4. Authentication Controller (`AuthController`)

File: `backend/controllers/AuthController.php`

Uses:
- `User` (accounts)
- `Customer` (profiles)
- Inherits helpers from `BaseController` (`successResponse`, `errorResponse`, `getRequestBody`).

### 4.1 Register (`POST /api/auth/register`)

Flow:

1. Read JSON body: `{ email, password, user_type? }`.
2. If `user_type` missing → default to `'customer'`.
3. Reject if `user_type === 'admin'` (admins must be created manually).
4. Call `User::create($data)`.
5. Fetch fresh user row `User::getById($userId)`.
6. If `user_type` is `'customer'`, try to create customer profile via:
   ```php
   $this->customer->createFromUser($userId, $user['email']);
   ```
   Errors here are **logged**, but don’t break registration.
7. Start a session (see below).
8. Return JSON: `success: true, data: user`.

### 4.2 Login (`POST /api/auth/login`)

Flow:

1. Read JSON: `{ email, password }`.
2. Call `User::verifyCredentials($email, $password)`.
3. If invalid → `401 Invalid email or password`.
4. If user is a `customer`:
   - Ensure a `customers` row exists for this `user`:
     - Use `Customer::getByUserId`
     - If not found, call `createFromUser`.
5. Call `startSession($user)` to store user in PHP session.
6. Return JSON: `success: true, data: user`.

### 4.3 Session handling inside `AuthController`

```php
private function startSession(array $user): void {
    session_start();
    $_SESSION['user_id']   = $user['id'];
    $_SESSION['user_email'] = $user['email'];
    $_SESSION['user_type']  = $user['user_type'];
}

private function destroySession(): void {
    session_start();
    session_unset();
    session_destroy();
}
```

- **Login / Register** call `startSession` → session cookie is set.
- **Logout** calls `destroySession`.

### 4.4 Current user (`GET /api/auth/me`)

- Starts session.
- If `$_SESSION['user_id']` missing → `401 Not authenticated`.
- Otherwise, loads user via `User::getById`.
- If user not found (stale session) → destroy session + `404 User not found`.
- Responds with `success: true, data: user`.

---

## 5. Auth Middleware (`AuthMiddleware`)

File: `backend/middleware/AuthMiddleware.php`

Purpose: **central place** for checking auth and roles.

### 5.1 Getting the current user

```php
public static function getCurrentUser(): ?array
```

Steps:

1. `session_start()`.
2. If `$_SESSION['user_id']` missing → return `null`.
3. Load `User` model (`initModels`).
4. Fetch user by ID.
5. If user not found:
   - Destroy the session (invalid session) and return `null`.
6. Return user array.

### 5.2 Requiring auth / roles

All throw exceptions (with HTTP codes) if checks fail:

- **Any authenticated user**:

```php
public static function requireAuth(): array
```

- **Customer-only**:

```php
public static function requireCustomer(): array
```

- **Admin-only**:

```php
public static function requireAdmin(): array
```

Usage pattern inside controllers (via `BaseController` helpers):

```php
protected function requireCustomer(): array {
    try {
        return AuthMiddleware::requireCustomer();
    } catch (Exception $e) {
        $statusCode = $e->getCode() ?: 403;
        $this->errorResponse($e->getMessage(), $statusCode);
    }
}
```

So in e.g. `CustomerController`, a method can call `$this->requireAdmin()` or `$this->requireCustomer()` to protect routes. If not allowed, `errorResponse()` is sent and execution stops.

### 5.3 Customer-related helpers

- `getCustomerByUserId(int $userId)`
- `getCurrentCustomer()`: returns the customer row for the logged-in user (if `user_type === 'customer'`).
- `requireCurrentCustomer()`: ensures the user is a customer **and** has a customer record; otherwise throws `404 Customer profile not found`.

These power the customer dashboard and profile APIs.

### 5.4 Role check helpers

- `isAuthenticated()`: bool
- `isCustomer()`: bool
- `isAdmin()`: bool

These are convenient for “soft” checks where you don’t want to throw, just know the status.

---

## 6. How Admin vs Customer Roles Work

### User Types

- `user_type = 'admin'`
  - Typically used by the admin dashboard (`index.html`) and admin APIs (bookings, tours, fleet, etc.).
  - Admin endpoints should call `requireAdmin()` in controllers to lock them down.

- `user_type = 'customer'`
  - Used by customer dashboard (`customer-dashboard.html`), browsing, booking etc.
  - Customer-facing endpoints usually call `requireCustomer()` or `requireCurrentCustomer()`.

### Typical Flow Examples

#### Customer logging in and using dashboard

1. Frontend (`assets/js/auth.js`) calls `POST /api/auth/login`.
2. `AuthController::login()` validates and sets session.
3. Frontend then calls `GET /api/auth/me` to get user info (including `user_type`).
4. On the **customer dashboard** (`customer-dashboard.js`), it does:

   - `API.getCurrentUser()` (wrapper around `/api/auth/me`)
   - If `user_type !== 'customer'` → redirect away (to admin or landing).

5. When the dashboard loads bookings:
   - The backend booking controller can use `requireCurrentCustomer()` to:
     - Ensure the user is logged in as a customer.
     - Get the corresponding `customers` row.
     - Filter bookings by `customer_id`.

#### Admin accessing admin dashboard

1. Admin logs in with an admin email/password.
2. `User::verifyCredentials` returns `user_type = 'admin'`.
3. Session stores `user_type='admin'`.
4. Admin-only endpoints in e.g. `BookingController` can:

   ```php
   $admin = $this->requireAdmin();
   ```

   If a customer tries to hit that endpoint, they get `403 Access denied. Admin access required.`

---

## 7. Summary – Mental Model

- **Sessions**: PHP session holds `user_id`, `user_email`, `user_type`. This is the “auth token”.
- **User model**: 
  - Responsible for accounts and passwords.
  - Doesn’t know about bookings or customers directly.
- **Customer model**: 
  - Responsible for profile data and statistics.
  - Linked to `users.user_id`.
- **AuthController**: 
  - Entry point for login/registration/logout.
  - Bridges `User` and `Customer` by auto-creating/associating customer rows.
- **AuthMiddleware**: 
  - Single source of truth for “who is logged in?” and “are they allowed here?”.
  - Controllers don’t touch `$_SESSION` directly; they call `requireAuth/requireCustomer/requireAdmin`.

---

If you want, I can next:
- Walk through a **full request** (e.g. “customer loads dashboard”) step-by-step, or  
- Show small code examples of how to protect a **new endpoint** with `AuthMiddleware`.

---

## Setting Up the Project on XAMPP

Here’s a concise checklist you can follow (or share) to get the whole stack running locally with XAMPP on Windows/macOS. The same flow works on Linux if you swap XAMPP for LAMP.

### 1. Install & Start XAMPP
1. Download the latest XAMPP installer (PHP 8.x) from [https://www.apachefriends.org](https://www.apachefriends.org).
2. Install it to the default path (`C:\xampp` on Windows).
3. Open the XAMPP Control Panel and start:
   - **Apache** (serves `/htdocs`).
   - **MySQL** (MariaDB).

### 2. Place the Project in `htdocs`
1. Clone or copy this repository into XAMPP’s web root:
   ```
   C:\xampp\htdocs\tour-booking
   ```
2. If you already cloned elsewhere, you can create a symlink or copy the folder.

### 3. Create the Database
1. Open [http://localhost/phpmyadmin](http://localhost/phpmyadmin).
2. Create a database named `rufbac_tours` (or any name—just remember to update `Database.php`).
3. Import the schema/data:
   - Click the database → **Import**.
   - Choose `database/init.sql` from this repo.
   - Run the import.

### 4. Check Database Credentials
The default connection settings live in `backend/config/Database.php`:
```php
private $host = 'localhost';
private $db_name = 'rufbac_tours';
private $username = 'root';
private $password = '';
```
- If your MySQL root account has a password or you created a different DB/user, edit these values accordingly.
- No migrations are needed; `init.sql` seeds all required tables.

### 5. Enable `.htaccess` (Optional but Recommended)
The API routing expects Apache to honor `.htaccess` inside the project. Make sure:
1. In `C:\xampp\apache\conf\httpd.conf`, `AllowOverride All` is set for the `htdocs` directory.
2. Restart Apache after changes.

### 6. Accessing the App
- Landing page: [http://localhost/tour-booking/landing.html](http://localhost/tour-booking/landing.html)
- Customer dashboard: [http://localhost/tour-booking/customer-dashboard.html](http://localhost/tour-booking/customer-dashboard.html)
- API endpoints:  
  - `GET http://localhost/tour-booking/backend/api/index.php?_route=auth/me`  
  - `.htaccess` rewrites let you hit `/tour-booking/backend/api/auth/me` if overrides are enabled.

### 7. Typical Development Flow
1. Edit frontend files under `assets/` or the HTML templates.
2. Edit backend controllers/models in `backend/`.
3. Use the browser dev tools + XAMPP logs (`C:\xampp\apache\logs\error.log`) to debug.
4. For API testing, use Postman or curl with URLs like:
   ```
   curl -X POST http://localhost/tour-booking/backend/api/auth/login \
        -H "Content-Type: application/json" \
        -d '{"email":"admin@example.com","password":"secret"}'
   ```

Following those steps should give you a working environment identical to the repo’s expectations, using only XAMPP + phpMyAdmin. Let me know if you need a Linux or Docker equivalent and I can outline that too.