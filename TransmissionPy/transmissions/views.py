# TransmissionPy/api/views.py

from rest_framework import generics, status, serializers
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from datetime import timedelta
from django.db.models import Q

from .models import Frequency, Transmission, EncryptionKey
from .serializers import (
    FrequencySerializer,
    TransmissionSerializer,
    EncryptionKeySerializer,
    FullStationDataSerializer
)

class StationDataView(APIView):
    """
    Returns all frequencies, scheduled transmissions, current transmissions,
    and active encryption keys in one consolidated response.
    """
    def get(self, request, *args, **kwargs):
        now = timezone.now()
        # Define your lookahead window for scheduled transmissions (e.g., next 24 hours)
        lookahead_time = now + timedelta(hours=24)

        # Frequencies
        frequencies = Frequency.objects.all()

        # Update status to 'transmitting' for currently active transmissions
        active_transmissions = Transmission.objects.filter(
            scheduled_time__lte=now,
            scheduled_time__gt=now - timedelta(hours=1),  # Only recent scheduled transmissions
        )
        for t in active_transmissions:
            end = t.scheduled_time + timedelta(seconds=t.duration_seconds)
            if t.status != 'transmitting' and t.scheduled_time <= now < end:
                t.status = 'transmitting'
                t.save(update_fields=['status'])

        # Scheduled Transmissions (upcoming within the lookahead window)
        scheduled_transmissions = Transmission.objects.filter(
            scheduled_time__gt=now, # Greater than current time
            scheduled_time__lte=lookahead_time, # Less than or equal to lookahead time
            status='scheduled'
        ).order_by('scheduled_time')

        # Current Transmissions (active right now)
        current_transmissions = Transmission.objects.filter(
            scheduled_time__lte=now, # Started by now
            status='transmitting'
        )
        # Only those actively playing (not ended)
        current_transmissions_filtered = []
        for trans in current_transmissions:
            if trans.scheduled_time + timedelta(seconds=trans.duration_seconds + 5) > now:
                current_transmissions_filtered.append(trans)

        # Active Encryption Keys
        active_keys = EncryptionKey.objects.filter(
            is_active=True,
            valid_from__lte=now
        ).filter(
            Q(valid_until__isnull=True) | Q(valid_until__gt=now)
        )

        # Serialize all data
        data = {
            'frequencies': FrequencySerializer(frequencies, many=True).data,
            'scheduled_transmissions': TransmissionSerializer(scheduled_transmissions, many=True).data,
            'current_transmissions': TransmissionSerializer(current_transmissions_filtered, many=True).data,
            'encryption_keys': EncryptionKeySerializer(active_keys, many=True).data,
        }

        return Response(data)

class TransmissionSubmitView(generics.CreateAPIView):
    """
    Allows users to submit new transmission codes.
    """
    queryset = Transmission.objects.all()
    serializer_class = TransmissionSerializer

    def perform_create(self, serializer):
        frequency_number = self.request.data.get('frequency_number')
        code = self.request.data.get('code')
        transmission_type = self.request.data.get('transmission_type', 'numbers')

        if not frequency_number:
            raise serializers.ValidationError({"frequency_number": "This field is required."})

        try:
            frequency = Frequency.objects.get(number=frequency_number)
        except Frequency.DoesNotExist:
            raise serializers.ValidationError({"frequency_number": "Invalid frequency number."})

        # Calculate scheduled_time: e.g., 5 minutes from now + current offset
        scheduled_time = timezone.now() + timedelta(minutes=5)
        duration_seconds = max(10, len(code) // 2) # Crude estimate

        # Validation
        if scheduled_time <= timezone.now():
            raise serializers.ValidationError({"scheduled_time": "Scheduled time must be in the future."})
        if duration_seconds <= 0:
            raise serializers.ValidationError({"duration_seconds": "Duration must be positive."})

        # Debug logging
        print(f"Creating transmission: freq={frequency_number}, code={code}, scheduled_time={scheduled_time}, duration_seconds={duration_seconds}")

        serializer.save(
            frequency=frequency,
            scheduled_time=scheduled_time,
            duration_seconds=duration_seconds,
            status='scheduled'
        )