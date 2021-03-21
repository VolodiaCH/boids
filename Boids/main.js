const random = (round, min, max) => {
    let random = min + Math.random() * (max - min);
    if (round) return Math.round(random);
    else return random;
}

// get distance between two points
const distance = (obj1, obj2) => Math.sqrt((obj1.x - obj2.x)**2 + (obj1.y - obj2.y)**2);

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

    // draw_boids = boids => {
    //     boids.forEach(boid => {
    //         const { x, y } = boid.coords;
    //         const radius = 1;
    //         const color = "#00ffff"
    
    //         this.create_arc(x, y, radius, color);
    //     });
    // }

    draw_boids = boids => {
        let { ctx } = this;
        boids.forEach(boid => {
            const angle = Math.atan2(boid.velocity.y, boid.velocity.x);
            ctx.translate(boid.coords.x, boid.coords.y);
            ctx.rotate(angle);
            ctx.translate(-boid.coords.x, -boid.coords.y);
            ctx.fillStyle = boid.color;
            ctx.beginPath();
            ctx.moveTo(boid.coords.x, boid.coords.y);
            ctx.lineTo(boid.coords.x - 15, boid.coords.y + 5);
            ctx.lineTo(boid.coords.x - 15, boid.coords.y - 5);
            ctx.lineTo(boid.coords.x, boid.coords.y);
            ctx.fill();
            ctx.setTransform(1, 0, 0, 1, 0, 0);
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
        width -= 10;
        height -= 10;
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
        this.color = ["#87aef7", "#6f9ef6", "#558cf4", "#3f7ef3", "#276ef1"][random(true, 0, 5)];
    }
}

class Predator {
    constructor(coords, velocity) {
        this.coords = coords; // { x, y }
        this.velocity = velocity; // { x, y }
        this.color = "#ff1111";
    }
}

class Obstacle {
    constructor(x, y, radius) {
        this.coords = { x, y };
        this.radius = radius;
    }
}

class Boids {
    constructor(boids, obstacles, predators) {
        this.boids = boids;
        this.obstacles = obstacles;
        this.predators = predators;

        this.visualRange = 75;
        this.maxSpeed = 15;
    }

    // make boid move to avarage of all boids coords
    coherence = (boid, factor) => {
        let { boids, visualRange } = this;

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

            boid.velocity.x += (avg.x - boid.coords.x) * factor;
            boid.velocity.y += (avg.y - boid.coords.y) * factor;
        }

        return boid
    }
    
    // make boids avoid other boid if it to close
    separation = (boid, factor) => {
        let { boids } = this;

        // The distance to stay away from other boids
        const minDistance = 30; 

        let move = { x: 0, y: 0 };
        let closestBoids = boids.filter(b => {
            return distance(boid.coords, b.coords) < minDistance && b != boid
        });

        closestBoids.forEach(b => {
            move.x += boid.coords.x - b.coords.x;
            move.y += boid.coords.y - b.coords.y;
        });

        boid.velocity.x += move.x * factor;
        boid.velocity.y += move.x * factor;

        return boid;
    }
    
    // make boids move in one direcion 
    aligment = (boid, factor) => {
        let { boids, visualRange } = this;

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

            boid.velocity.x += (avgVelocity.x - boid.velocity.x) * factor;
            boid.velocity.y += (avgVelocity.y - boid.velocity.y) * factor;
        }

        return boid
    }

    move = (c_width, c_height, mouse) => {
        let { boids, obstacles, predators } = this;

        mouse.x = mouse.x ? mouse.x : c_width / 2;
        mouse.y = mouse.y ? mouse.y : c_height / 2;

        this.boids = boids.map(boid => {
            boid = this.coherence(boid, 0.005);
            boid = this.separation(boid, 0.05);
            boid = this.aligment(boid, 0.005);

            boid.velocity.x += (c_width/2 - boid.coords.x) * 0.0001;
            boid.velocity.y += (c_height/2 - boid.coords.y) * 0.0001;


            // move to cursor
            if (mouse.x && mouse.y) {
                boid.velocity.x += (mouse.x - boid.coords.x) * 0.01;
                boid.velocity.y += (mouse.y - boid.coords.y) * 0.01;

                // awoid cursor
                if (distance(boid.coords, mouse) < 100) {
                    let move = { x: 0, y: 0 };
    
                    move.x += boid.coords.x - mouse.x;
                    move.y += boid.coords.y - mouse.y;
    
                    boid.velocity.x += move.x;
                    boid.velocity.y += move.x;
                }
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

            
            boid.velocity.x += random(false, -0.5, 0.5);
            boid.velocity.y += random(false, -0.5, 0.5);

            // avoid predators
            let move = { x: 0, y: 0 };
            let danger = 1;
            predators.forEach(predator => {
                if (distance(boid.coords, predator.coords) < this.visualRange) {
                    danger++;

                    // console.log(predator);
                    move.x += boid.coords.x - predator.coords.x;
                    move.y += boid.coords.y - predator.coords.y;
    
                    boid.velocity.x += move.x*10;
                    boid.velocity.y += move.x*10;
                }
            });
            
            // limit speed
            const speed = Math.sqrt(boid.velocity.x**2 + boid.velocity.y**2);
            if (speed > this.maxSpeed) {
                boid.velocity.x = (boid.velocity.x / speed) * this.maxSpeed*danger;
                boid.velocity.y = (boid.velocity.y / speed) * this.maxSpeed*danger;
            }


            // avoid edjes of canvas
            const margin = 200;
            const turnFactor = 1;
            if (boid.coords.x < margin) boid.velocity.x += turnFactor;
            if (boid.coords.x > c_width - margin) boid.velocity.x -= turnFactor
            if (boid.coords.y < margin) boid.velocity.y += turnFactor;
            if (boid.coords.y > c_height - margin) boid.velocity.y -= turnFactor; 

            // if boid is out of canvas get him back
            if (boid.coords.x > c_width) boid.coords.x = 0;
            else if (boid.coords.x < 0) boid.coords.x = c_width;
            else if (boid.coords.y > c_height) boid.coords.y = 0;
            else if (boid.coords.y < 0) boid.coords.y = c_height;

            boid.coords.x += boid.velocity.x;
            boid.coords.y += boid.velocity.y;

            return boid
        });

        // this.boids = boids.sort((a, b) => a.coords.x - b.coords.x)
        this.predators = predators.map(predator => {
            let closestBoids = boids.filter(b => distance(predator.coords, b.coords) < this.visualRange);
            if (closestBoids.length > 0) {
                let avg = { x: 0, y: 0 };

                closestBoids.forEach(b => {
                    avg.x += b.coords.x;
                    avg.y += b.coords.y;
                });

                avg.x /= closestBoids.length;
                avg.y /= closestBoids.length;

                let factor = 0.005;

                predator.velocity.x += (avg.x - predator.coords.x) * factor;
                predator.velocity.y += (avg.y - predator.coords.y) * factor;
            }

             // avoid predators
            let move = { x: 0, y: 0 };
            predators.forEach(p => {
                 if (distance(predator.coords, p.coords) < this.visualRange) {
                     move.x += predator.coords.x - p.coords.x;
                     move.y += predator.coords.y - p.coords.y;
     
                     predator.velocity.x += move.x * 0.5;
                     predator.velocity.y += move.x * 0.5;
                 }
             });

            predator.velocity.x += (c_width/2 - predator.coords.x) * 0.01;
            predator.velocity.y += (c_height/2 - predator.coords.y) * 0.01;

            // limit speed
            const speed = Math.sqrt(predator.velocity.x**2 + predator.velocity.y**2);
            if (speed > this.maxSpeed) {
                predator.velocity.x = (predator.velocity.x / speed) * 20;
                predator.velocity.y = (predator.velocity.y / speed) * 20;
            }

            // avoid edjes of canvas
            const margin = 200;
            const turnFactor = 1;
            if (predator.coords.x < margin) predator.velocity.x += turnFactor;
            if (predator.coords.x > c_width - margin) predator.velocity.x -= turnFactor
            if (predator.coords.y < margin) predator.velocity.y += turnFactor;
            if (predator.coords.y > c_height - margin) predator.velocity.y -= turnFactor; 

             // if predator is out of canvas get him back
             if (predator.coords.x > c_width) predator.coords.x = 0;
             else if (predator.coords.x < 0) predator.coords.x = c_width;
             else if (predator.coords.y > c_height) predator.coords.y = 0;
             else if (predator.coords.y < 0) predator.coords.y = c_height;

            predator.coords.x += predator.velocity.x;
            predator.coords.y += predator.velocity.y;

            return predator
        })
    }
}

