-- ========================================================
-- FreelanceHub Database Schema & Initial Seed Data
-- Database: freelancer_management
-- System: MySQL / MariaDB
-- ========================================================

CREATE DATABASE IF NOT EXISTS freelancer_management;
USE freelancer_management;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(20),
    password VARCHAR(255) NOT NULL,
    location VARCHAR(100) DEFAULT 'Coimbatore, Tamil Nadu, India',
    bio TEXT,
    skills TEXT,
    hourly_rate DECIMAL(10,2) DEFAULT 1200.00,
    experience_years INT DEFAULT 4,
    languages VARCHAR(100) DEFAULT 'English, Tamil, Hindi',
    portfolio_url VARCHAR(255) DEFAULT 'https://arunkumar.dev',
    avatar_url VARCHAR(255) DEFAULT '/assets/avatar-default.png',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Settings Table
CREATE TABLE IF NOT EXISTS settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    language VARCHAR(10) DEFAULT 'en',
    currency_symbol VARCHAR(5) DEFAULT '₹',
    invoice_prefix VARCHAR(10) DEFAULT 'INV',
    default_tax_rate DECIMAL(5,2) DEFAULT 18.00,
    monthly_income_goal DECIMAL(12,2) DEFAULT 150000.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. Clients Table
CREATE TABLE IF NOT EXISTS clients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    company VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(50),
    state VARCHAR(50),
    country VARCHAR(50) DEFAULT 'India',
    gstin VARCHAR(20),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 4. Projects Table
CREATE TABLE IF NOT EXISTS projects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    client_id INT NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    category VARCHAR(50) DEFAULT 'Web Development',
    budget DECIMAL(12,2) DEFAULT 0.00,
    start_date DATE,
    deadline DATE,
    priority ENUM('Low', 'Medium', 'High', 'Urgent') DEFAULT 'Medium',
    status ENUM('Planning', 'In Progress', 'On Hold', 'Completed', 'Cancelled') DEFAULT 'In Progress',
    progress INT DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

-- 5. Tasks Table
CREATE TABLE IF NOT EXISTS tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    project_id INT NOT NULL,
    client_id INT,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    assigned_to VARCHAR(100) DEFAULT 'Self',
    priority ENUM('Low', 'Medium', 'High', 'Urgent') DEFAULT 'Medium',
    status ENUM('To Do', 'In Progress', 'Review', 'Completed') DEFAULT 'To Do',
    progress INT DEFAULT 0,
    start_date DATE,
    due_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL
);

-- 6. Expenses Table
CREATE TABLE IF NOT EXISTS expenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    project_id INT,
    category VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    expense_date DATE NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'UPI',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
);

-- 7. Invoices Table
CREATE TABLE IF NOT EXISTS invoices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    client_id INT NOT NULL,
    project_id INT NOT NULL,
    invoice_number VARCHAR(30) NOT NULL UNIQUE,
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    subtotal DECIMAL(12,2) NOT NULL,
    tax_rate DECIMAL(5,2) DEFAULT 18.00,
    tax_amount DECIMAL(12,2) DEFAULT 0.00,
    total_amount DECIMAL(12,2) NOT NULL,
    status ENUM('Paid', 'Pending', 'Overdue', 'Cancelled') DEFAULT 'Pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- 8. Invoice Items Table
CREATE TABLE IF NOT EXISTS invoice_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_id INT NOT NULL,
    description VARCHAR(255) NOT NULL,
    quantity INT DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
);

-- 9. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 10. Files Table
CREATE TABLE IF NOT EXISTS files (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    project_id INT,
    client_id INT,
    file_name VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    file_size INT NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL
);

