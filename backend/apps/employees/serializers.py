from rest_framework import serializers
from .models import Department, Designation, Employee

class DepartmentSerializer(serializers.ModelSerializer):
    employee_count = serializers.IntegerField(source='employees.count', read_only=True)

    class Meta:
        model = Department
        fields = ['id', 'code', 'name', 'description', 'status', 'employee_count', 'created_at']


class DesignationSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)

    class Meta:
        model = Designation
        fields = ['id', 'code', 'name', 'department', 'department_name', 'description', 'status', 'created_at']


class EmployeeSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)
    designation_name = serializers.CharField(source='designation.name', read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)
    production_unit_name = serializers.CharField(source='production_unit.name', read_only=True)

    class Meta:
        model = Employee
        fields = [
            'id', 'employee_code', 'name', 'phone', 'email', 'address',
            'date_of_birth', 'joining_date', 'department', 'department_name',
            'designation', 'designation_name', 'employment_type',
            'production_unit', 'production_unit_name', 'user', 'user_email',
            'status', 'created_at', 'updated_at'
        ]

    def to_internal_value(self, data):
        # Convert empty strings for nullable FK / date fields to None
        data = data.copy() if hasattr(data, 'copy') else dict(data)
        for nullable_field in ['user', 'production_unit', 'date_of_birth', 'email']:
            if nullable_field in data and (data[nullable_field] == '' or data[nullable_field] is None):
                data[nullable_field] = None
        return super().to_internal_value(data)
