"""
preprocessing_utils.py — Kamus Slang & Stopword Bahasa Indonesia
==================================================================
Berisi:
  - SLANG_DICT   : kamus konversi slang -> baku (200+ entri)
  - STOPWORD_SET : kumpulan stopword bahasa Indonesia (300+ entri)
  - preprocess_text() : fungsi preprocessing teks
  - get_stats()        : fungsi statistik hasil preprocessing
"""

import re
from collections import Counter

# ─── Kamus Slang Bahasa Indonesia ─────────────────────────────────────────────
SLANG_DICT = {
    # Articles / Particles
    "yg": "yang", "dgn": "dengan", "utk": "untuk", "dg": "dengan",
    # Negation
    "tdk": "tidak", "gak": "tidak", "ga": "tidak", "gk": "tidak",
    "nggak": "tidak", "ngga": "tidak", "enggak": "tidak", "kagak": "tidak",
    "tak": "tidak",
    # Time / Tense
    "udah": "sudah", "udh": "sudah", "sdh": "sudah", "dah": "sudah",
    "blm": "belum", "blom": "belum", "belom": "belum",
    "lg": "lagi", "lgi": "lagi", "msh": "masih", "msih": "masih",
    "skrg": "sekarang", "skrang": "sekarang", "skrng": "sekarang",
    "bsk": "besok", "kmrn": "kemarin", "kmarin": "kemarin",
    # Conjunctions / Connectors
    "emg": "memang", "emang": "memang", "mmg": "memang",
    "tp": "tetapi", "tapi": "tetapi", "sbg": "sebagai",
    "krn": "karena", "karna": "karena", "krna": "karena", "soalnya": "karena",
    "klo": "kalau", "kalo": "kalau", "klw": "kalau", "bila": "jika",
    # Verbs / Actions
    "jd": "jadi", "jdi": "jadi", "jg": "juga",
    "dpt": "dapat", "dpat": "dapat", "bisa": "dapat",
    "bakal": "akan", "bakalan": "akan", "mw": "akan",
    "abis": "habis", "abiss": "habis", "bis": "habis",
    "tau": "tahu", "tw": "tahu", "taw": "tahu",
    "blg": "bilang", "blng": "bilang", "ngomong": "bilang",
    "crita": "cerita", "cr": "cerita",
    "lht": "lihat", "liat": "lihat",
    "dkt": "dekat",
    "jln": "jalan", "jal": "jalan",
    "msk": "masuk", "kluar": "keluar",
    "beli": "membeli", "jual": "menjual", "buat": "membuat",
    "kasih": "memberi", "ksh": "memberi",
    "ambil": "mengambil", "ambl": "mengambil",
    "nyari": "mencari", "cri": "mencari",
    "nanya": "bertanya", "tanya": "bertanya",
    "jawab": "menjawab", "jwb": "menjawab",
    "bantu": "membantu", "bntu": "membantu",
    "bayar": "membayar", "byr": "membayar",
    "kirim": "mengirim", "krm": "mengirim",
    "terima": "menerima", "trma": "menerima",
    "tunjuk": "menunjukkan", "tnk": "menunjukkan",
    "lupa": "melupakan", "inget": "ingat", "ingt": "ingat",
    "ngerti": "mengerti", "paham": "mengerti",
    "bawa": "membawa", "bwa": "membawa",
    "dtg": "datang", "dtng": "datang",
    "pgi": "pergi", "plng": "pulang",
    "mkn": "makan", "mnum": "minum",
    "tdr": "tidur", "bngn": "bangun",
    "krja": "kerja", "bljar": "belajar",
    "sklh": "sekolah", "kmpus": "kampus",
    "dsn": "dosen", "mhsw": "mahasiswa",
    "plajaran": "pelajaran",
    "ujin": "ujian", "test": "ujian",
    "nili": "nilai", "skor": "nilai",
    "llus": "lulus", "skses": "sukses",
    "duit": "uang", "money": "uang",
    "hrga": "harga",
    "mrah": "murah", "mhal": "mahal",
    "free": "gratis",
    "tko": "toko",
    "hp": "ponsel", "hape": "ponsel", "handphone": "ponsel",
    "pc": "komputer",
    "inet": "internet", "wifi": "jaringan",
    "sosmed": "media sosial", "socmed": "media sosial",
    "fb": "facebook", "ig": "instagram", "wa": "whatsapp",
    "brita": "berita", "kabar": "berita",
    "info": "informasi", "infomasi": "informasi",
    "fkta": "fakta",
    "pmrintah": "pemerintah",
    "negar": "negara",
    "pltk": "politik",
    "pemilu": "pemilihan umum", "pilpres": "pemilihan presiden",
    "prsident": "presiden",
    "mnteri": "menteri",
    "plisi": "polisi",
    "krupsi": "korupsi",
    "covid": "covid-19", "corona": "covid-19",
    "vksin": "vaksin",
    "bncan": "bencana",
    "kbakaran": "kebakaran",
    "kcelakaan": "kecelakaan",
    # Pronouns
    "sm": "sama", "sama2": "sama-sama",
    "org": "orang", "orng": "orang", "manusia": "orang",
    "tmn": "teman", "tmen": "teman", "sobat": "teman", "sbt": "teman",
    "km": "kamu", "lo": "kamu", "lu": "kamu", "elu": "kamu",
    "gw": "saya", "gue": "saya", "gua": "saya", "ane": "saya",
    "sy": "saya", "aku": "saya",
    "mrk": "mereka", "dy": "ia", "dia": "ia",
    "nih": "ini", "ni": "ini", "tu": "itu", "tuh": "itu",
    "pd": "pada", "dlm": "dalam", "dlam": "dalam",
    "ttg": "tentang", "mnrt": "menurut",
    # Adjectives / Adverbs
    "bgt": "banget", "bngt": "banget",
    "bener": "benar", "bner": "benar", "bnr": "benar",
    "gimana": "bagaimana", "gmn": "bagaimana", "gmana": "bagaimana",
    "kenapa": "mengapa", "knp": "mengapa", "knapa": "mengapa",
    "kyk": "seperti", "kyak": "seperti", "kek": "seperti",
    "hrs": "harus", "hrus": "harus", "wjb": "wajib",
    "bs": "bisa", "bsa": "bisa", "blh": "boleh",
    "mau": "ingin", "mo": "ingin", "pgn": "ingin", "pengen": "ingin",
    "bru": "baru",
    "sdg": "sedang",
    "aja": "saja", "doang": "saja", "thok": "saja",
    "cape": "lelah", "capek": "lelah", "kecapean": "kelelahan",
    "ngantuk": "mengantuk", "ngntk": "mengantuk",
    "skit": "sakit", "sht": "sehat",
    "bagus": "baik", "keren": "baik", "mantap": "baik", "mantul": "baik",
    "jelek": "buruk", "ancur": "buruk", "parah": "buruk",
    "gilak": "gila",
    "ori": "asli", "original": "asli",
    "hoax": "hoaks", "bohong": "dusta",
    "bner2": "benar-benar", "emg2": "memang-memang",
    "skali": "sekali", "bnyk": "banyak", "bnyak": "banyak",
    "sdikit": "sedikit", "sdkt": "sedikit", "byk": "banyak",
    "cepet": "cepat", "cpat": "cepat",
    "pake": "pakai", "pk": "pakai", "pkai": "pakai",
    "ok": "baik", "oke": "baik", "sip": "baik",
    "fix": "pasti", "pst": "pasti",
    # Internet slang / abbreviations
    "ldr": "hubungan jarak jauh", "bucin": "budak cinta",
    "gabut": "tidak ada kegiatan", "gabs": "tidak ada kegiatan",
    "baper": "bawa perasaan", "bpr": "bawa perasaan",
    "lebay": "berlebihan", "lbay": "berlebihan",
    "alay": "berlebihan",
    "gaje": "tidak jelas", "gj": "tidak jelas",
    "santuy": "santai",
    # Noise / filler words — mapped to empty (will be dropped)
    "wkwk": "", "haha": "", "hehe": "", "xixi": "", "lol": "",
    "wkwkwk": "", "kwkwk": "", "hahaha": "", "hihi": "",
}

