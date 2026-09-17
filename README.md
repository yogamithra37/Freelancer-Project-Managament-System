# FreelanceHub — Full-Stack Freelancer Project Management System

A complete freelancer project management application using **HTML/CSS/JavaScript + Node.js/Express + SQLite**. It is localized for Indian freelancers and uses Indian Rupees (₹).

## Included
- 10 Indian demo clients
- 10 projects
- 16 tasks
- 10 GST invoices with Paid/Pending/Overdue statuses
- 10 expenses
- 15 notifications with unread/read behavior
- Dashboard statistics and charts based on database data
- CRUD for clients, projects, tasks, invoices and expenses
- Authentication/demo session
- English/Tamil/Hindi UI support
- File Manager removed from the UI
- Profile DP/avatar removed from the UI

## Run locally (Windows / VS Code)
1. Install Node.js 18+
2. Open this folder in VS Code terminal.
3. Run:

```bash
npm install
npm run dev
```

4. Open **http://localhost:3000**

The server automatically creates `freelancer.db` and seeds the demo data if any required module has fewer than the expected records.

### Demo login
- Email: `arun@example.com`
- Password: `password123`

You can also use the demo session flow from the application.

## Verify the backend
Open **http://localhost:3000/api/health**. It should return counts for clients, projects, tasks, invoices, expenses and notifications.

Expected minimum counts:
- Clients: 10
- Projects: 10
- Tasks: 16
- Invoices: 10
- Expenses: 10
- Notifications: 15

## Important
The Google AI Studio visual preview may not run a Node/SQLite backend automatically. For the **actual full-stack application**, run the project with `npm run dev` as described above.
