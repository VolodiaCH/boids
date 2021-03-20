const random = (round, min, max) => {
    let random = min + Math.random() * (max - min);
    if (round) return Math.round(random);
    else return random;
}

const getAngle = (x1, y1, x2, y2) => Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
const getMovement = (coords, target, speed) => {
    let angle = getAngle(coords.x, coords.y, target.x, target.y);
    let angleRadians = (Math.PI / 180.0) * angle;

    return {
        x: coords.x + Math.cos(angleRadians) * speed,
        y: coords.y + Math.sin(angleRadians) * speed
    }
}

const checkCollide = (obj1, obj2) => {
    let withinX = obj2.x > obj1.x1 && obj2.x < obj1.x2;
    let withinY = obj2.y > obj1.y1 && obj2.y < obj1.y2;

    return withinX && withinY
}

// get distance between two points
const distance = (obj1, obj2) => {
    return Math.sqrt(
        (obj1.x - obj2.x) * (obj1.x - obj2.x) + (obj1.y - obj2.y) * (obj1.y - obj2.y)
    );
}

// mouse move listener
let mouseX, mouseY;
function mouseMove(e) {
    if (e) {
        if (e.offsetX) {
            mouseX = e.offsetX;
            mouseY = e.offsetY;
        }
        else if (e.layerX) {
            mouseX = e.layerX;
            mouseY = e.layerY;
        }
    }
}

class Canvas {
    constructor() {
        this.canvas = document.getElementById("Main");
        this.ctx = this.canvas.getContext("2d");

        this.width = this.canvas.width; 
        this.height = this.canvas.height; 
    }

    create_arc = (x, y, radius, color) => {
        const { ctx } = this;
        
        ctx.strokeStyle = color ? color : "black";
    
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        ctx.stroke();
    
        ctx.fillStyle = color ? color : "black";
        ctx.fill();
    }

    draw_boids = boids => {
        boids.forEach(boid => {
            const { x, y } = boid.coords;
            const radius = 1;
            const color = "#00ffff"
    
            this.create_arc(x, y, radius, color);
        });
    }

    draw_obstacles = obstacles => {
        obstacles.forEach(obstacle => {
            const { x, y } = obstacle.coords;
            const { radius } = obstacle;
            const color = "#FFFFFF"
    
            this.create_arc(x, y, radius, color);
        });
    }

    clear = () => this.ctx.clearRect(0, 0, this.width, this.height);
    background = color => {
        this.ctx.fillStyle = color ? color : "black";
        this.ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    reSize = (width, height) => {
        width -= 50;
        height -= 50;
        this.canvas.width = width;
        this.canvas.height = height;
        this.width = width;
        this.height = height;
    }
}

class Boid {
    constructor(coords, velocity) {
        this.coords = coords; // { x, y }
        this.velocity = velocity; // { x, y }
    }
}

class Obstacle {
    constructor(x, y, radius) {
        this.coords = { x, y };
        this.radius = radius;
    }
}

class Boids {
    constructor(boids, obstacles) {
        this.boids = boids;
        this.obstacles = obstacles;

        this.visualRange = 75;
        this.maxSpeed = 15;
    }

    // make boid move to avarage of all boids coords
    coherence = boid => {
        let { boids, visualRange } = this;

        const centeringFactor = 0.005; // adjust velocity by this %
        // const centeringFactor = 1; // adjust velocity by this %

        let avg = { x: 0, y: 0 };
        let boidsInSight = boids.filter(b => {
            return distance(boid.coords, b.coords) < visualRange
        });

        boidsInSight.forEach(b => {
            avg.x += b.coords.x;
            avg.y += b.coords.y;
        });

        if (boidsInSight.length > 0) {
            avg.x = avg.x / boidsInSight.length;
            avg.y = avg.y / boidsInSight.length;

            boid.velocity.x += (avg.x - boid.coords.x) * centeringFactor;
            boid.velocity.y += (avg.y - boid.coords.y) * centeringFactor;
        }

        return boid
    }
    
    // make boids avoid other boid if it to close
    separation = boid => {
        let { boids } = this;

        // The distance to stay away from other boids
        const minDistance = 20; 
        const avoidFactor = 0.05; 

        let move = { x: 0, y: 0 };
        let closestBoids = boids.filter(b => {
            return distance(boid.coords, b.coords) < minDistance && b != boid
        });

        closestBoids.forEach(b => {
            move.x += boid.coords.x - b.coords.x;
            move.y += boid.coords.y - b.coords.y;
        });

        boid.velocity.x += move.x * avoidFactor;
        boid.velocity.y += move.x * avoidFactor;

        return boid;
    }
    
