from django.db import models
from user.models import Users
from django.utils.timezone import now

class PongGame(models.Model):
    pong_id = models.AutoField(primary_key=True)
    created_date = models.DateTimeField(default=now)
    status = models.CharField(max_length=255, default="")
    # type = models.CharField(max_length=255, default="")
    player1 = models.ForeignKey(Users, related_name='pong_player1', on_delete=models.SET_NULL, null=True, blank=True)
    player2 = models.ForeignKey(Users, related_name='pong_player2', on_delete=models.SET_NULL, null=True, blank=True)
    player1_name = models.CharField(max_length=255, default="")
    player2_name = models.CharField(max_length=255, default="")
    player1_score = models.PositiveIntegerField(null=True, blank=True)
    player2_score = models.PositiveIntegerField(null=True, blank=True)

    def __str__(self):
        return f"Game {self.pong_id} ({self.status})"

# class PongMapping(models.Model):
#     user_id = models.ForeignKey(Users, on_delete=models.CASCADE)
#     pong_id = models.ForeignKey(PongGame, on_delete=models.CASCADE)
#     score = models.PositiveIntegerField(null=True, blank=True)
    
#     class Meta:
#         unique_together = ("user_id", "pong_id")  # 동일 유저-게임 중복 방지

#     def __str__(self):
#         return f"User {self.user_id} - Game {self.pong_id} - Score {self.score}"

class RPSGame(models.Model):
    rps_id = models.AutoField(primary_key=True)
    created_date = models.DateTimeField(default=now)
    status = models.CharField(max_length=255, default="")
    # result = models.CharField(max_length=255, default="")
    rematch = models.BooleanField(default=False)
    player1 = models.ForeignKey(Users, related_name='rps_player1', on_delete=models.SET_NULL, null=True, blank=True)
    player2 = models.ForeignKey(Users, related_name='rps_player2', on_delete=models.SET_NULL, null=True, blank=True)
    player1_name = models.CharField(max_length=255, default="")
    player2_name = models.CharField(max_length=255, default="")
    player1_choice = models.CharField(max_length=255, default="")
    player2_choice = models.CharField(max_length=255, default="")

    def __str__(self):
        return f"Game {self.rps_id} ({self.status})"
    
# class RPSMapping(models.Model):
#     user_id = models.ForeignKey(Users, on_delete=models.CASCADE)
#     rps_id = models.ForeignKey(PongGame, on_delete=models.CASCADE)
#     choice = models.PositiveIntegerField(null=True, blank=True)

#     class Meta:
#         unique_together = ("user_id", "rps_id")  # 동일 유저-게임 중복 방지

#     def __str__(self):
#         return f"User {self.user_id} - Game {self.rps_id} - Score {self.choice}"