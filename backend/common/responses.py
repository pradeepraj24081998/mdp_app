from rest_framework.response import Response
from rest_framework import status

def success_response(data=None, message="Success", status_code=status.HTTP_200_OK, pagination=None):
    payload = {
        'success': True,
        'message': message,
        'data': data if data is not None else {}
    }
    if pagination:
        payload['pagination'] = pagination
    return Response(payload, status=status_code)

def error_response(message="An error occurred", errors=None, status_code=status.HTTP_400_BAD_REQUEST):
    return Response({
        'success': False,
        'message': message,
        'errors': errors if errors is not None else {}
    }, status=status_code)