-- 11. Activities Table
CREATE TABLE IF NOT EXISTS activities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    type VARCHAR(50) DEFAULT 'general',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 12. Achievement Badges Table
CREATE TABLE IF NOT EXISTS badges (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    badge_key VARCHAR(50) NOT NULL,
    title VARCHAR(100) NOT NULL,
    description VARCHAR(255) NOT NULL,
    icon VARCHAR(50) NOT NULL,
    unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ========================================================
-- SEED DEMO DATA
-- Password for demo user: "Demo@1234" (hashed with bcrypt)
-- ========================================================

INSERT INTO users (id, full_name, email, phone, password, location, bio, skills, hourly_rate, experience_years, languages, portfolio_url)
VALUES (
    1,
    'Arun Kumar',
    'arun.freelance@example.com',
    '+91 9876543210',
    '$2a$10$e8R6.V2U0d1H2qY4r6Z9u.9Vw1L0rN3d1E3f5G7h9I1j3K5l7M9nO', -- bcrypt Demo@1234
    'Coimbatore, Tamil Nadu, India',
    'Senior Full-Stack Web Developer & UI/UX Specialist crafting high-performance digital solutions for global and Indian clients.',
    'Node.js, Express, React, MySQL, JavaScript, HTML5/CSS3, Tailwind CSS, REST APIs',
    1500.00,
    5,
    'English, Tamil, Hindi',
    'https://arunkumar.dev'
);

INSERT INTO settings (user_id, language, currency_symbol, invoice_prefix, default_tax_rate, monthly_income_goal)
VALUES (1, 'en', '₹', 'INV', 18.00, 150000.00);

-- 10 Realistic Indian Clients
INSERT INTO clients (id, user_id, name, company, email, phone, address, city, state, gstin, notes) VALUES
(1, 1, 'Priya Sharma', 'TechNova Solutions', 'priya@technova.in', '+91 9876543210', '102 Avinashi Road, Peelamedu', 'Coimbatore', 'Tamil Nadu', '33AAAAA1234A1Z5', 'Key enterprise account for cloud software.'),
(2, 1, 'Rahul Krishnan', 'PixelCraft Studio', 'rahul@pixelcraft.co.in', '+91 9812345678', '45 Anna Salai, T. Nagar', 'Chennai', 'Tamil Nadu', '33BBBBA5678B1Z2', 'Design and branding client.'),
(3, 1, 'Sneha Iyer', 'GreenLeaf Organics', 'sneha@greenleaf.in', '+91 9944332211', '88 Indiranagar 100ft Road', 'Bengaluru', 'Karnataka', '29CCCCA9012C1Z8', 'E-commerce platform build.'),
(4, 1, 'Vignesh Kumar', 'UrbanNest Interiors', 'vignesh@urbannest.in', '+91 9755443322', '12 Jubilee Hills', 'Hyderabad', 'Telangana', '36DDDDA3456D1Z4', 'Interior portfolio website.'),
(5, 1, 'Divya Nair', 'BrightEdge Tech', 'divya@brightedge.in', '+91 9633221100', '77 MG Road', 'Kochi', 'Kerala', '32EEEEE7890E1Z1', 'Mobile app backend & API development.'),
(6, 1, 'Karthik Raj', 'Bharat Digital Labs', 'karthik@bharatdigital.in', '+91 9500112233', '15 BKC Bandra', 'Mumbai', 'Maharashtra', '27FFFFF2345F1Z9', 'SEO & Web Portal client.'),
(7, 1, 'Ananya Menon', 'Indic Crafts', 'ananya@indiccrafts.org', '+91 9411223344', '34 Cross Cut Road, Gandhipuram', 'Coimbatore', 'Tamil Nadu', '33GGGGG6789G1Z3', 'Handicrafts export store.'),
(8, 1, 'Sanjay Patel', 'Surya Solar Power', 'sanjay@suryasolar.in', '+91 9322334455', '90 FC Road, Shivajinagar', 'Pune', 'Maharashtra', '27HHHHH0123H1Z7', 'Solar calculator web tool.'),
(9, 1, 'Meera Joshi', 'Kraftwork Innovations', 'meera@kraftwork.in', '+91 9233445566', '50 Connaught Place', 'Delhi', 'Delhi', '07JJJJJ4567J1Z0', 'Corporate CRM integration.'),
(10, 1, 'Rajesh Kannan', 'SilkRoute Global', 'rajesh@silkroute.in', '+91 9144556677', '21 West Masi Street', 'Madurai', 'Tamil Nadu', '33KKKKK8901K1Z6', 'Logistics tracking software.');

-- 10 Connected Projects
INSERT INTO projects (id, user_id, client_id, name, description, category, budget, start_date, deadline, priority, status, progress, notes) VALUES
(1, 1, 1, 'Enterprise Cloud Portal', 'Custom web application for cloud asset management and team analytics.', 'Web Development', 120000.00, '2026-06-01', '2026-08-15', 'High', 'In Progress', 75, 'Phase 1 delivered. Working on billing modules.'),
(2, 1, 2, 'PixelCraft Branding Site', 'Interactive portfolio website with custom WebGL animations.', 'UI/UX Design', 45000.00, '2026-05-10', '2026-06-30', 'Medium', 'Completed', 100, 'Project launched successfully on client server.'),
(3, 1, 3, 'GreenLeaf E-Commerce Platform', 'Full-stack online store with payment gateway and Indian shipping API integration.', 'E-Commerce', 95000.00, '2026-06-15', '2026-08-30', 'Urgent', 'In Progress', 60, 'Razorpay integration complete. Testing order flow.'),
(4, 1, 4, 'UrbanNest Showcase App', 'Mobile responsive web gallery for interior architecture projects.', 'Mobile Development', 50000.00, '2026-07-01', '2026-08-20', 'Low', 'In Progress', 40, 'Design approved. Frontend in progress.'),
(5, 1, 5, 'BrightEdge REST API', 'High-throughput Node.js API server for fintech analytics.', 'Backend API', 75000.00, '2026-04-01', '2026-05-25', 'High', 'Completed', 100, 'All endpoints delivered with documentation.'),
(6, 1, 6, 'Bharat Digital SEO Portal', 'Web portal for automated SEO auditing and keyword reports.', 'Web Development', 65000.00, '2026-07-10', '2026-09-10', 'Medium', 'Planning', 15, 'Requirement gathering phase.'),
(7, 1, 7, 'Indic Crafts Global Store', 'Multi-currency store for Indian artisans exporting worldwide.', 'E-Commerce', 85000.00, '2026-05-20', '2026-07-15', 'High', 'On Hold', 50, 'Awaiting product catalog media from client.'),
(8, 1, 8, 'Surya Solar ROI Calculator', 'Interactive web widget for solar cost savings estimation.', 'Web Development', 35000.00, '2026-07-05', '2026-07-28', 'Medium', 'In Progress', 85, 'Final review in progress.'),
(9, 1, 9, 'Kraftwork CRM Sync Tool', 'Custom middleware syncing client leads with WhatsApp Business API.', 'Automation', 60000.00, '2026-06-20', '2026-08-10', 'High', 'In Progress', 45, 'Webhook testing active.'),
(10, 1, 10, 'SilkRoute Logistics Tracker', 'Real-time consignment tracking dashboard for fleet dispatchers.', 'Web Development', 110000.00, '2026-07-15', '2026-09-30', 'Urgent', 'Planning', 10, 'Database architecture design.');

-- 16 Realistic Connected Tasks
INSERT INTO tasks (id, user_id, project_id, client_id, title, description, assigned_to, priority, status, progress, start_date, due_date) VALUES
(1, 1, 1, 1, 'Build User Access Control API', 'Implement role-based authorization middleware in Express.', 'Arun Kumar', 'High', 'Completed', 100, '2026-06-02', '2026-06-10'),
(2, 1, 1, 1, 'Design Billing Dashboard Charts', 'Create visual revenue charts using Recharts/D3.', 'Arun Kumar', 'Medium', 'In Progress', 80, '2026-06-12', '2026-07-28'),
(3, 1, 1, 1, 'Setup Automated Email Alerts', 'Configure Nodemailer for invoice reminder dispatch.', 'Arun Kumar', 'Low', 'To Do', 0, '2026-07-29', '2026-08-05'),
(4, 1, 2, 2, 'Finalize Home Page Animations', 'Implement subtle Framer Motion scroll transitions.', 'Arun Kumar', 'High', 'Completed', 100, '2026-05-12', '2026-05-20'),
(5, 1, 2, 2, 'Deploy to Vercel & Custom Domain', 'DNS record configuration for pixelcraft.co.in.', 'Arun Kumar', 'Medium', 'Completed', 100, '2026-05-22', '2026-05-25'),
(6, 1, 3, 3, 'Integrate Razorpay Payment Gateway', 'Connect web checkout to Indian payment methods.', 'Arun Kumar', 'Urgent', 'In Progress', 90, '2026-06-20', '2026-07-27'),
(7, 1, 3, 3, 'Design Product Catalog Filter', 'Multi-attribute filtering for organic products.', 'Arun Kumar', 'High', 'In Progress', 70, '2026-07-01', '2026-07-30'),
(8, 1, 4, 4, 'Create High-Res Image Lightbox', 'Interactive photo viewer for interior photography.', 'Arun Kumar', 'Medium', 'To Do', 0, '2026-07-28', '2026-08-05'),
(9, 1, 5, 5, 'Write OpenAPI 3.0 Documentation', 'Generate Swagger API specs for client developers.', 'Arun Kumar', 'Medium', 'Completed', 100, '2026-05-15', '2026-05-22'),
(10, 1, 6, 6, 'Draft Database Entity Diagrams', 'Plan tables for keyword tracking and SEO history.', 'Arun Kumar', 'Low', 'To Do', 0, '2026-07-30', '2026-08-10'),
(11, 1, 7, 7, 'Audit International Currency Support', 'Multi-currency checkout testing.', 'Arun Kumar', 'High', 'Review', 85, '2026-06-10', '2026-07-15'),
(12, 1, 8, 8, 'Implement Solar ROI Math Formula', 'Formula for state subsidy and energy calculation.', 'Arun Kumar', 'High', 'Completed', 100, '2026-07-10', '2026-07-20'),
(13, 1, 9, 9, 'Setup WhatsApp Webhook Endpoint', 'Express webhook handler for inbound lead notifications.', 'Arun Kumar', 'Urgent', 'In Progress', 50, '2026-07-15', '2026-08-01'),
(14, 1, 10, 10, 'Design Fleet Map Interface', 'Leaflet map view for truck location tracking.', 'Arun Kumar', 'High', 'To Do', 0, '2026-08-01', '2026-08-15'),
(15, 1, 1, 1, 'Security Vulnerability Audit', 'Audit npm dependencies and SQL sanitization.', 'Arun Kumar', 'High', 'Completed', 100, '2026-07-01', '2026-07-08'),
(16, 1, 3, 3, 'Mobile Layout Optimization', 'Verify checkout usability on mobile viewports.', 'Arun Kumar', 'Medium', 'In Progress', 60, '2026-07-18', '2026-08-02');

-- 10 Realistic Expenses
INSERT INTO expenses (id, user_id, project_id, category, description, amount, expense_date, payment_method, notes) VALUES
(1, 1, 1, 'Hosting', 'AWS Cloud Server Hosting for TechNova Portal', 4500.00, '2026-06-05', 'Credit Card', 'Monthly instance charge'),
(2, 1, 3, 'Software', 'Razorpay API Merchant Verification & SDK License', 2500.00, '2026-06-18', 'UPI', 'One-time onboarding fee'),
(3, 1, 2, 'Domain', 'PixelCraft Domain Registration (pixelcraft.co.in)', 1200.00, '2026-05-10', 'UPI', 'Annual domain fee'),
(4, 1, 5, 'Hosting', 'DigitalOcean Droplet for API Testing', 1800.00, '2026-04-10', 'Credit Card', 'Testing server'),
(5, 1, 4, 'Software', 'Figma Professional Team Subscription', 1500.00, '2026-07-02', 'Net Banking', 'Design prototyping tools'),
(6, 1, 8, 'Internet', 'Airtel Fiber Broadband Ultra Plan (1Gbps)', 1999.00, '2026-07-05', 'UPI', 'High speed fiber'),
(7, 1, 9, 'Equipment', 'Logitech MX Master 3S Ergonomic Mouse', 8999.00, '2026-06-25', 'Debit Card', 'Hardware upgrade'),
(8, 1, 6, 'Subscription', 'GitHub Copilot & JetBrains Suite', 2200.00, '2026-07-01', 'Credit Card', 'Developer tools'),
(9, 1, 7, 'Marketing', 'Google Ads Keyword Research Tool', 3500.00, '2026-05-25', 'UPI', 'SEO analytics tool'),
(10, 1, 10, 'Office', 'Ergonomic Desk Chair & Monitor Stand', 12500.00, '2026-07-12', 'Net Banking', 'Workspace setup');

-- 10 Realistic Invoices
INSERT INTO invoices (id, user_id, client_id, project_id, invoice_number, issue_date, due_date, subtotal, tax_rate, tax_amount, total_amount, status, notes) VALUES
(1, 1, 1, 1, 'INV-2026-001', '2026-06-15', '2026-06-30', 60000.00, 18.00, 10800.00, 70800.00, 'Paid', 'Milestone 1 Payment for TechNova Portal.'),
(2, 1, 2, 2, 'INV-2026-002', '2026-05-25', '2026-06-10', 45000.00, 18.00, 8100.00, 53100.00, 'Paid', 'Full Payment for PixelCraft Website.'),
(3, 1, 3, 3, 'INV-2026-003', '2026-07-01', '2026-07-20', 50000.00, 18.00, 9000.00, 59000.00, 'Pending', 'Milestone 1 Payment for GreenLeaf E-Commerce.'),
(4, 1, 5, 5, 'INV-2026-004', '2026-05-20', '2026-06-05', 75000.00, 18.00, 13500.00, 88500.00, 'Paid', 'Full Payment for BrightEdge REST API.'),
(5, 1, 8, 8, 'INV-2026-005', '2026-07-15', '2026-07-25', 25000.00, 18.00, 4500.00, 29500.00, 'Pending', 'Advance for Solar ROI Calculator.'),
(6, 1, 4, 4, 'INV-2026-006', '2026-07-05', '2026-07-18', 20000.00, 18.00, 3600.00, 23600.00, 'Overdue', 'Advance for UrbanNest Showcase.'),
(7, 1, 7, 7, 'INV-2026-007', '2026-06-01', '2026-06-15', 30000.00, 18.00, 5400.00, 35400.00, 'Paid', 'Phase 1 Payment for Indic Crafts Store.'),
(8, 1, 9, 9, 'INV-2026-008', '2026-06-25', '2026-07-10', 30000.00, 18.00, 5400.00, 35400.00, 'Paid', 'Milestone 1 Sync Tool.'),
(9, 1, 1, 1, 'INV-2026-009', '2026-07-20', '2026-08-05', 40000.00, 18.00, 7200.00, 47200.00, 'Pending', 'Milestone 2 Payment for TechNova Portal.'),
(10, 1, 10, 10, 'INV-2026-010', '2026-07-18', '2026-08-01', 35000.00, 18.00, 6300.00, 41300.00, 'Pending', 'Initial Deposit for Logistics Tracker.');

-- Invoice Line Items
INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, amount) VALUES
(1, 'Backend Architecture & API Setup', 1, 35000.00, 35000.00),
(1, 'Frontend UI Component Implementation', 1, 25000.00, 25000.00),
(2, 'Website UI/UX Redesign & WebGL Integration', 1, 45000.00, 45000.00),
(3, 'E-Commerce Database Schema & Catalog Module', 1, 50000.00, 50000.00),
(4, 'Node.js REST API Architecture & Endpoints', 1, 75000.00, 75000.00),
(5, 'Solar Formula Math Calculation Module', 1, 25000.00, 25000.00),
(6, 'Mobile Responsive Layout Wireframing', 1, 20000.00, 20000.00),
(7, 'Multi-Currency Gateway Onboarding', 1, 30000.00, 30000.00),
(8, 'WhatsApp Business API Integration', 1, 30000.00, 30000.00),
(9, 'Billing Analytics Module Implementation', 1, 40000.00, 40000.00),
(10, 'Fleet Consignment Database Design', 1, 35000.00, 35000.00);

