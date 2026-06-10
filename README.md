# Request Tracker

A clean, fully functional request tracking web application built with plain HTML, CSS, and vanilla JavaScript. No build tools. No frameworks. Just clear, readable code.

## Live Demo

> task.nexoracreatives.co.ke

---

## What It Does

Users can submit requests (bugs, feature requests, feedback, partnership enquiries, or general ideas) through a validated form. All submitted requests appear in a searchable, filterable list where their status can be updated or they can be deleted.

Key features:
- **Submit form** with client-side validation (name, email, product, type, priority, message)
- **Request list** with colour-coded priority and status badges
- **Status management** — change each request's status between New, In Review, Resolved, Rejected
- **Filters** — filter by status, request type, and priority simultaneously
- **Search** — live search across name, email, product, and message text
- **Sort** — newest or oldest first
- **Stats bar** — live count of requests by status
- **localStorage persistence** — data survives a page refresh
- **Toast notifications** — feedback on submit, status change, and delete
- **Confirm dialog** — prevents accidental deletions
- **Responsive design** — works on mobile and desktop
- **Seed demo data** — four sample requests on first load to show the UI in action

---

## Technology Used

| Layer | Choice | Why |
|---|---|---|
| Structure | HTML5 | Semantic, accessible, no dependencies |
| Styling | Vanilla CSS (custom design system) | Full control, no build step, readable |
| Logic | Vanilla JavaScript (ES6+) | Clear, straightforward, no compilation |
| Storage | `localStorage` | Works offline, no server needed |
| Fonts | Inter (Google Fonts) | Modern, legible, free |

---

## How to Run Locally

This project is purely static — no `npm install`, no build step.

**Option 1 — Open directly in the browser:**
```
Open index.html in any modern browser (Chrome, Firefox, Edge, Safari).
```

**Option 2 — Use a simple local server (recommended to avoid any CORS quirks):**

If you have Python installed:
```bash
python -m http.server 8080
# Then visit http://localhost:8080
```

If you have Node.js installed:
```bash
npx serve .
# Then visit the URL it prints
```

If you have VS Code, install the **Live Server** extension and click "Go Live".

---

## Deploying to Cloudflare Pages

1. Push this repository to GitHub.
2. Go to [Cloudflare Pages](https://pages.cloudflare.com/) → **Create a project**.
3. Connect your GitHub account and select this repository.
4. Under "Build settings":
   - **Framework preset:** None
   - **Build command:** *(leave empty)*
   - **Build output directory:** `/` (root)
5. Click **Save and Deploy**.

Cloudflare will give you a public URL like `https://request-tracker.pages.dev`.

You can also use **Netlify** or **GitHub Pages** — just drag the project folder into Netlify's deploy area, or enable GitHub Pages on the `main` branch pointing to the root.

---

## Project Structure

```
request-tracker/
├── index.html          # Main page — structure, form, and request list
├── css/
│   └── style.css       # Full design system: tokens, layout, components, animations
├── js/
│   └── app.js          # All logic: validation, storage, rendering, filters, actions
├── assets/
│   └── favicon.svg     # App icon
└── README.md
```

---

## What I Completed

- [x] Submit form with all required fields (name, email, product/company, type, priority, message)
- [x] Client-side form validation with inline error messages
- [x] Request list with full details, priority accent bar, and badges
- [x] Status management (New → In Review → Resolved / Rejected) per card
- [x] Filter by status, type, and priority (three simultaneous filters)
- [x] Live search across name, email, message, and product
- [x] Sort newest/oldest
- [x] localStorage persistence across refreshes
- [x] Live stats bar (count per status)
- [x] Toast notifications for key actions
- [x] Confirm dialog before deletion
- [x] Responsive mobile layout
- [x] Seed demo data on first load
- [x] Accessible markup (ARIA labels, `role`, `aria-live`)

---

## What I Would Improve with More Time

- **Database backend** — Replace localStorage with a real database (e.g. Cloudflare D1, Supabase, Firebase Firestore). This would enable multi-user access and data shared across devices.
- **Admin authentication** — Add a simple login so only authorised staff can change statuses or delete entries.
- **CSV export** — Let an admin download all requests as a spreadsheet.
- **Edit mode** — Allow a submitted request's details to be edited, not just its status.
- **Email notifications** — Automatically notify the submitter when their request status changes.
- **Charts / dashboard** — A visual summary of request volume and status trends over time.
- **Pagination** — Virtual scrolling or page-based navigation for large volumes of requests.
- **Unit tests** — Test the validation logic, filter functions, and storage layer independently.

---

## Challenges Faced

- Keeping the code readable and well-organised without the structure a framework provides (solved by separating logic into clear sections with comments and small, focused functions).
- Making the card layout work cleanly at both wide and narrow viewport sizes without JavaScript (solved with CSS Grid and media queries).
- Getting the confirm dialog and toast system to feel polished without a library (solved with CSS transitions and a small event-driven approach).

---

## Use of AI Tools

I used AI assistance (Antigravity / Gemini) to accelerate scaffolding, especially for the CSS design system tokens and the overall component structure. I reviewed, understood, and customised all output — in particular:

- The data model and localStorage schema are my own design decisions.
- The validation rules and field-level error display logic were written and reviewed by me.
- The filter/search/sort pipeline logic I designed and verified against edge cases myself.
- The seed demo data is contextual to Photomed (the company running this assessment).

---

## Contact

Submitted for the **Photomed Software Engineering Attachment Assessment**.  
Questions: recruitment@photomed.app
