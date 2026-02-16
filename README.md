# Project STAR — Safeguarding Interactive Training Course

A production-ready web application for the **Project STAR Safeguarding Policy** training programme. Features centralised user tracking with PostgreSQL, progress persistence across devices, and an admin dashboard — deployable to Fly.io, Namecheap, or any Node.js hosting environment.

---

## Architecture

```
project-star-safeguarding/
├── server.js          # Express server with async API endpoints
├── db.js              # PostgreSQL database layer (pg Pool)
├── schema.sql         # Database schema (auto-runs on startup)
├── package.json       # Dependencies and scripts
├── Dockerfile         # Container build for Fly.io / Docker
├── fly.toml           # Fly.io deployment config
├── .env.example       # Environment variable template
└── public/
    └── index.html     # Complete course (single-file SPA)
```

### Tech Stack
- **Backend**: Node.js 20 + Express 4 (async/await throughout)
- **Database**: PostgreSQL with native `pg` driver
- **Frontend**: Single-file HTML/CSS/JS SPA
- **Security**: Helmet, parameterised queries (SQL injection safe), CORS-restricted

---

## Database Schema

Four tables — auto-created on first startup via `schema.sql`:

| Table | Purpose | Key |
|---|---|---|
| `users` | Student accounts (name, class/year, timestamps) | `staff_id` PK |
| `progress` | Module completion records (score, pass status) | `(staff_id, module_id)` PK |
| `quiz_answers` | Saved quiz state for resume (JSONB) | `(staff_id, module_id)` PK |
| `certificates` | Certificate issue dates | `staff_id` PK |

**Note:** Column name `staff_id` is kept for database compatibility, but represents Admission Number for students.

All tables use `ON DELETE CASCADE` — deleting a user removes all their data.

---

## Features

### Student Experience
- Sign-in with name, admission number/email, and class/year
- Returning students auto-detected — resume from where they left off
- 8 training modules with interactive content
- 40 quiz questions (80% pass threshold per module)
- Progress auto-saved to PostgreSQL on every action
- Printable certificate of completion

### Admin Tracker Dashboard
- Passphrase-protected access
- Summary cards: total enrolled, completed, in progress, not started, average progress
- Full table with per-module completion dots, progress bars, last active dates
- Click any student for detailed breakdown with scores
- Search/filter by name, admission number, or class/year
- CSV export of all student data (server-generated)

### Multi-User / Multi-Location
- Centralised PostgreSQL database — all users share one data store
- Multiple concurrent users from different locations
- Admin dashboard shows consolidated real-time view

---

## API Endpoints

| Method | Path                      | Description                         |
|--------|---------------------------|-------------------------------------|
| POST   | `/api/register`           | Register a new student account      |
| POST   | `/api/login`              | Login with admission number/email   |
| POST   | `/api/set-password`       | Set password (existing students)    |
| POST   | `/api/forgot-password`    | Request password reset email        |
| POST   | `/api/reset-password`     | Reset password with token           |
| POST   | `/api/logout`             | End current session                 |
| GET    | `/api/session`            | Check authentication status         |
| POST   | `/api/progress`           | Save module completion              |
| POST   | `/api/quiz-answers`       | Save quiz answers (for resume)      |
| POST   | `/api/certificate`        | Record certificate completion       |
| POST   | `/api/admin/login`        | Verify admin passphrase             |
| GET    | `/api/admin/tracker?key=` | Get all tracker data (admin)        |
| GET    | `/api/admin/export?key=`  | Download CSV report (admin)         |
| DELETE | `/api/admin/user/:id?key=`| Delete a student record (admin)     |

---

## Deployment

### Option A: Fly.io (Recommended)

Fly.io provides managed Postgres and simple container deployment.

