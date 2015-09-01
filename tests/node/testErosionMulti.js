var chai = require('chai');
var expect = chai.expect;
var ErosionPacked = require('./../../ErosionMulti').ErosionMulti;
var _ = require('lodash');
var util = require('util');

describe('ErosionMulti', function () {
    var erosion;

    beforeEach(function () {
        var randomValues = [
            0,
            1,
            0.1,
            0.9,
            0.2,
            0.8,
            0.3,
            0.7,
            0.4,
            0.6,
            0.5
        ];
        var randomIndex = 0;
        erosion = new ErosionPacked({
            size: 5,
            rock: 100,
            chanceOfRain: 0.25,
            waterToNeighbors: 0.1,
            saturationRatio: 0.5,
            transportRatio: 0.25,
            randomness: 0.1,
            amountOfRain: 10,
            dissolveRatio: 0.25,
            randomValue: function () {
                var value = randomValues[randomIndex];
                randomIndex = (randomIndex + 1) % randomValues.length;
                return value;
            }
        });

        erosion.data.rockIJset(function (i, j) {
            if (j < 2) {
                return 100;
            } else if (j > 2) {
                if (i === 0) {
                    return 150;
                }
            }
            return 120;
        });
        //console.log('erosion: ', util.inspect(erosion, {depth: 4}));
    });

    it('should start with rock', function () {
        var rocks = erosion.data.rockValues(true);

        expect(rocks).to.eql([
            100, 100, 120, 150, 150,
            100, 100, 120, 120, 120,
            100, 100, 120, 120, 120,
            100, 100, 120, 120, 120,
            100, 100, 120, 120, 120
        ]);
    });

    it('#rain', function () {
        erosion.rain();
        var water = erosion.data.waterValues(true);
        //  console.log('water:', water);
        expect(water).to.eql(
          [
              10, 2, 10, 2, 10,
              2, 3, 3, 3, 2,
              2, 11, 2, 10, 1,
              11, 3, 3, 3, 2,
              1, 2, 10, 2, 10
          ]
        );
    });

    it('#height', function () {
        erosion.data.rockIJ(0, 0, 100);
        erosion.data.sedIJ(0, 0, 50);
        erosion.data.waterIJ(0, 0, 25);

        expect(erosion.height(0, 0)).to.eql(175);
    });

    it('#dissolve', function () {
        erosion.data.waterIJset(function () {
            return 100;
        });

        erosion.dissolve();

        var sed2s = erosion.data.sed2Values(true);
        expect(sed2s).to.eql([25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25]);
        var rock2s = erosion.data.rock2Values(true);
        expect(rock2s).to.eql([-25, -25, -25, -25, -25, -25, -25, -25, -25, -25, -25, -25, -25, -25, -25, -25, -25, -25, -25, -25, -25, -25, -25, -25, -25]);
    });

    describe('#flow', function () {

        var lowest;
        var cell02height;

        beforeEach(function () {
            erosion.data.waterIJset(function (i, j) {
                return 100;
            });
            erosion.data.sedIJset(function (i, j) {
                return i + 5 * j;
            });
            cell02height = erosion.height(0, 2);
            lowest = erosion.lowestNeighbor(0, 2);
        });

        it('#lowestNeighbor', function () {
            expect(lowest).to.eql({i: 0, j: 1, height: 205, r: 0});
        });

        it('#transport', function () {
            erosion.transport(0, 2, lowest);
            expect(erosion.data.water2IJ(0, 2)).to.eql(-12.5);
            expect(erosion.data.sed2IJ(0, 2)).to.eql(-1.25);
        });

    });

    describe('#evaporate', function () {
        beforeEach(function () {
            erosion.data.rockIJset(100);
            erosion.data.waterIJset(function (i, j) {
                return i * 10;
            });
            erosion.data.sedIJset(function (i, j) {
                return j * 10;
            });

            console.log('water: ');
            console.log(_.chunk(erosion.data.waterValues(), 5));
            console.log('sed: ');
            console.log(_.chunk(erosion.data.sedValues(), 5));
            erosion.evaporate();
            console.log('postevap water: ');
            console.log(_.chunk(erosion.data.waterValues(), 5));
            console.log('postevap sed: ');
            console.log(_.chunk(erosion.data.sedValues(), 5));
            console.log('postevap rock: ');
            console.log(_.chunk(erosion.data.rockValues(), 5));

        });

        it('should change the rocks', function () {
            var rocks = erosion.data.rockValues(true);
            expect(rocks).to.eql(
              [
                  100, 110, 120, 130, 140 ,
                   100, 107.5, 137.5, 147.5, 157.5 ,
                   100, 105, 135, 145, 155 ,
                   100, 102.5, 132.5, 142.5, 152.5 ,
                   100, 100, 130, 140, 150
              ]

            );
        });

        it('should change the seds', function () {
            var seds = erosion.data.sedValues(true);
            expect(seds).to.eql(
              [
                  0, 0, 0, 0, 0,
                  0, 2.5, 2.5, 2.5, 2.5,
                  0, 5, 5, 5, 5,
                  0, 7.5, 7.5, 7.5, 7.5,
                  0, 10, 10, 10, 10
              ]
            );
        })
    });

    describe.only('#update', function(){
        beforeEach(function(){
            erosion.data.sed2IJset(5);
            erosion.data.rock2IJset(2);
            erosion.data.water2IJset(4);
            erosion.data.waterIJset(3);
            erosion.data.rockIJset(120);
            erosion.data.sedIJset(1);

            erosion.update();
        });

        it('should end up with six sed', function(){
            expect(erosion.data.sedIJ(1, 1)).to.eql(6);
        })
    });
});