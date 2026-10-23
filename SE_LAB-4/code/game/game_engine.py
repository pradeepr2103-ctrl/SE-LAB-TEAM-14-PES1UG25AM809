import random
import pygame
from game.text_box import TextBox

MAX_ATTEMPTS = 7


class GameEngine:
    def __init__(self, width, height):
        self.width = width
        self.height = height
        self.secret_number = random.randint(1, 100)
        self.attempts = 0
        self.feedback_msg = "Enter a number between 1 and 100"
        self.feedback_color = (220, 220, 220)
        self.game_won = False
        self.game_over = False
        self.low_bound = 1
        self.high_bound = 100
        self.history = []  # (guess, 'LOW' / 'HIGH' / 'CORRECT')

        self.input_box = TextBox(width // 2 - 110, 150, 120, 48)
        self.submit_btn = pygame.Rect(width // 2 + 25, 150, 100, 48)

        self.font_title = pygame.font.SysFont(None, 42)
        self.font_medium = pygame.font.SysFont(None, 28)
        self.font_btn = pygame.font.SysFont(None, 26)
        self.font_small = pygame.font.SysFont(None, 22)

    def submit_guess(self):
        if self.game_won or self.game_over:
            return
            
        text = self.input_box.text.strip()
        if not text:
            self.feedback_msg = "Please enter a number first!"
            self.feedback_color = (240, 200, 80)
            return

        guess = int(text)
        if guess < 1 or guess > 100:
            self.feedback_msg = "Number must be between 1 and 100"
            self.feedback_color = (240, 200, 80)
            self.input_box.clear()
            return

        self.attempts += 1
        self.input_box.clear()

        if guess < self.secret_number:
            self.feedback_msg = f"TOO LOW! (Guess was {guess})"
            self.feedback_color = (80, 160, 240)
            self.low_bound = max(self.low_bound, guess + 1)
            self.history.append((guess, "LOW"))
        elif guess > self.secret_number:
            self.feedback_msg = f"TOO HIGH! (Guess was {guess})"
            self.feedback_color = (240, 100, 80)
            self.high_bound = min(self.high_bound, guess - 1)
            self.history.append((guess, "HIGH"))
        else:
            self.feedback_msg = f"CORRECT! Found in {self.attempts} attempts."
            self.feedback_color = (80, 220, 90)
            self.game_won = True
            self.history.append((guess, "CORRECT"))

        if not self.game_won and self.attempts >= MAX_ATTEMPTS:
            self.game_over = True
            self.feedback_msg = f"GAME OVER! Out of attempts ({MAX_ATTEMPTS})"
            self.feedback_color = (240, 100, 80)

    def reset(self):
        self.secret_number = random.randint(1, 100)
        self.attempts = 0
        self.feedback_msg = "Enter a number between 1 and 100"
        self.feedback_color = (220, 220, 220)
        self.game_won = False
        self.game_over = False
        self.low_bound = 1
        self.high_bound = 100
        self.history = []
        self.input_box.clear()

    def handle_event(self, event):
        self.input_box.handle_event(event)

        if event.type == pygame.KEYDOWN:
            if event.key == pygame.K_RETURN:
                self.submit_guess()
            elif event.key == pygame.K_r and (self.game_won or self.game_over):
                self.reset()

        elif event.type == pygame.MOUSEBUTTONDOWN and event.button == 1:
            if self.submit_btn.collidepoint(event.pos):
                self.submit_guess()

    def update(self):
        pass

    def render(self, screen):
        screen.fill((30, 34, 42))

        title_surf = self.font_title.render("Number Guessing Arena", True, (245, 245, 245))
        screen.blit(title_surf, (self.width // 2 - title_surf.get_width() // 2, 35))

        attempts_surf = self.font_medium.render(f"Attempts: {self.attempts}/{MAX_ATTEMPTS}", True, (180, 185, 195))
        screen.blit(attempts_surf, (self.width // 2 - attempts_surf.get_width() // 2, 80))

        range_surf = self.font_medium.render(
            f"Current Possible Range: {self.low_bound} - {self.high_bound}", True, (120, 190, 255))
        screen.blit(range_surf, (self.width // 2 - range_surf.get_width() // 2, 112))

        self.input_box.render(screen)

        pygame.draw.rect(screen, (50, 150, 80), self.submit_btn, border_radius=6)
        pygame.draw.rect(screen, (220, 220, 220), self.submit_btn, width=2, border_radius=6)
        btn_text = self.font_btn.render("SUBMIT", True, (255, 255, 255))
        screen.blit(
            btn_text,
            (self.submit_btn.centerx - btn_text.get_width() // 2, self.submit_btn.centery - btn_text.get_height() // 2),
        )

        feedback_surf = self.font_medium.render(self.feedback_msg, True, self.feedback_color)
        screen.blit(feedback_surf, (self.width // 2 - feedback_surf.get_width() // 2, 210))

        self.draw_history(screen)

        if self.game_won:
            restart_surf = self.font_small.render("Press [R] to Start a New Game", True, (255, 220, 80))
            screen.blit(restart_surf, (355, 300))

    def draw_history(self, screen):
        panel = pygame.Rect(30, 245, 300, 125)
        pygame.draw.rect(screen, (42, 47, 60), panel, border_radius=8)
        head = self.font_small.render("Last 5 guesses", True, (180, 185, 195))
        screen.blit(head, (panel.x + 12, panel.y + 6))
        for i, (g, res) in enumerate(reversed(self.history[-5:])):
            y = panel.y + 28 + i * 18
            screen.blit(self.font_small.render(f"{g:>3}", True, (230, 230, 230)), (panel.x + 12, y))
            x = panel.x + 60
            if res == "LOW":
                color, tag = (80, 160, 240), "TOO LOW"
                pygame.draw.polygon(screen, color, [(x, y + 12), (x + 16, y + 12), (x + 8, y)])
            elif res == "HIGH":
                color, tag = (240, 100, 80), "TOO HIGH"
                pygame.draw.polygon(screen, color, [(x, y), (x + 16, y), (x + 8, y + 12)])
            else:
                color, tag = (80, 220, 90), "CORRECT"
                pygame.draw.lines(screen, color, False, [(x, y + 7), (x + 5, y + 12), (x + 16, y)], 3)
            screen.blit(self.font_small.render(tag, True, color), (x + 28, y))

        if self.game_over:
            self.draw_game_over(screen)

    def draw_game_over(self, screen):
        overlay = pygame.Surface((self.width, self.height), pygame.SRCALPHA)
        overlay.fill((0, 0, 0, 200))
        screen.blit(overlay, (0, 0))
        lines = [
            (self.font_title, "GAME OVER", (240, 100, 80)),
            (self.font_medium, f"The secret number was {self.secret_number}", (245, 245, 245)),
            (self.font_medium, "Press [R] to try again", (255, 220, 80)),
        ]
        y = self.height // 2 - 70
        for font, text, color in lines:
            surf = font.render(text, True, color)
            screen.blit(surf, (self.width // 2 - surf.get_width() // 2, y))
            y += 50
