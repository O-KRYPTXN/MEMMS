import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

import { env } from '../src/config/env.js';

// 1. Create a standard PostgreSQL connection pool
const connectionString = env.DATABASE_URL;
const pool = new Pool({ connectionString });

// 2. Wrap the pool in Prisma's adapter
const adapter = new PrismaPg(pool);

// 3. Instantiate the client with the adapter instead of a URL
const prisma = new PrismaClient({ adapter });

export default prisma;