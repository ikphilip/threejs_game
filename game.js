// Set up a 2d scene, camera, and renderer.
const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(window.innerWidth / -2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / -2, 0, 1);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Create a circle.
const circleGeometry = new THREE.CircleGeometry(48, 64);
const circleMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
const player = new THREE.Mesh(circleGeometry, circleMaterial);
scene.add(player);

// Add arrow to represent directionality.
// https://threejs.org/docs/#api/en/helpers/ArrowHelper
const dir = new THREE.Vector3( 1, 0, 0 );

// normalize the direction vector (convert to vector of length 1).
dir.normalize();

const origin = new THREE.Vector3( 0, 0, 0 );
const length = 50;
const hex = 0xff0000;

const arrowHelper = new THREE.ArrowHelper( dir, origin, length, hex );
player.add( arrowHelper );

// Set the camera position
camera.position.z = 1;

// Initial game state
const state = {
  player: { x: 0, y: 0, z: 0 },
  touch: { x: 0, y: 0, z: 0 },
};

// Function to update the game state
const update = elapsed => {
  // Get the width of the canvas.
  player.position.x = state.player.x;
  player.position.y = state.player.y;
}

// Function to render the game state
const render = () => {
  // Render the scene
  renderer.render(scene, camera);
}

// Function to be called every frame
const gameLoop = elapsed => {
  update(elapsed);
  render();
  requestAnimationFrame(gameLoop);
}

// Event handler for touch on canvas.
// Get the touch position x,y coordinates.
// Move the object closer to touch position.
const onTouch = event => {
	let x = event.touches[0].clientX - window.innerWidth / 2;
  let y = -event.touches[0].clientY + window.innerHeight / 2;

  rotatePlayerToCoords(x, y)
  movePlayerToCoords(x, y)
}

// Function to move the player to the touch coordinates.
// Fraction is the speed of the movement.
const movePlayerToCoords = (x, y, fraction = 0.1) => {
  state.touch.x = x;
  state.touch.y = y;

  let dx = state.touch.x - state.player.x;
  let dy = state.touch.y - state.player.y;

  let angle = Math.atan2(dy, dx);
  let distance = Math.sqrt(dx * dx + dy * dy);
  let moveDistance = fraction * distance;
  let moveX = moveDistance * Math.cos(angle);
  let moveY = moveDistance * Math.sin(angle);

  state.player.x += moveX;
  state.player.y += moveY;
}

// Function to rotate player object to face the touch coordinates.
const rotatePlayerToCoords = (x, y) => {
  let dx = x - state.player.x;
  let dy = y - state.player.y;

  let angle = Math.atan2(dy, dx);
  player.rotation.z = angle;
}

// Start the game loop
requestAnimationFrame(gameLoop);

// Handle window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

window.addEventListener('touchstart', onTouch);
