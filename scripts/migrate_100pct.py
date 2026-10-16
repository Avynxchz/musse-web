#!/usr/bin/env python3
"""
Migrasi 100% data soal dari scrape_tka ke format Supabase Storage (musse-web).

Aturan:
- SEMUA soal dari semua paket (tidak dibatasi 5 seperti migrasi 10%)
- Pembahasan diambil dari data/solution_sources/ (match by question_number)
- Gambar dimigrasi sebagai `gambar_url` (list URL ke bucket `soal-images` di Supabase Storage)
- Output: 1 file JSON per paket -> scripts/storage_json_100pct/{mapel}_paket_{n}.json
- TIDAK upload ke Storage (hanya generate lokal; upload manual/terpisah)

Jalankan:
  python3 migrate_100pct.py            # generate semua
  python3 migrate_100pct.py --dry-run  # hanya hitung, tanpa tulis file
  python3 migrate_100pct.py --mapel matematika  # hanya 1 mapel (untuk test)

Pelajaran dari migrasi 10% (sudah diperbaiki di sini):
- ID duplikat "soal-no-N" -> dibuat unik dari mapel+paket+nomor
- pilihan=NULL (tipe Matriks) -> diganti [] agar tidak melanggar NOT NULL
"""

import argparse
import glob
import json
import os
import re
import sys
from collections import defaultdict

# --- Konfigurasi ---
SCRAPE_DIR = os.path.expanduser("~/workspace/projects/scrape_tka")
DATA_DIR = os.path.join(SCRAPE_DIR, "data")
SOLUTION_DIR = os.path.join(DATA_DIR, "solution_sources")
OUT_DIR = os.path.expanduser("~/workspace/musse-web/scripts/storage_json_100pct")

stats = {
    "total_soal": 0,
    "total_file": 0,
    "per_mapel": defaultdict(int),
    "dengan_pembahasan": 0,
    "tanpa_pembahasan": 0,
    "dengan_gambar": 0,
    "id_duplikat_diperbaiki": 0,
    "pilihan_null_diperbaiki": 0,
    "file_tanpa_solution": [],
    "gagal": [],
}

seen_ids = set()


def load_solution_map():
    """Load semua solution files -> {(mapel, paket): {nomor: solution}}"""
    sol_map = {}
    for f in glob.glob(os.path.join(SOLUTION_DIR, "*_SOLUTIONS.json")):
        bn = os.path.basename(f).replace("_SOLUTIONS.json", "")
        m = re.match(r"^(.+)_PAKET_(\d+)$", bn)
        if not m:
            continue
        mapel = m.group(1).lower()
        paket = int(m.group(2))
        try:
            with open(f, encoding="utf-8") as fh:
                d = json.load(fh)
        except Exception as e:
            print(f"  [!] Gagal baca {bn}: {e}")
            continue
        nomor_map = {}
        for sol in d.get("solutions", []):
            qn = sol.get("question_number")
            if qn is not None:
                nomor_map[int(qn)] = sol
        sol_map[(mapel, paket)] = nomor_map
    return sol_map


def build_pembahasan(sol):
    if not sol:
        return None
    return {
        "diketahui": sol.get("diketahui"),
        "ditanyakan": sol.get("ditanyakan"),
        "concept_tags": sol.get("concept_tags"),
        "concept_kunci": sol.get("concept_kunci"),
        "glossary": sol.get("glossary"),
        "reasoning": sol.get("reasoning"),
        "steps": sol.get("steps"),
        "why_correct": sol.get("why_correct"),
        "tips": sol.get("tips"),
        "common_mistakes": sol.get("common_mistakes"),
        "difficulty": sol.get("difficulty"),
        "estimated_time_seconds": sol.get("estimated_time_seconds"),
    }


