from datetime import datetime, timezone

import requests
from bs4 import BeautifulSoup
from django.core.management.base import BaseCommand

from hydrology.models import Observation, Station

URL = "https://www.hidmet.gov.rs/eng/hidrologija/godisnje/godisnjak.php?sifra=42035"


class Command(BaseCommand):
    help = "Uvozi dnevne vodostaje za Novi Sad (tekuca godina) sa RHMZ sajta"

    def handle(self, *args, **options):
        year = datetime.now().year
        station = Station.objects.get(id="RHMZ-NS")

        response = requests.get(URL, timeout=30)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "html.parser")

        saved = 0
        skipped = 0

        for row in soup.find_all("tr"):
            cells = [c.get_text(strip=True) for c in row.find_all(["td", "th"])]
            # trazimo redove oblika: dan + 12 meseci
            if len(cells) < 13 or not cells[0].isdigit():
                continue

            day = int(cells[0])
            for month, text in enumerate(cells[1:13], start=1):
                try:
                    level = int(text)
                except ValueError:
                    skipped += 1  # prazno ili "-" = nema podatka
                    continue

                try:
                    # RHMZ meri u 06:00 UTC
                    ts = datetime(year, month, day, 6, 0, tzinfo=timezone.utc)
                except ValueError:
                    continue  # npr. 30. februar

                Observation.objects.update_or_create(
                    station=station,
                    timestamp=ts,
                    defaults={"water_level_cm": level},
                )
                saved += 1

        self.stdout.write(f"Sacuvano: {saved}, bez podatka: {skipped}")