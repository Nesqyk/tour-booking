# Ruf Bac Tour Services

A complete tour booking platform with public landing page and admin dashboard. Built with PHP, MySQL, and Vanilla JavaScript featuring a modern Glassmorphism UI.

![Tech Stack](https://img.shields.io/badge/PHP-OOP-777BB4?style=flat&logo=php)
![MySQL](https://img.shields.io/badge/MySQL-Database-4479A1?style=flat&logo=mysql)
![Bootstrap](https://img.shields.io/badge/Bootstrap-5.3-7952B3?style=flat&logo=bootstrap)
![JavaScript](https://img.shields.io/badge/JavaScript-Vanilla-F7DF1E?style=flat&logo=javascript)

---

## Features

**Public Landing Page**
- Showcase services (rentals, tours, shuttles)
- Featured destinations with tour details
- Vehicle fleet display
- Responsive design

**Admin Dashboard**
- Booking management (CRUD operations)
- Tour & customer management
- Services, destinations, and fleet management
- Real-time statistics and analytics
- User authentication (admin/customer roles)
- File upload for images

**Technical**
- Object-Oriented PHP with MVC architecture
- RESTful API endpoints
- Glassmorphism UI design
- No-reload async operations

---

## Tech Stack

- **Backend**: PHP 7.4+ (OOP), MySQL (PDO)
- **Frontend**: HTML5, Bootstrap 5, Vanilla JavaScript (ES6+)
- **Server**: XAMPP (Apache + MySQL)
- **Design**: Glassmorphism with Azure Blue (#0078D4) & Sunset Orange (#FF6B35)

---

## Quick Start

### Prerequisites
- [XAMPP](https://www.apachefriends.org/) installed

### Installation

1. **Clone/Copy project** to XAMPP htdocs:
   ```bash
   C:\xampp\htdocs\tour-booking\
   ```

2. **Start XAMPP** services (Apache + MySQL)

3. **Setup database**:
   - Open phpMyAdmin: http://localhost/phpmyadmin
   - Run `database/schema.sql` (creates database and core tables)
   - Run `database/schema_auth.sql` (creates users table)
   - Run `database/schema_landing.sql` (creates landing page tables)
   - Run seed files: `database/seed.sql`, `database/seed_auth.sql`, `database/seed_landing.sql`

4. **Configure database** (if needed):
   Edit `backend/config/Database.php`:
   ```php
   private $host = 'localhost';
   private $db_name = 'rufbac_tours';
   private $username = 'root';
   private $password = '';
   ```

5. **Access application**:
   - Landing page: `http://localhost/tour-booking/landing.html`
   - Admin dashboard: `http://localhost/tour-booking/index.html`

---

## Project Structure

```
tour-booking/
├── landing.html              # Public landing page
├── index.html                # Admin dashboard
├── assets/
│   ├── css/                  # Stylesheets
│   └── js/                   # Frontend scripts (api.js, app.js, auth.js, landing.js)
├── backend/
│   ├── config/               # Database configuration
│   ├── models/               # Data models (Booking, Tour, Customer, User, etc.)
│   ├── controllers/          # Request handlers
│   └── api/                  # API router & endpoints
└── database/                 # SQL schemas and seeds
```

---

## API Endpoints

Base URL: `http://localhost/tour-booking/backend/api/index.php`

| Resource | Method | Action | Description |
|----------|--------|--------|-------------|
| **Bookings** | GET | `?action=list` | List all bookings |
| | POST | `?action=create` | Create booking |
| | PUT | `?action=update&id={id}` | Update booking |
| | DELETE | `?action=delete&id={id}` | Delete booking |
| **Tours** | GET | `?action=tours` | List active tours |
| **Customers** | GET | `?action=customers` | List customers |
| | POST | `?action=customer_create` | Create customer |
| **Services** | GET | `?action=services` | List services |
| **Destinations** | GET | `?action=destinations` | List destinations |
| **Fleet** | GET | `?action=fleet` | List fleet vehicles |
| **Auth** | POST | `?action=login` | User login |
| | POST | `?action=register` | User registration |
| **Dashboard** | GET | `?action=stats` | Get statistics |

---

## Database Schema

**Core Tables**: `bookings`, `tours`, `customers`  
**Landing Page**: `services`, `destinations`, `fleet`  
**Authentication**: `users`

See `database/schema*.sql` files for complete structure.

---

## Troubleshooting

- **Database connection failed**: Ensure MySQL is running, check `backend/config/Database.php`
- **CORS errors**: Access via `http://localhost/` not `file://`
- **Blank page**: Check PHP error logs, ensure Apache is running
- **Tables missing**: Run all schema files in order

---

## License

Educational project - Web Development course.
