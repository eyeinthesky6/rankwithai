#443D6B`), symbolizing professionalism and clarity.
- Secondary color: Slate Gray (`#64748B`), used for secondary actions and supporting text.
- Background color: A very light, subtle purplish-gray (`#F3F3F5`).
- Accent color: A medium blue (`#4791CC
# **App Name**: rankwithai

## Core Features:

- Project Creation & Management: Users can create and manage new business projects, defining essential details like business name, website, and target niche, with all project data persisted in Postgres.
- Structured Brand Memory Input: A dedicated interface for users to input structured 'Brand Memory' data, including services, industries, locations, differentiators, tone, and FAQs, which is then stored in Postgres.
- AI-Powered Feed Generation Tool: Leverages generative AI as a tool to create 20-50 optimized content pages (the 'Feed') based strictly on the project's 'Brand Memory', with generated page data saved to Postgres.
- Public Feed Page Display: Dynamically renders and serves the AI-generated content pages from Postgres as public web pages accessible via /feed/[projectSlug]/[pageSlug] routes within the application.
- Feed Export to HTML ZIP: Allows users to export the entire set of generated pages for a project as a downloadable ZIP archive containing static HTML files.

## Style Guidelines:

- Primary color: Deep indigo (`#443D6B`), symbolizing professionalism and clarity. This sophisticated dark hue ensures high contrast against lighter backgrounds and complements a modern aesthetic.
- Background color: A very light, subtle purplish-gray (`#F3F3F5`), providing a clean, spacious, and non-distracting canvas that subtly aligns with the primary color's hue.
- Accent color: A medium blue (`#4791CC`), selected to create clear visual interest and highlight interactive elements like buttons and links. It provides an effective and professional contrast with the primary and background colors.
- Body and headline font: 'Inter' (sans-serif), chosen for its modern, objective, and neutral aesthetic that is highly legible and versatile for both prominent headings and detailed body content in a business-focused application.
- Utilize a consistent set of clean, simple, and vector-based icons that clearly communicate their purpose without ornamentation, maintaining the app's professional and functional appearance.
- Employ a structured and minimalist layout, featuring a clean card-based UI for organizing and displaying project information and generated pages, ensuring an intuitive and clutter-free user experience.
- Incorporate subtle and swift micro-interactions and transitions for key user actions (e.g., button clicks, form submissions, page loading), designed to enhance feedback and user flow without causing delays.