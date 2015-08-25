var chai = require('chai');
var expect = chai.expect;
var Erosion = require('./../../Erosion').Erosion;
var _ = require('lodash');

describe('Erosion', function () {

    var erosion;

    beforeEach(function () {
        erosion = new Erosion({
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
            [108.33333333333334, 115, 140, 125],
            [105, 134.375, 137.5, 140],
            [105, 109.375, 134.375, 115],
            [100, 105, 105, 108.33333333333334]
        ]);
    });

    it('#hyrdrate', function () {
        erosion.hydrate(5);
        expect(erosion.pluck('water')).to.eql([[5, 5, 5, 5], [5, 5, 5, 5], [5, 5, 5, 5], [5, 5, 5, 5]]);
        expect(erosion.heights()).to.eql([
            [105, 105, 155, 105],
            [105, 155, 155, 155],
            [105, 105, 155, 105],
            [105, 105, 105, 105]
        ]);
    });

    describe('#dissolve', function () {
        beforeEach(function () {
            erosion.hydrate(5).dissolve();
        });

        it('should have heights:', function () {
            expect(erosion.heights()).to.eql([
                [105, 105, 155, 105],
                [105, 155, 155, 155],
                [105, 105, 155, 105],
                [105, 105, 105, 105]
            ]);
        });

        it('should have sediment: ', function () {
            expect(erosion.pluck('sediment')).to.eql([
                [2.5, 2.5, 2.5, 2.5],
                [2.5, 2.5, 2.5, 2.5],
                [2.5, 2.5, 2.5, 2.5],
                [2.5, 2.5, 2.5, 2.5]
            ]);
        });

        it('should have rock: ', function () {
            expect(erosion.pluck('rock')).to.eql([
                [97.5, 97.5, 147.5, 97.5],
                [97.5, 147.5, 147.5, 147.5],
                [97.5, 97.5, 147.5, 97.5],
                [97.5, 97.5, 97.5, 97.5]
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
                heights: [
                    [100, 100, 80],
                    [100, 100, 90],
                    [100, 100, 100]
                ]
            });
            flow = erosion.hydrate(50).dissolve();
        });

        describe('#neighborsBelow', function () {
            var nb;

            beforeEach(function () {
                nb = erosion.neighborsBelow(1, 1);
                //  console.log('nb', nb, nb.neighbors);
            });

            it('should have an averge height of 140', function () {
                expect(nb.averageHeight).to.eql(140);
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

                it('shoud distribute water and sediment in proportion to the dheight', function () {
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
            it('should have rock', function () {
                expect(erosion.pluck('rock')).to.eql([
                    [95, 95, 75],
                    [95, 95, 85],
                    [95, 95, 95]
                ]);
            });

            it('should have sediment', function () {
                expect(erosion.pluck('sediment')).to.eql([
                    [5, 5, 5],
                    [5, 5, 5],
                    [5, 5, 5]
                ]);
            });

            it('should have water', function () {
                expect(erosion.pluck('water')).to.eql([
                    [50, 50, 50],
                    [50, 50, 50],
                    [50, 50, 50]
                ]);
            });
        });

    });
});