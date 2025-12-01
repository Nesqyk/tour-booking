# Deployment Checklist

## 1. Move to XAMPP
- [ ] Copy this entire folder to `C:\xampp\htdocs\tour-booking\`
- [ ] Ensure the path is exactly: `C:\xampp\htdocs\tour-booking\index.html`

## 2. Database Setup
- [ ] Open XAMPP Control Panel -> Start Apache & MySQL
- [ ] Go to http://localhost/phpmyadmin
- [ ] Create database: `rufbac_tours`
- [ ] Import `database/schema_mysql57.sql`
- [ ] Import `database/seed.sql`

## 3. Accessing the App
- [ ] Open Browser
- [ ] Go to: **http://localhost/tour-booking/**
- [ ] ❌ DO NOT use `file://` paths
- [ ] ✅ DO use `http://localhost/`

## 4. Troubleshooting
- If you see `<?php` code on screen: Apache is not running or you are not using `localhost`.
- If you see "Database connection failed": Check `backend/config/Database.php` username/password (default is root/empty).
- If you see "Network error": Check the Console (F12) for red errors.
