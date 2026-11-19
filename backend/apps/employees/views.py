from rest_framework import viewsets, status
from rest_framework.decorators import action
from django.db.models import ProtectedError
from common.responses import success_response, error_response
from common.services import DocumentNumberService
from .models import Department, Designation, Employee
from .serializers import DepartmentSerializer, DesignationSerializer, EmployeeSerializer

class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.filter(is_deleted=False).order_by('-created_at')
    serializer_class = DepartmentSerializer
    filterset_fields = ['status']
    search_fields = ['code', 'name', 'description']
    ordering_fields = ['created_at', 'code', 'name']
    ordering = ['-created_at']


class DesignationViewSet(viewsets.ModelViewSet):
    queryset = Designation.objects.filter(is_deleted=False).select_related('department').order_by('-created_at')
    serializer_class = DesignationSerializer
    filterset_fields = ['department', 'status']
    search_fields = ['code', 'name', 'description', 'department__name']
    ordering_fields = ['created_at', 'code', 'name']
    ordering = ['-created_at']


class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.filter(is_deleted=False).select_related(
        'department', 'designation', 'user', 'production_unit'
    ).order_by('-created_at')
    serializer_class = EmployeeSerializer
    filterset_fields = ['department', 'designation', 'employment_type', 'production_unit', 'status']
    search_fields = ['employee_code', 'name', 'phone', 'email', 'designation__name', 'department__name']
    ordering_fields = ['created_at', 'employee_code', 'name', 'joining_date']
    ordering = ['-created_at']

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        emp = serializer.save()
        return success_response(
            data=EmployeeSerializer(emp).data,
            message=f"Employee '{emp.employee_code} - {emp.name}' created successfully.",
            status_code=status.HTTP_201_CREATED
        )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        emp = serializer.save()
        return success_response(
            data=EmployeeSerializer(emp).data,
            message=f"Employee '{emp.employee_code} - {emp.name}' updated successfully."
        )

    @action(detail=False, methods=['get'], url_path='next-code')
    def next_code(self, request):
        code = DocumentNumberService.peek_next_code(prefix='EMP', model=Employee, field_name='employee_code', padding=3)
        return success_response(data={'code': code})

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        display_name = f"{instance.employee_code} - {instance.name}"
        try:
            instance.delete()
            return success_response(message=f"Employee '{display_name}' has been deleted successfully.")
        except ProtectedError:
            return error_response(
                message=f"Cannot delete employee '{display_name}' because they are linked to active production batches, inward receipts, or operational records.",
                status_code=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return error_response(
                message=f"Cannot delete employee '{display_name}': {str(e)}",
                status_code=status.HTTP_400_BAD_REQUEST
            )
