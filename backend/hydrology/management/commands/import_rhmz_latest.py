import re
import xml.etree.ElementTree as ET
from datetime import datetime, timezone

import requests
from django.core.management.base import BaseCommand, CommandError

from hydrology.models import Observation, Station

FEED_URL = "https://www.hidmet.gov.rs/eng/osmotreni/stanje_voda.xml"
HM_ID = "42035"  # RHMZ sifra stanice Novi Sad


def to_number(text):
    # "*" i "-" znace da nema podatka -> None
    try:
        return float(text)
    except (TypeError, ValueError):
        return None


def find_value(pattern, text):
    match = re.search(pattern, text, re.S)
    return to_number(match.group(1)) if match else None


def child_text(element, name):
    for child in element:
        if child.tag.split("}")[-1] == name:
            return child.text or ""
    return ""


def child_href(element):
    for child in element:
        if child.tag.split("}")[-1] == "link":
            return child.attrib.get("href", "")
    return ""


class Command(BaseCommand):
    help = "Upisuje danasnji vodostaj, protok i temperaturu za Novi Sad iz RHMZ feeda"

    def handle(self, *args, **options):
        station = Station.objects.get(id="RHMZ-NS")

        response = requests.get(FEED_URL, timeout=30)
        response.raise_for_status()
        root = ET.fromstring(response.content)

        # datum merenja je u naslovu feeda, npr. "SUNDAY 18.10.2026."
        date_match = re.search(r"(\d{2})\.(\d{2})\.(\d{4})", child_text(root, "title"))
        if not date_match:
            raise CommandError("Nisam nasao datum u naslovu feeda.")
        day, month, year = (int(g) for g in date_match.groups())
        timestamp = datetime(year, month, day, 6, 0, tzinfo=timezone.utc)

        entry_summary = None
        for entry in root:
            if entry.tag.split("}")[-1] != "entry":
                continue
            if f"hm_id={HM_ID}" in child_href(entry):
                entry_summary = child_text(entry, "summary")
                break
        if entry_summary is None:
            raise CommandError("Stanica Novi Sad nije u feedu.")

        level = find_value(r"Water stage:\s*(\S+)\s*cm", entry_summary)
        flow = find_value(r"Flow\s+rate:\s*(\S+)\s*m3/s", entry_summary)
        temperature = find_value(r"Water temperature:\s*(\S+)\s*\(", entry_summary)

        values = {
            "water_level_cm": int(round(level)) if level is not None else None,
            "flow_m3_s": flow,
            "water_temperature_c": temperature,
        }
        # ne prepisujemo postojecu vrednost praznom
        values = {k: v for k, v in values.items() if v is not None}
        if not values:
            raise CommandError("Feed nema nijednu vrednost za Novi Sad.")

        Observation.objects.update_or_create(
            station=station, timestamp=timestamp, defaults=values
        )
        self.stdout.write(f"{timestamp:%Y-%m-%d}: {values}")