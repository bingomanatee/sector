var chai = require('chai');
var expect = chai.expect;
var Erosion = require('./../../Erosion').Erosion;
var _ = require('lodash');

describe('Erosion', function () {

    var erosion;
    var randomDigits;
    var digitPlace;

    function random() {
        var digits = randomDigits.slice(digitPlace, digitPlace + 3);
        digitPlace += 3;
        digitPlace %= randomDigits.length;
        var s = '0.' + digits.join('');
        return parseFloat(s);
    }

    beforeEach(function () {

        randomDigits = Math.PI.toString().replace('.', '').split('');
        digitPlace = 0;
        erosion = new Erosion({
            random: random,
            size: 4,
            sedimentErosion: 0.5,
            heights: [
                [100, 100, 150, 100],
                [100, 150, 150, 150],
                [100, 100, 150, 100],
                [100, 100, 100, 100]
            ]
        });
    });

    it('#smooth', function () {
        erosion.smooth();

        expect(erosion.pluck('rock')).to.eql([
            [108.33333333333333, 118.75, 137.5, 125],
            [106.25, 127.27272727272727, 131.8181818181818, 137.5],
            [106.25, 113.63636363636364, 127.27272727272727, 118.75],
            [100, 106.25, 106.25, 108.33333333333333]

        ]);
    });

    it('#hyrdrate', function () {
        console.log('#hydrating:');
        erosion.hydrate(5);
        expect(erosion.pluck('water')).to.eql([
              [1.57, 0.795, 1.3250000000000002, 1.79],
              [4.895, 1.5, 2.0749999999999997, 4.63],
              [2.6750000000000003, 4.485, 4.65, 0.705],
              [2.96, 3.265, 2.945, 3.9650000000000003]
          ]
        );
    });

    describe('#dissolve', function () {
        beforeEach(function () {
            erosion.hydrate(5).dissolve();
        });

        it('should have heights:', function () {
            expect(erosion.heights()).to.eql([
                [101.57, 100.795, 151.325, 101.79],
                [104.895, 151.5, 152.075, 154.63],
                [102.675, 104.485, 154.65, 100.705],
                [102.96, 103.265, 102.945, 103.965]
            ]);
        });

        it('should have sediment: ', function () {
            expect(erosion.pluck('sediment')).to.eql(
              [
                  [0.785, 0.3975, 0.6625000000000001, 0.895],
                  [2.4475, 0.75, 1.0374999999999999, 2.315],
                  [1.3375000000000001, 2.2425, 2.325, 0.3525],
                  [1.48, 1.6325, 1.4725, 1.9825000000000002]
              ]);
        });

        it('should have rock: ', function () {
            expect(erosion.pluck('rock')).to.eql([
                [99.215, 99.6025, 149.3375, 99.105],
                [97.5525, 149.25, 148.9625, 147.685],
                [98.6625, 97.7575, 147.675, 99.6475],
                [98.52, 98.3675, 98.5275, 98.0175]
            ]);
        });
    });

    describe('#flow', function () {
        var erosion;
        var flow;

        beforeEach(function () {
            erosion = new Erosion({
                size: 3,
                sedimentErosion: 0.1,
                random: random,
                heights: [
                    [100, 100, 80],
                    [100, 100, 90],
                    [100, 100, 100]
                ]
            });
            flow = erosion.hydrate(50).dissolve();
        });

        describe.skip('#neighborsBelow', function () {
            var nb;

            beforeEach(function () {
                nb = erosion.neighborsBelow(1, 1);
                //  console.log('nb', nb, nb.neighbors);
            });

            it('should have an averge height of 140', function () {
                expect(nb.averageHeight).to.eql(120.28333333333333);
            });

            it('should have the right height and dHeight', function () {
                var nData = _.map(nb.neighbors, function (n) {
                    return _.pick(n, 'i,j,height,value,dHeight,ratio'.split(','));
                });

                expect(nData).to.eql([
                    {
                        i: 0,
                        j: 2,
                        height: 130,
                        dHeight: 20,
                        "value": {
                            "rock": 75,
                            "sediment": 5,
                            "water": 50
                        },
                        "ratio": 0.6666666666666666
                    },
                    {
                        i: 1,
                        j: 2,
                        height: 140,
                        dHeight: 10,
                        "ratio": 0.3333333333333333,
                        "value": {
                            "rock": 85,
                            "sediment": 5,
                            "water": 50
                        }
                    }
                ]);
            });

            describe('#waterFlow', function () {
                var memo;

                beforeEach(function () {
                    memo = _.map(
                      _.range(0, 3),
                      function () {
                          return _.map(_.range(0, 3), function () {
                              return {
                                  water: 0,
                                  sediment: 0
                              }
                          })
                      }
                    );
                    erosion.waterFlow(nb, memo);
                });

                it.skip('shoud distribute water and sediment in proportion to the dheight', function () {
                    expect(memo).to.eql(
                      [[{"sediment": 0, "water": 0}, {"sediment": 0, "water": 0}, {
                          "sediment": 0.6666666666666666,
                          "water": 6.666666666666666
                      }],
                          [{"sediment": 0, "water": 0}, {"sediment": -1, "water": -10}, {
                              "sediment": 0.3333333333333333,
                              "water": 3.333333333333333
                          }],
                          [{"sediment": 0, "water": 0}, {"sediment": 0, "water": 0}, {"sediment": 0, "water": 0}]]
                    );
                });
            });

        });

        describe('should have rock and erosion', function () {

            it('should have water', function () {
                expect(erosion.pluck('water')).to.eql([
                    [15.7, 7.95, 13.25],
                    [17.9, 48.949999999999996, 15],
                    [20.75, 46.300000000000004, 26.75]
                ]);
            });

            it('should have rock', function () {
                expect(erosion.pluck('rock')).to.eql([
                    [98.43, 99.205, 78.675],
                    [98.21, 95.105, 88.5],
                    [97.925, 95.37, 97.325]
                ]);
            });

            it('should have sediment', function () {
                expect(erosion.pluck('sediment')).to.eql([
                    [1.57, 0.795, 1.3250000000000002],
                    [1.79, 4.895, 1.5],
                    [2.075, 4.630000000000001, 2.6750000000000003]
                ]);
            });
        });

    });
});