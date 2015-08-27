var canvas = document.getElementById('terrainCanvas');

noise.seed(Math.random());

function render(canvas) {
    var ctx = canvas.getContext('2d');
    ctx.fillColor = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    _.each(erosion.data.data, function (row, i) {
        _.each(row, function (cell, j) {
            var shade = Math.max(0, Math.min(255, Math.floor(255 * (cell.rock + cell.sediment - 40) / 100)));
            ctx.fillStyle = 'rgb(' + shade + ',' + shade + ',' + shade + ')';
            ctx.fillRect(i, j, 1, 1);
        });
    });

}

var NOISE_SCALE = 40;
var NOISE_DIF = 6;
var NOISE_SCALE_2 = 10;
var NOISE_DIF_2 = 10;
var RAND_SCALE = 4;

var erosion = new Erosion({
    size: canvas.width,
    randPow: 2,
    defaultHydration: 6,
    evaporation: 0.6,
    sedInWater: 0.0125,
    sedimentErosion: 0.02,
    fastDrop: false,
    heightFn: function (i, j) {
        return (i - canvas.width / 2) * -150 / canvas.width
          + 60
              //+ 10 * Math.random()
          + RAND_SCALE * Math.random()
          + NOISE_SCALE * noise.simplex2(i * NOISE_DIF / canvas.width, j * NOISE_DIF / canvas.width);
    }
});

noise.seed(Math.random());
erosion.data.each(function (i, j, cell) {
    cell.rock += NOISE_SCALE_2 * Math.abs(noise.perlin2(j * NOISE_DIF_2 / canvas.width, i * NOISE_DIF_2 / canvas.width))
});
render(canvas);
var image = new Image();
image.src= canvas.toDataURL('image.png');
document.getElementById('imgDiv2').appendChild(image);
render(document.getElementById('terrainCanvas2'));

var cycles = 0;
var CYCLES = 8          ;
var MAX = 30;
function loop() {
    erosion.cycle(CYCLES);

    render(canvas);
    ++cycles;
    document.getElementById('cycles').innerHTML = '' + (cycles * CYCLES);
    document.getElementById('iter').innerHTML = '' + cycles;
    if (MAX > cycles) {
        setTimeout(loop, 500);
    } else {
        var image = new Image();
        image.src = canvas.toDataURL('image/png');
        document.getElementById('imgDiv').appendChild(image);
    }
};

loop();