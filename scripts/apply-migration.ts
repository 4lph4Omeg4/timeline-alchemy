import postgres from 'postgres'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

async function runMigration() {
    const dbUrl = process.env.DATABASE_URL
    if (!dbUrl) {
        console.error('DATABASE_URL is missing in .env.local')
        process.exit(1)
    }

    let connectionString = dbUrl
    // Fix common issue where password is wrapped in brackets
    if (connectionString.includes(':[') && connectionString.includes(']@')) {
        console.log('Detected brackets in password, removing them...')
        connectionString = connectionString.replace(/:\[(.*?)\]@/, ':$1@')
    }

    console.log('Connecting to database...')
    const sql = postgres(connectionString, { ssl: 'require' })

    try {
        const migrationFile = path.join(process.cwd(), 'supabase', 'migrations', '042_add_trialing_status.sql')
        const migrationSql = fs.readFileSync(migrationFile, 'utf8')

        console.log('Applying migration 042_add_trialing_status.sql...')
        await sql.unsafe(migrationSql)
        console.log('✅ Migration applied successfully!')
    } catch (error) {
        console.error('❌ Migration failed:', error)
    } finally {
        await sql.end()
    }
}

runMigration()
