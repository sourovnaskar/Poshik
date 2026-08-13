# 🐾 Poshik — India's All-in-One Pet Care Platform

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white" />
  <img src="https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white" />
  <img src="https://img.shields.io/badge/EJS-B4CA65?style=for-the-badge&logo=ejs&logoColor=black" />
  <img src="https://img.shields.io/badge/Cloudinary-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white" />
  <img src="https://img.shields.io/badge/Bootstrap-7952B3?style=for-the-badge&logo=bootstrap&logoColor=white" />
</p>

<p align="center">
  <strong>A full-stack pet care management platform that connects pet owners, veterinarians, and pet shop owners — all in one place.</strong>
</p>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Role-Based Access](#-role-based-access)
- [API Routes Overview](#-api-routes-overview)
- [Email Templates](#-email-templates)
- [Order Status Lifecycle](#-order-status-lifecycle)
- [Database Models](#-database-models)
- [Author](#-author)

---

## 🌟 Overview

**Poshik** is a comprehensive, multi-role pet care ecosystem built with Node.js and MongoDB. It serves three distinct user groups:

- 🐾 **Pet Owners** — Manage pet profiles, book veterinarians, shop for pet products, and track orders.
- 🩺 **Veterinarians** — Manage schedules, view appointment bookings, and handle patient records.
- 🏪 **Pet Shop Owners** — List products, manage inventory, process orders, and track earnings with dynamic analytics.

The platform features a fully responsive landing page, secure JWT-based authentication with email verification, a cloud-based image pipeline via Cloudinary, and professional transactional email notifications.

---

## ✨ Features

### 🔐 Authentication & Security
- JWT dual-token system (short-lived **access token** + 7-day **refresh token**)
- Email verification upon registration via tokenized link
- **Forgot Password** flow — secure crypto token, 15-minute expiry, email delivery
- **Reset Password** with live password strength indicator
- Role-based route protection middleware (`authCheck`)
- Bcrypt password hashing (salt rounds: 10)

### 👤 Multi-Role System
| Role | Access |
|------|--------|
| **Pet Owner** | Pet profiles, vet booking, pet shop browsing, cart & orders |
| **Doctor** | Schedule management, appointment dashboard |
| **Shop Owner** | Product CRUD, order management, earnings analytics |
| **Admin** | User management, KYC approvals, platform oversight |

### 🐶 Pet Owner Dashboard
- Dynamic stats: Active orders, upcoming vet visits, completed appointments, total spent (₹)
- Manage multiple pet profiles with photos
- Upcoming vet appointments with **day countdown badges** (Today / Tomorrow / In Xd)
- Real-time recent order feed with colour-coded status dots

### 🛍️ Pet Marketplace
- Browse and **search pet shops by name**
- Premium shop directory with animated cards
- Per-shop product browsing with **sticky filter bar** (search + category pills combined)
- Shopping cart with cross-shop replacement flow (modal confirmation)
- Full order lifecycle: `Pending → Confirmed → Processing → Shipped → Delivered → Cancelled`
- **Forward-only status** enforcement — no reverting allowed from either UI or server

### 🏪 Shop Owner Dashboard
- **Dynamic Chart.js visualisations:**
  - Line chart — daily revenue for the last 7 days
  - Doughnut chart — real-time order status distribution (6 statuses)
- **Earnings Module** — 6-month bar chart, top-selling products, paginated transaction history, MoM growth %
- Product management — Add, **Edit** (with existing image removal), **Delete** (with Cloudinary cleanup)
- Order management with status update controls locked by progression rules

### 📧 Professional Email System
Three fully responsive HTML email templates (table-based, email-client safe):
1. **Email Verification** — branded green header, CTA button, 1-hour expiry
2. **Password Reset** — blue header, 15-min warning box, inline fallback link
3. **Order Delivered** — itemised order table with quantities/prices, delivery address, auto-triggered when shop marks order as Delivered

### 🏥 Vet Booking System
- Browse available doctors with specialisations
- Token-based appointment scheduling with slot availability
- Appointment history with status tracking (Pending / Confirmed / Completed / Cancelled)

### 🖼️ Cloud Image Management
- All product and profile images stored on **Cloudinary**
- Automatic deletion of old images when products are edited or deleted
- Multiple image upload support per product (up to 4)

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Runtime** | Node.js |
| **Framework** | Express.js |
| **Database** | MongoDB Atlas + Mongoose ODM |
| **Template Engine** | EJS |
| **Authentication** | JWT (`jsonwebtoken`) + `bcryptjs` |
| **File Upload** | Multer (local temp) → Cloudinary |
| **Email** | Nodemailer |
| **Frontend Styling** | Bootstrap 5, Vanilla CSS |
| **Charts** | Chart.js |
| **Session / Flash** | `express-session`, `connect-flash` |
| **Validation** | Joi schema validation middleware |
| **Environment** | dotenvx |

---

## 📁 Project Structure

```
Poshik/
├── app/
│   ├── config/
│   │   ├── cloudinary.js          # Cloudinary SDK configuration
│   │   ├── emailConfig.js         # Nodemailer transporter
│   │   └── db.js                  # MongoDB connection
│   ├── controller/
│   │   ├── authController.js      # Register, Login, Verify, Forgot/Reset Password
│   │   ├── petController.js       # Pet owner dashboard, pets, appointments, shop, cart, orders
│   │   ├── shopControler.js       # Shop dashboard, products, orders, earnings
│   │   ├── doctorController.js    # Doctor schedules & appointments
│   │   └── adminController.js     # Admin panel & KYC management
│   ├── middleware/
│   │   ├── authCheck.js           # JWT verification middleware
│   │   └── validation.js          # Joi request validation middleware
│   ├── models/
│   │   ├── userModel.js           # User schema (multi-role + password reset fields)
│   │   ├── petModel.js            # Pet profile schema
│   │   ├── appointmentModel.js    # Vet appointment schema
│   │   ├── doctorModel.js         # Doctor profile schema
│   │   ├── doctorScheduleModel.js # Schedule and time-slot schema
│   │   ├── shopModel.js           # Pet shop profile schema
│   │   ├── categoryModel.js       # Product category schema
│   │   ├── productModel.js        # Product schema (with Cloudinary images array)
│   │   ├── cartModel.js           # Shopping cart schema
│   │   ├── orderModel.js          # Order schema with full status lifecycle
│   │   └── verificationModel.js   # Email verification token schema
│   ├── routes/
│   │   ├── authRoutes.js          # /auth/* routes
│   │   ├── petRoutes.js           # /api/pet/* routes
│   │   ├── shopRoutes.js          # /api/shop/* routes
│   │   ├── doctorRoutes.js        # /api/doctor/* routes
│   │   └── adminRoutes.js         # /admin/* routes
│   └── utils/
│       ├── email/
│       │   └── sendEmail.js       # 3 professional HTML email templates
│       ├── multer_setup.js        # Multer disk storage configuration
│       └── schemaValidation.js    # Joi validation schemas
├── views/
│   ├── landing.ejs                # Marketing landing page (Tailwind)
│   ├── login.ejs                  # Login page
│   ├── register.ejs               # Registration page with role picker cards
│   ├── forgot-password.ejs        # Forgot password page
│   ├── reset-password.ejs         # Reset password page with strength meter
│   ├── shop/
│   │   ├── partials/              # navbar, sidebar, header, footer, flash
│   │   ├── dashboard.ejs          # Shop dashboard with dynamic charts
│   │   ├── products.ejs           # Product list with pagination
│   │   ├── add-product.ejs        # Add product (multipart form)
│   │   ├── edit-product.ejs       # Edit product with image removal
│   │   ├── orders.ejs             # Orders list with filters
│   │   ├── order-detail.ejs       # Order detail with status update
│   │   └── earnings.ejs           # Earnings analytics page
│   └── petOwner/
│       ├── partials/              # navbar, footer, flash
│       ├── dashboard.ejs          # Pet owner dashboard (fully dynamic)
│       ├── pet-shop.ejs           # Shop directory with search
│       ├── products.ejs           # Shop storefront with search + filters
│       ├── cart.ejs               # Shopping cart
│       └── orders.ejs             # My orders history
├── public/
│   └── images/                    # Static assets
├── .env                           # Environment variables (not committed)
├── .gitignore
├── package.json
└── index.js                       # Express app entry point
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- MongoDB Atlas account (or local MongoDB)
- Cloudinary account
- Gmail account (or any SMTP provider)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/poshik.git
cd poshik

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env and fill in all required values

# 4. Start the development server
npm run dev
```

The server will start at `http://localhost:3000`

---

## 🔑 Environment Variables

```env
# Server
PORT=3000
BASE_URL=http://localhost:3000

# MongoDB
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/poshik

# JWT
JWT_SECRET_KEY=your_jwt_secret_here
JWT_REFRESH_SECRET_KEY=your_refresh_secret_here

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email (Nodemailer / Gmail)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password
EMAIL_FROM=your_email@gmail.com

# Session
SESSION_SECRET=your_session_secret
```

> **Gmail tip:** Use a [Google App Password](https://support.google.com/accounts/answer/185833) — not your regular password.

---

## 🎭 Role-Based Access

### Registration Roles
| Role | KYC Required | Redirects To |
|------|-------------|-------------|
| `Owner` | ❌ No | `/api/pet/dashboard` |
| `Doctor` | ✅ Yes | `/api/doctor/dashboard` |
| `Shop` | ✅ Yes | `/api/shop/dashboard` |

### KYC Workflow (Doctor & Shop Owner)
```
Register → Email Verification → Login → Submit KYC Docs
  → Admin Review → Approved ✅ / Rejected ❌
```

---

## 🛣 API Routes Overview

### Auth — `/auth`
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/register` | Registration page |
| POST | `/register-create` | Create new account |
| GET | `/login` | Login page |
| POST | `/login-create` | Authenticate & issue JWT |
| GET | `/verify-email/:token` | Verify email address |
| GET | `/forgot-password` | Forgot password form |
| POST | `/forgot-password` | Send password reset email |
| GET | `/reset-password/:token` | Reset password form |
| POST | `/reset-password/:token` | Save new hashed password |
| GET | `/logout` | Clear cookies & redirect |

### Pet Owner — `/api/pet`
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard` | Dynamic pet owner dashboard |
| GET | `/view/shop` | Shop directory (with name search) |
| GET | `/view/products/:shopId` | Visit shop (product search + categories) |
| POST | `/cart/add` | Add item to cart |
| POST | `/cart/replace` | Clear cart and add from new shop |
| POST | `/orders/checkout` | Place order (COD) |
| GET | `/orders` | My orders list |
| GET | `/appointements` | My appointments |

### Shop Owner — `/api/shop`
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard` | Dashboard with live charts |
| GET | `/all/products` | Paginated product list |
| POST | `/products/add` | Add product with image upload |
| GET | `/products/edit/:id` | Edit product form |
| POST | `/products/update/:id` | Update product + images |
| POST | `/products/delete/:id` | Delete product + Cloudinary cleanup |
| GET | `/orders` | All orders (status filter) |
| GET | `/orders/:id` | Order detail |
| POST | `/orders/:id/status` | Update status (forward-only) |
| GET | `/earnings` | Earnings analytics |

---

## 📧 Email Templates

| Template | Trigger | Colour Theme |
|----------|---------|--------------|
| Email Verification | On new registration | 🟢 Brand Green |
| Password Reset | On forgot-password submit | 🔵 Blue |
| Order Delivered | When shop sets status = Delivered | 🟢 Brand Green |

The **Order Delivered** email automatically populates: customer name, shop name, itemised product list (name × qty = subtotal), total amount, and the full delivery address from the order record.

---

## 🔄 Order Status Lifecycle

```
  Pending ──► Confirmed ──► Processing ──► Shipped ──► Delivered
                                                          │
                                               📧 Email sent to customer
                                               
  Any status ──────────────────────────────────────────► Cancelled
```

> **Strict forward-only rule** — enforced on both frontend (UI disables backward options) and backend (server rejects invalid transitions).

---

## 🏗 Database Models

| Model | Key Fields |
|-------|-----------|
| `User` | name, email, password (hashed), role, kycStatus, isEmailVerify, isActive, resetPasswordToken, resetPasswordExpires |
| `Pet` | owner (ref User), name, species, breed, age, image |
| `Appointment` | owner, pet, doctor, schedule, appointmentDate, tokenNumber, reason, consultationFee, status |
| `DoctorSchedule` | doctor, date, timeSlot, maxTokens, availableTokens |
| `Shop` | owner (ref User), shopName, logo, description, isActive |
| `Category` | shop, name, isActive |
| `Product` | shop, category, name, mrp, price, discountPercentage, stock, images[] (Cloudinary URLs), isActive |
| `Cart` | user, shop, items[{product, productName, quantity, price}], totalAmount |
| `Order` | user, shop, items[], totalAmount, shippingAddress, paymentMethod, paymentStatus, orderStatus |
| `VerificationToken` | userId, token, createdAt (TTL indexed) |

---

## 👨‍💻 Author

**Sourov Naskar**

- 🌐 GitHub: [github.com/sourovnaskar](https://github.com/sourovnaskar)
- 💼 LinkedIn: [linkedin.com/in/sourovnaskar](https://linkedin.com/in/sourovnaskar)

---

## 📄 License

This project is licensed under the **MIT License** — feel free to use it for learning and personal projects.

---

<p align="center">Made with ❤️ for every pet and their family &nbsp;🐶🐱🐰</p>