# ─── Stopword Bahasa Indonesia ─────────────────────────────────────────────────
STOPWORD_SET = {
    "yang", "dan", "di", "ke", "dari", "dengan", "untuk", "pada", "adalah",
    "ini", "itu", "atau", "juga", "dalam", "ada", "tidak", "kami", "kita",
    "ia", "mereka", "saya", "anda", "kamu", "apa", "akan", "sudah", "saat",
    "bisa", "oleh", "karena", "lebih", "bagi", "serta", "telah", "bahwa",
    "antara", "namun", "namun", "jika", "maka", "kalau", "sebagai", "pun",
    "agar", "setelah", "ketika", "meski", "meskipun", "walaupun", "bila",
    "hingga", "sampai", "sejak", "sebelum", "sesudah", "apabila", "sehingga",
    "atas", "bawah", "dalam", "luar", "dalam", "depan", "belakang", "antara",
    "sebuah", "suatu", "setiap", "semua", "seluruh", "beberapa", "salah",
    "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan",
    "sembilan", "sepuluh", "pertama", "kedua", "ketiga",
    "sekarang", "sudah", "telah", "sedang", "akan", "pernah", "belum",
    "tidak", "bukan", "jangan", "tapi", "tetapi", "namun", "melainkan",
    "sekitar", "kira", "kurang", "lebih", "hampir", "sangat", "amat",
    "sangat", "paling", "jauh", "dekat", "cukup", "hanya", "saja",
    "malah", "bahkan", "justru", "memang", "sebenarnya", "ternyata",
    "tentu", "pasti", "mungkin", "barangkali", "kiranya",
    "demikian", "begitu", "seperti", "sama", "hal", "cara", "waktu",
    "lain", "baru", "lagi", "masih", "terus", "kembali", "lalu", "kemudian",
    "juga", "pun", "sih", "deh", "nih", "loh", "dong", "ya", "yah",
    "gitu", "gini", "tuh", "nah", "wah", "ah", "oh", "eh", "hmm",
    "iya", "yep", "yup", "oke", "ok",
    "hei", "hai", "halo", "hello",
    "sang", "si", "sang", "para", "kaum", "pihak",
    "itu", "ini", "tersebut", "tadi", "sini", "sana", "situ",
    "saya", "aku", "ku", "kau", "nya", "mu",
    "kita", "kami", "mereka", "dia", "ia", "beliau",
    "apa", "siapa", "mana", "kapan", "dimana", "mengapa", "bagaimana",
    "bahwa", "agar", "supaya", "biar",
    "pula", "jua", "pun", "saja", "sajalah", "hanya", "sekedar",
    "yaitu", "yakni", "adalah", "merupakan", "ialah",
    "misalnya", "contohnya", "antara", "lain",
    "oleh", "karena", "sebab", "lantaran", "akibat",
    "melalui", "lewat", "via", "berdasarkan",
    "menurut", "berkata", "dikatakan",
    "nomor", "no", "hal", "hlm",
    "dengan", "beserta", "bersama", "disertai",
    "terhadap", "bagi", "kepada", "dari",
    "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m",
    "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z",
    "dr", "yg", "dgn", "dlm", "pd", "sdh", "jg", "tp", "krn", "lg",
    "blm", "spt", "ttg", "utk", "dg", "sbg", "bhw",
    "dan", "atau", "namun", "tapi", "akan", "bila", "jika",
    "serta", "maupun", "hingga", "sampai", "padahal",
    "bilamana", "andaikan", "seandainya", "andai",
    "sungguhpun", "jangankan", "sekalipun",
    "malahan", "apalagi", "lagipula", "selain", "kecuali",
    "sesungguhnya", "sebenarnya", "hakikatnya",
    "terutama", "khususnya", "umumnya", "biasanya",
    "kenyataannya", "sayangnya", "untungnya", "syukurlah",
    "setidaknya", "sedikitnya", "sekurangnya",
    "belakangan", "terbaru", "terkini", "teraktual",
    "sudahlah", "biarlah", "biarkan", "baiknya",
    "tolong", "mohon", "silakan", "mari", "ayo",
    "jangan", "hindari", "stop", "henti",
    "sesuai", "sesuatu", "masing-masing", "berbagai", "seluruh",
}


