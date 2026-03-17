# 🚀 Taskify - Premium Task & Finance Manager

A modern, high-performance web application designed for seamless task management, financial tracking, and Google Sheets integration. Built with Visual Excellence and Premium User Experience in mind.

👉 **Live Demo:** [https://quan-ly-cong-viec-website.vercel.app](https://quan-ly-cong-viec-website.vercel.app)

---

## ✨ Key Features

### 📋 Smart Task Management
- **Dashboard Overview:** Real-time statistics (Todo, In Progress, Done, Overdue) with interactive charts.
- **Task Board:** Professional card-based interface with quick status update buttons.
- **Intelligent Tracking:** Automated "Overdue" status detection for past-due tasks.

### 💰 Finance Manager (Spending Analytics)
- **Financial Dashboard:** Track Total Income, Total Expense, and Current Balance.
- **Category Analysis:** Visual pie charts showing exactly where your money goes.
- **Detailed Reports:** Filterable transaction history with professional formatting.

### 🔔 Advanced Notification System
- **Sound Alerts:** Professional "Ding" notify chime for due tasks.
- **Smart Popups:** Instant summary of "Today's Tasks" upon application launch.
- **Browser Push Notifications:** Stay informed even when the app is in the background.

### 📊 Google Sheets Cloud Integration
- **Direct Injection:** Add data directly to your Google Sheets tabs via a smart form.
- **Schema Management:** Create new Sheets/Tabs and define dynamic columns (+/-/x) directly from the UI.
- **Auto-Discovery:** Form fields automatically adapt based on your Sheet headers.

---

## 🛠️ Technology Stack

- **Framework:** React 18 (Vite)
- **Routing:** React Router 7
- **Styling:** Tailwind CSS 4 (Modern, Utility-first)
- **Icons:** Lucide React
- **Charts:** Recharts (High-quality data visualization)
- **Forms:** React Hook Form
- **State/Theme:** Context API & Next-Themes (Dark/Light mode support)
- **Date Handling:** Date-fns & React DatePicker

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18 or higher)
- npm or pnpm

### 2. Installation
```bash
# Clone the repository
git clone <your-repo-url>

# Navigate to project directory
cd "Quản lý công việc website"

# Install dependencies
npm install
```

### 3. Development
```bash
# Start the development server
npm run dev
```
The app will be available at `http://localhost:5173`.

### 4. Build for Production
```bash
# Generate production bundle
npm run build
```

---

## 📁 Project Structure

```text
src/
├── app/
│   ├── components/    # Reusable UI components (Sidebar, Notification, etc.)
│   ├── context/       # State management (TaskContext)
│   ├── layouts/       # Main container structures
│   ├── pages/         # Page components (Dashboard, Finance, Sheets, etc.)
│   ├── App.tsx        # Root component
│   └── routes.tsx     # Application routing logic
├── styles/            # Global CSS, Tailwind, and Theme configurations
└── main.tsx           # Entry point
```

---

## 🎨 UI/UX Philosophy
- **Glassmorphism:** Subtle blurs and translucent layers.
- **Dark Mode First:** Optimized for eye comfort in low-light environments.
- **Micro-animations:** Smooth transitions and bounce effects using Tailwind and Motion.
- **Responsive Design:** Optimized for Desktop, Tablet, and Mobile.

## 📄 License
This project is for personal productivity management. Built with ❤️ by Penguino.