// -- -- -- -- --

const canvas = new Canvas();

function sizeCanvas() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.reSize(width, height);
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

let followMouse = false;
function keyPress(e) {
    if (e.key === "f") followMouse = !followMouse;
    else if (e.key === "p") addPredator();
    else if (e.key === "o") addObstacle();
}

window.addEventListener("resize", sizeCanvas, false);
window.addEventListener("keypress", keyPress, false);
sizeCanvas();

let boids = [];
for (let i = 0; i < 500; i++) {
    let x = random(true, 0, canvas.width);
    let y = random(true, 0, canvas.height);
    
    boids.push(new Boid({ x, y }, { x: 1, y: 1 }))
}

for (let i = 0; i < 0; i++) {
    let margin = 100;
    let radius = random(true, 10, 20);
    let x = random(true, margin, canvas.width - radius - margin);
    let y = random(true, margin, canvas.height - radius - margin);
    
    obstacles.push(new Obstacle(x, y, radius))
}

let obstacles = [];
let predators = [];
let boidsObj = new Boids(boids, obstacles, predators);

const addPredator = () => {
    let x = random(true, 0, canvas.width);
    let y = random(true, 0, canvas.height);
    
    predators.push(new Predator({ x, y }, { x: 1, y: 1 }));
    boidsObj.predators = predators;
}

const addObstacle = () => {
    let margin = 100;
    let radius = random(true, 10, 20);
    let x = random(true, margin, canvas.width - radius - margin);
    let y = random(true, margin, canvas.height - radius - margin);
    
    obstacles.push(new Obstacle(x, y, radius));
    boidsObj.obstacles = obstacles;
}

// mainloop
let fps = 30;
setInterval(() => {
    // clear canvas + draw black background
    canvas.clear();
    canvas.background("black");

    if (!followMouse) {
        mouseX = null;
        mouseY = null;
    }

    boidsObj.move(canvas.width, canvas.height, { x: mouseX, y: mouseY });

    canvas.draw_boids(boidsObj.boids);
    canvas.draw_boids(boidsObj.predators);
    canvas.draw_obstacles(boidsObj.obstacles);
}, 1000 / fps);
