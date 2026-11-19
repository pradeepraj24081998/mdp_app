import re
from django.db import transaction
from common.models import DocumentSequence

class DocumentNumberService:
    """
    Centralized, concurrency-safe document number and master code generation service.
    Guarantees unique numbers formatted like PO-000001, INW-000001, MAT-020, VEN-007.
    """
    @classmethod
    @transaction.atomic
    def generate_number(cls, prefix: str, padding: int = 6) -> str:
        seq, _ = DocumentSequence.objects.select_for_update().get_or_create(
            prefix=prefix.upper(),
            defaults={'current_value': 0, 'padding_length': padding}
        )
        seq.current_value += 1
        seq.padding_length = padding
        seq.save(update_fields=['current_value', 'padding_length', 'updated_at'])

        number_str = str(seq.current_value).zfill(padding)
        return f"{seq.prefix}-{number_str}"

    @classmethod
    @transaction.atomic
    def generate_unique_code(cls, prefix: str, model=None, field_name: str = 'code', padding: int = 3) -> str:
        """
        Generates a guaranteed unique ID with auto-increment sequence and collision check.
        """
        prefix_upper = prefix.upper()
        seq, _ = DocumentSequence.objects.select_for_update().get_or_create(
            prefix=prefix_upper,
            defaults={'current_value': 0, 'padding_length': padding}
        )

        # If current_value is 0, initialize it with the max existing number from the model
        if seq.current_value == 0 and model is not None:
            max_num = 0
            codes = model.objects.values_list(field_name, flat=True)
            for c in codes:
                m = re.search(r'(\d+)', str(c))
                if m:
                    max_num = max(max_num, int(m.group(1)))
            seq.current_value = max_num

        while True:
            seq.current_value += 1
            number_str = str(seq.current_value).zfill(padding)
            candidate = f"{seq.prefix}-{number_str}"
            if model is not None and field_name:
                exists = model.objects.filter(**{field_name: candidate}).exists()
                if not exists and hasattr(model, 'all_objects'):
                    exists = model.all_objects.filter(**{field_name: candidate}).exists()
                if not exists:
                    seq.padding_length = padding
                    seq.save(update_fields=['current_value', 'padding_length', 'updated_at'])
                    return candidate
            else:
                seq.padding_length = padding
                seq.save(update_fields=['current_value', 'padding_length', 'updated_at'])
                return candidate

    @classmethod
    def peek_next_code(cls, prefix: str, model=None, field_name: str = 'code', padding: int = 3) -> str:
        """
        Peeks the next upcoming unique code without advancing the sequence.
        """
        prefix_upper = prefix.upper()
        seq = DocumentSequence.objects.filter(prefix=prefix_upper).first()
        current_val = seq.current_value if seq else 0

        if current_val == 0 and model is not None:
            max_num = 0
            codes = model.objects.values_list(field_name, flat=True)
            for c in codes:
                m = re.search(r'(\d+)', str(c))
                if m:
                    max_num = max(max_num, int(m.group(1)))
            current_val = max_num

        candidate_val = current_val + 1
        while True:
            number_str = str(candidate_val).zfill(padding)
            candidate = f"{prefix_upper}-{number_str}"
            if model is not None and field_name:
                exists = model.objects.filter(**{field_name: candidate}).exists()
                if not exists and hasattr(model, 'all_objects'):
                    exists = model.all_objects.filter(**{field_name: candidate}).exists()
                if not exists:
                    return candidate
                candidate_val += 1
            else:
                return candidate
