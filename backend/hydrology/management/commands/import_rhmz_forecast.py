import re
from datetime import date

import requests
from bs4 import BeautifulSoup
from django.core.management.base import BaseCommand, CommandError

from hydrology.models import Station, WaterLevelForecast

URL = "https://www.hidmet.gov.rs/eng/hidrologija/izvestajne/prognoza.php?hm_id=42035"
STATION_ID = "RHMZ-NS"


def clean(text):
    return re.sub(r"\s+", " ", text.replace("\xa0", " ")).strip()


class Command(BaseCommand):
    help = "Import the official RHMZ water-level forecast for Novi Sad (4 days ahead)."

    def handle(self, *args, **options):
        station = Station.objects.filter(id=STATION_ID).first()
        if station is None:
            raise CommandError(f"Station {STATION_ID} does not exist.")

        resp = requests.get(URL, timeout=20, headers={"User-Agent": "WaterWise-MVP/1.0"})
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "html.parser")

        # Issue date: header line like "Date: FRIDAY, 30.10.2026."
        m = re.search(r"Date:\s*[A-Za-z]+,\s*(\d{1,2})\.(\d{1,2})\.(\d{4})", clean(soup.get_text(" ")))
        if not m:
            raise CommandError("Could not find the issue date on the page.")
        issued = date(int(m.group(3)), int(m.group(2)), int(m.group(1)))

        # Forecast table
        table = next((t for t in soup.find_all("table") if "Water stage forecast" in t.get_text()), None)
        if table is None:
            raise CommandError("Forecast table not found (page layout may have changed).")

        dates_row, levels_row = None, None
        for tr in table.find_all("tr"):
            cells = [clean(td.get_text(" ")) for td in tr.find_all("td")]
            if not cells:
                continue
            if cells[0].startswith("Date"):
                dates_row = cells[1:]
            elif cells[0].startswith("Water stage"):
                levels_row = cells[1:]
        if not dates_row or not levels_row:
            raise CommandError("Could not read dates/levels from the forecast table.")

        saved = skipped = 0
        for d_text, level_text in zip(dates_row, levels_row):
            dm = re.fullmatch(r"(\d{1,2})\.(\d{1,2})\.", d_text)  # skips the 'weekly range' column
            if not dm:
                continue
            if not re.fullmatch(r"-?\d+", level_text):
                skipped += 1
                continue
            day, month = int(dm.group(1)), int(dm.group(2))
            year = issued.year + (1 if month < issued.month else 0)
            WaterLevelForecast.objects.update_or_create(
                station=station,
                issued_date=issued,
                target_date=date(year, month, day),
                defaults={"water_level_cm": int(level_text), "source_url": URL},
            )
            saved += 1

        self.stdout.write(self.style.SUCCESS(f"Issued {issued}: saved {saved}, skipped {skipped}"))