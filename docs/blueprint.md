# **App Name**: AdminVault

## Core Features:

- Google-Authenticated Admin Login: Provides a dedicated `/admin/login` page enabling administrators to securely sign in using their Google accounts, leveraging Firebase Auth's `signInWithPopup` as per the existing `@/lib/firebase` configuration.
- Persistent Dashboard Layout: Implements the main admin dashboard structure with a permanent left-hand navigation sidebar for key sections (Dashboard, Users, Sellers, Subscriptions, Products) and a top navigation bar displaying the logged-in administrator's name.
- Key Performance Indicators Overview: Displays a grid of visually distinct 'Stat Cards' on the main `/admin/dashboard` page, summarizing critical metrics such as Total Users, Total Sellers, Active Subscriptions, and Pending Approvals, fetching data from a connected backend.

## Style Guidelines:

- Primary Color: A sophisticated deep blue (#337FCC), signifying trust and stability, serving as a key interactive element on the dark background.
- Background Color: A dark, subtle blue-tinged grey (#16181C), providing a modern and professional dark theme while allowing interface elements to stand out.
- Accent Color: A vibrant tech-inspired cyan (#45C0E3), used sparingly for calls to action, important notifications, and highlighting active states.
- Body and Headline Font: 'Inter' (sans-serif) for its modern, neutral, and highly readable qualities across all text elements in the dashboard.
- Use clear, concise, line-based icons for navigation and data indicators, maintaining a professional and uncluttered aesthetic throughout the panel.
- A classic dashboard layout featuring a fixed-width left sidebar for primary navigation and a main content area for data display, adapting responsively for different screen sizes.
- Implement subtle, quick transitions for state changes, such as sidebar expansion/collapse and card hovers, to enhance interactivity without distraction.