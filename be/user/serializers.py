from rest_framework import serializers

from .models import Users

# class UserStatisticsSerializer(serializers.ModelSerializer):
# 	class Meta:
# 		model = UserStatistics
# 		fields = '__all__'

class UsersSerializer(serializers.ModelSerializer):
	class Meta:
		model = Users
		fields = '__all__'