#### Prerequisites
- Install [flyctl](https://fly.io/docs/getting-started/installing-flyctl/)
- Create a Fly.io account: `fly auth signup`

#### Steps

```bash
# 1. Navigate to project
cd project-star-safeguarding

# 2. Authenticate
fly auth login

# 3. Launch the app (say NO if asked about existing databases)
fly launch

# 4. Create a managed Postgres cluster (free tier available)
fly postgres create --name project-star-db --region lhr

# 5. Attach Postgres to your app (auto-sets DATABASE_URL secret)
fly postgres attach project-star-db

# 6. Set admin passphrase
fly secrets set ADMIN_PASSPHRASE="YourSecurePassphrase2025"

# 7. Deploy
fly deploy

# 8. Open in browser
fly open
```

The schema auto-migrates on first startup — no manual SQL needed.

#### Subsequent Deployments
```bash
fly deploy
```

#### Database Access
```bash
# Connect to Postgres directly
fly postgres connect -a project-star-db

# From inside psql:
\dt                          -- list tables
SELECT * FROM users;         -- view all learners
SELECT COUNT(*) FROM progress WHERE passed = true;  -- completed modules
```

---

### Option B: Namecheap

#### With Namecheap Shared Hosting (cPanel)
Namecheap shared hosting does not include PostgreSQL. You have two options:
1. **Use an external PostgreSQL provider** (recommended):
   - [Neon](https://neon.tech) — free tier, serverless Postgres
   - [Supabase](https://supabase.com) — free tier with dashboard
   - [ElephantSQL](https://www.elephantsql.com) — free 20MB plan
2. **Upgrade to Namecheap VPS** (see below)

After obtaining your `DATABASE_URL` from the provider:

```bash
# 1. Upload project files via cPanel File Manager or SSH
# 2. In cPanel → Setup Node.js App:
#    - Node.js version: 20.x
#    - Application root: project-star-safeguarding
#    - Startup file: server.js
#    - Environment variables:
#        DATABASE_URL = postgresql://user:pass@host:5432/dbname
#        ADMIN_PASSPHRASE = YourSecurePassphrase2025
#    - Click "Create" then "Run NPM Install"
```

#### With Namecheap VPS

```bash
# 1. SSH into VPS
ssh root@your-vps-ip

# 2. Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Install PostgreSQL
sudo apt-get install -y postgresql postgresql-contrib

# 4. Create database and user
sudo -u postgres psql -c "CREATE USER staruser WITH PASSWORD 'your_secure_password';"
sudo -u postgres psql -c "CREATE DATABASE safeguarding OWNER staruser;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE safeguarding TO staruser;"

# 5. Upload project and install
cd /var/www/project-star-safeguarding
npm install --production

# 6. Create .env
cat > .env << EOF
PORT=3000
DATABASE_URL=postgresql://staruser:your_secure_password@localhost:5432/safeguarding
DB_SSL=false
ADMIN_PASSPHRASE=YourSecurePassphrase2025
EOF

# 7. Run schema (auto-runs on start, but you can also run manually)
npm run db:migrate

# 8. Install PM2 and start
sudo npm install -g pm2
pm2 start server.js --name "safeguarding-course"
pm2 save
pm2 startup

# 9. Set up Nginx reverse proxy
sudo nano /etc/nginx/sites-available/safeguarding
```

Nginx configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/safeguarding /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl restart nginx

# SSL with Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

### Option C: Docker (Any Host)

```bash
# Build
docker build -t project-star-safeguarding .

# Run (provide your PostgreSQL connection string)
docker run -d \
  --name safeguarding-course \
  -p 3000:3000 \
  -e DATABASE_URL="postgresql://user:pass@host:5432/dbname" \
  -e ADMIN_PASSPHRASE="YourSecurePassphrase2025" \
  project-star-safeguarding
```

Or with Docker Compose (includes its own Postgres):

```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://postgres:starpass@db:5432/safeguarding
      ADMIN_PASSPHRASE: YourSecurePassphrase2025
    depends_on:
      db:
        condition: service_healthy

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: safeguarding
      POSTGRES_PASSWORD: starpass
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  pgdata:
```

```bash
docker-compose up -d
```

---

### Local Development

```bash
# Prerequisites: PostgreSQL running locally

# 1. Create local database
createdb safeguarding

# 2. Install dependencies
npm install

# 3. Create .env
cp .env.example .env
# Edit DATABASE_URL to point to your local Postgres

# 4. Start with auto-reload
npm run dev

# Open http://localhost:3000
```

---

## Configuration

| Variable           | Default              | Description                                    |
|--------------------|----------------------|------------------------------------------------|
| `PORT`             | `3000`               | Server port                                    |
| `DATABASE_URL`     | *(required)*         | PostgreSQL connection string                   |
| `DB_SSL`           | `auto`               | Set to `false` for local dev without SSL       |
| `ADMIN_PASSPHRASE` | `ProjectSTAR2025`    | Passphrase for admin tracker access            |

**Important**: Change `ADMIN_PASSPHRASE` before deploying to production.

---

## Database Backup

```bash
# Standard pg_dump
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Restore
psql $DATABASE_URL < backup_20250209.sql

# Fly.io managed Postgres
fly postgres connect -a project-star-db -c "COPY users TO STDOUT CSV HEADER" > users_backup.csv
```

---

## Security Notes

- All SQL queries use parameterised `$1, $2...` placeholders (SQL injection safe)
- Helmet.js headers for XSS, clickjacking, and content-type protection
- Quiz answers stored as JSONB (native Postgres JSON type)
- Admin tracker protected by passphrase over HTTPS
- Password-based authentication with bcrypt hashing (12 rounds)
- Email-based password reset with secure tokens
- For enhanced security, your DevOps team can add:
  - Session-based authentication with express-session + connect-pg-simple
  - Rate limiting with express-rate-limit
  - Integration with your organisation's SSO/LDAP

---

## Project STAR

**Building tomorrow's leaders today**

Lagelu Grammar School, Oyo State, Nigeria

© 2025 Project STAR. All rights reserved.
