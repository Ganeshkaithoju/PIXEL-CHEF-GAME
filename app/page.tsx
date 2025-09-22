"use client"

import { useEffect, useRef, useState } from "react"

export default function PixelChefGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameRef = useRef<any>(null)
  const [gameStarted, setGameStarted] = useState(false)
  const [selectedTime, setSelectedTime] = useState(30)

  useEffect(() => {
    if (!gameStarted) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Game constants
    const CANVAS_WIDTH = 800
    const CANVAS_HEIGHT = 600
    const CHEF_WIDTH = 60
    const CHEF_HEIGHT = 80
    const OBJECT_SIZE = 30
    const CHEF_SPEED = 5
    const FALL_SPEED = 2

    let gameState = {
      chef: {
        x: CANVAS_WIDTH / 2 - CHEF_WIDTH / 2,
        y: CANVAS_HEIGHT - CHEF_HEIGHT - 10,
        animationState: "idle", // 'idle', 'catching'
        animationTimer: 0,
      },
      fallingObjects: [] as any[],
      score: 0,
      health: 100,
      currentRecipe: 0,
      recipeProgress: { tomato: 0, lettuce: 0, cheese: 0 },
      timeLeft: selectedTime,
      gameRunning: true,
      gameOver: false,
      powerUps: { magnet: 0, slowMotion: 0 },
      keys: { left: false, right: false },
    }

    const recipes = [
      { name: "Basic Salad", ingredients: { tomato: 3, lettuce: 3, cheese: 3 }, time: selectedTime },
      { name: "Veggie Burger", ingredients: { tomato: 4, lettuce: 4, cheese: 4 }, time: selectedTime },
      { name: "Deluxe Sandwich", ingredients: { tomato: 5, lettuce: 5, cheese: 5 }, time: selectedTime },
      { name: "Garden Special", ingredients: { tomato: 6, lettuce: 6, cheese: 6 }, time: selectedTime },
      { name: "Chef's Choice", ingredients: { tomato: 7, lettuce: 7, cheese: 7 }, time: selectedTime },
    ]

    // Object types
    const objectTypes = [
      { type: "tomato", color: "#FF6B6B", points: 10, isIngredient: true },
      { type: "lettuce", color: "#4ECDC4", points: 10, isIngredient: true },
      { type: "cheese", color: "#FFE66D", points: 10, isIngredient: true },
      { type: "bomb", color: "#FF4757", points: -20, isIngredient: false },
      { type: "rotten", color: "#8B4513", points: -10, isIngredient: false },
      { type: "magnet", color: "#A8E6CF", points: 0, isIngredient: false, isPowerUp: true },
      { type: "clock", color: "#DDA0DD", points: 0, isIngredient: false, isPowerUp: true },
    ]

    // Initialize game
    function initGame() {
      gameState.timeLeft = recipes[gameState.currentRecipe].time
      gameState.recipeProgress = { tomato: 0, lettuce: 0, cheese: 0 }
    }

    // Spawn falling objects
    function spawnObject() {
      if (Math.random() < 0.02) {
        // 2% chance per frame
        const objectType = objectTypes[Math.floor(Math.random() * objectTypes.length)]
        gameState.fallingObjects.push({
          x: Math.random() * (CANVAS_WIDTH - OBJECT_SIZE),
          y: -OBJECT_SIZE,
          type: objectType.type,
          color: objectType.color,
          points: objectType.points,
          isIngredient: objectType.isIngredient,
          isPowerUp: objectType.isPowerUp || false,
        })
      }
    }

    function drawChef(
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      animationState: string,
      animationTimer: number,
    ) {
      // Body
      ctx.fillStyle = "#FFFFFF"
      ctx.fillRect(x + 15, y + 30, 30, 40)

      // Head
      ctx.fillStyle = "#FFDBAC"
      ctx.beginPath()
      ctx.arc(x + 30, y + 20, 15, 0, Math.PI * 2)
      ctx.fill()

      // Chef hat
      ctx.fillStyle = "#FFFFFF"
      ctx.fillRect(x + 20, y + 5, 20, 15)
      ctx.fillRect(x + 25, y, 10, 10)

      // Eyes
      ctx.fillStyle = "#000000"
      ctx.fillRect(x + 25, y + 15, 2, 2)
      ctx.fillRect(x + 33, y + 15, 2, 2)

      // Arms - animate based on state
      ctx.fillStyle = "#FFDBAC"
      if (animationState === "catching") {
        // Arms raised up when catching
        ctx.fillRect(x + 5, y + 25, 15, 8) // Left arm up
        ctx.fillRect(x + 40, y + 25, 15, 8) // Right arm up
      } else {
        // Arms at sides when idle
        ctx.fillRect(x + 10, y + 35, 8, 15) // Left arm down
        ctx.fillRect(x + 42, y + 35, 8, 15) // Right arm down
      }

      // Legs
      ctx.fillStyle = "#000080"
      ctx.fillRect(x + 20, y + 70, 8, 10)
      ctx.fillRect(x + 32, y + 70, 8, 10)

      // Apron
      ctx.fillStyle = "#FF6B6B"
      ctx.fillRect(x + 18, y + 40, 24, 25)
    }

    function drawIngredient(ctx: CanvasRenderingContext2D, obj: any) {
      const centerX = obj.x + OBJECT_SIZE / 2
      const centerY = obj.y + OBJECT_SIZE / 2

      switch (obj.type) {
        case "tomato":
          // Draw realistic tomato - red circle with green stem
          ctx.fillStyle = "#FF4444"
          ctx.beginPath()
          ctx.arc(centerX, centerY + 2, 12, 0, Math.PI * 2)
          ctx.fill()

          // Tomato highlight
          ctx.fillStyle = "#FF6666"
          ctx.beginPath()
          ctx.arc(centerX - 3, centerY - 2, 4, 0, Math.PI * 2)
          ctx.fill()

          // Green stem
          ctx.fillStyle = "#228B22"
          ctx.fillRect(centerX - 2, obj.y + 2, 4, 6)
          ctx.fillRect(centerX - 4, obj.y + 2, 2, 3)
          ctx.fillRect(centerX + 2, obj.y + 2, 2, 3)
          break

        case "lettuce":
          // Draw realistic lettuce - layered green leaves
          ctx.fillStyle = "#32CD32"
          ctx.beginPath()
          ctx.arc(centerX, centerY, 10, 0, Math.PI * 2)
          ctx.fill()

          // Outer leaves
          ctx.fillStyle = "#228B22"
          for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI) / 3
            const leafX = centerX + Math.cos(angle) * 8
            const leafY = centerY + Math.sin(angle) * 8
            ctx.beginPath()
            ctx.arc(leafX, leafY, 6, 0, Math.PI * 2)
            ctx.fill()
          }

          // Inner core
          ctx.fillStyle = "#90EE90"
          ctx.beginPath()
          ctx.arc(centerX, centerY, 6, 0, Math.PI * 2)
          ctx.fill()
          break

        case "cheese":
          // Draw realistic cheese - yellow triangle wedge with holes
          ctx.fillStyle = "#FFD700"
          ctx.beginPath()
          ctx.moveTo(centerX - 10, centerY + 8)
          ctx.lineTo(centerX + 10, centerY + 8)
          ctx.lineTo(centerX, centerY - 8)
          ctx.closePath()
          ctx.fill()

          // Cheese holes
          ctx.fillStyle = "#FFA500"
          ctx.beginPath()
          ctx.arc(centerX - 3, centerY + 2, 2, 0, Math.PI * 2)
          ctx.fill()
          ctx.beginPath()
          ctx.arc(centerX + 2, centerY - 1, 1.5, 0, Math.PI * 2)
          ctx.fill()
          ctx.beginPath()
          ctx.arc(centerX + 4, centerY + 4, 1, 0, Math.PI * 2)
          ctx.fill()
          break

        case "bomb":
          // Draw realistic bomb - black sphere with fuse
          ctx.fillStyle = "#1a1a1a"
          ctx.beginPath()
          ctx.arc(centerX, centerY + 2, 10, 0, Math.PI * 2)
          ctx.fill()

          // Bomb highlight
          ctx.fillStyle = "#333333"
          ctx.beginPath()
          ctx.arc(centerX - 3, centerY - 1, 3, 0, Math.PI * 2)
          ctx.fill()

          // Fuse
          ctx.strokeStyle = "#8B4513"
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.moveTo(centerX + 6, centerY - 6)
          ctx.lineTo(centerX + 10, centerY - 12)
          ctx.stroke()

          // Spark at fuse tip
          ctx.fillStyle = "#FF4500"
          ctx.beginPath()
          ctx.arc(centerX + 10, centerY - 12, 2, 0, Math.PI * 2)
          ctx.fill()
          break

        case "rotten":
          // Draw rotten food - brown irregular shape with flies
          ctx.fillStyle = "#8B4513"
          ctx.beginPath()
          ctx.arc(centerX - 2, centerY, 8, 0, Math.PI * 2)
          ctx.fill()
          ctx.beginPath()
          ctx.arc(centerX + 3, centerY + 2, 6, 0, Math.PI * 2)
          ctx.fill()

          // Green mold spots
          ctx.fillStyle = "#556B2F"
          ctx.beginPath()
          ctx.arc(centerX - 4, centerY - 2, 2, 0, Math.PI * 2)
          ctx.fill()
          ctx.beginPath()
          ctx.arc(centerX + 2, centerY + 4, 1.5, 0, Math.PI * 2)
          ctx.fill()

          // Stink lines
          ctx.strokeStyle = "#696969"
          ctx.lineWidth = 1
          for (let i = 0; i < 3; i++) {
            ctx.beginPath()
            ctx.moveTo(centerX + i * 3 - 3, obj.y - 2)
            ctx.lineTo(centerX + i * 3 - 1, obj.y - 8)
            ctx.stroke()
          }
          break

        case "magnet":
          // Draw realistic magnet - horseshoe shape
          ctx.fillStyle = "#DC143C"
          ctx.fillRect(centerX - 8, centerY - 6, 4, 12)
          ctx.fillRect(centerX + 4, centerY - 6, 4, 12)
          ctx.fillRect(centerX - 8, centerY + 6, 16, 4)

          // Blue end
          ctx.fillStyle = "#0000FF"
          ctx.fillRect(centerX - 8, centerY - 10, 4, 4)
          ctx.fillRect(centerX + 4, centerY - 10, 4, 4)

          // Magnetic field lines
          ctx.strokeStyle = "#4169E1"
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.arc(centerX, centerY - 8, 12, 0.2, Math.PI - 0.2, false)
          ctx.stroke()
          break

        case "clock":
          // Draw realistic clock - circle with hands
          ctx.fillStyle = "#F5F5DC"
          ctx.beginPath()
          ctx.arc(centerX, centerY, 10, 0, Math.PI * 2)
          ctx.fill()

          // Clock border
          ctx.strokeStyle = "#8B4513"
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.arc(centerX, centerY, 10, 0, Math.PI * 2)
          ctx.stroke()

          // Clock hands
          ctx.strokeStyle = "#000000"
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.moveTo(centerX, centerY)
          ctx.lineTo(centerX, centerY - 6)
          ctx.stroke()
          ctx.beginPath()
          ctx.moveTo(centerX, centerY)
          ctx.lineTo(centerX + 4, centerY)
          ctx.stroke()

          // Center dot
          ctx.fillStyle = "#000000"
          ctx.beginPath()
          ctx.arc(centerX, centerY, 1, 0, Math.PI * 2)
          ctx.fill()
          break
      }
    }

    // Update game logic
    function update() {
      if (!gameState.gameRunning) return

      // Move chef
      if (gameState.keys.left && gameState.chef.x > 0) {
        gameState.chef.x -= CHEF_SPEED
      }
      if (gameState.keys.right && gameState.chef.x < CANVAS_WIDTH - CHEF_WIDTH) {
        gameState.chef.x += CHEF_SPEED
      }

      if (gameState.chef.animationTimer > 0) {
        gameState.chef.animationTimer--
      } else {
        gameState.chef.animationState = "idle"
      }

      // Update falling objects
      const fallSpeed = gameState.powerUps.slowMotion > 0 ? FALL_SPEED * 0.5 : FALL_SPEED
      gameState.fallingObjects.forEach((obj, index) => {
        obj.y += fallSpeed

        // Magnet effect
        if (gameState.powerUps.magnet > 0 && obj.isIngredient) {
          const dx = gameState.chef.x + CHEF_WIDTH / 2 - (obj.x + OBJECT_SIZE / 2)
          const dy = gameState.chef.y + CHEF_HEIGHT / 2 - (obj.y + OBJECT_SIZE / 2)
          const distance = Math.sqrt(dx * dx + dy * dy)
          if (distance < 100) {
            obj.x += dx * 0.05
            obj.y += dy * 0.05
          }
        }

        // Check collision with chef
        if (
          obj.x < gameState.chef.x + CHEF_WIDTH &&
          obj.x + OBJECT_SIZE > gameState.chef.x &&
          obj.y < gameState.chef.y + CHEF_HEIGHT &&
          obj.y + OBJECT_SIZE > gameState.chef.y
        ) {
          gameState.chef.animationState = "catching"
          gameState.chef.animationTimer = 30 // Show catching animation for 30 frames

          // Handle collision
          if (obj.isPowerUp) {
            if (obj.type === "magnet") {
              gameState.powerUps.magnet = 300 // 5 seconds at 60fps
            } else if (obj.type === "clock") {
              gameState.powerUps.slowMotion = 300
              gameState.timeLeft += 10 // Add 10 seconds instead of small amount
            }
          } else if (obj.isIngredient) {
            const recipe = recipes[gameState.currentRecipe]
            if (
              recipe.ingredients[obj.type as keyof typeof recipe.ingredients] >
              gameState.recipeProgress[obj.type as keyof typeof gameState.recipeProgress]
            ) {
              gameState.recipeProgress[obj.type as keyof typeof gameState.recipeProgress]++
              gameState.score += obj.points
            }
          } else {
            // Hazard
            gameState.health += obj.points
            if (gameState.health <= 0) {
              gameState.gameOver = true
              gameState.gameRunning = false
            }
          }

          gameState.fallingObjects.splice(index, 1)
        }

        // Remove objects that fell off screen
        if (obj.y > CANVAS_HEIGHT) {
          gameState.fallingObjects.splice(index, 1)
        }
      })

      // Update power-ups
      if (gameState.powerUps.magnet > 0) gameState.powerUps.magnet--
      if (gameState.powerUps.slowMotion > 0) gameState.powerUps.slowMotion--

      // Update timer
      gameState.timeLeft -= 1 / 60 // Assuming 60fps

      // Check recipe completion
      const recipe = recipes[gameState.currentRecipe]
      const completed = Object.keys(recipe.ingredients).every(
        (ingredient) =>
          gameState.recipeProgress[ingredient as keyof typeof gameState.recipeProgress] >=
          recipe.ingredients[ingredient as keyof typeof recipe.ingredients],
      )

      if (completed) {
        gameState.score += 100 // Bonus for completing recipe
        gameState.currentRecipe++
        if (gameState.currentRecipe >= recipes.length) {
          gameState.gameOver = true
          gameState.gameRunning = false
        } else {
          initGame()
        }
      }

      // Check time up
      if (gameState.timeLeft <= 0) {
        gameState.gameOver = true
        gameState.gameRunning = false
      }

      spawnObject()
    }

    // Render game
    function render() {
      // Clear canvas
      ctx.fillStyle = "#87CEEB"
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

      if (gameState.gameOver) {
        // Game over screen
        ctx.fillStyle = "rgba(0, 0, 0, 0.8)"
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

        ctx.fillStyle = "#FFFFFF"
        ctx.font = "48px Arial"
        ctx.textAlign = "center"
        ctx.fillText("Game Over!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50)

        ctx.font = "24px Arial"
        ctx.fillText(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2)
        ctx.fillText("Press R to Restart", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50)
        return
      }

      drawChef(ctx, gameState.chef.x, gameState.chef.y, gameState.chef.animationState, gameState.chef.animationTimer)

      // Draw falling objects
      gameState.fallingObjects.forEach((obj) => {
        drawIngredient(ctx, obj)
      })

      // Draw HUD
      ctx.fillStyle = "rgba(0, 0, 0, 0.8)"
      ctx.fillRect(0, 0, CANVAS_WIDTH, 80)

      ctx.fillStyle = "#FFFFFF"
      ctx.font = "16px Arial"
      ctx.textAlign = "left"
      ctx.fillText(`Score: ${gameState.score}`, 10, 25)
      ctx.fillText(`Health: ${gameState.health}`, 10, 45)
      ctx.fillText(`Time: ${Math.ceil(gameState.timeLeft)}s`, 10, 65)

      // Draw recipe progress
      const recipe = recipes[gameState.currentRecipe]
      ctx.fillText(`Recipe: ${recipe.name}`, 200, 25)
      ctx.fillText(`🍅: ${gameState.recipeProgress.tomato}/${recipe.ingredients.tomato}`, 200, 45)
      ctx.fillText(
        `🥬: ${gameState.recipeProgress.lettuce}/${recipe.ingredients.lettuce} 🧀: ${gameState.recipeProgress.cheese}/${recipe.ingredients.cheese}`,
        200,
        65,
      )

      // Draw power-ups
      if (gameState.powerUps.magnet > 0) {
        ctx.fillText(`🧲 Magnet: ${Math.ceil(gameState.powerUps.magnet / 60)}s`, 500, 45)
      }
      if (gameState.powerUps.slowMotion > 0) {
        ctx.fillText(`⏰ Slow-Mo: ${Math.ceil(gameState.powerUps.slowMotion / 60)}s`, 500, 65)
      }

      // Draw health bar
      ctx.fillStyle = "#FF0000"
      ctx.fillRect(CANVAS_WIDTH - 210, 10, 200, 20)
      ctx.fillStyle = "#00FF00"
      ctx.fillRect(CANVAS_WIDTH - 210, 10, (gameState.health / 100) * 200, 20)
    }

    // Game loop
    function gameLoop() {
      update()
      render()
      requestAnimationFrame(gameLoop)
    }

    // Event listeners
    function handleKeyDown(e: KeyboardEvent) {
      switch (e.key) {
        case "ArrowLeft":
          gameState.keys.left = true
          break
        case "ArrowRight":
          gameState.keys.right = true
          break
        case "r":
        case "R":
          if (gameState.gameOver) {
            gameState = {
              chef: {
                x: CANVAS_WIDTH / 2 - CHEF_WIDTH / 2,
                y: CANVAS_HEIGHT - CHEF_HEIGHT - 10,
                animationState: "idle",
                animationTimer: 0,
              },
              fallingObjects: [],
              score: 0,
              health: 100,
              currentRecipe: 0,
              recipeProgress: { tomato: 0, lettuce: 0, cheese: 0 },
              timeLeft: selectedTime,
              gameRunning: true,
              gameOver: false,
              powerUps: { magnet: 0, slowMotion: 0 },
              keys: { left: false, right: false },
            }
            initGame()
          }
          break
      }
    }

    function handleKeyUp(e: KeyboardEvent) {
      switch (e.key) {
        case "ArrowLeft":
          gameState.keys.left = false
          break
        case "ArrowRight":
          gameState.keys.right = false
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)

    // Start game
    initGame()
    gameLoop()

    // Cleanup
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
    }
  }, [gameStarted, selectedTime])

  if (!gameStarted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-4">
        <h1 className="text-4xl font-bold text-white mb-8">Pixel Chef: Kitchen Rush</h1>

        <div className="bg-white p-8 rounded-lg shadow-lg mb-8 max-w-md w-full">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Game Options</h2>

          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">Select Time Duration:</label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  value={30}
                  checked={selectedTime === 30}
                  onChange={(e) => setSelectedTime(Number(e.target.value))}
                  className="mr-2"
                />
                <span className="text-gray-700">30 seconds (Quick Game)</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value={60}
                  checked={selectedTime === 60}
                  onChange={(e) => setSelectedTime(Number(e.target.value))}
                  className="mr-2"
                />
                <span className="text-gray-700">1 minute (Standard Game)</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value={90}
                  checked={selectedTime === 90}
                  onChange={(e) => setSelectedTime(Number(e.target.value))}
                  className="mr-2"
                />
                <span className="text-gray-700">1.5 minutes (Extended Game)</span>
              </label>
            </div>
          </div>

          <button
            onClick={() => setGameStarted(true)}
            className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
          >
            Start Game
          </button>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-lg max-w-md w-full">
          <p className="text-sm text-gray-700 mb-2">
            <strong>Controls:</strong> Use ← → arrow keys to move the chef
          </p>
          <p className="text-sm text-gray-700 mb-2">
            <strong>Goal:</strong> Catch ingredients (🍅🥬🧀) to complete recipes, avoid hazards (💣🤢)
          </p>
          <p className="text-sm text-gray-700">
            <strong>Power-ups:</strong> 🧲 Magnet attracts ingredients, ⏰ Clock adds +10 seconds
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-4">
      <h1 className="text-4xl font-bold text-white mb-4">Pixel Chef: Kitchen Rush</h1>
      <div className="bg-white p-4 rounded-lg shadow-lg mb-4">
        <p className="text-sm text-gray-700 mb-2">
          <strong>Time Duration:</strong> {selectedTime} seconds per recipe
        </p>
        <p className="text-sm text-gray-700 mb-2">
          <strong>Controls:</strong> Use ← → arrow keys to move the chef
        </p>
        <p className="text-sm text-gray-700 mb-2">
          <strong>Goal:</strong> Catch ingredients (🍅🥬🧀) to complete recipes, avoid hazards (💣🤢)
        </p>
        <p className="text-sm text-gray-700">
          <strong>Power-ups:</strong> 🧲 Magnet attracts ingredients, ⏰ Clock adds +10 seconds
        </p>
      </div>
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className="border-4 border-white rounded-lg shadow-2xl"
        tabIndex={0}
      />
      <div className="flex gap-4 mt-4">
        <p className="text-white text-sm">Press R to restart when game over</p>
        <button
          onClick={() => setGameStarted(false)}
          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded text-sm"
        >
          Back to Options
        </button>
      </div>
    </div>
  )
}
