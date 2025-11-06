# Database Setup Instructions

## Issue: Permission Denied

You're getting a "permission denied for schema public" error. This means `zar_user` doesn't have the necessary permissions on the `public` schema.

---

## Solution: Grant Permissions

### Option 1: Run SQL Script (Recommended)

```bash
# Run the setup script as postgres superuser
sudo -u postgres psql -f setup-database.sql
```

### Option 2: Manual Steps

1. **Connect to PostgreSQL as superuser:**

   ```bash
   sudo -u postgres psql
   ```

2. **Grant permissions to zar_user:**

   ```sql
   -- Connect to postgres database
   \c postgres;

   -- Grant all permissions
   GRANT ALL PRIVILEGES ON DATABASE postgres TO zar_user;
   GRANT ALL ON SCHEMA public TO zar_user;
   GRANT CREATE ON SCHEMA public TO zar_user;
   GRANT USAGE ON SCHEMA public TO zar_user;

   -- Exit
   \q
   ```

### Option 3: Create New Database (Clean Start)

If you prefer a dedicated database:

```bash
# As postgres superuser
sudo -u postgres psql

# In psql:
CREATE DATABASE psx_stocks;
GRANT ALL PRIVILEGES ON DATABASE psx_stocks TO zar_user;
\c psx_stocks;
GRANT ALL ON SCHEMA public TO zar_user;
GRANT CREATE ON SCHEMA public TO zar_user;
\q
```

Then update `.env`:

```env
DATABASE_URL="postgresql://zar_user:StrongPassword123@localhost:5432/psx_stocks?schema=public"
```

---

## Alternative: Use postgres Superuser

If you want to avoid permission issues, use the `postgres` superuser:

**Update `.env`:**

```env
DATABASE_URL="postgresql://postgres:StrongPassword123@localhost:5432/postgres?schema=public"
```

(Replace `StrongPassword123` with your actual postgres user password)

---

## After Fixing Permissions

Run these commands:

```bash
cd /home/haris.rajput/Personal/pcs-stocks-app/backend

# Push schema to database
npm run prisma:push

# Seed with test data
npm run prisma:seed

# Start the backend
npm run dev
```

---

## Verify Database Connection

```bash
# Test connection
psql -h localhost -p 5432 -U zar_user -d postgres -c "SELECT version();"
```

You should see PostgreSQL version information if the connection works.

---

## Redis Setup

The backend also needs Redis. Install it:

### Ubuntu/Debian:

```bash
sudo apt update
sudo apt install redis-server
sudo systemctl start redis
sudo systemctl enable redis
```

### macOS:

```bash
brew install redis
brew services start redis
```

### Check Redis:

```bash
redis-cli ping
# Should return: PONG
```

---

## Full Backend Startup

Once both PostgreSQL and Redis are set up:

```bash
cd /home/haris.rajput/Personal/pcs-stocks-app/backend

# 1. Generate Prisma client
npm run prisma:generate

# 2. Push schema to database
npm run prisma:push

# 3. Seed database with test data
npm run prisma:seed

# 4. Start backend server
npm run dev
```

Backend will be available at: **http://localhost:5000**

Test it:

```bash
curl http://localhost:5000/health
```

---

## Quick Setup Summary

**Option A: Fix Permissions (Current Database)**

1. Run: `sudo -u postgres psql -f setup-database.sql`
2. Run: `npm run prisma:push`
3. Run: `npm run prisma:seed`
4. Run: `npm run dev`

**Option B: Use postgres Superuser**

1. Update `.env` DATABASE_URL to use `postgres` user
2. Run: `npm run prisma:push`
3. Run: `npm run prisma:seed`
4. Run: `npm run dev`

**Option C: Create New Database**

1. Create `psx_stocks` database with full permissions
2. Update `.env` to use `psx_stocks` database
3. Run: `npm run prisma:push`
4. Run: `npm run prisma:seed`
5. Run: `npm run dev`
