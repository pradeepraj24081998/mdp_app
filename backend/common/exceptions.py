from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import APIException
from django.conf import settings

class BusinessLogicError(APIException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = "A business rule violation occurred."
    default_code = "business_logic_error"

class InsufficientStockError(BusinessLogicError):
    default_detail = "Insufficient stock available for the requested operation."
    default_code = "insufficient_stock"

class InvalidStatusTransitionError(BusinessLogicError):
    default_detail = "The requested status transition is not permitted."
    default_code = "invalid_status_transition"

class ApprovalPermissionError(BusinessLogicError):
    status_code = status.HTTP_403_FORBIDDEN
    default_detail = "User does not have required authority or tier limit to approve this document."
    default_code = "approval_permission_denied"


def custom_exception_handler(exc, context):
    """
    Standardize all API error responses to:
    {
      "success": false,
      "message": "Human readable explanation",
      "errors": {}
    }
    """
    response = exception_handler(exc, context)

    if response is not None:
        message = "An error occurred."
        errors = response.data

        if isinstance(response.data, dict):
            if 'detail' in response.data:
                message = str(response.data['detail'])
                errors = response.data
            else:
                message = "Validation failed"
                errors = response.data
        elif isinstance(response.data, list):
            message = response.data[0] if response.data else "Validation failed"
            errors = {'non_field_errors': response.data}
        else:
            message = str(response.data)
            errors = {'error': [message]}

        response.data = {
            'success': False,
            'message': message,
            'errors': errors
        }
    else:
        # Unhandled 500 error
        return Response(
            {
                'success': False,
                'message': str(exc) if settings.DEBUG else "Internal server error. Please try again later.",
                'errors': {'internal': [str(exc)]}
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    return response
