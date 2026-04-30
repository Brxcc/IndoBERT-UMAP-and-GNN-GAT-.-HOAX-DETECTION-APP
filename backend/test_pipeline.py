import requests, time, json

payload = {
    "dataset_id": 3,
    "model_name": "Integration_Test_v1",
    "algorithm_mode": "hybrid",
    "data_split_ratio": "80/20",
    "train_ratio": 80,
    "test_ratio": 20,
    "max_seq_length": 128,
    "indo_learning_rate": 2e-5,
    "indo_batch_size": 16,
    "indo_epoch": 1,
    "indo_fold": 2,
    "use_umap": True,
    "umap_n_components": 32,
    "umap_n_neighbors": 10,
    "umap_min_dist": 0.1,
    "umap_metric": "cosine",
    "umap_random_state": 42,
    "use_gat": True,
    "gat_hidden_dim": 64,
    "gat_num_heads": 4,
    "gat_dropout": 0.1,
    "gat_learning_rate": 1e-3,
    "gat_epochs": 3,
    "gat_num_layers": 2,
    "knn_k": 5,
    "graph_construction": "knn",
}

print("Triggering training...")
res = requests.post("http://localhost:8000/admin/train-pipeline", json=payload)
print("HTTP", res.status_code)
data = res.json()
print("Response:", json.dumps(data, indent=2))
job_id = data.get("job_id")

if job_id:
    print("Job ID:", job_id)
    for i in range(30):
        time.sleep(10)
        st = requests.get("http://localhost:8000/admin/training/status/" + job_id).json()
        status = st.get("status", "?")
        error = st.get("error_msg")
        logs_count = len(st.get("logs", []))
        print("[%ds] Status: %s | Logs: %d | Error: %s" % ((i+1)*10, status, logs_count, error))
        if status in ("completed", "error"):
            print("=== FINAL METRICS ===")
            print(json.dumps(st.get("best_metrics", {}), indent=2))
            print("Result ID:", st.get("result_id"))
            break
    else:
        print("Timeout — still running after 300s")
else:
    print("ERROR: No job_id returned")
