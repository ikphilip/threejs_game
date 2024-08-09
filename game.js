// Set up a 2d scene, camera, and renderer.
const scene = new THREE.Scene()
const camera = new THREE.OrthographicCamera(window.innerWidth / -2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / -2, 0, 1)
const renderer = new THREE.WebGLRenderer()
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

// Game variables.
const playerRadius = 48
const bugRadius = 16
const visionRadius = playerRadius + 48
const mapXSize = 1920;
const mapYSize = 1080;

// Create a canvas to draw the darkness texture
const darknessCanvas = document.createElement('canvas');
darknessCanvas.width = window.innerWidth;
darknessCanvas.height = window.innerHeight;
const darknessContext = darknessCanvas.getContext('2d');

// Draw initial darkness (solid black)
darknessContext.fillStyle = 'rgba(00, 00, 33, 1)';
darknessContext.fillRect(0, 0, darknessCanvas.width, darknessCanvas.height);

// Create a darkness texture from the canvas
const darknessTexture = new THREE.CanvasTexture(darknessCanvas);
const darknessMaterial = new THREE.MeshBasicMaterial({
  map: darknessTexture,
  transparent: true,
});

// Create the darkness plane (same size as the map)
const darknessGeometry = new THREE.PlaneGeometry(mapXSize, mapYSize);
const darknessPlane = new THREE.Mesh(darknessGeometry, darknessMaterial);
// darknessPlane.rotation.x = -Math.PI / 2;
darknessPlane.position.z = 0.02; // Slightly above the map
scene.add(darknessPlane);

// Create a circle. This is bat.
const circleGeometry = new THREE.CircleGeometry(playerRadius, 36)
const circleMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 })
const player = new THREE.Mesh(circleGeometry, circleMaterial)
scene.add(player)

// Create another circle. This is the bug object.
const circleGeometry2 = new THREE.CircleGeometry(bugRadius, 36)
const circleMaterial2 = new THREE.MeshBasicMaterial({ color: 0x0000ff })
const bug = new THREE.Mesh(circleGeometry2, circleMaterial2)
scene.add(bug)

// Create a rectangle. This is an impassable tree object.
const treeGeometry = new THREE.BoxGeometry(150, 50, 0)
const treeMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 })
const tree = new THREE.Mesh(treeGeometry, treeMaterial)
scene.add(tree)

// Add arrow to represent directionality.
// https://threejs.org/docs/#api/en/helpers/ArrowHelper
const dir = new THREE.Vector3(1, 0, 0)

// normalize the direction vector (convert to vector of length 1).
dir.normalize()

const origin = new THREE.Vector3(0, 0, 0)
const length = 50
const hex = 0xff0000

const arrowHelper = new THREE.ArrowHelper(dir, origin, length, hex)
player.add(arrowHelper)

// Set the camera position
camera.position.z = 1

// Random x and y coordinates.
const randomX = () => {
  return Math.random() * window.innerWidth - window.innerWidth / 2
}
const randomY = () => {
  return Math.random() * window.innerHeight - window.innerHeight / 2
}

// Set the player position.
// Reveal the area around the player.
const updatePlayerPosition = () => {
  player.position.x = state.player.x
  player.position.y = state.player.y
}

// Initial game state.
const state = {
  bug: { x: randomX(), y: randomY(), z: 0 },
  counter: 0,
  currentBugCollision: false,
  currentTreeCollision: false,
  player: { x: 0, y: -100, z: 0 },
  playerNextPosition: { x: 0, y: -100, z: 0 },
  touch: { x: 0, y: 0, z: 0 },
  tree: { x: 0, y: 0, z: 0 },
}

// Reveal the area around a point.
// Check for a last reveal position and refill it with darkness.
const revealArea = (x, y) => {
  if (state.lastRevealPosition) {
    const lastX = (state.lastRevealPosition.x + mapXSize / 2) / mapXSize * darknessCanvas.width;
    const lastY = (-state.lastRevealPosition.y + mapYSize / 2) / mapYSize * darknessCanvas.height;

    darknessContext.globalCompositeOperation = 'destination-over'; // Erase mode
    darknessContext.beginPath();
    darknessContext.arc(lastX, lastY, visionRadius + 1, 0, 2 * Math.PI);
    darknessContext.fill();
  }

  const canvasX = (x + mapXSize / 2) / mapXSize * darknessCanvas.width;
  const canvasY = (-y + mapYSize / 2) / mapYSize * darknessCanvas.height;

  darknessContext.globalCompositeOperation = 'destination-out'; // Erase mode
  darknessContext.beginPath();
  darknessContext.arc(canvasX, canvasY, visionRadius, 0, 2 * Math.PI);
  darknessContext.fill();

  state.lastRevealPosition = { x: x, y: y };

  darknessTexture.needsUpdate = true;
}

