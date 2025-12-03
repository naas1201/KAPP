<div align="center">

# 🏥 KAPP - Medical Booking Application

### A Modern Healthcare Appointment & Patient Management System

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-11-orange?style=for-the-badge&logo=firebase)](https://firebase.google.com/)
[![Stripe](https://img.shields.io/badge/Stripe-Payments-635BFF?style=for-the-badge&logo=stripe)](https://stripe.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

**KAPP (Kastillo Aesthetics Patient Portal)** is a full-featured medical booking and patient management application built with Next.js 15, Firebase, and AI-powered features using Google GenKit.

[📖 Documentation](./docs/README.md) • [🚀 Getting Started](#-quick-start) • [✨ Features](#-features) • [🤝 Contributing](#-contributing)

</div>

---

## ✨ Features

### 🗓️ **Appointment Booking System**
- Online booking with date/time selection
- Service and doctor selection
- Real-time availability checking
- Guest and authenticated user booking
- Automated status tracking (pending → confirmed → completed)

### 💳 **Secure Payment Processing**
- Stripe integration for secure payments
- Credit/Debit card support (Visa, Mastercard, etc.)
- GCash support for Philippine payments
- Automatic payment confirmation

### 👨‍⚕️ **Doctor Dashboard**
- Consultation request management
- Appointment approval/rejection workflow
- Patient records and medical history
- Service configuration with custom pricing
- Performance statistics and gamification

### 👤 **Patient Portal**
- Personal dashboard with appointment overview
- Medical information management
- Prescription history
- Secure messaging with doctors
- Document uploads

### 🔐 **Role-Based Access Control**
- **Admin**: Full system access, user management, procedure management
- **Doctor**: Patient data access, appointment management, services configuration
- **Patient**: Personal data, booking, messaging

### 🤖 **AI-Powered Features**
- Automated FAQ generation using Google GenKit
- Treatment information assistance
- Smart recommendations

### 📊 **Admin Panel**
- User and staff management
- Procedure/treatment management
- Discount code management
- System announcements
- Audit logging

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 15 (App Router, Turbopack) |
| **Language** | TypeScript |
| **Database** | Firebase Firestore |
| **Authentication** | Firebase Auth |
| **Payments** | Stripe (Cards + GCash) |
| **UI Components** | Radix UI + Shadcn/UI |
| **Styling** | Tailwind CSS |
| **Forms** | React Hook Form + Zod |
| **AI** | Google GenKit |
| **Testing** | Jest + Playwright |

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- Firebase project (or use emulators)
- Stripe account (for payments)

### Installation

```bash
# Clone the repository
git clone https://github.com/naas1201/KAPP.git
cd KAPP

# Install dependencies
pnpm install

# Copy environment variables
cp env.example .env.local
# Edit .env.local with your Stripe and Firebase keys

# Start development server
pnpm dev
```

The app will be available at `http://localhost:9002`

### Using Firebase Emulators (Recommended for Development)

```bash
# Terminal 1: Start Firebase emulators
./node_modules/.bin/firebase emulators:start --only firestore,auth --project demo-project

# Terminal 2: Start dev server with emulator connection
FIRESTORE_EMULATOR_HOST=localhost:8080 FIREBASE_AUTH_EMULATOR_HOST=localhost:9099 pnpm dev
```

---

## 📁 Project Structure

```
KAPP/
├── src/
│   ├── app/           # Next.js App Router pages
│   │   ├── admin/     # Admin dashboard pages
│   │   ├── doctor/    # Doctor dashboard pages
│   │   ├── patient/   # Patient portal pages
│   │   └── booking/   # Public booking flow
│   ├── components/    # React components
│   │   └── ui/        # Shadcn/UI primitives
│   ├── firebase/      # Firebase configuration & hooks
│   ├── ai/            # GenKit AI flows
│   │   ├── genkit.ts  # AI client setup
│   │   └── flows/     # AI flow implementations
│   └── lib/           # Utilities and types
├── docs/              # Documentation
├── e2e/               # Playwright E2E tests
├── __tests__/         # Jest unit tests
└── scripts/           # Utility scripts
```

---

## 📚 Documentation

Comprehensive documentation is available in the [`docs/`](./docs/README.md) directory:

| Document | Description |
|----------|-------------|
| [Development Guide](./docs/DEVELOPMENT_GUIDE.md) | Adding features, pages, and collections |
| [Admin & Doctor Setup](./docs/ADMIN_DOCTOR_SETUP.md) | Setting up staff accounts |
| [Doctor Workflows](./docs/DOCTOR_WORKFLOWS.md) | Doctor functionality guide |
| [Firebase Setup](./docs/FIREBASE_SETUP.md) | Firestore and Auth configuration |
| [Stripe Setup](./docs/STRIPE_SETUP.md) | Payment integration guide |
| [Storage Setup](./docs/STORAGE_SETUP.md) | File upload configuration |
| [E2E Testing](./docs/E2E_TESTING.md) | End-to-end testing guide |
| [API Reference](./docs/API_REFERENCE.md) | Backend data schema |

---

## 🧪 Testing

```bash
# Run unit tests
pnpm test

# Run Firestore rules tests (requires emulator)
pnpm test:rules

# Run E2E tests
pnpm test:e2e

# Run full E2E workflow
RUN_FULL_E2E=1 DOCTOR_EMAIL=info@lpp.ovh DOCTOR_PASS=1q2w3e4r5t6y pnpm test:e2e
```

---

## 🔧 Available Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start development server (port 9002) |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |
| `pnpm typecheck` | Run TypeScript checks |
| `pnpm test` | Run Jest tests |
| `pnpm test:e2e` | Run Playwright tests |
| `pnpm genkit:dev` | Start GenKit AI dev server |
| `pnpm seed:prod-staff-accounts` | Create initial admin/doctor accounts |

---

## ⚠️ Security Notice

> **Warning:** The seeding script (`pnpm seed:prod-staff-accounts`) creates accounts with **hard-coded passwords** for development purposes. 
> 
> **Before deploying to production:**
> 1. Change all default passwords immediately
> 2. Remove test accounts
> 3. Never commit service account JSON files
> 4. Use environment variables for all secrets

See [Admin & Doctor Setup](./docs/ADMIN_DOCTOR_SETUP.md) for secure production configuration.

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`pnpm test && pnpm typecheck`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Development Guidelines

- Follow TypeScript strict mode
- Use Zod schemas for runtime validation
- Mark client components with `'use client'` directive
- Mark server actions with `'use server'` directive
- Use `@/` path alias for imports from `src/`
- Follow existing code patterns and conventions

---

## 📄 License

This project is proprietary software. All rights reserved.

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React Framework
- [Firebase](https://firebase.google.com/) - Backend Services
- [Stripe](https://stripe.com/) - Payment Processing
- [Shadcn/UI](https://ui.shadcn.com/) - UI Components
- [Google GenKit](https://firebase.google.com/docs/genkit) - AI Framework

---

<div align="center">

**Built with ❤️ for healthcare professionals**

[⬆ Back to Top](#-kapp---medical-booking-application)

</div>
