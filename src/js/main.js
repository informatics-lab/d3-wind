'use strict';
var uk = require('./data/uk.json');
var moObSites = require('./data/mo-datapoint-obs-sites.json');


const FRAME_RATE = 1000 / 2;
const TRANSFORM_MAGNITUDE = 1 / 4;
const PARTICLE_AGE = 100;
const PARTICLE_DECAY_RATE_PER_FRAME = 10;
const NUM_SITES = 100;
const NUM_PARTICLES = 2000;
var width;
var height;
const WIND_DIRECTIONS = d3.map()
    .set("N", 0)
    .set("NNE", 22.5)
    .set("NE", 45)
    .set("ENE", 67.5)
    .set("E", 90)
    .set("ESE", 112.5)
    .set("SE", 135)
    .set("SSE", 157.5)
    .set("S", 180)
    .set("SSW", 202.5)
    .set("SW", 225)
    .set("WSW", 247.5)
    .set("W", 270)
    .set("WNW", 292.5)
    .set("NW", 315)
    .set("NNW", 337.5);

var svg;
var obsSites = [];
var transforms = [];
var particles = [];

init();

function init() {
    width = window.innerWidth;
    height = window.innerHeight;

    obsSites = moObSites.map(function (moObSite) {
        return {
            type: "Feature",
            geometry: {
                type: "Point",
                coordinates: [moObSite.longitude, moObSite.latitude]
            },
            properties: moObSite
        }
    });

    // generate sites and particles
    // obsSites = d3.range(NUM_SITES).map(function () {
    //     return new ObsSite(new Vector2D(Math.random() * width, Math.random() * height),
    //         Math.floor(Math.random() * 360),
    //         Math.floor(Math.random() * 20));
    // });



    particles = d3.range(NUM_PARTICLES).map(function () {
        var p = new Particle();
        p.spawn();
        return p;
    });

    svg = d3.select("svg")
        .attr("width", width)
        .attr("height", height);

    //set up a geo projection function
    var projection = d3.geoAlbers()
        .center([0, 54.4])
        .rotate([4.4, 0])
        .parallels([50, 60])
        .scale((width * height) / 200)
        .translate([width / 2, height / 2]);

    var path = d3.geoPath()
        .projection(projection)
        .pointRadius(2);

    svg.append("path")
        .datum(topojson.feature(uk, uk.objects.subunits))
        .attr("d", path)
        .attr("class", "uk");

    svg.selectAll(".site")
        .data(obsSites)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("class", "site")
        .each(function(data){
            var centroid = path.centroid(data);
            data.properties.direction = Math.floor(Math.random() * 360);
            data.properties.speed = Math.floor(Math.random() * 20);

            data.properties.position = new Vector2D(Math.floor(centroid[0]),Math.floor(centroid[1]));
            data.properties.transform = new Vector2D(data.properties.speed * Math.sin(data.properties.direction),
                data.properties.speed * Math.cos(data.properties.direction));
        })
        .on('mouseover', function (d) {
            console.log(d);
        });

    calculateTransforms();

    // //draw the sites to screen
    // svg.selectAll(".site")
    //     .data(obsSites)
    //     .enter()
    //     .append("circle")
    //     .attr("class", "site")
    //     .attr("cx", function (d) {
    //         return d.position.x;
    //     })
    //     .attr("cy", function (d) {
    //         return d.position.y;
    //     })
    //     .attr("r", 10)
    //     .on('mouseover', function(d) {
    //        console.log(d);
    //     });

    // draw the initial particles to screen
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
        .attr("r", 2);

    animate();
}

/**
 * Animation loop called as per the FRAME_RATE setting
 * @returns {number}
 */
function animate() {
    return setInterval(function () {

        svg.selectAll(".particle")
            .data(particles)
            .each(function (d) {
                d.step();
            })
            .transition()
            .duration(FRAME_RATE)
            .ease(d3.easeLinear)
            .attr("cx", function (d) {
                return d.position.x;
            })
            .attr("cy", function (d) {
                return d.position.y;
            })
            .attr("opacity", function (d) {
                if (d.isInBounds() && d.age < 100) {
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
            var prob = obSite.properties.position.compare(vector2D, 300);

            if (prob > 0) {
                nns.push(new WeightedTransform(probToWeight(prob), obSite.properties.transform));
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

    for (var y = 0; y < height; y++) {
        for (var x = 0; x < width; x++) {
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
        self.position = new Vector2D(Math.floor(Math.random() * width)
            , Math.floor(Math.random() * height));
        self.previousPosition = null;
    };
    self.step = function () {
        self.age = self.age - Math.floor(Math.random() * PARTICLE_DECAY_RATE_PER_FRAME);
        if (self.age < 0) {
            self.spawn();
        }
        if (self.isInBounds()) {
            self.previousPosition = self.position;
            var transform = transforms[self.previousPosition.y][self.previousPosition.x];
            self.position = new Vector2D(self.previousPosition.x + Math.floor(transform.x * TRANSFORM_MAGNITUDE),
                self.previousPosition.y + Math.floor(transform.y * TRANSFORM_MAGNITUDE));
        } else {
            self.age = -5;
        }
    };
    self.isInBounds = function () {
        if (self.position.x >= 0
            && self.position.x < width
            && self.position.y >= 0
            && self.position.y < height) {
            return true;
        }
        return false;
    };
}
