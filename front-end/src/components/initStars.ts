export function initStars() {
	console.log('[initStars] called')
  
	const canvas = document.getElementById('smoke-bg') as HTMLCanvasElement
	if (!canvas) return
  
	const ctx = canvas.getContext('2d')!
	let width = window.innerWidth
	let height = window.innerHeight
	canvas.width = width
	canvas.height = height
  
	interface Star {
	  x: number
	  y: number
	  radius: number
	  speed: number
	  baseAlpha: number
	  alpha: number
	  flicker: number
	}
  
	let stars: Star[] = []
  
	function createStars(count = 100) {
	  stars = Array.from({ length: count }, () => ({
		x: Math.random() * width,
		y: Math.random() * height,
		radius: Math.random() * 1.5 + 0.5,
		speed: Math.random() * 0.3 + 0.1,
		baseAlpha: Math.random() * 0.3 + 0.8,  // 0.8 ~ 1.0
		alpha: 0,
		flicker: Math.random() * 0.02 + 0.01, // 控制闪烁速度
	  }))
	}
  
	function draw() {
	  ctx.clearRect(0, 0, width, height)
  
	  stars.forEach((star) => {
		star.y += star.speed
		if (star.y > height) {
		  star.y = 0
		  star.x = Math.random() * width
		}
  
		// 实现闪烁
		const variation = (Math.random() - 0.5) * star.flicker
		star.alpha += variation
		star.alpha = Math.max(0.1, Math.min(star.baseAlpha, star.alpha)) // 限制 alpha 范围
  
		ctx.beginPath()
		ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2)
		ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`
		ctx.fill()
	  })
  
	  requestAnimationFrame(draw)
	}
  
	function resize() {
	  width = window.innerWidth
	  height = window.innerHeight
	  canvas.width = width
	  canvas.height = height
	  createStars()
	}
  
	resize()
	draw()
	window.addEventListener('resize', resize)
  }
  