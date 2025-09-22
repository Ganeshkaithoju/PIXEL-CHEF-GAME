import pygame
import random
import sys
from enum import Enum
from dataclasses import dataclass
from typing import List, Tuple, Dict
import json

# Initialize Pygame
pygame.init()

# Constants
SCREEN_WIDTH = 800
SCREEN_HEIGHT = 600
FPS = 60

# Colors
WHITE = (255, 255, 255)
BLACK = (0, 0, 0)
RED = (255, 0, 0)
GREEN = (0, 255, 0)
BLUE = (0, 0, 255)
YELLOW = (255, 255, 0)
ORANGE = (255, 165, 0)
PURPLE = (128, 0, 128)
GRAY = (128, 128, 128)
DARK_GREEN = (0, 128, 0)

class ObjectType(Enum):
    """Enumeration for different types of falling objects"""
    CORRECT_INGREDIENT = "correct"
    WRONG_INGREDIENT = "wrong"
    HAZARD = "hazard"
    MAGNET_POWERUP = "magnet"
    SLOWMO_POWERUP = "slowmo"

@dataclass
class Recipe:
    """Data class representing a recipe with required ingredients"""
    name: str
    ingredients: List[str]
    points_per_ingredient: int
    time_limit: int

class FallingObject:
    """Class representing objects falling from the top of the screen"""
    
    def __init__(self, x: int, y: int, obj_type: ObjectType, name: str, color: Tuple[int, int, int]):
        self.x = x
        self.y = y
        self.obj_type = obj_type
        self.name = name
        self.color = color
        self.width = 30
        self.height = 30
        self.speed = random.randint(2, 5)
        self.rect = pygame.Rect(x, y, self.width, self.height)
    
    def update(self, slow_motion_active: bool = False):
        """Update object position based on falling speed"""
        speed_modifier = 0.3 if slow_motion_active else 1.0
        self.y += self.speed * speed_modifier
        self.rect.y = self.y
    
    def draw(self, screen: pygame.Surface, font: pygame.font.Font):
        """Draw the falling object on screen"""
        pygame.draw.rect(screen, self.color, self.rect)
        pygame.draw.rect(screen, BLACK, self.rect, 2)
        
        # Draw text label
        text = font.render(self.name[:4], True, BLACK)
        text_rect = text.get_rect(center=self.rect.center)
        screen.blit(text, text_rect)

class Chef:
    """Class representing the player-controlled chef"""
    
    def __init__(self, x: int, y: int):
        self.x = x
        self.y = y
        self.width = 60
        self.height = 40
        self.speed = 8
        self.rect = pygame.Rect(x, y, self.width, self.height)
        self.magnet_active = False
        self.magnet_timer = 0
    
    def update(self, keys_pressed: Dict):
        """Update chef position based on keyboard input"""
        if keys_pressed[pygame.K_LEFT] and self.x > 0:
            self.x -= self.speed
        if keys_pressed[pygame.K_RIGHT] and self.x < SCREEN_WIDTH - self.width:
            self.x += self.speed
        
        self.rect.x = self.x
        
        # Update magnet timer
        if self.magnet_timer > 0:
            self.magnet_timer -= 1
            if self.magnet_timer <= 0:
                self.magnet_active = False
    
    def draw(self, screen: pygame.Surface):
        """Draw the chef on screen"""
        # Chef body
        pygame.draw.rect(screen, WHITE, self.rect)
        pygame.draw.rect(screen, BLACK, self.rect, 2)
        
        # Chef hat
        hat_rect = pygame.Rect(self.x + 10, self.y - 15, 40, 20)
        pygame.draw.rect(screen, WHITE, hat_rect)
        pygame.draw.rect(screen, BLACK, hat_rect, 2)
        
        # Magnet effect
        if self.magnet_active:
            pygame.draw.circle(screen, BLUE, self.rect.center, 80, 3)
    
    def activate_magnet(self, duration: int = 300):
        """Activate magnet power-up"""
        self.magnet_active = True
        self.magnet_timer = duration

