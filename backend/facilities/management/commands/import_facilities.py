import json
import math
from collections import Counter
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from facilities.models import Facility

DATA_DIR = Path(settings.BASE_DIR).parent / "data"
RAW_FILE = DATA_DIR / "raw" / "facilities_overpass.geojson"
RULES_FILE = DATA_DIR / "facilities_rules.json"
DUPLICATE_DISTANCE_M = 50

CYRILLIC = {
    "а": "a", "б": "b", "в": "v", "г": "g", "д": "d", "ђ": "đ", "е": "e",
    "ж": "ž", "з": "z", "и": "i", "ј": "j", "к": "k", "л": "l", "љ": "lj",
    "м": "m", "н": "n", "њ": "nj", "о": "o", "п": "p", "р": "r", "с": "s",
    "т": "t", "ћ": "ć", "у": "u", "ф": "f", "х": "h", "ц": "c", "ч": "č",
    "џ": "dž", "ш": "š",
}


def transliterate(text):
    result = []
    for ch in text:
        low = ch.lower()
        if low in CYRILLIC:
            latin = CYRILLIC[low]
            result.append(latin if ch == low else latin.capitalize())
        else:
            result.append(ch)
    return "".join(result)


def best_name(p):
    if p.get("name:sr-Latn"):
        return p["name:sr-Latn"]
    if p.get("name"):
        return transliterate(p["name"])
    return p.get("int_name") or p.get("name:en") or None


def address_for(p):
    street = p.get("addr:street")
    if not street:
        return ""
    text = transliterate(street)
    if p.get("addr:housenumber"):
        text += " " + transliterate(p["addr:housenumber"])
    return text


def category_for(p):
    amenity = p.get("amenity")
    healthcare = p.get("healthcare")
    if amenity == "school":
        return "school"
    if amenity == "kindergarten":
        return "kindergarten"
    if amenity == "social_facility":
        return "social_care"
    if amenity == "hospital":
        return "hospital"
    if amenity in ("clinic", "doctors"):
        return "health_center"
    if healthcare == "hospital":
        return "hospital"
    if healthcare in ("clinic", "centre"):
        return "health_center"
    return None


def ownership_for(p):
    value = (p.get("operator:type") or "").lower()
    if value == "private":
        return "private"
    if value in ("public", "government", "govenrment"):
        return "public"
    return "unknown"


def norm(name):
    return "".join(c for c in name.lower() if c.isalnum())


def distance_m(lat1, lon1, lat2, lon2):
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp, dl = p2 - p1, math.radians(lon2 - lon1)
    h = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * 6371000 * math.asin(math.sqrt(h))


