# 📚 College Library Management System

A beginner-friendly, full-stack **Library Management System** engineered for college microproject demonstrations. This project illustrates modern full-stack development, PostgreSQL database transactions, containerization with **Docker**, container orchestration with **Docker Compose**, cluster deployment with **Kubernetes (Minikube)**, and serverless hosting with **Netlify Functions**.

---

## 📑 Table of Contents

1. [Project Overview & Key Features](#-project-overview--key-features)
2. [Technology Stack](#-technology-stack)
3. [Folder Structure](#-folder-structure)
4. [Prerequisites](#-prerequisites)
5. [Local Development Setup](#-local-development-setup)
6. [Database Setup & First Admin Account](#-database-setup--first-admin-account)
7. [Docker & Docker Compose Deployment](#-docker--docker-compose-deployment)
8. [Kubernetes (Minikube) Deployment](#-kubernetes-minikube-deployment)
9. [GitHub Repository Setup](#-github-repository-setup)
10. [Netlify Hosting & Cloud Database Setup](#-netlify-hosting--cloud-database-setup)
11. [Automated Test Suite & Verification](#-automated-test-suite--verification)
12. [Troubleshooting Guide](#-troubleshooting-guide)

---

## 🎯 Project Overview & Key Features

This microproject is designed with clean architecture principles, separating the user-facing responsive frontend, shared database logic, Express application server, and Netlify Serverless Functions:

### 🌐 Public Access
- **Dashboard & Statistics**: Real-time counters showing total book titles, total collection copies, and available copies.
- **Searchable Book Catalogue**: Live search by book title, author, category, or ISBN.
- **Stock Badges**: Real-time availability badges (`Available`, `Low Stock`, `Out of Stock`).
- **No Login Required to Browse**: Students and visitors can inspect the catalogue freely.

### 🔐 Authentication & Roles
- **Student Registration**: Validates full name, alphanumeric username, email format, and password length (minimum 6 characters).
- **Secure Authentication**: Passwords hashed with `bcryptjs` using a salt work factor of 10. Sessions managed via signed JWT tokens (24-hour expiry).
- **Role-Based Access Control (RBAC)**: Enforced on both backend Express routes and Netlify Serverless Functions. Privileged actions (adding books, editing, deleting, issuing, returns) are restricted to administrators.

### 👨‍💼 Administrator Desk
- **Book Management**: Add new books, safely edit details, and delete books (guarded against active loans).
- **Transactional Issue Operations**: Issues a book to a registered student, sets a due date, and automatically decrements available copies within an atomic database transaction.
- **Return Processing**: Records return date and automatically restores the book's available copy count.
- **Student Directory**: Displays all registered students and their active loan counts.

### 🎓 Student Portal
- **My Active Loans**: View currently borrowed books with due date alerts (visually highlights overdue loans).
- **Past Borrowing History**: Permanent audit trail of previously returned books.

---

## 🛠 Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | HTML5, CSS3, JavaScript (ES6+), Bootstrap 5.3, Bootstrap Icons |
| **Backend (Server & Container)** | Node.js (v20+), Express.js 4.x |
| **Backend (Serverless / Netlify)** | Netlify Functions (JavaScript Runtime, ESBuild / Node 20) |
| **Database** | PostgreSQL 16 (Relational tables, foreign keys, check constraints, ACID transactions) |
| **Authentication** | JSON Web Tokens (`jsonwebtoken`), `bcryptjs` password hashing |
| **Containerization** | Docker, Dockerfile (multi-stage, non-root user `node`), `.dockerignore` |
| **Orchestration** | Docker Compose v2 (automated database health check & restart policies) |
| **Kubernetes** | Minikube, Deployments, Services (NodePort & ClusterIP), PVC, ConfigMap, Secrets |
| **Testing** | Jest, Supertest, In-memory mock database engine |

---

## 📂 Folder Structure

```text
Library-Management-System/
├── public/                     # Frontend client assets
│   ├── index.html              # Home page & library overview dashboard
│   ├── books.html              # Searchable public catalogue
│   ├── login.html              # Secure student & admin login
│   ├── register.html           # Student registration
│   ├── student.html            # Student dashboard (active loans & history)
│   ├── admin.html              # Administrator desk (CRUD, issue, return)
│   ├── css/
│   │   └── style.css           # Custom UI styling and badges
│   └── js/
│       ├── api.js              # Unified API client (/api & Netlify routes)
│       ├── auth.js             # Session state & role check helpers
│       ├── books.js            # Book catalogue controller
│       ├── student.js          # Student loans controller
│       └── admin.js            # Admin CRUD & loan operations controller
├── server/                     # Local Express server application
│   ├── app.js                  # Express setup, middleware, routing
│   ├── server.js               # Entry point with DB readiness verification
│   ├── middleware/
│   │   └── authMiddleware.js   # JWT verification & RBAC middleware
│   └── routes/
│       ├── authRoutes.js       # /api/auth (register, login, me)
│       ├── bookRoutes.js       # /api/books & /api/stats
│       ├── borrowRoutes.js     # /api/borrow (issue, return, loans, students)
│       └── healthRoutes.js     # /api/health endpoint
├── netlify/                    # Netlify serverless deployment
│   └── functions/              # Netlify Serverless API Functions
│       ├── util.js             # Shared response headers, auth, CORS helpers
│       ├── health.js           # /.netlify/functions/health
│       ├── stats.js            # /.netlify/functions/stats
│       ├── auth-register.js    # Student registration function
│       ├── auth-login.js       # Authentication function
│       ├── auth-me.js          # Current user profile function
│       ├── books.js            # Catalogue listing & book creation
│       ├── book-detail.js      # Book update and deletion
│       ├── admin-students.js   # Student listing function
│       ├── borrow-issue.js     # Issue book transaction function
│       ├── borrow-return.js    # Return book transaction function
│       └── student-records.js  # Student & admin loans function
├── shared/                     # Shared business logic & database layer
│   ├── db.js                   # PostgreSQL connection pool with SSL handling
│   ├── auth.js                 # Bcrypt hashing & JWT generator
│   ├── validation.js           # Central server-side validation functions
│   └── services/
│       ├── authService.js      # User registration & verification logic
│       ├── bookService.js      # Catalogue queries & book updates
│       └── borrowService.js    # ACID transactional issue & return logic
├── database/                   # Database schema and migrations
│   ├── schema.sql              # Idempotent DDL definitions
│   └── migrate.js              # Migration execution script
├── scripts/                    # Management scripts
│   ├── create-admin.js         # Interactive CLI to create first administrator
│   └── seed-demo.js            # Optional local-only demonstration seed data
├── tests/                      # Automated test suite (Jest & Supertest)
│   ├── mockDb.js               # In-memory PostgreSQL mock engine
│   ├── validation.test.js      # Input validation test suite
│   ├── auth.test.js            # Authentication & RBAC test suite
│   ├── books.test.js           # Book CRUD test suite
│   ├── borrow.test.js          # Transactional issue & return test suite
│   └── netlify-functions.test.js # Netlify function handler tests
├── k8s/                        # Kubernetes manifests for Minikube
│   ├── 00-namespace.yaml       # 'library-system' namespace
│   ├── 01-postgres-pvc.yaml    # Persistent volume claim for PostgreSQL data
│   ├── 02-postgres-secret-template.yaml # PostgreSQL credentials template
│   ├── 03-postgres-deployment.yaml     # PostgreSQL Pod Deployment
│   ├── 04-postgres-service.yaml        # PostgreSQL ClusterIP Service
│   ├── 05-app-configmap.yaml           # Application environment config
│   ├── 06-app-secret-template.yaml     # Application secrets template
│   ├── 07-app-deployment.yaml          # Express App Deployment (2 replicas)
│   └── 08-app-service.yaml             # NodePort Service (Port 30080)
├── Dockerfile                  # Lightweight Node.js 20 Alpine image
├── .dockerignore               # Build exclusion rules
├── docker-compose.yml          # Local multi-container orchestration
├── netlify.toml                # Netlify build and redirect configuration
├── .env.example                # Environment variables template
├── .gitignore                  # Git tracking exclusion list
└── package.json                # Project dependencies and npm scripts
```

---

## 📋 Prerequisites

Before starting, ensure you have the following installed on your machine:

- **Node.js**: `v20.x` or `v22.x` (LTS recommended)
- **Git**: `v2.x`
- **Docker Desktop**: With Docker Compose enabled
- **Minikube & Kubectl**: (For Kubernetes demonstrations)
- **PostgreSQL**: (Optional if running Docker Compose, required if running Node standalone locally)

---

## 🚀 Local Development Setup

### 1. Clone or Open the Project
Open Windows PowerShell and navigate to the project directory:
```powershell
cd "d:\Microproject Library Management system\Library-Management-System"
```

### 2. Install Node Dependencies
```powershell
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env`:
```powershell
Copy-Item .env.example .env
```
Edit `.env` to configure your local PostgreSQL credentials:
```env
PORT=3000
NODE_ENV=development
DATABASE_URL=postgres://lms_user:lms_secure_pass_123@localhost:5432/library_db
JWT_SECRET=my_development_jwt_secret_key_12345
JWT_EXPIRES_IN=24h
DB_SSL=false
```

### 4. Run Schema Migration
Initialize the database tables and indices:
```powershell
npm run migrate
```

### 5. Create Your First Administrator
Run the explicit administrator creation script:
```powershell
npm run admin:create
```
Follow the interactive prompts to enter:
- Full Name: `System Administrator`
- Username: `admin`
- Email: `admin@college.edu`
- Password: `AdminPassword123`

*(Note: In accordance with security best practices, the database is never automatically seeded with default administrator passwords).*

### 6. (Optional) Seed Local Demo Books
Seed sample computer science and engineering books for demonstration:
```powershell
npm run seed:demo
```
*(This script is guarded and will automatically abort if executed in production).*

### 7. Start the Local Server
```powershell
npm start
```
Open your browser and navigate to: **`http://localhost:3000`**

---

## 🐳 Docker & Docker Compose Deployment

The application includes a production-grade Docker configuration that sets up both the Node.js application and a persistent PostgreSQL database with health checks.

### 1. Build and Start Services
From the `Library-Management-System` directory:
```powershell
docker compose up -d --build
```

### 2. Verify Running Containers
```powershell
docker compose ps
```
Both `lms_postgres` and `lms_application` should show `healthy` / `running` status.

### 3. Inspect Container Logs
To monitor application logs:
```powershell
docker compose logs -f app
```

### 4. Create First Administrator Inside Container
Once containers are running, execute the admin creation script inside the app container:
```powershell
docker compose exec app node scripts/create-admin.js "Admin User" "admin" "admin@college.edu" "AdminPass123!"
```

### 5. (Optional) Seed Demo Data
```powershell
docker compose exec app node scripts/seed-demo.js
```

### 6. Access the Application
Open your browser to: **`http://localhost:3000`**

### 7. Restart or Stop Without Losing Data
- **Stop containers safely**:
  ```powershell
  docker compose down
  ```
- **Restart containers**:
  ```powershell
  docker compose up -d
  ```
  *(All PostgreSQL database records remain intact within the named Docker volume `postgres_data`).*

---

## ☸️ Kubernetes (Minikube) Deployment

Follow these exact steps in Windows PowerShell to deploy the Library Management System to Minikube:

### 1. Start Minikube
```powershell
minikube start --driver=docker
```

### 2. Point Shell to Minikube Docker Daemon
To build the application image directly inside Minikube's Docker daemon:
```powershell
minikube -p minikube docker-env --shell powershell | Invoke-Expression
```

### 3. Build the Image
```powershell
docker build -t library-management-system:latest .
```

### 4. Apply Kubernetes Manifests in Order
Apply the manifests to create the dedicated namespace, persistent volume claim, secrets, database, configuration, and application:
```powershell
# 1. Create namespace
kubectl apply -f k8s/00-namespace.yaml

# 2. Apply Storage & Secrets
kubectl apply -f k8s/01-postgres-pvc.yaml
kubectl apply -f k8s/02-postgres-secret-template.yaml

# 3. Deploy PostgreSQL Database & ClusterIP Service
kubectl apply -f k8s/03-postgres-deployment.yaml
kubectl apply -f k8s/04-postgres-service.yaml

# 4. Wait for PostgreSQL Pod to become Ready
kubectl wait --namespace=library-system --for=condition=ready pod -l app=postgres --timeout=120s

# 5. Apply Application ConfigMap & Secrets
kubectl apply -f k8s/05-app-configmap.yaml
kubectl apply -f k8s/06-app-secret-template.yaml

# 6. Deploy Application & NodePort Service
kubectl apply -f k8s/07-app-deployment.yaml
kubectl apply -f k8s/08-app-service.yaml
```

### 5. Check Deployment Status
```powershell
kubectl get pods,services -n library-system
```

### 6. Create Administrator Account in Kubernetes
Run the admin creation script inside one of the running application pods:
```powershell
$POD_NAME = (kubectl get pods -n library-system -l app=library-app -o jsonpath="{.items[0].metadata.name}")
kubectl exec -it $POD_NAME -n library-system -- node scripts/create-admin.js "K8s Admin" "admin" "admin@college.edu" "K8sAdmin@123"
```

### 7. Access the Application
In Minikube, retrieve the live application service URL:
```powershell
minikube service library-app-service -n library-system
```
This automatically opens your default browser pointing to the Minikube NodePort endpoint.

### 8. Cleanup Kubernetes Resources
To delete the deployment without deleting the persistent PostgreSQL storage volume:
```powershell
kubectl delete deployment,service,configmap,secret -l app=library-app -n library-system
```
To delete everything including persistent storage:
```powershell
kubectl delete namespace library-system
```

---

## 🐙 GitHub Repository Setup

To host your project on GitHub and enable continuous deployment to Netlify:

### 1. Initialize Git in the Project
```powershell
cd "d:\Microproject Library Management system\Library-Management-System"
git init
```

### 2. Stage and Commit Project Files
```powershell
git add .
git commit -m "feat: Initial commit of Library Management System with Docker, K8s, and Netlify"
```

### 3. Create a New GitHub Repository
1. Log in to [GitHub](https://github.com).
2. Click **New Repository** (top-right `+` icon).
3. Name the repository: `Library-Management-System`.
4. Choose **Public** (or **Private**).
5. Do **not** initialize with README, `.gitignore`, or license (we already created them).
6. Click **Create repository**.

### 4. Link Remote and Push
```powershell
git branch -M main
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/Library-Management-System.git
git push -u origin main
```

---

## ☁️ Netlify Hosting & Cloud Database Setup

Netlify hosts the static web frontend and executes the API as serverless functions. Because Netlify cannot run persistent Docker containers or access local files, a hosted cloud PostgreSQL database is required.

### 1. Create a Free Hosted PostgreSQL Database
We recommend using **Neon** or **Supabase** (both provide free tier PostgreSQL):
1. Sign up for free at [Neon](https://neon.tech) or [Supabase](https://supabase.com).
2. Create a new project named `library-db`.
3. Copy your database connection string, which will look like:
   ```text
   postgresql://lms_user:PASSWORD@ep-sample-12345.us-east-2.aws.neon.tech/library_db?sslmode=require
   ```

### 2. Initialize the Cloud Database Schema
From your local terminal, run the migration script against your cloud database:
```powershell
$env:DATABASE_URL = "postgresql://lms_user:PASSWORD@ep-sample-12345.us-east-2.aws.neon.tech/library_db?sslmode=require"
$env:DB_SSL = "true"
npm run migrate
```

### 3. Create First Administrator in Cloud Database
```powershell
npm run admin:create "College Librarian" "admin" "admin@college.edu" "SuperSecretAdmin123!"
```

### 4. Deploy to Netlify via GitHub
1. Sign in to [Netlify](https://app.netlify.com).
2. Click **Add new site** &rarr; **Import an existing project**.
3. Select **GitHub** and authorize access.
4. Select your repository: `Library-Management-System`.
5. Netlify will automatically detect configuration from `netlify.toml`:
   - **Publish directory**: `public`
   - **Functions directory**: `netlify/functions`
   - **Build command**: *(leave blank or `npm install`)*
6. Click **Environment variables** &rarr; **Add a variable**:
   - `DATABASE_URL`: *(Your cloud PostgreSQL connection string)*
   - `DB_SSL`: `true`
   - `JWT_SECRET`: *(A long, secure random string)*
   - `JWT_EXPIRES_IN`: `24h`
   - `NODE_ENV`: `production`
7. Click **Deploy Site**.

### 5. Verify the Live Netlify Deployment
Once deployed, test the following:
1. **Health Check**: Open `https://<your-site-name>.netlify.app/api/health`. Should return:
   ```json
   { "status": "healthy", "database": { "connected": true, "details": "PostgreSQL connection active" } }
   ```
2. **Book Catalogue**: Open `https://<your-site-name>.netlify.app/books.html`.
3. **Admin Sign In**: Log in with your admin credentials created in Step 3.
4. **Student Sign Up & Loan Test**: Register a new student account, sign in, and verify the student loan dashboard.

---

## 🧪 Automated Test Suite & Verification

The project includes unit, integration, and serverless handler tests executed with Jest and Supertest.

Run all tests:
```powershell
npm test
```

### Test Suite Coverage:
- **`tests/validation.test.js`**: Validates email formats, username constraints, password lengths, book copy counts, and issue due dates.
- **`tests/auth.test.js`**: Validates user registration, duplicate username/email rejection, login with valid/invalid credentials, password hashing integrity, and role-based route protection.
- **`tests/books.test.js`**: Validates public catalogue browsing, library collection statistics, admin book creation, updating total copies, and safe deletion.
- **`tests/borrow.test.js`**: Validates atomic issue transactions, copy count decrements, preventing issuing out-of-stock books, return processing, copy count increments, and student loan queries.
- **`tests/netlify-functions.test.js`**: Validates Netlify Function handlers (`health.js`, `stats.js`, `books.js`, `book-detail.js`, `auth-login.js`), verifying HTTP methods, CORS headers, status codes, and JSON response formatting.

---

## 🔧 Troubleshooting Guide

### 1. `DATABASE_URL environment variable is not defined`
- **Cause**: No `.env` file found or variable missing.
- **Fix**: Verify `.env` exists in the `Library-Management-System` directory or set the environment variable in your terminal.

### 2. `Database connection refused (ECONNREFUSED 127.0.0.1:5432)`
- **Cause**: PostgreSQL is not running locally.
- **Fix**: If using Docker, run `docker compose up -d postgres`. If running standalone, start the local PostgreSQL service in Windows Services (`services.msc`).

### 3. Netlify API returns 404
- **Cause**: Redirects not applied or wrong publish folder.
- **Fix**: Ensure `netlify.toml` is located at the root of your repository and that Netlify build settings have Publish directory set to `public`.

### 4. `EACCES` or permission errors with Minikube
- **Cause**: PowerShell running without standard permissions or Docker desktop paused.
- **Fix**: Open PowerShell as Administrator, ensure Docker Desktop is running, and re-run `minikube start`.

### 5. "Cannot delete this book because copies are currently issued"
- **Cause**: Data integrity protection is working as intended.
- **Fix**: An administrator must record the return of all borrowed copies before a book record can be safely deleted.

---

## 📜 License & Academic Integrity

This project is created for educational purposes as a college microproject demonstration. Free to use and adapt under the MIT License.
