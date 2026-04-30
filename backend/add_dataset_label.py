import sqlite3

conn = sqlite3.connect('antihoax.db')
c = conn.cursor()

# Check if column already exists
c.execute("PRAGMA table_info(datasets)")
cols = [row[1] for row in c.fetchall()]
print("Existing columns:", cols)

if 'dataset_label' not in cols:
    c.execute("ALTER TABLE datasets ADD COLUMN dataset_label TEXT")
    conn.commit()
    print("Added dataset_label column successfully.")
else:
    print("dataset_label column already exists, skipping.")

conn.close()