// Function to update the game state
const update = elapsed => {
  bug.position.x = state.bug.x
  bug.position.y = state.bug.y

  tree.position.x = state.tree.x
  tree.position.y = state.tree.y

  // Count the number of collisions.
  if (detectBugCollision() === true && state.currentBugCollision === false) {
    state.currentBugCollision = true

    addPoint()

    // Move bug to new location.
    state.bug.x = randomX()
    state.bug.y = randomY()

  }
  else if (detectBugCollision() === false && state.currentBugCollision === true) {
    state.currentBugCollision = false
  }

  // Player movement functions.
  movePlayerToNextCoords()
  updatePlayerPosition()
  revealArea(state.player.x, state.player.y)
}

// Function to render the game state
const render = () => {
  // Render the scene
  renderer.render(scene, camera)
}

// Function to be called every frame
const gameLoop = elapsed => {
  update(elapsed)
  render()
  requestAnimationFrame(gameLoop)
}

// Event handler for touch on canvas.
// Get the touch position x,y coordinates.
// Move the object closer to touch position.
const onTouch = event => {
	let x = event.touches[0].clientX - window.innerWidth / 2
  let y = -event.touches[0].clientY + window.innerHeight / 2

  rotatePlayerToCoords(x, y)
  calculatePlayerNextCoords(x, y)
}

const onClick = event => {
  // if mouse is down, get the x,y coordinates.
  if (event.buttons === 1) {

    let x = event.clientX - window.innerWidth / 2
    let y = -event.clientY + window.innerHeight / 2

    rotatePlayerToCoords(x, y)
    calculatePlayerNextCoords(x, y)
  }
}

// Function to add a point to the score.
const addPoint = () => {
  state.counter += 1

  document.querySelector('#score').innerText = state.counter
}

// Function to move the player to the next position.
// If the player collides with a tree, move the player away from the tree.
const movePlayerToNextCoords = () => {
  if (detectTreeCollision() === true) {
    movePlayerAwayFromTree()
  }

  state.player.x = state.playerNextPosition.x
  state.player.y = state.playerNextPosition.y
}

// Function to calculate the next position of the player.
// Fraction is the speed of the movement.
const calculatePlayerNextCoords = (x, y, fraction = 0.1) => {
  state.touch.x = x
  state.touch.y = y

  let dx = state.touch.x - state.player.x
  let dy = state.touch.y - state.player.y

  let angle = Math.atan2(dy, dx)
  let distance = Math.sqrt(dx * dx + dy * dy)
  let moveDistance = fraction * distance
  let moveX = moveDistance * Math.cos(angle)
  let moveY = moveDistance * Math.sin(angle)

  state.playerNextPosition.x = state.player.x + moveX
  state.playerNextPosition.y = state.player.y + moveY
}

// Function to rotate player object to face the touch coordinates.
const rotatePlayerToCoords = (x, y) => {
  let dx = x - state.player.x
  let dy = y - state.player.y

  let angle = Math.atan2(dy, dx)
  player.rotation.z = angle
}

// Function to detect collision between two objects.
const detectObjectsCollision = (object1, object2) => {
  object1.geometry.computeBoundingBox()
  object2.geometry.computeBoundingBox()

  const box1 = object1.geometry.boundingBox.clone()
  const box2 = object2.geometry.boundingBox.clone()

  // Adjust bounding boxes to the object's world position
  box1.applyMatrix4(object1.matrixWorld)
  box2.applyMatrix4(object2.matrixWorld)

  return box1.intersectsBox(box2)
}

// detect collision between player and bug.
const detectBugCollision = () => {
  return detectObjectsCollision(player, bug)
}

// detect collision between player and tree.
const detectTreeCollision = () => {
  return detectObjectsCollision(player, tree)
}

// Disallow the player from getting closer to the tree's position.
const movePlayerAwayFromTree = () => {
  let dx = state.tree.x - state.player.x
  let dy = state.tree.y - state.player.y
  let distance = Math.sqrt(dx * dx + dy * dy)

  let angle = Math.atan2(dy, dx)
  let moveDistance = 0.1 * distance
  let moveX = moveDistance * Math.cos(angle)
  let moveY = moveDistance * Math.sin(angle)

  state.playerNextPosition.x = state.player.x - moveX
  state.playerNextPosition.y = state.player.y - moveY
}

// Start the game loop
requestAnimationFrame(gameLoop)

// Handle window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})

// Add listener for touch events.
window.addEventListener('touchstart', onTouch)
window.addEventListener('touchmove', onTouch)

// Add listener for mouse events.
window.addEventListener('mousedown', onClick)
window.addEventListener('mousemove', onClick)
