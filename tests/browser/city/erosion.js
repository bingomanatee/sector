var canvas = document.getElementById('terrainCanvas');

noise.seed(Math.random());

var CELLSIZE = 2;
var SIZE = canvas.width / CELLSIZE;
var NOISE_SCALE = 60;
var NOISE_DIF = 4;
var NOISE_SCALE_2 = 30;
var NOISE_DIF_2 = 8;
var RAND_SCALE = 2;
var cycles = 0;
var CYCLES = 8;
var MAX_CYCLES = 60;
var WATER_SCALE = 1;

var erosion;

function render(canvas, doBlue) {
    var ctx = canvas.getContext('2d');
    ctx.fillColor = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    erosion.data.each(function (i, j, cell) {
        var height = erosion.height(cell);
        var shade = Math.max(0, Math.min(255, (255 * height / 150)));
        ctx.fillStyle = 'rgb(' + Math.floor(shade) + ',' + Math.round(shade) + ',' + Math.ceil(shade) + ')';
        ctx.fillRect(CELLSIZE * i, CELLSIZE * j, CELLSIZE, CELLSIZE);
        if (doBlue) {
            var green = Math.max(0, Math.min(255, Math.floor(255 * (cell.water - WATER_SCALE))));
            var blue = 'rgba(0,' + green + ',255,' + Math.min(1, cell.water / WATER_SCALE) + ')';
            ctx.fillStyle = blue;
            ctx.fillRect(CELLSIZE * i, CELLSIZE * j, CELLSIZE / 2, CELLSIZE / 2);
        }
    });

}

erosion = new Erosion({
    size: SIZE,
    waterAmount: 8,
    chanceOfRain: 0.001,
    sedToWater: 0.01,
    smoothDrop: 4,
    sedInWater: 0.75,
    sedSaturation: 0.05,
    evaporateRate: 0.5,
    randomness: 0.01,
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