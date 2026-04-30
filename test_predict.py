import requests, json

url = 'http://localhost:8000/admin/predict-bulk'
files = {'file': open('contoh_testing.csv', 'rb')}
res = requests.post(url, files=files)
print('HTTP Status:', res.status_code)
data = res.json()
if 'predictions' in data:
    for p in data['predictions']:
        print(f"[{p['predicted_label']}] {p['text'][:50]}... ({p['confidence']}%)")
else:
    print('Error:', data)