# ─── Fungsi Preprocessing ──────────────────────────────────────────────────────
def preprocess_text(text: str, convert_slang: bool = False, remove_stopwords: bool = False):
    """
    Bersihkan teks dengan opsi konversi slang dan penghapusan stopword.
    
    Returns:
        (clean_text, slang_matches, stopword_matches)
        - slang_matches : list of (original, replacement, sentence_example)
        - stopword_matches : list of removed stopwords
    """
    slang_matches = []
    stopword_matches = []
    
    # Lowercase & basic clean
    text = str(text).lower()
    text = re.sub(r'http\S+|www\.\S+', '', text)         # remove URLs
    text = re.sub(r'@\w+|#\w+', '', text)                # remove mentions/hashtags
    text = re.sub(r'[^\w\s]', ' ', text)                 # remove punctuation
    text = re.sub(r'\d+', ' ', text)                     # remove numbers
    
    tokens = text.split()
    result_tokens = []
    
    for token in tokens:
        token = token.strip()
        if not token:
            continue
        
        if convert_slang and token in SLANG_DICT:
            replacement = SLANG_DICT[token]
            if replacement and replacement != token:  # Only record REAL conversions
                slang_matches.append((token, replacement, text[:80]))
                token = replacement
            elif not replacement:
                continue  # drop noise words (wkwk, haha, etc.)
            # if replacement == token (identity entry), just keep original token unchanged
        
        if remove_stopwords and token in STOPWORD_SET:
            stopword_matches.append(token)
            continue  # skip this token
        
        result_tokens.append(token)
    
    clean_text = " ".join(result_tokens)
    clean_text = re.sub(r'\s+', ' ', clean_text).strip()
    
    return clean_text, slang_matches, stopword_matches


# ─── Fungsi Statistik ─────────────────────────────────────────────────────────
def get_stats(slang_matches: list, stopword_matches: list, df, text_col: str):
    """
    Hitung tabel frekuensi untuk hasil preprocessing.
    
    Returns:
        (slang_table, stopword_table) — list of dicts
    """
    # Slang: count by (original, replacement)
    slang_counter = Counter()
    slang_examples = {}
    for original, replacement, example in slang_matches:
        key = (original, replacement)
        slang_counter[key] += 1
        if key not in slang_examples:
            slang_examples[key] = example

    slang_table = [
        {
            "original": k[0],
            "replacement": k[1],
            "count": v,
            "example": slang_examples.get(k, "")[:100],
        }
        for k, v in slang_counter.most_common(100)
    ]

    # Stopword: count by word
    sw_counter = Counter(stopword_matches)
    stopword_table = [
        {"word": word, "count": count}
        for word, count in sw_counter.most_common(100)
    ]

    return slang_table, stopword_table