class Command(BaseCommand):
    help = "Ucitava ustanove iz data/raw/facilities_overpass.geojson uz pravila iz data/facilities_rules.json"

    def add_arguments(self, parser):
        parser.add_argument("--details", action="store_true", help="ispisi svaku izbacenu ustanovu")

    def handle(self, *args, **options):
        for path in (RAW_FILE, RULES_FILE):
            if not path.exists():
                raise CommandError(f"Fajl ne postoji: {path}")

        with open(RAW_FILE, encoding="utf-8-sig") as f:
            raw = json.load(f)
        with open(RULES_FILE, encoding="utf-8-sig") as f:
            rules = json.load(f)

        features = {}
        for feat in raw["features"]:
            osm_id = feat["properties"].get("@id") or feat.get("id")
            features[osm_id] = feat

        excluded = {item["id"]: item["reason"] for item in rules.get("exclude", [])}
        groups = rules.get("groups", {})
        member_group = {m: g for g, data in groups.items() for m in data["members"]}
        overrides = rules.get("category_override", {})
        keep_private = set(rules.get("keep_despite_private", []))

        # provera da id-jevi iz pravila postoje u fajlu (hvata greske u kucanju)
        mentioned = set(excluded) | set(member_group) | set(overrides) | keep_private
        for missing in sorted(mentioned - set(features)):
            self.stdout.write(f"UPOZORENJE: id iz pravila ne postoji u fajlu: {missing}")

        candidates = []
        dropped = []  # (osm_id, name, razlog)

        for osm_id, feat in features.items():
            p = feat["properties"]
            name = best_name(p)

            if osm_id in excluded:
                dropped.append((osm_id, name, "pravilo:" + excluded[osm_id]))
                continue
            if feat["geometry"]["type"] != "Point":
                dropped.append((osm_id, name, "nije_tacka"))
                continue

            group_id = member_group.get(osm_id)
            category = overrides.get(osm_id) or category_for(p)
            if group_id:
                category = groups[group_id]["category"]
            if category is None:
                dropped.append((osm_id, name, "bez_kategorije"))
                continue

            ownership = ownership_for(p)
            if (
                category in ("hospital", "health_center")
                and ownership == "private"
                and osm_id not in keep_private
            ):
                dropped.append((osm_id, name, "privatna_oznaka"))
                continue

            lon, lat = feat["geometry"]["coordinates"]
            candidates.append({
                "osm_id": osm_id, "name": name,
                "name_original": p.get("name", ""),
                "category": category, "address": address_for(p),
                "latitude": lat, "longitude": lon,
                "ownership": ownership, "group_id": group_id,
                "tags": len(p),
            })

        # duplikati: imenovani sa vise oznaka prvi, pa neimenovani
        candidates.sort(key=lambda r: (r["name"] is None, -r["tags"]))
        accepted = []
        for r in candidates:
            duplicate_of = None
            if not r["group_id"]:
                for a in accepted:
                    if a["group_id"] or a["category"] != r["category"]:
                        continue
                    if distance_m(r["latitude"], r["longitude"], a["latitude"], a["longitude"]) >= DUPLICATE_DISTANCE_M:
                        continue
                    if r["name"] is None and a["name"] is not None:
                        duplicate_of = (a["osm_id"], "neimenovana_blizu_imenovane")
                        break
                    if r["name"] and a["name"] and norm(r["name"]) == norm(a["name"]):
                        duplicate_of = (a["osm_id"], "isto_ime_blizu")
                        break
            if duplicate_of:
                dropped.append((r["osm_id"], r["name"], f"{duplicate_of[1]}:{duplicate_of[0]}"))
            else:
                accepted.append(r)

        seen = set()
        for r in accepted:
            fid = "FAC-" + r["osm_id"].replace("/", "-")
            Facility.objects.update_or_create(
                id=fid,
                defaults={
                    "osm_id": r["osm_id"], "name": r["name"],
                    "name_original": r["name_original"], "category": r["category"],
                    "address": r["address"], "latitude": r["latitude"],
                    "longitude": r["longitude"], "ownership": r["ownership"],
                    "group_id": r["group_id"],
                },
            )
            seen.add(fid)
        removed, _ = Facility.objects.exclude(id__in=seen).delete()

        self.stdout.write(f"Ucitano iz fajla: {len(features)}")
        self.stdout.write(f"Sacuvano: {len(accepted)} (obrisano starih: {removed})")
        for category, count in sorted(Counter(r["category"] for r in accepted).items()):
            self.stdout.write(f"  {category}: {count}")
        self.stdout.write(f"  u grupi KCV: {sum(1 for r in accepted if r['group_id'] == 'KCV')}")
        self.stdout.write(f"  bez imena: {sum(1 for r in accepted if r['name'] is None)}")
        self.stdout.write(f"Izbaceno: {len(dropped)}")
        for reason, count in sorted(Counter(d[2].split(':')[0] for d in dropped).items()):
            self.stdout.write(f"  {reason}: {count}")
        if options["details"]:
            for osm_id, name, reason in sorted(dropped, key=lambda d: d[2]):
                self.stdout.write(f"  - {osm_id} | {name} | {reason}")