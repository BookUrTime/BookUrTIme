# ⏱️ BookUrTime: B2B Multi-Tenant Platform Architecture & Specification

## 1. Executive Summary & Vision
**BookUrTime** has evolved into a full-scale **B2B2C Queue Management & Appointment Scheduling Platform**.

The platform is divided into two distinct, interconnected applications:
1. **The Business Device App (`/business`)**: Built for service facilities (Clinics, Banks, Aadhaar Centers, Salons, Diagnostic Labs) to run on counter tablets, desktops, or reception devices. Counter operators appoint and configure slots, manage custom services, issue physical walk-in tickets, and call tokens in real time.
2. **The Customer Booking App (`/` & `/service`)**: Built for citizens on their personal mobile devices to browse services offered by a business, book specific time slots, receive live queue tokens, and track their real-time position in line.

---

## 2. Problems Solved in the B2B Paradigm
1. **Counter Chaos & Uncontrolled Crowds:**
   - Essential service businesses lack modern queue caller hardware. BookUrTime turns any tablet or PC at the counter into an intelligent token calling station.
2. **Service Differentiation:**
   - Appointments are not one-size-fits-all. Businesses can define specialized services (e.g. 15-minute routine consultation vs 30-minute procedure) with unique durations and pricing.
3. **Walk-in & Online Coexistence:**
   - Counter staff can issue instant walk-in tokens that seamlessly integrate into the same sequential queue as online bookings.
4. **Transparent Citizen Wait Times:**
   - Customers don't sit in the dark: their digital ticket dynamically shows *"Now Serving: HC-1001 • You are #2 in line"*, preventing crowded waiting rooms.

---

## 3. Application Architecture & Feature Breakdown

### 🏢 1. Business Device Application (`/business`)
- **Live Counter Station:**
  - High-visibility **Now Serving** token monitor with counter assignment (e.g. `Doctor Room 1`, `Counter 3`).
  - Prominent **"Call Next Token"** one-tap caller with automatic status progression (`waiting` $\to$ `in-progress` $\to$ `completed`).
  - Queue actions for each guest: Call, Complete, Absent / No-Show, Cancel.
  - **Walk-in Dispatcher:** Issue immediate on-the-spot tokens for in-person visitors with custom counter assignment and internal notes.
- **Service & Offerings Builder:**
  - Create, customize, and delete business service offerings with duration in minutes, prices, and descriptions.
- **Shift & Slot Engine:**
  - Configure daily working hours (e.g. 09:00 to 18:00) and slot intervals (15, 20, 30, 45, 60 minutes).
  - One-click **"Regenerate Slots for Today"**.
  - Interactive slot grid with one-click **Block/Unblock Slot** toggles.
- **Facility Profile & Terminal Settings:**
  - Edit facility name, physical address, contact phone, counter name, and buffer wait time.
- **Real-Time Analytics:**
  - Live capacity utilization %, total footfall, active waiting, and completed tokens.

---

### 👤 2. Customer Booking Application (`/` & `/slots`)
- **Facility Discovery:** Browse facilities by category with live wait times and distance markers.
- **Service Selection:** Choose the exact procedure/service needed from the business's custom service menu.
- **Dynamic Slot Reservation:** Morning / Afternoon slot picker based on the business's active schedule.
- **Live Digital Token Ticket (`/confirmation`):**
  - Unique queue token badge (e.g. `HC-1002`).
  - **Live Queue Position:** Dynamic indicator showing who is currently being served and how many people are ahead in line.
  - One-click Google Maps location navigation.
  - Add to Google Calendar.
  - Simulated WhatsApp confirmation bubble.
- **Multi-Language Support:**
  - 6 Indian languages (English, Hindi, Telugu, Tamil, Bengali, Urdu with full Right-to-Left RTL layout).
- **"My Bookings" Self-Service (`/bookings`):**
  - Track active tickets with service names and one-tap cancellation.

---

## 4. End-to-End System Flowchart

```mermaid
flowchart TD
    %% Business Side
    subgraph Business["🏢 Business Device Terminal (/business)"]
        B1["Counter Staff Login / Dashboard"]
        B2["Services Configurator<br/>(Add Services, Durations & Fees)"]
        B3["Shift Generator<br/>(Working Hours & Slot Intervals)"]
        B4["Live Counter Station<br/>('Call Next Token', Serving Screen)"]
        B5["Walk-in Dispatcher<br/>(Instant On-the-spot Tokens)"]
        
        B1 --> B2
        B1 --> B3
        B1 --> B4
        B1 --> B5
    end

    %% Backend Engine
    subgraph Engine["⚙️ Multi-Tenant Backend (FastAPI + Async DB)"]
        API_BUS["/business/* APIs<br/>(Schedule, Services, Live Queue)"]
        API_USER["/bookings & /providers APIs<br/>(Catalog, Slot Reservation)"]
        DB[("Database<br/>Providers, Services, Slots, Bookings")]
        
        B2 -->|POST /business/services| API_BUS
        B3 -->|POST /business/schedule/generate| API_BUS
        B4 -->|POST /business/queue/call-next| API_BUS
        B5 -->|POST /bookings (Walk-in)| API_USER
        
        API_BUS --> DB
        API_USER --> DB
    end

    %% Customer Side
    subgraph Customer["👤 Customer Mobile Booking App (/)"]
        C1["Browse Facility by Category"]
        C2["Select Service Offering"]
        C3["Pick Available Time Slot"]
        C4["Enter Name & Phone"]
        C5["Digital Queue Ticket<br/>(Token, Position in Line, Google Maps)"]
        C6["My Bookings Tracker"]
        
        C1 --> C2 --> C3 --> C4 --> C5 --> C6
        C1 -->|GET /providers| API_USER
        C3 -->|GET /providers/{id}/slots| API_USER
        C4 -->|POST /bookings| API_USER
    end

    %% Sync
    B4 -.->|"Live Queue Advancement"| C5
```

---

## 5. Technology Stack

- **Frontend:** Next.js 16 (App Router), React 19, Tailwind CSS v4, Webpack compiler.
- **Backend:** FastAPI, Python 3.12+, SQLAlchemy 2.0 (Async).
- **Databases:** SQLite (local development) / PostgreSQL + `asyncpg` (production ready).
- **Architecture:** Multi-tenant B2B2C REST architecture with offline `localStorage` fallback.
