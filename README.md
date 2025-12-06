- Prerequisites

Before starting, please ensure your machine has the following software installed:

Node.js (v18.x or v20.x LTS recommended)

MySQL Server (v8.0)

MySQL Workbench (or any SQL Client like DBeaver, phpMyAdmin)

Git (Optional)

- Project Structure

The project follows a Monorepo structure:

BACKEND/: Contains the Node.js/Express API Server source code.

FRONTEND/: Contains the React.js/Vite Client source code.

README.md: This documentation file.

- Database Setup (Crucial Step)

Step 1: Create the Database
Open your MySQL Client (e.g., MySQL Workbench) and execute the following command:

CREATE DATABASE IF NOT EXISTS restaurant;

USE restaurant;

Step 2: Create Tables
Copy and execute the SQL script below to create all necessary tables and relationships.

-- 1. BRANCHES
CREATE TABLE `branches` (
  `branch_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `address` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('ACTIVE','INACTIVE') COLLATE utf8mb4_unicode_ci DEFAULT 'ACTIVE',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`branch_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. USERS
CREATE TABLE `users` (
  `user_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role` enum('CUSTOMER','STAFF','ADMIN','CHEF','RECEPTIONIST') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'CUSTOMER',
  `branch_id` int DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `reset_token` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reset_token_expires` datetime DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `email` (`email`),
  KEY `fk_users_branch` (`branch_id`),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`branch_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. CATEGORY
CREATE TABLE `category` (
  `category_id` int NOT NULL AUTO_INCREMENT,
  `branch_id` int DEFAULT NULL,
  `food_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`category_id`),
  KEY `category_ibfk_1` (`branch_id`),
  CONSTRAINT `category_ibfk_1` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`branch_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. MENU ITEMS
CREATE TABLE `menu_items` (
  `item_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `image` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `category_id` int DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `price` decimal(10,2) NOT NULL,
  `stock_quantity` int NOT NULL DEFAULT '0',
  `branch_id` int DEFAULT NULL,
  `is_available` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`item_id`),
  KEY `fk_menu_branch` (`branch_id`),
  KEY `fk_menu_items_category` (`category_id`),
  CONSTRAINT `fk_menu_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`branch_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_menu_items_category` FOREIGN KEY (`category_id`) REFERENCES `category` (`category_id`) ON DELETE SET NULL,
  CONSTRAINT `menu_items_chk_1` CHECK ((`price` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. ITEM OPTION GROUPS
CREATE TABLE `item_option_groups` (
  `group_id` int NOT NULL AUTO_INCREMENT,
  `item_id` int NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `selection_type` enum('SINGLE','MULTI') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'SINGLE',
  `is_required` tinyint(1) NOT NULL DEFAULT '0',
  `sort_order` int DEFAULT '0',
  PRIMARY KEY (`group_id`),
  KEY `fk_item_option_groups_item` (`item_id`),
  CONSTRAINT `fk_item_option_groups_item` FOREIGN KEY (`item_id`) REFERENCES `menu_items` (`item_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. ITEM OPTION CHOICES
CREATE TABLE `item_option_choices` (
  `choice_id` int NOT NULL AUTO_INCREMENT,
  `group_id` int NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `price_delta` decimal(10,2) NOT NULL DEFAULT '0.00',
  `sort_order` int DEFAULT '0',
  PRIMARY KEY (`choice_id`),
  KEY `fk_item_option_choices_group` (`group_id`),
  CONSTRAINT `fk_item_option_choices_group` FOREIGN KEY (`group_id`) REFERENCES `item_option_groups` (`group_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. PROMOTIONS
CREATE TABLE `promotions` (
  `promo_id` int NOT NULL AUTO_INCREMENT,
  `branch_id` int DEFAULT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `discount_type` enum('PERCENT','AMOUNT') COLLATE utf8mb4_unicode_ci NOT NULL,
  `discount_value` decimal(10,2) NOT NULL,
  `min_order_value` decimal(10,2) NOT NULL DEFAULT '0.00',
  `start_date` datetime NOT NULL,
  `end_date` datetime NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`promo_id`),
  KEY `fk_promotions_branch` (`branch_id`),
  CONSTRAINT `fk_promotions_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`branch_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. ORDERS
CREATE TABLE `orders` (
  `order_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `branch_id` int NOT NULL,
  `status` enum('DRAFT','PENDING','PAID','PREPARING','COMPLETED','DELIVERY','CANCELED') COLLATE utf8mb4_unicode_ci DEFAULT 'DRAFT',
  `total_price` decimal(10,2) NOT NULL DEFAULT '0.00',
  `shipping_fee` decimal(10,2) DEFAULT '0.00',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `customer_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `customer_phone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `order_type` enum('TAKEAWAY','DELIVERY') COLLATE utf8mb4_unicode_ci DEFAULT 'TAKEAWAY',
  `scheduled_time` datetime DEFAULT NULL,
  `delivery_address` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payment_method` enum('CASH','QR') COLLATE utf8mb4_unicode_ci DEFAULT 'CASH',
  `promo_id` int DEFAULT NULL,
  `discount_amount` decimal(10,2) DEFAULT '0.00',
  `final_price` decimal(10,2) DEFAULT '0.00',
  `message` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `guest_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`order_id`),
  KEY `fk_orders_branch` (`branch_id`),
  KEY `fk_orders_promo` (`promo_id`),
  KEY `fk_orders_user` (`user_id`),
  CONSTRAINT `fk_orders_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`branch_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_orders_promo` FOREIGN KEY (`promo_id`) REFERENCES `promotions` (`promo_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_orders_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. ORDER ITEMS
CREATE TABLE `order_items` (
  `order_item_id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `item_id` int NOT NULL,
  `quantity` int NOT NULL,
  `unit_price` decimal(10,2) NOT NULL,
  `line_total` decimal(10,2) NOT NULL,
  `options` json DEFAULT NULL,
  `option_summary` varchar(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `options_hash` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`order_item_id`),
  KEY `fk_orderitems_item` (`item_id`),
  KEY `idx_order_item_optionshash` (`order_id`,`item_id`,`options_hash`),
  CONSTRAINT `fk_orderitems_item` FOREIGN KEY (`item_id`) REFERENCES `menu_items` (`item_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_orderitems_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE CASCADE,
  CONSTRAINT `order_items_chk_1` CHECK ((`quantity` > 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. IMPORTS
CREATE TABLE `imports` (
  `import_id` int NOT NULL AUTO_INCREMENT,
  `branch_id` int NOT NULL,
  `staff_id` int NOT NULL,
  `status` enum('PENDING','COMPLETE') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `note` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`import_id`),
  KEY `fk_imports_staff` (`staff_id`),
  KEY `fk_imports_branch` (`branch_id`),
  CONSTRAINT `fk_imports_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`branch_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_imports_staff` FOREIGN KEY (`staff_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. IMPORT ITEMS
CREATE TABLE `import_items` (
  `import_item_id` int NOT NULL AUTO_INCREMENT,
  `import_id` int NOT NULL,
  `item_id` int NOT NULL,
  `quantity` int NOT NULL,
  PRIMARY KEY (`import_item_id`),
  KEY `fk_importitems_import` (`import_id`),
  KEY `fk_importitems_item` (`item_id`),
  CONSTRAINT `fk_importitems_import` FOREIGN KEY (`import_id`) REFERENCES `imports` (`import_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_importitems_item` FOREIGN KEY (`item_id`) REFERENCES `menu_items` (`item_id`) ON DELETE CASCADE,
  CONSTRAINT `import_items_chk_1` CHECK ((`quantity` > 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. RATINGS
CREATE TABLE `ratings` (
  `rating_id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `user_id` int NOT NULL,
  `branch_id` int NOT NULL,
  `rating` tinyint NOT NULL,
  `comment` varchar(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `customer_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `order_date` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`rating_id`),
  UNIQUE KEY `unique_order_user` (`order_id`,`user_id`),
  KEY `fk_ratings_branch` (`branch_id`),
  KEY `fk_ratings_user` (`user_id`),
  CONSTRAINT `fk_ratings_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`branch_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ratings_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ratings_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `ratings_chk_1` CHECK ((`rating` BETWEEN 1 AND 5))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

- Backend Setup (Server)

Navigate to the Backend folder ussing terminal: cd BACKEND

Install Dependencies: npm install

Configure Environment Variables:
Create a file named .env inside the BACKEND folder.

Paste the following content and update your MySQL password:

PORT=3000

DB_HOST=localhost

DB_PORT=3306

DB_USER=root

DB_PASSWORD=YOUR_MYSQL_PASSWORD_HERE

DB_NAME=restaurant

JWT_SECRET=your_secret_key_123

Seed Initial Data (Admin Account): To create the initial Admin account and test data, run: node seedAdmin.js

Start the Server:
npm start

You should see: "Server listening on port 3000" and "Database connected".

- Frontend Setup (Client)

Open a new terminal and navigate to the Frontend folder: cd FRONTEND

Install Dependencies: npm install

Start the Development Server: npm run dev

- Troubleshooting

Error: Access denied for user 'root'@'localhost'

Check your DB_PASSWORD in the .env file inside the BACKEND folder. It must match your local MySQL password.

Error: Unknown database 'restaurant'

Make sure you ran the CREATE DATABASE restaurant; command in MySQL before starting the server.

Frontend API Errors:

Ensure the Backend is running on port 3000.

Check if FRONTEND/src/api/api.js has baseURL: "http://localhost:3000".



