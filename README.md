# PSX Stocks Backend API

Production-ready backend API for the PSX Stock Portfolio Management Platform built with Node.js, Express, Prisma, PostgreSQL, Redis, and Socket.IO.

## 🚀 Features

- **RESTful API** with comprehensive endpoints for portfolio management
- **Real-time updates** via Socket.IO for live market data
- **JWT Authentication** with refresh token rotation
- **PostgreSQL Database** with Prisma ORM
- **Redis** for caching and pub/sub
- **Mock market data provider** (easily replaceable with real PSX API)
- **Role-based access control** (User/Admin)
- **Subscription tiers** (Free/Pro/Premium)
- **Price alerts** with automatic triggering
- **Transaction management** with automatic portfolio updates
- **Docker Compose** for easy local development

## 📋 Prerequisites

- Node.js (v18+)
- npm or yarn
- Docker & Docker Compose (for database)
- PostgreSQL (if not using Docker)
- Redis (if not using Docker)

## 🛠️ Installation

### 1. Clone and Install Dependencies

```bash
cd backend
npm install
```

### 2. Environment Setup

```bash
cp .env.example .env
```

Edit `.env` and configure your environment variables:

```env
NODE_ENV=development
PORT=5000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/psx_stocks?schema=public"
REDIS_HOST=localhost
REDIS_PORT=6379

JWT_ACCESS_SECRET=your-secret-here
JWT_REFRESH_SECRET=your-refresh-secret-here
```

### 3. Start Database Services

```bash
# Start PostgreSQL and Redis using Docker Compose
docker-compose up -d

# Check services are running
docker-compose ps
```

### 4. Setup Database

```bash
# Generate Prisma Client
npm run prisma:generate

# Push schema to database
npm run prisma:push

# Seed database with sample data
npm run prisma:seed
```

### 5. Start Development Server

```bash
npm run dev
```

The server will start on http://localhost:5000

## 📚 API Endpoints

### Authentication

- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - Logout (revoke refresh token)
- `GET /api/v1/auth/me` - Get current user

### Users

- `GET /api/v1/users/me` - Get current user profile
- `PATCH /api/v1/users/me` - Update profile
- `GET /api/v1/users` - Get all users (Admin only)

### Portfolios

- `GET /api/v1/portfolios` - List user portfolios
- `POST /api/v1/portfolios` - Create portfolio
- `GET /api/v1/portfolios/:id` - Get portfolio details
- `PATCH /api/v1/portfolios/:id` - Update portfolio
- `DELETE /api/v1/portfolios/:id` - Delete portfolio

### Holdings

- `POST /api/v1/portfolios/:portfolioId/holdings` - Add holding
- `GET /api/v1/portfolios/:portfolioId/holdings` - Get holdings
- `PATCH /api/v1/holdings/:id` - Update holding
- `DELETE /api/v1/holdings/:id` - Delete holding

### Transactions

- `POST /api/v1/portfolios/:portfolioId/transactions` - Create transaction
- `GET /api/v1/portfolios/:portfolioId/transactions` - Get transactions

### Watchlists

- `GET /api/v1/watchlists` - List watchlists
- `POST /api/v1/watchlists` - Create watchlist
- `GET /api/v1/watchlists/:id` - Get watchlist
- `DELETE /api/v1/watchlists/:id` - Delete watchlist
- `POST /api/v1/watchlists/:id/items` - Add item
- `DELETE /api/v1/watchlists/:id/items/:itemId` - Remove item

### Alerts

- `GET /api/v1/alerts` - List alerts
- `POST /api/v1/alerts` - Create alert
- `GET /api/v1/alerts/:id` - Get alert
- `DELETE /api/v1/alerts/:id` - Delete alert

### Market Data

- `GET /api/v1/market/symbols` - Get available symbols
- `GET /api/v1/market/:symbol/price` - Get current price
- `GET /api/v1/market/:symbol/history` - Get historical data

## 🔌 WebSocket API

Connect to `ws://localhost:5000/socket.io` namespace `/market`

### Events

**Client → Server:**
- `subscribe` - Subscribe to symbol updates: `{ symbols: ['PSO', 'OGDC'] }`
- `unsubscribe` - Unsubscribe from symbols

**Server → Client:**
- `price:update` - Real-time price updates
- `alert:trigger` - Alert notifications

## 🧪 Sample Data

The seed script creates:
- 4 test users (free/pro/premium/admin)
- 2 portfolios with holdings for pro user
- Sample transactions
- 2 watchlists with items
- 3 price alerts
- 30 days of historical market data

**Test Credentials:**
- Free: `free@example.com` / `password123`
- Pro: `pro@example.com` / `password123`
- Premium: `premium@example.com` / `password123`
- Admin: `admin@example.com` / `password123`

## 🔧 Development

```bash
# Run in development mode (with hot reload)
npm run dev

# Build for production
npm run build

# Run production build
npm run start:prod

# Run Prisma Studio (database GUI)
npm run prisma:studio

# Generate Prisma Client
npm run prisma:generate

# Create new migration
npm run prisma:migrate

# Run tests
npm test
```

## 🐳 Docker

```bash
# Start all services (postgres, redis, pgadmin)
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f

# Rebuild containers
docker-compose up -d --build
```

**pgAdmin:** http://localhost:5050 (admin@psx.com / admin)

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/           # Configuration
│   ├── modules/          # Feature modules
│   │   ├── auth/
│   │   ├── users/
│   │   ├── portfolios/
│   │   ├── holdings/
│   │   ├── transactions/
│   │   ├── watchlists/
│   │   ├── alerts/
│   │   └── market/
│   ├── prisma/           # Prisma client
│   ├── sockets/          # Socket.IO gateway
│   ├── jobs/             # Background jobs
│   ├── utils/            # Utilities
│   ├── types/            # TypeScript types
│   ├── app.ts            # Express app
│   ├── server.ts         # HTTP server + Socket.IO
│   └── index.ts          # Entry point
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── seed.ts           # Seed script
├── docker-compose.yml
├── tsconfig.json
└── package.json
```

## 🔐 Security

- Passwords hashed with bcrypt (12 rounds)
- JWT access tokens (15min expiry)
- JWT refresh tokens (30 day expiry, stored hashed)
- Helmet for security headers
- CORS configured
- Rate limiting on API endpoints
- Input validation with express-validator

## 🚦 Health Check

```bash
curl http://localhost:5000/health
```

## 🔗 Integration with Angular Frontend

The Angular SSR frontend should:

1. Connect to `http://localhost:5000/api/v1` for REST API
2. Connect to `ws://localhost:5000` for Socket.IO
3. Store JWT access token in memory
4. Store refresh token in httpOnly cookie or secure storage
5. Implement token refresh interceptor

## 📝 License

MIT

