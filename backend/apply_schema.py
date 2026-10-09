import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()
db_url = os.environ.get("DATABASE_URL")

with open('../supabase_schema.sql', 'r') as f:
    sql = f.read()

try:
    conn = psycopg2.connect(db_url)
    conn.autocommit = True
    cursor = conn.cursor()
    cursor.execute(sql)
    print("Schema applied successfully!")
except Exception as e:
    print(f"Failed to apply schema: {e}")
