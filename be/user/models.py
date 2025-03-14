from django.db import models
from django.utils.timezone import now

class Users(models.Model):
	user_id = models.AutoField(primary_key=True)
	user_name = models.CharField(max_length=255, default="")
	email = models.CharField(max_length=255, unique=True)
	# verification_code = models.CharField(max_length=6, default="")
	# jwt_token = models.CharField(max_length=255, default="")
	# refresh_token = models.CharField(max_length=255, default="")
	access_token = models.CharField(max_length=255, default="")
	register_date = models.DateTimeField(default=now)
	# last_login = models.DateTimeField(null=True, blank=True)
	pong_win = models.PositiveIntegerField(default=0)
	pong_lose = models.PositiveIntegerField(default=0)
	# tournament_win = models.PositiveIntegerField(default=0)
	rps_win = models.PositiveIntegerField(default=0)
	rps_lose = models.PositiveIntegerField(default=0)
	rps_draw = models.PositiveIntegerField(default=0)

	def __str__(self):
		return f"User {self.user_name}({self.user_id})"

# class UserStatistics(models.Model):
# 	user_id=models.OneToOneField(Users, on_delete=models.CASCADE, related_name="userstatistics")
# 	pong_win = models.PositiveIntegerField(default=0)
# 	pong_lose = models.PositiveIntegerField(default=0)
# 	rps_win = models.PositiveIntegerField(default=0)
# 	rps_lose = models.PositiveIntegerField(default=0)
# 	rps_draw = models.PositiveIntegerField(default=0)
