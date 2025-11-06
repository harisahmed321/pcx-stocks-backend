#!/bin/bash

# Setup PSX Stocks Database with zar_user
# Run this script to create the database with proper permissions

echo "🚀 Setting up PSX Stocks database..."

sudo -u postgres psql << 'EOF'
-- Create database
CREATE DATABASE psx_stocks OWNER zar_user;

-- Grant all privileges
GRANT ALL PRIVILEGES ON DATABASE psx_stocks TO zar_user;

-- Connect to the new database
\c psx_stocks;

-- Grant schema permissions
GRANT ALL ON SCHEMA public TO zar_user;
GRANT CREATE ON SCHEMA public TO zar_user;
GRANT USAGE ON SCHEMA public TO zar_user;

-- Allow user to create databases (for testing if needed)
ALTER USER zar_user CREATEDB;

-- Show granted permissions
SELECT 
    grantee, 
    privilege_type 
FROM information_schema.role_table_grants 
WHERE grantee='zar_user';

-- Show connection info
SELECT current_database(), current_user;
EOF

echo ""
echo "✅ Database setup complete!"
echo ""
echo "📋 Database Details:"
echo "   Database: psx_stocks"
echo "   User: zar_user"
echo "   Host: localhost"
echo "   Port: 5432"
echo ""
echo "🧪 Test the connection:"
echo "   PGPASSWORD=StrongPassword123 psql -h localhost -U zar_user -d psx_stocks -c 'SELECT version();'"
echo ""

