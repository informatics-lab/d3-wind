'use strict';
var uk = require('./data/uk.json');
var moObSites = require('./data/mo-datapoint-obs-sites.json');


const FRAME_RATE = 1000 / 2;
const TRANSFORM_MAGNITUDE = 1 / 4;
const AREA_OF_INFLUENCE = 100;
const PARTICLE_AGE = 100;
const PARTICLE_DECAY_RATE_PER_FRAME = 10;
const NUM_PARTICLES = 4000;
const MAX_SPEED = 20;
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
    width = window.innerWidth / 2;
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
        .scale((width * height) / 100)
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
            data.properties.speed = Math.floor(Math.random() * MAX_SPEED);

            data.properties.position = new Vector2D(Math.floor(centroid[0]),Math.floor(centroid[1]));
            data.properties.transform = new Vector2D(data.properties.speed * Math.sin(data.properties.direction),
                data.properties.speed * Math.cos(data.properties.direction));
        })
        .on('mouseover', function (d) {
            console.log(d);
        });

    calculateTransforms();

    /* view calculated transforms */
    // svg.selectAll(".transform-row")
    //     .data(transforms)
    //     .enter()
    //     .selectAll(".transform")
    //     .data(function(d,transformRow) {
    //         d.forEach(function (e){
    //             e.transformRow=transformRow;
    //         });
    //         return d;
    //     })
    //     .enter()
    //     .append("rect")
    //     .attr("class", "transform")
    //     .attr("x", function(d,x) {
    //         return x;
    //     })
    //     .attr("y", function(d){
    //         return d.transformRow;
    //     })
    //     .attr("width", 1)
    //     .attr("height", 1)
    //     .attr("opacity", 0.2)
    //     .style("fill", function(d){
    //         if(d && !(d.x === 0 && d.y === 0)) {
    //             return "green"
    //         } else {
    //             return "red";
    //         }
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
                if (d.isInBounds()
                    && d.age < PARTICLE_AGE - PARTICLE_DECAY_RATE_PER_FRAME
                    && d.age > 0 + PARTICLE_DECAY_RATE_PER_FRAME) {
                    return d.age / PARTICLE_AGE;
                }
                return 0;

            })
            .style("fill", function (d) {
                return d3.interpolateViridis(d.speed/(MAX_SPEED/2));
            })
            .attr("r", function(d) {
                return d.speed + 1;
            });

    }, FRAME_RATE);
}

function calculateTransforms() {
    var t1 = new Date().getTime();
    console.log("calculating pixel transforms...");

    for (var y = 0; y < height; y++) {
        for (var x = 0; x < width; x++) {
            var pixel = new Vector2D(x, y);
            if (!transforms[y]) {
                transforms[y] = [];
            }
            transforms[y][x] = getTransform(pixel);
        }
    }
    var t2 = new Date().getTime();
    console.log(transforms.length * transforms[0].length + ' pixel transforms calculated in '+ (t2-t1));

}

function getTransform(vector2D) {
    var transform = {x: 0, y: 0};
    var sumComparisons = 0;
    var nns = obsSites.filter(function (obSite) {
        var dist = obSite.properties.position.distanceFrom(vector2D);
        if (dist < AREA_OF_INFLUENCE) {
            var comparison = 1 - normalise(0, AREA_OF_INFLUENCE, dist).toFixed(5);
            if (comparison > 0) {
                sumComparisons += parseFloat(comparison);
                obSite.comparison = comparison;
                return true;
            }
        }
        return false;
    });
    if (nns.length > 0) {
        transform = nns.map(function (a) {
            var weight = a.comparison/sumComparisons;
            return {
                x: weight * a.properties.transform.x,
                y: weight * a.properties.transform.y
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


/**
 * Convert a value in a given range into a value between 1 and 0
 * @param min - the minimum value of the current range
 * @param max - the maximum value of the current range
 * @param value - the value within the current range
 * @returns {number} normalised valued
 */
function normalise(min, max, value) {
    //Convert the range into a 0-1 range (float)
    var a = value - min;
    var b = max - min;
    if (b == 0) {
        return 1;
    } else {
        var c = a / b;
        return c;
    }
}

/*
 * HELPER CLASSES
 */
function Vector2D(x, y) {
    var self = this;
    self.x = x;
    self.y = y;
    self.distanceFrom = function(other) {
        return Math.sqrt(Math.pow(other.x - self.x, 2) + Math.pow(other.y - self.y, 2)).toFixed(5);
    }
}

function Particle() {
    var self = this;
    self.previousPosition = null;
    self.position = null;
    self.age = null;
    self.decayRate = null;
    self.speed = null;
    self.spawn = function () {
        self.age = PARTICLE_AGE;
        self.decayRate = Math.floor(Math.random() * (PARTICLE_DECAY_RATE_PER_FRAME - PARTICLE_DECAY_RATE_PER_FRAME/2)) + PARTICLE_DECAY_RATE_PER_FRAME/2;
        self.position = new Vector2D(Math.floor(Math.random() * width)
            , Math.floor(Math.random() * height));
        self.previousPosition = null;
    };
    self.step = function () {
        self.age = self.age - self.decayRate;
        if (self.age < 0) {
            self.spawn();
            return;
        }
        if (self.isInBounds()) {
            self.previousPosition = self.position;
            var transform = transforms[self.previousPosition.y][self.previousPosition.x];
            self.position = new Vector2D(self.previousPosition.x + Math.floor(transform.x * TRANSFORM_MAGNITUDE),
                self.previousPosition.y + Math.floor(transform.y * TRANSFORM_MAGNITUDE));
            self.speed = self.previousPosition.distanceFrom(self.position);
            if(self.speed == 0) {
                self.age = -5;
                return;
            }
            return;
        } else {
            self.age = -5;
            return;
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
