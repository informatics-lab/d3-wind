'use strict';

const FRAME_RATE = 2000;
const PARTICLE_AGE = 100;
const PARTICLE_DECAY_RATE_PER_FRAME = 10;
const NUM_SITES = 200;
const NUM_PARTICLES = 2000;
const WIDTH = 960;
const HEIGHT = 500;

var svg;
var obsSites = [];
var transforms = [];
var particles = [];

init();

function init() {

    //generate sites and particles
    obsSites = d3.range(NUM_SITES).map(function () {
        return new ObsSite(new Vector2D(Math.random() * WIDTH, Math.random() * HEIGHT),
            Math.floor(Math.random() * 360),
            Math.floor(Math.random() * 20));
    });

    particles = d3.range(NUM_PARTICLES).map(function () {
        var p = new Particle();
        p.spawn();
        return p;
    });

    calculateTransforms();

    svg = d3.select("svg")
        .attr("width", WIDTH)
        .attr("height", HEIGHT);

    //draw the
    svg.selectAll(".site")
        .data(obsSites)
        .enter()
        .append("circle")
        .attr("class", "site")
        .attr("cx", function (d) {
            return d.position.x;
        })
        .attr("cy", function (d) {
            return d.position.y;
        })
        .attr("r", 3);

    //draw the initial particles to screen
    svg.selectAll(".particle")
        .data(particles)
        .enter()
        .append("circle")
        .attr("class", "particle")
        .attr("cx", function (d) {
            return d.position.x;
        })
        .attr("cy", function (d) {
            return d.position.y;
        })
        .attr("r", 3);

    animate();
}

function animate() {

    return setInterval(function () {

        particles.map(function (p) {
            return p.step();
        });

        svg.selectAll(".particle")
            .data(particles)
            .transition()
            .duration(FRAME_RATE)
            .ease(d3.easeLinear)
            .attr("cx", function (d) {
                if (d) {
                    return d.position.x;
                }
            })
            .attr("cy", function (d) {
                if (d) {
                    return d.position.y;
                }
            })
            .attr("opacity", function (d) {
                if(d.isVisible()) {
                    return d.age / 100;
                }
                return 0;
            });


    }, FRAME_RATE);
}

function calculateTransforms() {
    console.log("calculating pixel transforms...");

    function getTransform(vector2D) {
        var transform = {x: 0, y: 0};
        var nns = [];
        obsSites.forEach(function (obSite) {
            var prob = obSite.position.compare(vector2D, 300);

            if (prob > 0) {
                nns.push(new WeightedTransform(probToWeight(prob), obSite.transform));
            }
        });
        if (nns.length > 0) {
            transform = nns.map(function (a) {
                return {
                    x: a.weight * a.transform.x,
                    y: a.weight * a.transform.y
                };
            }).reduce(function (a, b) {
                return {
                    x: Math.floor(a.x + b.x),
                    y: Math.floor(a.y + b.y)
                };
            });
        }
        return transform;
    };

    for (var y = 0; y < HEIGHT; y++) {
        for (var x = 0; x < WIDTH; x++) {
            var pixel = new Vector2D(x, y);
            if (!transforms[y]) {
                transforms[y] = [];
            }
            transforms[y][x] = getTransform(pixel);
        }
    }
    console.log(transforms.length * transforms[0].length + ' pixel transforms calculated');

}

function probToWeight(prob) {
    var magicWeight = 0.21446;
    return (prob - magicWeight) / (1 - magicWeight);
};

/*
 * HELPER CLASSES
 */
function Vector2D(x, y) {
    var self = this;
    self.x = x;
    self.y = y;
    self.compare = function (other, range) {
        var dx = Math.abs(self.x - other.x);
        var dy = Math.abs(self.y - other.y);
        if (dx > range || dy > range) {
            return 0;
        } else {
            var diff = Math.abs(dx - dy);
            var distance = diff / range;
            return 1 - distance;
        }
    }
}

function ObsSite(position, direction, speed) {
    var self = this;
    self.position = position;
    self.direction = direction;
    self.speed = speed;
    self.transform = new Vector2D(self.speed * Math.sin(self.direction), self.speed * Math.cos(self.direction));
}

function WeightedTransform(weight, transform) {
    var self = this;
    self.weight = weight;
    self.transform = transform;
}

function Particle() {
    var self = this;
    self.previousPosition = null;
    self.position = null;
    self.age = null;
    self.spawn = function () {
        self.age = PARTICLE_AGE;
        self.position = new Vector2D(Math.floor(Math.random() * WIDTH)
            , Math.floor(Math.random() * HEIGHT));
        self.previousPosition = null;
    };
    self.step = function () {
        self.age = self.age - PARTICLE_DECAY_RATE_PER_FRAME;
        if(self.age < 0) {
            self.spawn();
        }
        if (self.isVisible()) {
            self.previousPosition = self.position;

            if (transforms[self.previousPosition.y] && transforms[self.previousPosition.y][self.previousPosition.x]) {
                var transform = transforms[self.previousPosition.y][self.previousPosition.x];
                self.position = new Vector2D(self.previousPosition.x + transform.x, self.previousPosition.y + transform.y);
            } else {
                console.log("Transform undefined", self.previousPosition);
            }
        } else {
            self.age = 0;
        }
    };
    self.isVisible = function () {
        if (self.position.x >= 0
            && self.position.x <= WIDTH
            && self.position.y >= 0
            && self.position.y <= HEIGHT) {
            return true;
        }
        return false;
    };
}
