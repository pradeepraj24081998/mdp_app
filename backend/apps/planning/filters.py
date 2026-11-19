import django_filters
from .models import MaterialPlan

class MaterialPlanFilter(django_filters.FilterSet):
    status = django_filters.CharFilter(field_name='status', lookup_expr='iexact')
    start_date = django_filters.DateFilter(field_name='planning_date', lookup_expr='gte')
    end_date = django_filters.DateFilter(field_name='planning_date', lookup_expr='lte')
    planning_date_from = django_filters.DateFilter(field_name='planning_date', lookup_expr='gte')
    planning_date_to = django_filters.DateFilter(field_name='planning_date', lookup_expr='lte')
    required_date_from = django_filters.DateFilter(field_name='required_date', lookup_expr='gte')
    required_date_to = django_filters.DateFilter(field_name='required_date', lookup_expr='lte')
    vendor = django_filters.UUIDFilter(field_name='vendor_id')

    class Meta:
        model = MaterialPlan
        fields = [
            'status',
            'vendor',
            'start_date',
            'end_date',
            'planning_date_from',
            'planning_date_to',
            'required_date_from',
            'required_date_to'
        ]
