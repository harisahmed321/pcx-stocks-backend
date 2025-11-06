# 🚀 Quick Start Guide - PSX Stocks Backend

## Step 1: Create Database

Run the setup script to create the `psx_stocks` database:

```bash
cd /home/haris.rajput/Personal/pcs-stocks-app/backend
./setup-psx-database.sh
```

This will:

- ✅ Create `psx_stocks` database
- ✅ Grant permissions to `zar_user`
- ✅ Configure schema access

---

## Step 2: Install & Start Redis

### Install Redis:

```bash
# Ubuntu/Debian
sudo apt update && sudo apt install redis-server
sudo systemctl start redis
sudo systemctl enable redis

# Test Redis
redis-cli ping  # Should return: PONG
```

---

## Step 3: Setup Backend Database

```bash
cd /home/haris.rajput/Personal/pcs-stocks-app/backend

# Generate Prisma Client
npm run prisma:generate

# Push database schema
npm run prisma:push

# Seed with test data (4 users, portfolios, holdings, etc.)
npm run prisma:seed
```

---

## Step 4: Start Backend Server

```bash
npm run dev
```

Backend will be available at: **http://localhost:5000**

---

## 🧪 Test Backend

```bash
# Health check
curl http://localhost:5000/health

# Get available stock symbols
curl http://localhost:5000/api/v1/market/symbols

# Login (after seeding)
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"pro@example.com","password":"password123"}'
```

---

## 🎯 Test Accounts (After Seeding)

| Email                 | Password      | Plan            | Holdings                 |
| --------------------- | ------------- | --------------- | ------------------------ |
| `pro@example.com`     | `password123` | Pro             | 4 holdings, 2 portfolios |
| `free@example.com`    | `password123` | Free            | Empty                    |
| `premium@example.com` | `password123` | Premium         | Empty                    |
| `admin@example.com`   | `password123` | Premium (Admin) | Empty                    |

---

## 🎨 Start Frontend

In a **new terminal**:

```bash
cd /home/haris.rajput/Personal/pcs-stocks-app/pcx-stocks-frontend
npm start
```

Frontend will be available at: **http://localhost:4200**

---

## 📊 Database Connection Details

```env
Host: localhost
Port: 5432
Database: psx_stocks
User: zar_user
Password: StrongPassword123
```

---

## 🔧 Troubleshooting

### Database Connection Issues

```bash
# Test database connection
PGPASSWORD=StrongPassword123 psql -h localhost -U zar_user -d psx_stocks -c "SELECT version();"
```

### Redis Issues

```bash
# Check Redis status
sudo systemctl status redis

# Restart Redis
sudo systemctl restart redis
```

### Backend Port Already in Use

```bash
# Find process using port 5000
sudo lsof -i :5000

# Kill the process
sudo kill -9 <PID>
```

---

## 📝 Summary of Commands

```bash
# 1. Setup database
cd /home/haris.rajput/Personal/pcs-stocks-app/backend
./setup-psx-database.sh

# 2. Install & start Redis
sudo apt install redis-server
sudo systemctl start redis

# 3. Setup backend
npm run prisma:generate
npm run prisma:push
npm run prisma:seed

# 4. Start backend
npm run dev

# 5. In new terminal - start frontend
cd ../pcx-stocks-frontend
npm start
```

---

## ✅ Success Indicators

You'll know everything is working when:

- ✅ Backend shows: `🚀 Server running on port 5000`
- ✅ WebSocket shows: `Socket.IO initialized`
- ✅ Logs show: `Subscribed to market:updates channel`
- ✅ Frontend opens at: `http://localhost:4200`
- ✅ Real-time price updates every 5 seconds

---

## 🎉 Next Steps

Once everything is running, you can:

1. Login at `http://localhost:4200/auth/login` (UI to be built)
2. Test API endpoints using curl or Postman
3. Build the Angular UI components
4. Connect frontend to backend

---

**Need Help?** Check:

- `DATABASE_SETUP.md` - Detailed database setup
- `README.md` - Complete project documentation
- `/backend/README.md` - Backend API documentation