-- 15 Realistic Connected Notifications
INSERT INTO notifications (id, user_id, title, message, type, is_read, created_at) VALUES
(1, 1, 'Payment Received', 'Priya Sharma (TechNova) paid ₹70,800 for INV-2026-001.', 'success', TRUE, '2026-06-30 11:30:00'),
(2, 1, 'Invoice Overdue', 'Invoice INV-2026-006 for UrbanNest Interiors is now overdue by 8 days.', 'warning', FALSE, '2026-07-19 09:00:00'),
(3, 1, 'Project Deadline Approaching', 'Surya Solar ROI Calculator is due in 2 days (28th July 2026).', 'urgent', FALSE, '2026-07-26 08:00:00'),
(4, 1, 'Task Completed', 'Task "Integrate Razorpay Payment Gateway" marked 90% complete.', 'info', FALSE, '2026-07-25 16:45:00'),
(5, 1, 'New Client Added', 'Rajesh Kannan from SilkRoute Global added successfully.', 'info', TRUE, '2026-07-15 10:15:00'),
(6, 1, 'New Invoice Generated', 'Invoice INV-2026-009 for TechNova Solutions generated for ₹47,200.', 'info', FALSE, '2026-07-20 14:20:00'),
(7, 1, 'Income Goal Alert', 'You have achieved 78% of your ₹1,50,000 monthly income goal!', 'success', FALSE, '2026-07-24 18:00:00'),
(8, 1, 'Expense Logged', 'Logged hardware purchase of ₹8,999 for Logitech MX Master 3S.', 'info', TRUE, '2026-06-25 12:00:00'),
(9, 1, 'Project Status Updated', 'Indic Crafts Global Store status changed to "On Hold".', 'warning', TRUE, '2026-06-15 15:30:00'),
(10, 1, 'Task Due Today', 'Task "Design Billing Dashboard Charts" due today.', 'urgent', FALSE, '2026-07-26 07:30:00'),
(11, 1, 'New Project Created', 'SilkRoute Logistics Tracker added under SilkRoute Global.', 'info', TRUE, '2026-07-15 11:00:00'),
(12, 1, 'Milestone Approved', 'Rahul Krishnan approved final launch for PixelCraft Site.', 'success', TRUE, '2026-05-25 17:00:00'),
(13, 1, 'Security Alert', 'Profile password updated successfully.', 'info', TRUE, '2026-07-01 09:00:00'),
(14, 1, 'File Uploaded', 'Project proposal PDF uploaded for Enterprise Cloud Portal.', 'info', TRUE, '2026-06-02 10:30:00'),
(15, 1, 'Achievement Unlocked', 'Unlocked badge: "10 Clients Reached"! Keep up the great work.', 'success', FALSE, '2026-07-15 11:05:00');

-- Initial Achievement Badges
INSERT INTO badges (user_id, badge_key, title, description, icon) VALUES
(1, 'first_project', 'First Project Completed', 'Successfully completed and delivered your first project.', 'trophy'),
(1, 'ten_clients', '10 Clients Reached', 'Expanded your client roster to 10 professional clients.', 'users'),
(1, 'lakh_revenue', '₹1 Lakh Revenue', 'Surpassed ₹1,00,000 in total client earnings.', 'dollar-sign'),
(1, 'five_star', '5-Star Client Rating', 'Maintained exceptional quality and feedback.', 'star');

-- Initial Activity Log
INSERT INTO activities (user_id, title, description, type) VALUES
(1, 'Logged in to FreelanceHub', 'Successful authentication session.', 'auth'),
(1, 'Created Task', 'Added "Design Billing Dashboard Charts" to TechNova Portal.', 'task'),
(1, 'Generated Invoice', 'Created INV-2026-009 for ₹47,200.', 'invoice'),
(1, 'Updated Project Progress', 'Surya Solar ROI Calculator updated to 85%.', 'project');
