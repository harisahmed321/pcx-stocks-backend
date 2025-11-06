-- Setup script for local PostgreSQL database
-- Run this as the postgres superuser to grant permissions

-- Connect to postgres database
\c postgres;

-- Grant necessary permissions to zar_user
GRANT ALL PRIVILEGES ON DATABASE postgres TO zar_user;
GRANT ALL ON SCHEMA public TO zar_user;
GRANT CREATE ON SCHEMA public TO zar_user;
GRANT USAGE ON SCHEMA public TO zar_user;

-- Alternative: If zar_user doesn't exist yet, create it
-- CREATE USER zar_user WITH PASSWORD 'StrongPassword123';
-- GRANT ALL PRIVILEGES ON DATABASE postgres TO zar_user;
-- GRANT ALL ON SCHEMA public TO zar_user;
-- GRANT CREATE ON SCHEMA public TO zar_user;
-- GRANT USAGE ON SCHEMA public TO zar_user;

-- Verify permissions
SELECT 
    grantee, 
    privilege_type 
FROM information_schema.role_table_grants 
WHERE grantee='zar_user';

