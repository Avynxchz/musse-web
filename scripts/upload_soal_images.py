#!/usr/bin/env python3
"""
Upload gambar soal ke Supabase Storage bucket `soal-images`.

Prasyarat:
  1. Jalankan scripts/create_bucket_soal_images.sql di Supabase SQL Editor
  2. Set env SUPABASE_URL dan SUPABASE_SERVICE_KEY

Jalankan:
  SUPABASE_URL=https://auhqgzrrgvjbfvzvayzg.supabase.co \\
  SUPABASE_SERVICE_KEY=xxx \\
  python3 scripts/upload_soal_images.py

  --dry-run   : hanya hitung, tanpa upload
  --limit N   : batasi N file (untuk test)
"""

import argparse
import json
import os
import sys
import urllib.request
import urllib.error

SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://auhqgzrrgvjbfvzvayzg.supabase.co")
SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")
BUCKET = "soal-images"
DATA_DIR = os.path.expanduser("~/workspace/projects/scrape_tka/data")

# File generic yang TIDAK di-upload
SKIP_KEYWORDS = ("logo", "loader")


def collect_images():
    """Kumpulkan (storage_path, local_path) untuk semua gambar soal."""
    import glob

    result = {}  # storage_path -> local_path

    for f in glob.glob(os.path.join(DATA_DIR, "*_paket_*_learning.json")):
        bn = os.path.basename(f).replace("_learning.json", "")
        parts = bn.rsplit("_paket_", 1)
        if len(parts) != 2:
            continue
        mapel, paket = parts[0], parts[1]

        try:
            with open(f, encoding="utf-8") as fh:
                data = json.load(fh)
        except Exception:
            continue

        for q in data.get("soal", []):
            for section in ["stimulus", "pertanyaan", "pernyataan"]:
                sec = q.get(section)
                if isinstance(sec, dict):
                    for img in sec.get("images", []) or []:
                        if isinstance(img, dict) and img.get("filename"):
                            fn = img["filename"]
                            if not any(k in fn.lower() for k in SKIP_KEYWORDS):
                                sp = f"{mapel}_paket_{paket}/{fn}"
                                lp = os.path.join(DATA_DIR, mapel, f"paket_{paket}", "images", fn)
                                if os.path.exists(lp):
                                    result[sp] = lp

            for p in q.get("pilihan_jawaban", []) or []:
                if isinstance(p, dict):
                    img = p.get("image")
                    if isinstance(img, dict) and img.get("filename"):
                        fn = img["filename"]
                        if not any(k in fn.lower() for k in SKIP_KEYWORDS):
                            sp = f"{mapel}_paket_{paket}/{fn}"
                            lp = os.path.join(DATA_DIR, mapel, f"paket_{paket}", "images", fn)
                            if os.path.exists(lp):
                                result[sp] = lp

    return result


def upload_file(storage_path, local_path):
    """Upload 1 file via Supabase Storage API."""
    url = f"{SUPABASE_URL}/storage/v1/object/{BUCKET}/{storage_path}"

    with open(local_path, "rb") as fh:
        data = fh.read()

    # Tentukan content-type
    if local_path.endswith(".png"):
        ctype = "image/png"
    elif local_path.endswith((".jpg", ".jpeg")):
        ctype = "image/jpeg"
    elif local_path.endswith(".gif"):
        ctype = "image/gif"
    elif local_path.endswith(".webp"):
        ctype = "image/webp"
    else:
        ctype = "application/octet-stream"

    req = urllib.request.Request(url, data=data, method="POST")
    req.add_header("Authorization", f"Bearer {SERVICE_KEY}")
    req.add_header("apikey", SERVICE_KEY)
    req.add_header("Content-Type", ctype)
    req.add_header("x-upsert", "true")  # idempotent: timpa jika sudah ada

    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            return True, resp.status
    except urllib.error.HTTPError as e:
        return False, f"HTTP {e.code}: {e.read()[:200]}"
    except Exception as e:
        return False, str(e)[:200]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--limit", type=int, default=0)
    args = parser.parse_args()

    if not args.dry_run and not SERVICE_KEY:
        print("ERROR: Set SUPABASE_SERVICE_KEY terlebih dahulu!")
        sys.exit(1)

    print("Mengumpulkan gambar...")
    images = collect_images()
    print(f"Total: {len(images)} file")

    if args.limit:
        images = dict(list(images.items())[:args.limit])
        print(f"Dibatasi: {len(images)} file")

    if args.dry_run:
        print("\n[DRY-RUN] Tidak ada yang di-upload.")
        # Tampilkan 5 contoh
        for sp in list(images.keys())[:5]:
            print(f"  {sp}")
        return

    ok, fail = 0, 0
    failed_list = []
    for i, (sp, lp) in enumerate(images.items(), 1):
        success, info = upload_file(sp, lp)
        if success:
            ok += 1
        else:
            fail += 1
            failed_list.append((sp, info))
        if i % 50 == 0:
            print(f"  ... {i}/{len(images)} (ok={ok}, fail={fail})")

    print(f"\nSelesai: {ok} berhasil, {fail} gagal")
    if failed_list:
        print("\nYang gagal:")
        for sp, info in failed_list[:10]:
            print(f"  {sp}: {info}")


if __name__ == "__main__":
    main()
