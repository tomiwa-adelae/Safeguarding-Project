# Database Migrations

This folder contains SQL migration scripts for the Project STAR Safeguarding Course database.

## Running Migrations

### Local Development

```bash
# Using psql
psql -h localhost -U your_user -d your_database -f migrations/001_seed_modules_and_questions.sql

# Using the connection string from .env
psql $DATABASE_URL -f migrations/001_seed_modules_and_questions.sql
```

### Docker

```bash
# If using docker-compose
docker-compose exec db psql -U postgres -d safeguarding -f /migrations/001_seed_modules_and_questions.sql

# Copy file into container first
docker cp migrations/001_seed_modules_and_questions.sql <container_name>:/tmp/
docker exec -it <container_name> psql -U postgres -d safeguarding -f /tmp/001_seed_modules_and_questions.sql
```

## Migration Files

### 001_seed_modules_and_questions.sql
Seeds the database with the initial 8 modules and 40 quiz questions from the existing course content.

**Status:** ⚠️ Incomplete - Module HTML content needs to be extracted from `public/index.html`

**What's included:**
- ✅ All 8 modules with metadata (module_id, num, title, description, display_order)
- ✅ All 40 quiz questions with correct answers and explanations
- ✅ All 160 answer options

**What's missing:**
- ⚠️ HTML content for each module (currently placeholder comments)

**To complete:**
Extract the HTML content from `public/index.html` (the large `content` sections for each module) and replace the placeholder comments with the actual HTML.

## Testing Migrations

After running a migration, verify the data:

```sql
-- Check module count
SELECT COUNT(*) FROM modules;  -- Should be 8

-- Check question count
SELECT COUNT(*) FROM questions;  -- Should be 40

-- Check option count
SELECT COUNT(*) FROM question_options;  -- Should be 160

-- View all modules
SELECT module_id, title, is_active FROM modules ORDER BY display_order;

-- View questions for a module
SELECT q.id, q.question_text, COUNT(o.id) as option_count
FROM questions q
LEFT JOIN question_options o ON q.id = o.question_id
WHERE q.module_id = 'm1'
GROUP BY q.id, q.question_text;
```

## Rollback

To rollback the seed migration:

```sql
DELETE FROM question_options;
DELETE FROM questions;
DELETE FROM modules;
```

Note: This will remove all modules, questions, and options. User progress data will remain intact (referencing module_ids).

## Next Steps

1. Extract HTML content from `public/index.html` and update the migration script
2. Run the complete migration to populate the database
3. Test the admin API endpoints with the seeded data
4. Update the frontend to load modules from the database instead of hardcoded array
