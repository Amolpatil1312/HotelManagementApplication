-- PostgreSQL import script - converted from H2 export
-- Run this AFTER the Spring Boot app creates the schema (ddl-auto=update)

-- Clear existing data (in correct order for foreign keys)
DELETE FROM order_items;
DELETE FROM orders;
DELETE FROM restaurant_tables;
DELETE FROM menu_items;
DELETE FROM categories;
DELETE FROM table_types;
DELETE FROM restaurant_config;
DELETE FROM app_user;
DELETE FROM restaurants;

-- Insert Restaurants
INSERT INTO restaurants (id, created_at, name) VALUES
(1, '2026-03-22 13:55:06.646875', 'Biryani House');

-- Insert Users
INSERT INTO app_user (id, active, display_name, password, restaurant_id, role, username) VALUES
(1, TRUE, 'Amol', '$2a$10$uLHDYvOmtLiUwmlpAeAMveQql2RHocnZy4TsjeZSeBLvh3KB8DYnW', 1, 'ADMIN', 'amol');

-- Insert Categories
INSERT INTO categories (id, display_order, emoji, name, restaurant_id) VALUES
(5, 1, E'\U0001F372', 'STARTERS', 1),
(6, 2, E'\U0001F35B', 'MAIN COURSE', 1),
(7, 3, E'\U0001F964', 'BEVERAGES', 1),
(8, 4, E'\U0001F370', 'DESSERTS', 1);

-- Insert Menu Items
INSERT INTO menu_items (id, available, category, description, image_emoji, name, price, restaurant_id) VALUES
(1, TRUE, 'STARTERS', 'Grilled cottage cheese', E'\U0001F9C0', 'Paneer Tikka', 220.00, 1),
(2, TRUE, 'STARTERS', 'Crispy rolls with veggie filling', E'\U0001F32F', 'Veg Spring Roll', 180.00, 1),
(3, TRUE, 'STARTERS', 'Spicy deep-fried chicken', E'\U0001F357', 'Chicken 65', 280.00, 1),
(4, TRUE, 'MAIN COURSE', 'Creamy tomato chicken curry', E'\U0001F35B', 'Butter Chicken', 350.00, 1),
(5, TRUE, 'MAIN COURSE', 'Fragrant rice with vegetables', E'\U0001F35A', 'Veg Biryani', 250.00, 1),
(6, TRUE, 'MAIN COURSE', 'Creamy black lentils', E'\U0001F372', 'Dal Makhani', 220.00, 1),
(7, TRUE, 'BEVERAGES', 'Indian spiced tea', E'\2615', 'Masala Chai', 60.00, 1),
(8, TRUE, 'BEVERAGES', 'Sweet yogurt drink', E'\U0001F964', 'Mango Lassi', 120.00, 1),
(9, TRUE, 'BEVERAGES', 'Lime with soda water', E'\U0001F34B', 'Fresh Lime Soda', 80.00, 1),
(10, TRUE, 'DESSERTS', 'Sweet milk dumplings', E'\U0001F36A', 'Gulab Jamun', 120.00, 1),
(11, TRUE, 'DESSERTS', 'Soft paneer in sweet milk', E'\U0001F370', 'Rasmalai', 150.00, 1);

-- Insert Restaurant Config
INSERT INTO restaurant_config (id, address, city, currency_symbol, gstin, logo_emoji, owner_name, phone, receipt_footer, restaurant_id, restaurant_name, setup_complete, subtitle, tax1label, tax1rate, tax2label, tax2rate, thank_you_message) VALUES
(1, '', '', E'\u20B9', '', E'\U0001F37D\uFE0F', '', '', 'Powered by Restaurant POS', 1, 'Biryani House', TRUE, 'Restaurant Management System', 'CGST', 2.5, 'SGST', 2.5, E'Thank you! Visit again \U0001F64F');

-- Insert Restaurant Tables
INSERT INTO restaurant_tables (id, capacity, occupied_since, reservation_time, reserved_by, restaurant_id, status, table_number, table_type) VALUES
(1, 8, NULL, NULL, NULL, 1, 'AVAILABLE', 1, 'FAMILY'),
(2, 8, NULL, NULL, NULL, 1, 'AVAILABLE', 2, 'FAMILY'),
(3, 8, NULL, NULL, NULL, 1, 'AVAILABLE', 3, 'FAMILY'),
(4, 8, NULL, NULL, NULL, 1, 'AVAILABLE', 4, 'FAMILY'),
(5, 8, NULL, NULL, NULL, 1, 'AVAILABLE', 5, 'FAMILY'),
(6, 4, NULL, NULL, NULL, 1, 'AVAILABLE', 6, 'GENERAL'),
(7, 4, NULL, NULL, NULL, 1, 'AVAILABLE', 7, 'GENERAL'),
(8, 4, NULL, NULL, NULL, 1, 'AVAILABLE', 8, 'GENERAL'),
(9, 4, NULL, NULL, NULL, 1, 'AVAILABLE', 9, 'GENERAL'),
(10, 4, NULL, NULL, NULL, 1, 'AVAILABLE', 10, 'GENERAL'),
(11, 4, NULL, NULL, NULL, 1, 'AVAILABLE', 11, 'GENERAL'),
(12, 4, NULL, NULL, NULL, 1, 'AVAILABLE', 12, 'GENERAL'),
(13, 4, NULL, NULL, NULL, 1, 'AVAILABLE', 13, 'GENERAL'),
(14, 4, NULL, NULL, NULL, 1, 'AVAILABLE', 14, 'GENERAL'),
(15, 4, NULL, NULL, NULL, 1, 'AVAILABLE', 15, 'GENERAL');

-- Insert Table Types
INSERT INTO table_types (id, default_capacity, label_prefix, name, restaurant_id) VALUES
(3, 8, 'F', 'FAMILY', 1),
(4, 4, 'T', 'GENERAL', 1);

-- Reset sequences to continue after the max IDs
SELECT setval(pg_get_serial_sequence('restaurants', 'id'), (SELECT MAX(id) FROM restaurants));
SELECT setval(pg_get_serial_sequence('app_user', 'id'), (SELECT MAX(id) FROM app_user));
SELECT setval(pg_get_serial_sequence('categories', 'id'), (SELECT MAX(id) FROM categories));
SELECT setval(pg_get_serial_sequence('menu_items', 'id'), (SELECT MAX(id) FROM menu_items));
SELECT setval(pg_get_serial_sequence('restaurant_config', 'id'), (SELECT MAX(id) FROM restaurant_config));
SELECT setval(pg_get_serial_sequence('restaurant_tables', 'id'), (SELECT MAX(id) FROM restaurant_tables));
SELECT setval(pg_get_serial_sequence('table_types', 'id'), (SELECT MAX(id) FROM table_types));
SELECT setval(pg_get_serial_sequence('orders', 'id'), COALESCE((SELECT MAX(id) FROM orders), 1));
SELECT setval(pg_get_serial_sequence('order_items', 'id'), COALESCE((SELECT MAX(id) FROM order_items), 1));
