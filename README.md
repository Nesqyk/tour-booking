# Rufbac Tour System (RTS) Dashboard

**Air Traffic Control Center for Tour Booking Management**

A single-page application built with XAMPP, MySQL, Object-Oriented PHP, HTML, Bootstrap, and Vanilla JavaScript. Features a stunning Glassmorphism UI with Azure Blue and Sunset Orange color scheme.

![Tech Stack](https://img.shields.io/badge/PHP-OOP-777BB4?style=flat&logo=php)
![MySQL](https://img.shields.io/badge/MySQL-Database-4479A1?style=flat&logo=mysql)
![Bootstrap](https://img.shields.io/badge/Bootstrap-5.3-7952B3?style=flat&logo=bootstrap)
![JavaScript](https://img.shields.io/badge/JavaScript-Vanilla-F7DF1E?style=flat&logo=javascript)

---

## Features

- **Dashboard Overview**: Real-time statistics on bookings, revenue, and tour capacity
- **Booking Management**: Full CRUD operations (Create, Read, Update, Delete)
- **Tour Tracking**: View upcoming tours with availability status
- **Customer Management**: Track customer bookings and information
- **Responsive Design**: Mobile-first approach using Bootstrap grid
- **Glassmorphism UI**: Modern, translucent design with blur effects
- **No-Reload Experience**: Seamless async operations using Vanilla JS Fetch API

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Server | XAMPP (Apache + MySQL) |
| Backend | Object-Oriented PHP with Mini-MVC Architecture |
| Database | MySQL with PDO |
| Frontend | HTML5, Bootstrap 5, CSS3 |
| JavaScript | Vanilla JS (ES6+) |
| Design | Glassmorphism with Azure Blue (#0078D4) & Sunset Orange (#FF6B35) |

---

## Project Structure

```
rufbac-tours/
├── index.html                 # Main SPA entry point
├── assets/
│   ├── css/
│   │   └── style.css         # Glassmorphism design system
│   └── js/
│       ├── api.js            # API service module (fetch wrapper)
│       └── app.js            # UI controller (DOM manipulation)
├── backend/
│   ├── config/
│   │   └── Database.php      # Singleton PDO connection
│   ├── models/
│   │   ├── Booking.php       # Booking class with validation & CRUD
│   │   ├── Tour.php          # Tour model
│   │   └── Customer.php      # Customer model
│   ├── controllers/
│   │   └── BookingController.php  # Request handler
│   └── api/
│       └── index.php         # API router
└── database/
    ├── schema.sql            # Database structure
    └── seed.sql              # Sample data
```

---

## Installation & Setup

### Prerequisites

- [XAMPP](https://www.apachefriends.org/) installed (Apache + MySQL + PHP)
- Web browser (Chrome, Firefox, Edge recommended)

### Step 1: Clone/Copy Project

Copy the project folder to your XAMPP htdocs directory:

```bash
# Windows
C:\xampp\htdocs\rufbac-tours\

# macOS
/Applications/XAMPP/htdocs/rufbac-tours/

# Linux
/opt/lampp/htdocs/rufbac-tours/
```

### Step 2: Start XAMPP Services

1. Open XAMPP Control Panel
2. Start **Apache** and **MySQL** services
3. Wait for both services to show green status

### Step 3: Create Database

1. Open phpMyAdmin: http://localhost/phpmyadmin
2. Create a new database or use the SQL console
3. Run the schema file:

```sql
-- Copy and paste contents of database/schema.sql
-- This creates the rufbac_tours database with all tables
```

4. Run the seed file:

```sql
-- Copy and paste contents of database/seed.sql
-- This populates sample tours, customers, and bookings
```

**Or via command line:**

```bash
# Windows (from XAMPP folder)
mysql\bin\mysql -u root < C:\xampp\htdocs\rufbac-tours\database\schema.sql
mysql\bin\mysql -u root < C:\xampp\htdocs\rufbac-tours\database\seed.sql
```

### Step 4: Configure Database Connection (if needed)

Edit `backend/config/Database.php` if your MySQL credentials differ:

```php
private $host = 'localhost';
private $db_name = 'rufbac_tours';
private $username = 'root';      // Change if different
private $password = '';          // Add password if set
```

### Step 5: Access the Application

Open your browser and navigate to:

```
http://localhost/rufbac-tours/
```

---

## API Endpoints

Base URL: `http://localhost/rufbac-tours/backend/api/index.php`

### Bookings

| Method | Action | Description |
|--------|--------|-------------|
| GET | `?action=list` | Get all bookings (with optional filters) |
| GET | `?action=show&id={id}` | Get single booking |
| POST | `?action=create` | Create new booking |
| PUT | `?action=update&id={id}` | Update booking |
| DELETE | `?action=delete&id={id}` | Cancel booking |

### Dashboard

| Method | Action | Description |
|--------|--------|-------------|
| GET | `?action=stats` | Get dashboard statistics |

### Tours

| Method | Action | Description |
|--------|--------|-------------|
| GET | `?action=tours` | Get all active tours |
| GET | `?action=tour&id={id}` | Get single tour with availability |

### Customers

| Method | Action | Description |
|--------|--------|-------------|
| GET | `?action=customers` | Get all customers |
| GET | `?action=customer&id={id}` | Get single customer |
| POST | `?action=customer_create` | Create new customer |
| GET | `?action=customer_search&q={query}` | Search customers |

### Query Parameters (for `?action=list`)

- `status` - Filter by booking status (pending, confirmed, cancelled)
- `payment_status` - Filter by payment status
- `search` - Search by customer name, email, or destination
- `sort` - Sort field (booking_date, total_amount, etc.)
- `order` - Sort direction (ASC, DESC)
- `limit` - Number of results
- `offset` - Pagination offset

---

## Database Schema

### Tables

**tours**
- `id` (PK), `destination`, `description`, `start_date`, `end_date`, `capacity`, `price`, `status`, `created_at`

**customers**
- `id` (PK), `first_name`, `last_name`, `email` (unique), `phone`, `address`, `created_at`

**bookings**
- `id` (PK), `tour_id` (FK), `customer_id` (FK), `booking_date`, `num_guests`, `status`, `payment_status`, `total_amount`, `notes`, `created_at`, `updated_at`

### Views

- `vw_booking_details` - Joined view with tour and customer info
- `vw_dashboard_stats` - Aggregated statistics for dashboard

---

## Design System

### Color Palette

| Color | Hex | Usage |
|-------|-----|-------|
| Azure Blue | `#0078D4` | Primary actions, headers, links |
| Sunset Orange | `#FF6B35` | Accents, warnings, revenue |
| Deep Navy | `#0a1628` | Background |
| Glass White | `rgba(255,255,255,0.08)` | Card backgrounds |

### Glassmorphism Effects

```css
.glass-card {
    background: rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}
```

---

## Booking Class Validation

The `Booking.php` model includes comprehensive validation:

- **validateTourId()**: Ensures tour exists and is active
- **validateCustomerId()**: Ensures customer exists
- **validateBookingDate()**: Date format and range validation
- **validateStatus()**: Valid enum values (pending, confirmed, cancelled)
- **validatePaymentStatus()**: Valid payment states
- **validateNumGuests()**: Range 1-20 guests
- **checkAvailability()**: Tour capacity verification

---

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

*Note: Glassmorphism effects require `backdrop-filter` support*

---

## Troubleshooting

### "Database connection failed"
- Ensure MySQL is running in XAMPP
- Check credentials in `backend/config/Database.php`
- Verify database `rufbac_tours` exists

### "CORS error"
- Access via `http://localhost/` not `file://`
- Check Apache is running

### "Blank page / PHP errors"
- Enable error display in `backend/api/index.php`:
  ```php
  ini_set('display_errors', 1);
  ```
- Check PHP error log in XAMPP

### "Tours/Customers not loading"
- Ensure seed data was imported
- Check browser console for API errors

---

## License

This project is part of a Web Development course using the vanilla stack.

---

## Author

Rufbac Tour System Dashboard - Built with Sequential Thinking methodology.
