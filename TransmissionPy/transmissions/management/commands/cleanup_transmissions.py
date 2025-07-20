from django.core.management.base import BaseCommand
from django.utils import timezone
from transmissions.models import Transmission
from datetime import timedelta
from django.db import models

class Command(BaseCommand):
    help = 'Update transmission statuses and delete old transmissions.'

    def handle(self, *args, **options):
        now = timezone.now()
        # 1. Set status to "transmitting" for currently playing transmissions
        transmitting_count = 0
        scheduled = Transmission.objects.filter(status='scheduled')
        for t in scheduled:
            start = t.scheduled_time
            end = start + timedelta(seconds=t.duration_seconds)
            if start <= now < end:
                t.status = 'transmitting'
                t.save(update_fields=['status'])
                transmitting_count += 1
        self.stdout.write(self.style.SUCCESS(f"Set {transmitting_count} transmissions to 'transmitting'."))

        # 2. Delete transmissions ended >30min ago
        cutoff = now - timedelta(minutes=30)
        old_transmissions = Transmission.objects.filter(
            scheduled_time__lt=cutoff - models.F('duration_seconds') * timedelta(seconds=1)
        )
        # Log which transmissions will be deleted
        for t in old_transmissions:
            self.stdout.write(self.style.WARNING(f"Deleting transmission ID={t.id}, scheduled_time={t.scheduled_time}, duration_seconds={t.duration_seconds}, code={t.code}"))
        deleted_count, _ = old_transmissions.delete()
        self.stdout.write(self.style.SUCCESS(f"Deleted {deleted_count} old transmissions.")) 