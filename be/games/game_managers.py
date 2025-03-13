import asyncio
import math
from asgiref.sync import sync_to_async
from .models import PongGame, RPSGame
from user.models import Users
fps = 60

class PongGameManager:
	def __init__(self):
		self.players_connection = {
			"player1": "off",
			"player2": "off",
		}
		self.players_user_id = {
			"player1": "",
			"player2": "",
		}
		self.scores = [0, 0]
		self.canvas_width = 800
		self.canvas_height = 600

		self.paddle_width = 12
		self.paddle_height = 8 * self.paddle_width
		self.paddle_positions = {
			"player1": (self.canvas_height - self.paddle_height) / 2,
			"player2": (self.canvas_height - self.paddle_height) / 2
			}
		self.paddle_pre_positions = {
			"player1": (self.canvas_height - self.paddle_height) / 2,
			"player2": (self.canvas_height - self.paddle_height) / 2
		}
		self.paddle_speed = 10
		self.ball_width = self.paddle_width
		self.ball_x = (self.canvas_width - self.ball_width) / 2
		self.ball_y = (self.canvas_height - self.ball_width) / 2
		self.ball_pre_x = 0
		self.ball_pre_y = 0
		self.ball_speed = 10
		self.ball_vx = 5 
		self.ball_vy = 0

		self.win_condition = 10
		self.status = "waiting"
		self.connection = ""

	async def update_game_state(self):
		left_paddle_line = 4 * self.paddle_width
		write_paddle_line = self.canvas_width - 4 * self.paddle_width
		max_angle = math.pi * 8 / 16
		while self.check_end() == False:
			if self.check_connection() == False: # 두 플레이어 모두 지속적으로 online 상태인지 확인
				# await asyncio.sleep(1)
				break
			self.ball_pre_x = self.ball_x
			self.ball_pre_y = self.ball_y
			self.ball_x += self.ball_vx  # 볼 스피드만큼 움직임
			self.ball_y += self.ball_vy  # 볼 스피드만큼 움직임

			# if 0 < self.ball_vy:
			# 	ball_y_sign = 1
			# else:
			# 	ball_y_sign = -1
				
			# 천장 충돌-
			if self.ball_y <= 0:
				self.ball_vy *= -1
				self.ball_y *= -1

			# 바닥 충돌
			if self.canvas_height <= self.ball_y + self.ball_width:
				self.ball_vy *= -1
				self.ball_y -= 2 * (self.ball_y + self.ball_width - self.canvas_height)

			# 왼쪽 패들에 충돌
			if 2 * self.paddle_width < self.ball_x and self.ball_x <= 4 * self.paddle_width:  # 패들과 공의 x 좌표의 겹침
				# print("왼쪽패들 x 좌표 겹침")
				if self.paddle_positions["player1"] < self.ball_y + self.ball_width and self.paddle_positions["player1"] + self.paddle_height > self.ball_y:  # 패들과 공의 y 좌표의 겹침
					# print("왼쪽패들 y 좌표 겹침")
					dt = (self.ball_x - left_paddle_line) / self.ball_vx
					interpolated_y = self.ball_y - self.ball_vy * dt
					interpolated_h = self.paddle_positions["player1"] - (self.paddle_positions["player1"] - self.paddle_pre_positions["player1"]) * dt
					if interpolated_h < interpolated_y + self.ball_width and interpolated_y < interpolated_h + self.paddle_height: # 패들 옆으로의 충돌
						angle = max_angle * ((interpolated_y + (self.ball_width / 2)) - (interpolated_h + (self.paddle_height / 2))) / (4.5 * self.paddle_width)
						self.ball_vx = self.ball_speed * math.cos(angle)
						self.ball_vy = self.ball_speed * math.sin(angle)
						self.ball_x = left_paddle_line + self.ball_vx * dt
						self.ball_y = interpolated_y + self.ball_vy * dt
					elif 0 < self.ball_vy: # 패들 위쪽으로 충돌
						self.ball_vy *= -1
						self.ball_y = self.paddle_positions["player1"] - self.ball_width
					elif self.ball_vy < 0: # 패들 밑면으로 충돌
						self.ball_vy *= -1
						self.ball_y = self.paddle_positions["player1"] + self.paddle_height

			# 오른쪽 패들에 충돌
			if self.canvas_width - 5 * self.paddle_width < self.ball_x and self.ball_x < self.canvas_width - 3 * self.paddle_width:
				# print("오른쪽패들 x 좌표 겹침")
				if self.paddle_positions["player2"] < self.ball_y + self.ball_width and self.paddle_positions["player2"] + self.paddle_height > self.ball_y:  # 패들과 공의 y 좌표의 겹침
					# print("오른쪽패들 y 좌표 겹침")
					dt = ((self.ball_x + self.ball_width) - write_paddle_line) / self.ball_vx
					interpolated_y = self.ball_y - self.ball_vy * dt
					interpolated_h = self.paddle_positions["player2"] - (self.paddle_positions["player2"] - self.paddle_pre_positions["player2"]) * dt
					if interpolated_h < interpolated_y + self.ball_width and interpolated_y < interpolated_h + self.paddle_height: # 패들 옆으로의 충돌
						angle = max_angle * ((interpolated_y + (self.ball_width / 2)) - (interpolated_h + (self.paddle_height / 2))) / (4.5 * self.paddle_width)
						self.ball_vx = self.ball_speed * math.cos(angle + math.pi)
						self.ball_vy = self.ball_speed * math.sin(angle)
						self.ball_x = write_paddle_line - self.ball_width + self.ball_vx * dt
						self.ball_y = interpolated_y + self.ball_vy * dt
					elif 0 < self.ball_vy: # 패들 위쪽으로 충돌
						self.ball_vy *= -1
						self.ball_y = self.paddle_positions["player2"] - self.ball_width
					elif self.ball_vy < 0: # 패들 밑면으로 충돌
						self.ball_vy *= -1
						self.ball_y = self.paddle_positions["player2"] + self.paddle_height
				
			# player 1 득점
			if self.ball_x + self.ball_width < 0:
				self.scores[1] += 1
				self.ball_x = (self.canvas_width - self.ball_width) / 2
				self.ball_y = (self.canvas_height - self.ball_width) / 2
				self.ball_pre_x = (self.canvas_width - self.ball_width) / 2
				self.ball_pre_y = (self.canvas_height - self.ball_width) / 2
				self.ball_vx = -5 
				self.ball_vy = 0
			# player 2 득점
			if self.canvas_width < self.ball_x:
				self.scores[0] += 1
				self.ball_x = (self.canvas_width - self.ball_width) / 2
				self.ball_y = (self.canvas_height - self.ball_width) / 2
				self.ball_pre_x = (self.canvas_width - self.ball_width) / 2
				self.ball_pre_y = (self.canvas_height - self.ball_width) / 2
				self.ball_vx = 5 
				self.ball_vy = 0

			await asyncio.sleep(1/fps)
		await self.finish_game() # 게임 종료조건시 게임 종료 및 저장 함수 콜

	def check_end(self):  # 둘중 한명이 이기는 조건의 점수에 도달했는지 확인
		if self.scores[0] < self.win_condition and self.scores[1] < self.win_condition:
			return False
		else:
			return True

	def check_connection(self): # 둘중 한명이라도 offline 되면 disconnected 판정
		if self.players_connection["player1"] == "off" or self.players_connection["player2"] == "off":
			self.connection = "disconnected"
			return False
		else:
			return True

	async def change_status(self, new_status): # 밖에서 status 바꾸기 요청하기 위한 함수
		async with asyncio.Lock():
			self.status = new_status

	def move_paddle(self, player, direction):  # player의 패들 이동 계산
		self.paddle_pre_positions[player] = self.paddle_positions[player]
		if direction == "up":
			self.paddle_positions[player] = max(0, self.paddle_positions[player] - self.paddle_speed)
		elif direction == "down":
			self.paddle_positions[player] = min(self.canvas_height - self.paddle_height, self.paddle_positions[player] + self.paddle_speed)

	def get_state(self): # 각 좌표, 점수, 상태 보내기
		if self.connection == "disconnected" and self.status == "saved":
			return {
				"ball_x": self.ball_x,
				"ball_y": self.ball_y,
				"left_paddle": self.paddle_positions["player1"],
				"right_paddle": self.paddle_positions["player2"],
				"left_score": self.scores[0],
				"right_score": self.scores[1],
				"status": "disconnected",
			}
		else:
			return {
				"ball_x": self.ball_x,
				"ball_y": self.ball_y,
				"left_paddle": self.paddle_positions["player1"],
				"right_paddle": self.paddle_positions["player2"],
				"left_score": self.scores[0],
				"right_score": self.scores[1],
				"status": self.status,
			}

	def start_game_loop(self): # 게임 루프 시작 함수
		self.status = "playing"
		self.connection = "connected"
		asyncio.create_task(self.update_game_state())

	async def finish_game(self): # 게임 종료및 결과 저장 함수
		print("pong finished")
		self.status = "saving"
		if self.connection == "disconnected": # 한명이 나가게 되면 10 대 0 부전승 처리
			self.scores[0] = 0
			self.scores[1] = 0
			if self.players_connection["player1"] == "on":
				self.scores[0] = self.win_condition
			elif self.players_connection["player2"] == "on":
				self.scores[1] = self.win_condition
			status = "disconnected"
		else:
			status = "finished"

		player1 = await sync_to_async(Users.objects.get)(user_id=self.players_user_id["player1"])  # 데이터베이스에 저장하기 위해 users 객체 가져오기
		player2 = await sync_to_async(Users.objects.get)(user_id=self.players_user_id["player2"])  # 데이터베이스에 저장하기 위해 users 객체 가져오기

		game = await sync_to_async(PongGame.objects.create)(  # 데이터 베이스에 저장하기 위해 ponggame 객체 가져오기
			status=status,
			player1=player1,
			player2=player2,
			player1_name=player1.user_name,
			player2_name=player2.user_name,
			player1_score=self.scores[0],
			player2_score=self.scores[1],
			)
		
		if self.scores[0] > self.scores[1]:
			player1.pong_win += 1
			player2.pong_lose += 1
		else:
			player1.pong_lose += 1
			player2.pong_win += 1

		await sync_to_async(player1.save)()  # player1 의 user 데이터 저장
		await sync_to_async(player2.save)()  # player2 의 user 데이터 저장
		await sync_to_async(game.save)()  # PongGame 데이터 저장
		self.status = "saved"