def normalize_soal_serupa(sim):
    if not sim or not isinstance(sim, dict):
        return None
    pemb = (
        sim.get("pembahasan")
        or sim.get("pembahasan_singkat")
        or sim.get("pembahasan_serupa")
        or ""
    )
    return {
        "pertanyaan": sim.get("pertanyaan"),
        "pilihan": sim.get("pilihan") or sim.get("opsi"),
        "kunci": sim.get("kunci"),
        "pembahasan": pemb,
    }


def has_images(q):
    for section in ["stimulus", "pertanyaan"]:
        imgs = (q.get(section) or {}).get("images", [])
        if imgs:
            return True
    for p in q.get("pilihan_jawaban", []) or []:
        if p.get("image"):
            return True
    return False


# Base URL untuk gambar soal di Supabase Storage
GAMBAR_BASE_URL = "https://auhqgzrrgvjbfvzvayzg.supabase.co/storage/v1/object/public/soal-images"

# File generic yang TIDAK di-upload (logo, loader, dll)
SKIP_GAMBAR = ("logo", "loader")


def build_gambar_url(q, mapel, paket):
    """Kumpulkan semua gambar soal -> list URL Supabase Storage.

    Format: {GAMBAR_BASE_URL}/{mapel}_paket_{paket}/{filename}
    """
    filenames = []
    seen = set()

    def add(fn):
        if not fn or fn in seen:
            return
        # Skip file generic
        if any(g in fn.lower() for g in SKIP_GAMBAR):
            return
        seen.add(fn)
        filenames.append(fn)

    for section in ["stimulus", "pertanyaan", "pernyataan"]:
        sec = q.get(section)
        if isinstance(sec, dict):
            for img in sec.get("images", []) or []:
                if isinstance(img, dict):
                    add(img.get("filename"))

    for p in q.get("pilihan_jawaban", []) or []:
        if isinstance(p, dict):
            img = p.get("image")
            if isinstance(img, dict):
                add(img.get("filename"))

    prefix = f"{mapel}_paket_{paket}"
    return [f"{GAMBAR_BASE_URL}/{prefix}/{fn}" for fn in filenames]


def get_mapel_nama(mapel_key, learning_data):
    name = learning_data.get("name", "")
    if name:
        return name
    return mapel_key.replace("_", " ").title()


def unique_id(qid, mapel, paket, nomor):
    """Pastikan ID unik (perbaiki duplikat 'soal-no-N')."""
    global seen_ids
    if qid in seen_ids:
        qid = f"{mapel}_paket_{paket}_q{int(nomor):02d}"
        stats["id_duplikat_diperbaiki"] += 1
    seen_ids.add(qid)
    return qid


