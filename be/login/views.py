import requests
import jwt

from datetime import datetime, timedelta

from django.conf import settings
from django.core.mail import send_mail
from django.http import JsonResponse
from django.shortcuts import redirect
from django.utils.crypto import get_random_string
from django.utils.http import urlencode

from rest_framework import viewsets, status
from rest_framework.decorators import action

import urllib.parse

from user.models import Users

CALLBACK_URI = settings.BASE_URL + "/api/auth/callback"
REDIRECT_URI = settings.REDIRECT_URI
AUTH_URL = settings.AUTH_URL
TOKEN_URL = settings.TOKEN_URL
API_BASE_URL = settings.API_BASE_URL

CLIENT_UID = settings.API_UID
CLIENT_SECRET = settings.API_SECRET

STATE = "random_secure_string"

scope = "openid email profile"
# URL 인코딩
encoded_scope = urllib.parse.quote(scope)

class GoogleAuthViewSet(viewsets.ModelViewSet):
    @action(detail=False, methods=["get"], url_path="login")
    def login(self, request):
        target_url = (
            f"{AUTH_URL}?"
            f"client_id={CLIENT_UID}&"
            f"redirect_uri={CALLBACK_URI}&"
            f"response_type=code&"
            f"scope={encoded_scope}&"
            f"state={STATE}"
        )
        return redirect(target_url)

    @action(detail=False, methods=["get"], url_path="callback")
    def callback(self, request):
        code = request.GET.get('code')
        if not code:
            return JsonResponse({'error': f"[Auth code missing]"}, status=status.HTTP_400_BAD_REQUEST)
        token_data = {
            "grant_type": "authorization_code",
            "client_id": CLIENT_UID,
            "client_secret": CLIENT_SECRET,
            "code": code,
            "redirect_uri": CALLBACK_URI,
        }
        token_response = requests.post(TOKEN_URL, data=token_data).json()
        access_token = token_response.get("access_token")
        # refresh_token = token_response.get("refresh_token") # google 에서 refresh_token을 받기위해서는 따로 설정이 필요함

        if not access_token:
            return JsonResponse({'error': f"[Access token missing]"}, status=status.HTTP_400_BAD_REQUEST)

        headers = {"Authorization": f"Bearer {access_token}"}

        try:
            user_response = requests.get(f"{API_BASE_URL}", headers=headers)
            user_response.raise_for_status()
            user_data = user_response.json()
        except requests.exceptions.RequestException as e:
            return JsonResponse({"error": f"[Failed to fetch user data]: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        user_name = user_data.get("name") # google 에서 이름 가져오기
        email = user_data.get("email")
        if not user_name:
            return JsonResponse({"error": f"[user data missing]"}, status=status.HTTP_400_BAD_REQUEST)

        user_profile, created = Users.objects.update_or_create(
            email=email,
            defaults={
                # "refresh_token": refresh_token,
                "access_token": access_token,
                "user_name": user_name,
            }
        )

        try:
            # tmp_jwt_token = create_jwt_token(user_profile, settings.JWT_SECRET_KEY, 180)
            jwt_token = create_jwt_token(user_profile, settings.JWT_SECRET_KEY, 3 * 24 * 60 * 60)
        except Exception as e:
            return JsonResponse({"error": f"[Failed to create JWT token]: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        # send_and_save_verification_code(user_profile)

        response = redirect(REDIRECT_URI)
        # response.set_cookie('tmp_jwt', tmp_jwt_token)
        response.set_cookie('jwt', jwt_token)
        # print(f"REDIRECT_URI: {REDIRECT_URI}", flush=True)
        return response

    @action(detail=False, methods=["post"], url_path="verify")
    def verify_code(self, request):
        # print(f"got here", flush = True)
        code = request.data.get('code')
        if not code:
            return JsonResponse({'error': f"[Verification code is required]"}, status=status.HTTP_400_BAD_REQUEST)
        if code.isalnum() is False:
            return JsonResponse({'error': f"[Verification code is invalid]"}, status=status.HTTP_400_BAD_REQUEST)
        tmp_jwt_token = request.data.get('tmp_jwt')
        payload = jwt.decode(tmp_jwt_token, settings.JWT_SECRET_KEY, algorithms=['HS256'])
        user_email = payload.get('user_email')

        try:
            user = Users.objects.get(email=user_email)

            if user.verification_code == code:
                jwt_token = create_jwt_token(user, settings.JWT_SECRET_KEY, 3 * 24 * 60 * 60)
                response = JsonResponse({'message': 'Verification success'},status=status.HTTP_200_OK)
                response.set_cookie('jwt', jwt_token)
                return response
            else:
                return JsonResponse({'error': 'Verification code is invalid'}, status=status.HTTP_400_BAD_REQUEST)
        except Users.DoesNotExist:
            return JsonResponse({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return JsonResponse({'error': f"[{e.__class__.__name__}] {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=["get"], url_path="check_expired")
    def is_expired(self, request):
        jwt_token = request.COOKIES.get('jwt')
        # if not jwt_token:
        #     jwt_token = request.COOKIES.get('tmp_jwt')
        if not jwt_token:
            return JsonResponse({'message': 'JWT token not found'}, status=status.HTTP_404_NOT_FOUND)
        try:
            payload = jwt.decode(jwt_token, settings.JWT_SECRET_KEY, algorithms=['HS256'])
        except jwt.ExpiredSignatureError:
            return JsonResponse({'message': 'Token is expired'}, status=status.HTTP_401_UNAUTHORIZED)
        except jwt.InvalidTokenError:
            return JsonResponse({'message': 'Invalid token'}, status=status.HTTP_401_UNAUTHORIZED)

        return JsonResponse({'message': 'Token is valid'}, status=status.HTTP_200_OK)

    @action(detail=False, methods=["get"], url_path="user_info")
    def user_info(self, request):
        jwt_token = request.COOKIES.get('jwt')
        if not jwt_token:
            return JsonResponse({'message': 'JWT token not found'}, status=status.HTTP_401_UNAUTHORIZED)
        try:
            payload = jwt.decode(jwt_token, settings.JWT_SECRET_KEY, algorithms=['HS256'])
        except jwt.ExpiredSignatureError:
            return JsonResponse({'message': 'Token is expired'}, status=status.HTTP_401_UNAUTHORIZED)
        user = Users.objects.get(email=payload.get('user_email'))
        if not user:
            return JsonResponse({'message': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        else:
            return JsonResponse({
                'user_id': user.user_id,
                'user_name': user.user_name
            }, status=status.HTTP_200_OK)
        
    @action(detail=False, methods=["get"], url_path="user_name") #google에서 이름 수정상황을 확인하는 코드 추가하기
    def user_name(self, request):
        jwt_token = request.COOKIES.get('jwt')
        if not jwt_token:
            return JsonResponse({'message': 'JWT token not found'}, status=status.HTTP_401_UNAUTHORIZED)
        try:
            payload = jwt.decode(jwt_token, settings.JWT_SECRET_KEY, algorithms=['HS256'])
        except jwt.ExpiredSignatureError:
            return JsonResponse({'message': 'Token is expired'}, status=status.HTTP_401_UNAUTHORIZED)
        user = Users.objects.get(email=payload.get('user_email'))
        if not user:
            return JsonResponse({'message': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        else:
            return JsonResponse({
                'user_name': user.user_name
            }, status=status.HTTP_200_OK)

def send_and_save_verification_code(user):
    RANDOM_STRING_CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    verification_code = get_random_string(length=6, allowed_chars=RANDOM_STRING_CHARS)
    user.verification_code = verification_code
    user.save()

    mail_subject = "0x-1f 이메일 인증 코드입니다."
    message = f'당신의 인증 코드는 {verification_code} 입니다.'
    send_mail(mail_subject, message, 'moon@mooncloud.kr', [user.email])

def create_jwt_token(user: Users, secret_key, expire_seconds:int):
    try:
        payload = {
            'user_email': user.email,
            'exp': datetime.utcnow() + timedelta(seconds=expire_seconds),
        }
        token = jwt.encode(payload, secret_key, algorithm='HS256')
        token = token.decode('utf-8') if isinstance(token, bytes) else token
        return token
    except Exception as e:
        raise Exception(f"[{e.__class__.__name__}] {str(e)}")
