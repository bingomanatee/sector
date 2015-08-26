var canvas = document.getElementById('terrainCanvas');

noise.seed(Math.random());

function render(canvas, doBlue) {
    var ctx = canvas.getContext('2d');
    ctx.fillColor = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    var WATER_SCALE = 2;

    _.each(erosion.data.data, function (row, i) {
        _.each(row, function (cell, j) {
            var shade = Math.max(0, Math.min(255, Math.floor(255 * (cell.rock + cell.sediment - 40) / 100)));
            ctx.fillStyle = 'rgb(' + shade + ',' + shade + ',' + shade + ')';
            ctx.fillRect(CELLSIZE * i, CELLSIZE * j, CELLSIZE, CELLSIZE);
         if (doBlue){
             var green = Math.max(0, Math.min(255, Math.floor(255 * (cell.water - WATER_SCALE))));
             var blue = 'rgba(0,' + green + ',255,' + Math.min(1, cell.water / WATER_SCALE) + ')';
             ctx.fillStyle = blue;
             ctx.fillRect(CELLSIZE * i, CELLSIZE * j, CELLSIZE / 2, CELLSIZE / 2);
         }
        });
    });

}

var CELLSIZE = 8;
var SIZE = canvas.width / CELLSIZE;
var NOISE_SCALE = 40;
var NOISE_DIF = 10;
var NOISE_SCALE_2 = 5;
var NOISE_DIF_2 = 3;
var RAND_SCALE = 2;

var erosion = new Erosion({
    size: SIZE,
    randPow: 3,
    defaultHydration: 1,
    evaporation: 0.25,
    sedInWater: 0.05,
    sedimentErosion: 0.01,
    fastDrop: false,
    maxErosion: 1,
    heightFn: function (i, j) {
        return (i - SIZE / 2) * -150 / SIZE
          + 60
              //+ 10 * Math.random()
          + RAND_SCALE * Math.random()
          + NOISE_SCALE * noise.simplex2(i * NOISE_DIF / SIZE, j * NOISE_DIF / SIZE);
    }
});

noise.seed(Math.random());
erosion.data.each(function (i, j, cell) {
    cell.rock += NOISE_SCALE_2 * Math.abs(noise.perlin2(j * NOISE_DIF_2 / SIZE, i * NOISE_DIF_2 / SIZE))
});
render(canvas);
var image = new Image();
image.src = canvas.toDataURL('image.png');
document.getElementById('imgDiv2').appendChild(image);
render(document.getElementById('terrainCanvas2'));

var cycles = 0;
var CYCLES = 8;
var MAX = 30;
function loop() {
    erosion.cycle(CYCLES);

    render(canvas, true);
    ++cycles;
    document.getElementById('cycles').innerHTML = '' + (cycles * CYCLES);
    document.getElementById('iter').innerHTML = '' + cycles;
    if (MAX > cycles) {
        setTimeout(loop, 500);
    } else {
        render(canvas);
        var image = new Image();
        image.src = canvas.toDataURL('image/png');
        document.getElementById('imgDiv').appendChild(image);
    }
};

loop();