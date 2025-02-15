from rest_framework import serializers
from user.models import Users
from .models import PongGame, RPSGame

class PongSerializer(serializers.ModelSerializer):
    # player1_name = serializers.CharField(source='player1.user_name')
    # player2_name = serializers.CharField(source='player2.user_name')

    class Meta:
        model = PongGame
        fields = '__all__'

class PongSerializerHistory(serializers.ModelSerializer):
    # winner = serializers.CharField(source='winner.intra_id')
    # loser = serializers.CharField(source='loser.intra_id')
    date = serializers.DateTimeField(source='created_date', format="%Y-%m-%d", read_only=True)
    opponent_id = serializers.SerializerMethodField()
    opponent_name = serializers.SerializerMethodField()
    opponent_score = serializers.SerializerMethodField()
    your_score = serializers.SerializerMethodField()

    # result = serializers.SerializerMethodField()

    class Meta:
        model = PongGame
        fields = ['pong_id', 'date', 'opponent_name', 'opponent_id', 'your_score', 'opponent_score']

    def get_opponent_id(self, obj):
        user_id = self.get_user_id()
        if obj.player1_id == user_id:
            return obj.player2_id if obj.player2 else None
        elif obj.player2_id == user_id:
            return obj.player1_id if obj.player1 else None
        return None

    def get_opponent_name(self, obj):
        user_id = self.get_user_id()
        if obj.player1_id == user_id:
            return obj.player2_name if obj.player2_name else None
        elif obj.player2_id == user_id:
            return obj.player1_name if obj.player1_name else None
        return None

    def get_opponent_score(self, obj):
        user_id = self.get_user_id()
        if obj.player1_id == user_id:
            return obj.player2_score if obj.player2_score else None
        elif obj.player2_id == user_id:
            return obj.player1_score if obj.player1_score else None
        return None
    
    def get_your_score(self, obj):
        user_id = self.get_user_id()
        if obj.player1_id == user_id:
            return obj.player1_score if obj.player1_score else None
        elif obj.player2_id == user_id:
            return obj.player2_score if obj.player2_score else None
        return None

    def get_user_id(self):
        request = self.context.get('request')
        path = request.path
        parts = path.split('/')

        user_id = parts[parts.index('pong') + 1]
        return int(user_id)


class RPSSerializer(serializers.ModelSerializer):
    # player1_name = serializers.CharField(source='player1.user_name')
    # player2_name = serializers.CharField(source='player2.user_name')

    class Meta:
        model = RPSGame
        fields = '__all__'

class RPSSerializerHistory(serializers.ModelSerializer):
    date = serializers.DateTimeField(source='created_date', format="%Y-%m-%d", read_only=True)
    opponent_id = serializers.SerializerMethodField()
    opponent_name = serializers.SerializerMethodField()
    opponent_choice = serializers.SerializerMethodField()
    your_choice = serializers.SerializerMethodField()

    class Meta:
        model = RPSGame
        fields = ['rps_id', 'date', 'rematch', 'opponent_name', 'opponent_id', 'your_choice', 'opponent_choice']

    def get_opponent_id(self, obj):
        user_id = self.get_user_id()
        if obj.player1_id == user_id:
            return obj.player2_id if obj.player2 else None
        elif obj.player2_id == user_id:
            return obj.player1_id if obj.player1 else None
        return None

    def get_opponent_name(self, obj):
        user_id = self.get_user_id()
        if obj.player1_id == user_id:
            return obj.player2_name if obj.player2_name else None
        elif obj.player2_id == user_id:
            return obj.player1_name if obj.player1_name else None
        return None

    def get_opponent_choice(self, obj):
        user_id = self.get_user_id()
        if obj.player1_id == user_id:
            return obj.player2_choice if obj.player2_choice else None
        elif obj.player2_id == user_id:
            return obj.player1_choice if obj.player1_choice else None
        return None
    
    def get_your_choice(self, obj):
        user_id = self.get_user_id()
        if obj.player1_id == user_id:
            return obj.player1_choice if obj.player1_choice else None
        elif obj.player2_id == user_id:
            return obj.player2_choice if obj.player2_choice else None
        return None

    # def get_result(self, obj):
    #     intra_id = self.get_intra_id()
    #     if obj.winner.intra_id == intra_id:
    #         return "Win"
    #     return "Lose"

    def get_user_id(self):
        request = self.context.get('request')
        path = request.path
        parts = path.split('/')

        user_id = parts[parts.index('rps') + 1]
        return int(user_id)
    
    