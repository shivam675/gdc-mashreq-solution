"""
Migration script to add new fields to AgentWorkflow table
Run this once to update existing database
"""
import sqlite3
import os

DB_PATH = "app/bank_sentinel.db"

def migrate():
    if not os.path.exists(DB_PATH):
        print("❌ Database not found. Will be created on first run.")
        return
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Check if columns already exist
    cursor.execute("PRAGMA table_info(agent_workflows)")
    columns = [col[1] for col in cursor.fetchall()]
    
    new_columns = []
    
    if 'confidence_score' not in columns:
        new_columns.append("ALTER TABLE agent_workflows ADD COLUMN confidence_score FLOAT")
    
    if 'data_quality' not in columns:
        new_columns.append("ALTER TABLE agent_workflows ADD COLUMN data_quality VARCHAR(20)")
    
    if 'risk_level' not in columns:
        new_columns.append("ALTER TABLE agent_workflows ADD COLUMN risk_level VARCHAR(20)")
    
    if 'escalation_recommendation' not in columns:
        new_columns.append("ALTER TABLE agent_workflows ADD COLUMN escalation_recommendation TEXT")
    
    if 'discarded_by' not in columns:
        new_columns.append("ALTER TABLE agent_workflows ADD COLUMN discarded_by VARCHAR(200)")
    
    if new_columns:
        print(f"📝 Adding {len(new_columns)} new columns...")
        for sql in new_columns:
            print(f"  - {sql.split('ADD COLUMN ')[1]}")
            cursor.execute(sql)
        conn.commit()
        print("✅ Migration completed successfully!")
    else:
        print("✅ All columns already exist. No migration needed.")
    
    conn.close()

if __name__ == "__main__":
    migrate()
