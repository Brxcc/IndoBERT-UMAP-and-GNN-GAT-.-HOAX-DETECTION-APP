"""DB Migration — Add new columns and tables."""
import sqlite3

conn = sqlite3.connect("antihoax.db")
cur  = conn.cursor()

# ── model_training_results upgrades ───────────────────────────────────────────
cur.execute("PRAGMA table_info(model_training_results)")
existing = [row[1] for row in cur.fetchall()]
print("model_training_results columns:", existing)

migrations = [
    ("mcc",              "ALTER TABLE model_training_results ADD COLUMN mcc REAL"),
    ("algorithm_mode",   "ALTER TABLE model_training_results ADD COLUMN algorithm_mode TEXT DEFAULT 'hybrid'"),
    ("epoch_logs_json",  "ALTER TABLE model_training_results ADD COLUMN epoch_logs_json TEXT"),
    ("macro_average",    "ALTER TABLE model_training_results ADD COLUMN macro_average REAL"),
    ("weighted_average", "ALTER TABLE model_training_results ADD COLUMN weighted_average REAL"),
    ("roc_auc",          "ALTER TABLE model_training_results ADD COLUMN roc_auc REAL"),
    ("mean_std",         "ALTER TABLE model_training_results ADD COLUMN mean_std REAL"),
]
for col, sql in migrations:
    if col not in existing:
        cur.execute(sql)
        print(f"  Added: {col}")
    else:
        print(f"  Exists: {col}")

# ── testing_history table ─────────────────────────────────────────────────────
cur.execute("""
    CREATE TABLE IF NOT EXISTS testing_history (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        input_type  TEXT,
        filename    TEXT,
        model_id    INTEGER,
        model_name  TEXT,
        total_rows  INTEGER DEFAULT 1,
        result_json TEXT,
        timestamp   DATETIME DEFAULT CURRENT_TIMESTAMP
    )
""")
print("testing_history: ready")

conn.commit()
conn.close()
print("\nMigration complete!")