class RPSGameManager:
	def __init__(self):
		self.connection = {}
		self.user_id = {}
		self.choice = {}
		self.result = {}
		self.status = "waiting"
		self.rematch = False

	async def save_choice(self, player, choice):  # 플레이어의 선택 저장
		async with asyncio.Lock():
			self.choice[player] = choice
			length = len(self.choice)
		if length == 2:
			await self.calculate_result()
			await self.change_status("saving")
			await self.finish_game()

	async def is_rematch(self):
		async with asyncio.Lock():
			self.rematch = True

	async def get_status(self):  # status 불러오기 함수
		async with asyncio.Lock():
			return self.status

	async def get_data(self):  # data 불러오기 함수
		async with asyncio.Lock():
			return {
				"status": self.status,
				"result": self.result,
				"choice": self.choice,
			}

	async def change_status(self, new_status): # 밖에서 status 바꾸기 요청하기 위한 함수
		async with asyncio.Lock():
			self.status = new_status

	async def calculate_result(self):  # 경기 결과 계산
		self.result["player1"] = "win"
		self.result["player2"] = "lose"
		if self.choice["player1"] == self.choice["player2"]:
			self.result["player1"] = "draw"
			self.result["player2"] = "draw"
		elif self.choice["player1"] == "rock" and self.choice["player2"] == "paper":
			self.result["player1"] = "lose"
			self.result["player2"] = "win"
		elif self.choice["player1"] == "paper" and self.choice["player2"] == "scissors":
			self.result["player1"] = "lose"
			self.result["player2"] = "win"
		elif self.choice["player1"] == "scissors" and self.choice["player2"] == "rock":
			self.result["player1"] = "lose"
			self.result["player2"] = "win"

	async def finish_game(self):  # 경기 끝내고 결과 저장하기
		player1 = await sync_to_async(Users.objects.get)(user_id=self.user_id["player1"])  # 플레이어 유저객체 가져오기
		player2 = await sync_to_async(Users.objects.get)(user_id=self.user_id["player2"])  # 플레이어 유저객체 가져오기

		# result = f"player1 {self.result['player1']}, player2 {self.result['player2']}"

		game = await sync_to_async(RPSGame.objects.create)(  # 가위바위보 객체 가저오기
			status="finished",
			# result=result,
			rematch=self.rematch,
			player1= player1,
			player2= player2,
			player1_name=player1.user_name,
			player2_name=player2.user_name,
			player1_choice = self.choice["player1"],
			player2_choice = self.choice["player2"]
			)

		if self.result["player1"] == "win":
			player1.rps_win += 1
			player2.rps_lose += 1
		elif self.result["player1"] == "lose":
			player1.rps_lose += 1
			player2.rps_win += 1
		elif self.result["player1"] == "draw":
			player1.rps_draw += 1
			player2.rps_draw += 1

		await sync_to_async(player1.save)()  # 플레이어의 유저객체 저장
		await sync_to_async(player2.save)()  # 플레이어의 유저객체 저장
		await sync_to_async(game.save)()  # 가위바위보 객체 저장
		await self.change_status("saved")
