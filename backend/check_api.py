import requests, json

# Training results list
res = requests.get("http://localhost:8000/admin/training/results")
data = res.json()
print("=== TRAINING RESULTS (%d total) ===" % len(data))
for r in data:
    print("  ID=%s | %s | Dataset=%s | Acc=%.4f | F1=%.4f | Path=%s" % (
        r["id"], r["model_name"], r["dataset_name"], r["accuracy"] or 0, r["f1_score"] or 0, r["best_model_path"]
    ))

# Detail for latest result
if data:
    rid = data[0]["id"]
    det = requests.get("http://localhost:8000/admin/training/results/%s" % rid).json()
    print("\n=== DETAIL ID=%s ===" % rid)
    for k in ["accuracy","precision","recall","f1_score","mcc","macro_average","weighted_average","roc_auc","mean_std"]:
        print("  %s: %s" % (k, det.get(k)))
    print("  epoch_logs count:", len(det.get("epoch_logs", [])))
    print("  settings keys:", list(det.get("settings", {}).keys())[:12])