class GameState:
    """Class managing the overall game state"""
    
    def __init__(self):
        self.score = 0
        self.health = 100
        self.max_health = 100
        self.high_score = 0
        self.current_recipe_index = 0
        self.recipe_progress = {}
        self.slow_motion_active = False
        self.slow_motion_timer = 0
        self.game_over = False
        self.recipe_completed = False
        
        # Define recipes
        self.recipes = [
            Recipe("Pizza", ["tomato", "cheese", "dough"], 10, 30),
            Recipe("Burger", ["bun", "patty", "lettuce"], 15, 25),
            Recipe("Salad", ["lettuce", "tomato", "carrot"], 12, 35),
            Recipe("Pasta", ["noodles", "sauce", "cheese"], 18, 28),
            Recipe("Soup", ["broth", "carrot", "celery"], 14, 32)
        ]
        
        # Initialize recipe progress
        self.reset_recipe_progress()
    
    def reset_recipe_progress(self):
        """Reset progress for current recipe"""
        if self.current_recipe_index < len(self.recipes):
            current_recipe = self.recipes[self.current_recipe_index]
            self.recipe_progress = {ingredient: 0 for ingredient in current_recipe.ingredients}
    
    def get_current_recipe(self) -> Recipe:
        """Get the current recipe"""
        if self.current_recipe_index < len(self.recipes):
            return self.recipes[self.current_recipe_index]
        return None
    
    def add_ingredient(self, ingredient: str) -> int:
        """Add ingredient to current recipe and return points earned"""
        current_recipe = self.get_current_recipe()
        if current_recipe and ingredient in self.recipe_progress:
            if self.recipe_progress[ingredient] < 3:  # Need 3 of each ingredient
                self.recipe_progress[ingredient] += 1
                points = current_recipe.points_per_ingredient
                self.score += points
                return points
        return 0
    
    def is_recipe_complete(self) -> bool:
        """Check if current recipe is complete"""
        return all(count >= 3 for count in self.recipe_progress.values())
    
    def advance_recipe(self):
        """Advance to next recipe"""
        self.current_recipe_index += 1
        if self.current_recipe_index < len(self.recipes):
            self.reset_recipe_progress()
            self.recipe_completed = True
        else:
            self.game_over = True
    
    def take_damage(self, damage: int = 20):
        """Reduce health and check for game over"""
        self.health -= damage
        if self.health <= 0:
            self.health = 0
            self.game_over = True
    
    def activate_slow_motion(self, duration: int = 180):
        """Activate slow motion power-up"""
        self.slow_motion_active = True
        self.slow_motion_timer = duration
    
    def update(self):
        """Update game state timers"""
        if self.slow_motion_timer > 0:
            self.slow_motion_timer -= 1
            if self.slow_motion_timer <= 0:
                self.slow_motion_active = False

