import json
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.utils.dateparse import parse_date, parse_datetime

from events.models import WaterEvent

DEFAULT_FILE = Path(settings.BASE_DIR).parent / "data" / "events.json"
VALID_STATUSES = {code for code, _ in WaterEvent.STATUS_CHOICES}
DATETIME_FIELDS = ["start_time", "expected_end_time", "actual_end_time"]


class Command(BaseCommand):
    help = "Uvozi dogadjaje iz data/events.json (fajl je izvor istine)"

    def add_arguments(self, parser):
        parser.add_argument("--file", default=str(DEFAULT_FILE))

    def handle(self, *args, **options):
        path = Path(options["file"])
        if not path.exists():
            raise CommandError(f"Fajl ne postoji: {path}")

        with open(path, encoding="utf-8-sig") as f:
            items = json.load(f)

        saved = 0
        for item in items:
            event_id = item.get("id")
            if not event_id:
                raise CommandError("Dogadjaj bez polja 'id'.")

            status = item.get("status", "unknown")
            if status not in VALID_STATUSES:
                raise CommandError(f"{event_id}: nepoznat status '{status}'")

            data = {k: v for k, v in item.items() if k != "id"}

            for field in DATETIME_FIELDS:
                if data.get(field):
                    parsed = parse_datetime(data[field])
                    if parsed is None:
                        raise CommandError(f"{event_id}: neispravan datum u '{field}'")
                    data[field] = parsed
                else:
                    data[field] = None

            published = data.get("source_published_at")
            data["source_published_at"] = parse_date(published) if published else None

            WaterEvent.objects.update_or_create(id=event_id, defaults=data)
            saved += 1

        self.stdout.write(f"Uvezeno dogadjaja: {saved}")