var canvas = document.getElementById('terrainCanvas');

noise.seed(Math.random());

var CELLSIZE = 3;
var SIZE = canvas.width / CELLSIZE;
var NOISE_SCALE = 100;
var NOISE_DIF = 6;
var NOISE_SCALE_2 = 15;
var NOISE_DIF_2 = 16;
var RAND_SCALE = 2;
var cycles = 0;
var CYCLES = 5;
var MAX_CYCLES = 20;
var WATER_SCALE = 1;
var HEIGHT_POW = 1.95;
var HEIGHT_FACTOR = 0.05;
var SLOPE_SCALE = 100;
var SLOPE_OFFSET = 0.25;
var erosion;

function render(canvas, doBlue) {
    var ctx = canvas.getContext('2d');
    ctx.fillColor = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    erosion.data.each(function (i, j) {
        var height = erosion.height(i, j);
        var shade = Math.max(0, Math.min(255, (255 * height / 200)));
        ctx.fillStyle = 'rgb(' + Math.floor(shade) + ',' + Math.round(shade) + ',' + Math.ceil(shade) + ')';
        ctx.fillRect(CELLSIZE * i, CELLSIZE * j, CELLSIZE, CELLSIZE);
        if (doBlue) {
            var green = Math.max(0, Math.min(255, Math.floor(255 * (this.waterIJ(i, j) - WATER_SCALE))));
            var blue = 'rgba(0,' + green + ',255,' + Math.min(1, this.waterIJ(i, j) / WATER_SCALE) + ')';
            ctx.fillStyle = blue;
            ctx.fillRect(CELLSIZE * i, CELLSIZE * j, CELLSIZE / 2, CELLSIZE / 2);
        }
    });

}

erosion = new ErosionMulti({
    size: SIZE,
    evaporationRate: 0.8,
    chanceOfRain: 0.01,
    amountOfRain: 1,
    dissolveRatio: 0.0125,
    saturationRatio: 0.025,
    rock: function (i, j) {
        var random = RAND_SCALE * Math.random();
        var slope = SLOPE_SCALE * (SLOPE_OFFSET + (i - SIZE / 2) * -1 / SIZE);
        var hills = Math.abs( NOISE_SCALE * noise.perlin2(i * NOISE_DIF / SIZE, j * NOISE_DIF / SIZE));
       // var hi = hills < 0 ? -1 : 1;
        hills = HEIGHT_FACTOR * Math.pow(Math.abs(hills), HEIGHT_POW);
        var height = slope
          + random
          + hills;
        if (i > SIZE * 0.6) {
            height *= (SIZE - i) / (SIZE * 0.4)
        }
        return height;
    }
});

if (true) {
    noise.seed(Math.random());
    erosion.data.rockIJset(function (i, j, rock) {
        return rock + NOISE_SCALE_2 * (noise.perlin2(j * NOISE_DIF_2 / SIZE, i * NOISE_DIF_2 / SIZE))
    });
}

render(canvas);
var image = new Image();
image.src = canvas.toDataURL('image.png');
document.getElementById('imgDiv2').appendChild(image);
render(document.getElementById('terrainCanvas2'));

function doErode() {

    function loop() {
        erosion.cycle(CYCLES);

        render(canvas, true);
        ++cycles;
        document.getElementById('cycles').innerHTML = '' + (cycles * CYCLES);
        document.getElementById('iter').innerHTML = '' + cycles;
        if (MAX_CYCLES > cycles) {
            setTimeout(loop);
        } else {
            render(canvas);
            var image = new Image();
            image.src = canvas.toDataURL('image/png');
            document.getElementById('imgDiv').appendChild(image);
        }
    };

    setTimeout(loop);
}

$('.doErode').click(doErode);