class Game:
    """Main game class handling all game logic"""
    
    def __init__(self):
        self.screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
        pygame.display.set_caption("Pixel Chef: Kitchen Rush")
        self.clock = pygame.time.Clock()
        
        # Initialize fonts
        self.font_small = pygame.font.Font(None, 24)
        self.font_medium = pygame.font.Font(None, 36)
        self.font_large = pygame.font.Font(None, 48)
        
        # Initialize game objects
        self.chef = Chef(SCREEN_WIDTH // 2 - 30, SCREEN_HEIGHT - 60)
        self.game_state = GameState()
        self.falling_objects: List[FallingObject] = []
        
        # Timing variables
        self.spawn_timer = 0
        self.recipe_timer = 0
        self.max_recipe_time = 0
        
        # Initialize recipe timer
        self.start_recipe_timer()
    
    def start_recipe_timer(self):
        """Start timer for current recipe"""
        current_recipe = self.game_state.get_current_recipe()
        if current_recipe:
            self.max_recipe_time = current_recipe.time_limit * FPS
            self.recipe_timer = self.max_recipe_time
    
    def spawn_falling_object(self):
        """Spawn a new falling object"""
        x = random.randint(0, SCREEN_WIDTH - 30)
        y = -30
        
        # Determine object type and properties
        rand = random.random()
        current_recipe = self.game_state.get_current_recipe()
        
        if rand < 0.4 and current_recipe:  # 40% chance for correct ingredient
            ingredient = random.choice(current_recipe.ingredients)
            obj = FallingObject(x, y, ObjectType.CORRECT_INGREDIENT, ingredient, GREEN)
        elif rand < 0.65:  # 25% chance for wrong ingredient
            wrong_ingredients = ["rock", "trash", "bug", "dirt", "slime"]
            ingredient = random.choice(wrong_ingredients)
            obj = FallingObject(x, y, ObjectType.WRONG_INGREDIENT, ingredient, RED)
        elif rand < 0.8:  # 15% chance for hazard
            hazards = ["fire", "knife", "oil", "steam"]
            hazard = random.choice(hazards)
            obj = FallingObject(x, y, ObjectType.HAZARD, hazard, ORANGE)
        elif rand < 0.9:  # 10% chance for magnet power-up
            obj = FallingObject(x, y, ObjectType.MAGNET_POWERUP, "magnet", BLUE)
        else:  # 10% chance for slow-mo power-up
            obj = FallingObject(x, y, ObjectType.SLOWMO_POWERUP, "slow", PURPLE)
        
        self.falling_objects.append(obj)
    
    def update_falling_objects(self):
        """Update all falling objects"""
        for obj in self.falling_objects[:]:
            # Apply magnet effect
            if (self.chef.magnet_active and 
                obj.obj_type == ObjectType.CORRECT_INGREDIENT and
                abs(obj.x - self.chef.rect.centerx) < 100):
                # Pull object towards chef
                if obj.x < self.chef.rect.centerx:
                    obj.x += 3
                else:
                    obj.x -= 3
                obj.rect.x = obj.x
            
            obj.update(self.game_state.slow_motion_active)
            
            # Remove objects that have fallen off screen
            if obj.y > SCREEN_HEIGHT:
                self.falling_objects.remove(obj)
    
    def check_collisions(self):
        """Check for collisions between chef and falling objects"""
        for obj in self.falling_objects[:]:
            if self.chef.rect.colliderect(obj.rect):
                self.falling_objects.remove(obj)
                
                if obj.obj_type == ObjectType.CORRECT_INGREDIENT:
                    points = self.game_state.add_ingredient(obj.name)
                    if points > 0:
                        # Visual feedback for successful collection
                        pass
                
                elif obj.obj_type == ObjectType.WRONG_INGREDIENT:
                    self.game_state.take_damage(15)
                
                elif obj.obj_type == ObjectType.HAZARD:
                    self.game_state.take_damage(25)
                
                elif obj.obj_type == ObjectType.MAGNET_POWERUP:
                    self.chef.activate_magnet()
                
                elif obj.obj_type == ObjectType.SLOWMO_POWERUP:
                    self.game_state.activate_slow_motion()
    
    def draw_hud(self):
        """Draw the heads-up display"""
        # Score
        score_text = self.font_medium.render(f"Score: {self.game_state.score}", True, BLACK)
        self.screen.blit(score_text, (10, 10))
        
        # Health bar
        health_bar_width = 200
        health_bar_height = 20
        health_percentage = self.game_state.health / self.game_state.max_health
        
        # Health bar background
        health_bg_rect = pygame.Rect(10, 50, health_bar_width, health_bar_height)
        pygame.draw.rect(self.screen, RED, health_bg_rect)
        
        # Health bar fill
        health_fill_rect = pygame.Rect(10, 50, health_bar_width * health_percentage, health_bar_height)
        pygame.draw.rect(self.screen, GREEN, health_fill_rect)
        
        # Health bar border
        pygame.draw.rect(self.screen, BLACK, health_bg_rect, 2)
        
        # Health text
        health_text = self.font_small.render(f"Health: {self.game_state.health}/{self.game_state.max_health}", True, BLACK)
        self.screen.blit(health_text, (10, 75))
        
        # Timer
        time_left = max(0, self.recipe_timer // FPS)
        timer_text = self.font_medium.render(f"Time: {time_left}s", True, BLACK)
        self.screen.blit(timer_text, (SCREEN_WIDTH - 150, 10))
        
        # Power-up indicators
        y_offset = 100
        if self.chef.magnet_active:
            magnet_text = self.font_small.render("MAGNET ACTIVE", True, BLUE)
            self.screen.blit(magnet_text, (10, y_offset))
            y_offset += 25
        
        if self.game_state.slow_motion_active:
            slow_text = self.font_small.render("SLOW MOTION", True, PURPLE)
            self.screen.blit(slow_text, (10, y_offset))
    
    def draw_recipe_info(self):
        """Draw current recipe information"""
        current_recipe = self.game_state.get_current_recipe()
        if not current_recipe:
            return
        
        # Recipe name
        recipe_text = self.font_medium.render(f"Recipe: {current_recipe.name}", True, BLACK)
        self.screen.blit(recipe_text, (SCREEN_WIDTH // 2 - 100, 10))
        
        # Ingredients needed
        y_offset = 40
        for ingredient, collected in self.game_state.recipe_progress.items():
            color = DARK_GREEN if collected >= 3 else BLACK
            ingredient_text = self.font_small.render(f"{ingredient}: {collected}/3", True, color)
            self.screen.blit(ingredient_text, (SCREEN_WIDTH // 2 - 50, y_offset))
            y_offset += 20
    
    def draw_end_screen(self):
        """Draw game over screen"""
        # Semi-transparent overlay
        overlay = pygame.Surface((SCREEN_WIDTH, SCREEN_HEIGHT))
        overlay.set_alpha(128)
        overlay.fill(BLACK)
        self.screen.blit(overlay, (0, 0))
        
        # Game over text
        game_over_text = self.font_large.render("GAME OVER", True, WHITE)
        game_over_rect = game_over_text.get_rect(center=(SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2 - 100))
        self.screen.blit(game_over_text, game_over_rect)
        
        # Final score
        final_score_text = self.font_medium.render(f"Final Score: {self.game_state.score}", True, WHITE)
        final_score_rect = final_score_text.get_rect(center=(SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2 - 50))
        self.screen.blit(final_score_text, final_score_rect)
        
        # High score
        if self.game_state.score > self.game_state.high_score:
            self.game_state.high_score = self.game_state.score
        
        high_score_text = self.font_medium.render(f"High Score: {self.game_state.high_score}", True, WHITE)
        high_score_rect = high_score_text.get_rect(center=(SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2))
        self.screen.blit(high_score_text, high_score_rect)
        
        # Restart instruction
        restart_text = self.font_small.render("Press R to restart or ESC to quit", True, WHITE)
        restart_rect = restart_text.get_rect(center=(SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2 + 50))
        self.screen.blit(restart_text, restart_rect)
    
    def reset_game(self):
        """Reset game to initial state"""
        self.chef = Chef(SCREEN_WIDTH // 2 - 30, SCREEN_HEIGHT - 60)
        self.game_state = GameState()
        self.falling_objects.clear()
        self.spawn_timer = 0
        self.start_recipe_timer()
    
    def run(self):
        """Main game loop"""
        running = True
        
        while running:
            # Handle events
            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    running = False
                elif event.type == pygame.KEYDOWN:
                    if self.game_state.game_over:
                        if event.key == pygame.K_r:
                            self.reset_game()
                        elif event.key == pygame.K_ESCAPE:
                            running = False
            
            if not self.game_state.game_over:
                # Get pressed keys for continuous movement
                keys_pressed = pygame.key.get_pressed()
                
                # Update game objects
                self.chef.update(keys_pressed)
                self.game_state.update()
                self.update_falling_objects()
                self.check_collisions()
                
                # Spawn new objects
                self.spawn_timer += 1
                if self.spawn_timer >= 60:  # Spawn every second
                    self.spawn_falling_object()
                    self.spawn_timer = 0
                
                # Update recipe timer
                self.recipe_timer -= 1
                if self.recipe_timer <= 0:
                    self.game_state.take_damage(50)  # Time penalty
                    self.start_recipe_timer()
                
                # Check recipe completion
                if self.game_state.is_recipe_complete():
                    self.game_state.advance_recipe()
                    if not self.game_state.game_over:
                        self.start_recipe_timer()
            
            # Draw everything
            self.screen.fill(WHITE)
            
            if not self.game_state.game_over:
                # Draw game objects
                for obj in self.falling_objects:
                    obj.draw(self.screen, self.font_small)
                
                self.chef.draw(self.screen)
                self.draw_hud()
                self.draw_recipe_info()
                
                # Recipe completion message
                if self.game_state.recipe_completed:
                    complete_text = self.font_large.render("RECIPE COMPLETE!", True, GREEN)
                    complete_rect = complete_text.get_rect(center=(SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2))
                    self.screen.blit(complete_text, complete_rect)
                    
                    # Reset the flag after showing for a moment
                    pygame.time.wait(1000)
                    self.game_state.recipe_completed = False
            else:
                self.draw_end_screen()
            
            pygame.display.flip()
            self.clock.tick(FPS)
        
        pygame.quit()
        sys.exit()

# Run the game
if __name__ == "__main__":
    game = Game()
    game.run()