    // make boids move in one direcion 
    aligment = boid => {
        let { boids, visualRange } = this;

        const matchingFactor = 0.0005;

        let avgVelocity = { x: 0, y: 0 };
        let closestBoids = boids.filter(b => {
            return distance(boid.coords, b.coords) < visualRange
        });

        closestBoids.forEach(b => {
            avgVelocity.x += b.velocity.x;
            avgVelocity.y += b.velocity.y;
        });

        if (closestBoids.length > 0) {
            avgVelocity.x = avgVelocity.x / closestBoids.length;
            avgVelocity.x = avgVelocity.y / closestBoids.length;

            boid.velocity.x += (avgVelocity.x - boid.velocity.x) * matchingFactor;
            boid.velocity.y += (avgVelocity.y - boid.velocity.y) * matchingFactor;
        }

        return boid
    }

    move = (c_width, c_height, mouse) => {
        let { boids, obstacles } = this;

        this.boids = boids.map(boid => {
            boid = this.coherence(boid);
            boid = this.separation(boid);
            boid = this.aligment(boid);

            // move to cursor
            if (mouse.x && mouse.y) {
                boid.velocity.x += (mouse.x - boid.coords.x) * 0.01;
                boid.velocity.y += (mouse.y - boid.coords.y) * 0.01;
            }

            // awoid cursor
            if (distance(boid.coords, mouse) < 100) {
                let move = { x: 0, y: 0 };

                move.x += boid.coords.x - mouse.x;
                move.y += boid.coords.y - mouse.y;

                boid.velocity.x += move.x;
                boid.velocity.y += move.x;
            }

            // avoid obstacles
            obstacles.forEach(obstacle => {
                if (distance(boid.coords, obstacle.coords) < 50 + obstacle.radius) {
                    let move = { x: 0, y: 0 };
    
                    move.x += boid.coords.x - obstacle.coords.x;
                    move.y += boid.coords.y - obstacle.coords.y;
    
                    boid.velocity.x += move.x * 0.5;
                    boid.velocity.y += move.x * 0.5;
                }
            });

            // limit speed
            const speed = Math.sqrt(boid.velocity.x**2 + boid.velocity.y**2);
            if (speed > this.maxSpeed) {
                boid.velocity.x = (boid.velocity.x / speed) * this.maxSpeed;
                boid.velocity.y = (boid.velocity.y / speed) * this.maxSpeed;
            }

            // avoid edjes of canvas
            const margin = 150;
            const turnFactor = 1.5;
            if (boid.coords.x < margin) boid.velocity.x += turnFactor;
            if (boid.coords.x > c_width - margin) boid.velocity.x -= turnFactor
            if (boid.coords.y < margin) boid.velocity.y += turnFactor;
            if (boid.coords.y > c_height - margin) boid.velocity.y -= turnFactor; 

            // if boid is out of canvas turn him back
            if (boid.coords.x > c_width) boid.coords.x = 0;
            else if (boid.coords.x < 0) boid.coords.x = c_width;
            else if (boid.coords.y > c_height) boid.coords.y = 0;
            else if (boid.coords.y < 0) boid.coords.y = c_height;

            boid.coords.x += boid.velocity.x;
            boid.coords.y += boid.velocity.y;

            return boid
        });

        this.boids = boids.sort((a, b) => a.coords.x - b.coords.x)
    }
}

// -- -- -- -- --

const canvas = new Canvas();

function sizeCanvas() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.reSize(width, height);
}

window.addEventListener("resize", sizeCanvas, false);
sizeCanvas();

let boids = [];
for (let i = 0; i < 500; i++) {
    let x = random(true, 0, canvas.width);
    let y = random(true, 0, canvas.height);
    
    boids.push(new Boid({ x, y }, { x: 1, y: 1 }))
}

let obstacles = [];
for (let i = 0; i < 5; i++) {
    let margin = 100;
    let radius = random(true, 10, 20);
    let x = random(true, margin, canvas.width - radius - margin);
    let y = random(true, margin, canvas.height - radius - margin);
    
    obstacles.push(new Obstacle(x, y, radius))
}

const boidsObj = new Boids(boids, obstacles);

// mainloop
let fps = 30;
setInterval(() => {
    // clear canvas + draw black background
    canvas.clear();
    canvas.background("black");

    canvas.draw_boids(boidsObj.boids);
    canvas.draw_obstacles(boidsObj.obstacles);
    
    boidsObj.move(canvas.width, canvas.height, { x: mouseX, y: mouseY });
}, 1000 / fps);