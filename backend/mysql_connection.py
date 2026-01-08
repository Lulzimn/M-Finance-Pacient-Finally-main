import os
import mysql.connector
from mysql.connector import Error

# Minimal MySQL connection helper using environment variables
# Required env vars:
#   MYSQL_HOST, MYSQL_PORT, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE

def get_mysql_connection():
    try:
        conn = mysql.connector.connect(
            host=os.environ.get("MYSQL_HOST", "localhost"),
            port=int(os.environ.get("MYSQL_PORT", "3306")),
            user=os.environ.get("MYSQL_USER"),
            password=os.environ.get("MYSQL_PASSWORD"),
            database=os.environ.get("MYSQL_DATABASE"),
            autocommit=True,
        )
        return conn
    except Error as e:
        # Avoid logging secrets; keep message concise
        raise RuntimeError(f"MySQL connection failed: {e}")

if __name__ == "__main__":
    # Quick connectivity check
    conn = get_mysql_connection()
    cur = conn.cursor()
    cur.execute("SELECT 1")
    print({"connected": True, "result": cur.fetchone()[0]})
    cur.close()
    conn.close()