def main():
    ap = argparse.ArgumentParser(description="Migrasi 100% soal ke JSON per-paket")
    ap.add_argument("--dry-run", action="store_true",
                    help="Hanya hitung, tanpa tulis file")
    ap.add_argument("--mapel", default=None,
                    help="Hanya proses 1 mapel (untuk test)")
    args = ap.parse_args()

    if not args.dry_run:
        os.makedirs(OUT_DIR, exist_ok=True)

    sol_map = load_solution_map()
    print(f"Solution packages loaded: {len(sol_map)}\n")

    learning_files = sorted(glob.glob(os.path.join(DATA_DIR, "*_learning.json")))
    learning_files = [f for f in learning_files
                      if not re.match(r".*/paket_\d+_learning\.json$", f)]
    if args.mapel:
        learning_files = [f for f in learning_files
                          if f"/{args.mapel}_paket_" in f]
        print(f"Filter mapel: {args.mapel} ({len(learning_files)} file)\n")

    for lf in learning_files:
        bn = os.path.basename(lf).replace("_learning.json", "")
        m = re.match(r"^(.+)_paket_(\d+)$", bn)
        if not m:
            print(f"  [!] Skip (pola nama tidak dikenal): {bn}")
            continue
        mapel, paket = m.group(1), int(m.group(2))

        try:
            with open(lf, encoding="utf-8") as fh:
                data = json.load(fh)
        except Exception as e:
            stats["gagal"].append((bn, str(e)[:80]))
            continue

        soals = data.get("soal", []) if isinstance(data, dict) else data
        if not soals:
            continue

        mapel_nama = get_mapel_nama(mapel, data)
        solutions = sol_map.get((mapel, paket), {})
        if not solutions:
            stats["file_tanpa_solution"].append(f"{mapel}_paket_{paket}")

        paket_out = []
        for q in soals:
            nomor = q.get("nomor")
            qid = q.get("id") or f"{mapel}_paket_{paket}_q{int(nomor):02d}"
            qid = unique_id(qid, mapel, paket, nomor or 0)

            sol = solutions.get(int(nomor)) if nomor else None
            pembahasan = build_pembahasan(sol)
            if pembahasan:
                stats["dengan_pembahasan"] += 1
            else:
                stats["tanpa_pembahasan"] += 1

            if has_images(q):
                stats["dengan_gambar"] += 1

            # Perbaiki pilihan=NULL (tipe Matriks pakai pernyataan, bukan pilihan)
            pilihan = q.get("pilihan_jawaban")
            if pilihan is None:
                pilihan = []
                stats["pilihan_null_diperbaiki"] += 1

            tipe = q.get("tipe_soal") or q.get("tipe") or "Pilihan Ganda"

            # Kumpulkan URL gambar soal (Supabase Storage: soal-images)
            gambar_url = build_gambar_url(q, mapel, paket)

            paket_out.append({
                "id": qid,
                "mapel": mapel,
                "mapel_nama": mapel_nama,
                "paket": paket,
                "nomor": nomor,
                "tipe": tipe,
                "stimulus": q.get("stimulus"),
                "pertanyaan": q.get("pertanyaan"),
                "pilihan": pilihan,
                "pernyataan": q.get("pernyataan"),
                "kunci": q.get("kunci_jawaban"),
                "pembahasan": pembahasan,
                "soal_serupa": normalize_soal_serupa(q.get("soal_serupa")),
                "gambar_url": gambar_url,
            })
            stats["total_soal"] += 1
            stats["per_mapel"][mapel] += 1

        # Urutkan per nomor, tulis 1 file per paket
        paket_out.sort(key=lambda s: (s["nomor"] or 0))
        if not args.dry_run:
            out_path = os.path.join(OUT_DIR, f"{mapel}_paket_{paket}.json")
            with open(out_path, "w", encoding="utf-8") as fh:
                json.dump(paket_out, fh, ensure_ascii=False)
        stats["total_file"] += 1

    # --- Laporan ---
    print("=" * 55)
    print("HASIL MIGRASI 100%" + (" (DRY-RUN)" if args.dry_run else ""))
    print("=" * 55)
    print(f"File paket diproses : {stats['total_file']}")
    print(f"Total soal          : {stats['total_soal']}")
    print(f"Dengan pembahasan   : {stats['dengan_pembahasan']}")
    print(f"Tanpa pembahasan    : {stats['tanpa_pembahasan']}")
    print(f"Dengan gambar       : {stats['dengan_gambar']} (gambar_url terisi)")
    print(f"ID duplikat diperbaiki : {stats['id_duplikat_diperbaiki']}")
    print(f"pilihan NULL diperbaiki: {stats['pilihan_null_diperbaiki']}")
    if stats["file_tanpa_solution"]:
        print(f"\n[!] Paket tanpa solution ({len(stats['file_tanpa_solution'])}):")
        for s in stats["file_tanpa_solution"]:
            print(f"    - {s}")
    if stats["gagal"]:
        print(f"\n[!] Gagal baca ({len(stats['gagal'])}):")
        for f, e in stats["gagal"]:
            print(f"    - {f}: {e}")
    if not args.dry_run:
        total_kb = 0
        for f in glob.glob(os.path.join(OUT_DIR, "*.json")):
            total_kb += os.path.getsize(f)
        print(f"\nOutput: {OUT_DIR}")
        print(f"Total ukuran: {total_kb // 1024} KB ({stats['total_file']} file)")


if __name__ == "__main__":
    main()
