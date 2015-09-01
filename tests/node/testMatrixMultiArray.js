var chai = require('chai');
var expect = chai.expect;
var _ = require('lodash');
var MatrixMultiArray = require('./../../MatrixMultiArray').MatrixMultiArray;
var Matrix = require('./../../Matrix').Matrix;
var util = require('util');

describe('MatrixMultiArray', function () {

    describe('foundation', function () {

        var mpa;

        beforeEach(function () {
            mpa = new MatrixMultiArray(['foo', 'bar', 'vey'], 4);

        });

        describe('#goodIndex', function () {

            it('should accept good values', function () {
                expect(mpa.goodIndex(0)).to.be.true;
                expect(mpa.goodIndex(3)).to.be.true;
            });

            it('should reject floats', function () {
                expect(mpa.goodIndex(0.5)).to.be.false;
            }),

              it('should reject low values', function () {
                  expect(mpa.goodIndex(-1)).to.be.false;
              });

            it('should reject high values', function () {
                expect(mpa.goodIndex(4)).to.be.false;
            })

        });

        describe('#getIJ/#setIJ', function () {
            beforeEach(function () {
                for (var i = 0; i < 4; ++i) {
                    for (var j = 0; j < 4; ++j) {
                        mpa.fooIJ(i, j, ((i * 4) + j) * 2);
                        mpa.barIJ(i, j, (i * 4) + j);
                        mpa.veyIJ(i, j, ((i * 4) + j) * 100);
                    }
                }
            });

            it('should et the values for foo var and vey', function () {
                for (var i = 0; i < 4; ++i) {
                    for (var j = 0; j < 4; ++j) {
                        expect(mpa.fooIJ(i, j)).to.eql(((i * 4) + j) * 2);
                        expect(mpa.barIJ(i, j)).to.eql((i * 4) + j);
                        expect(mpa.veyIJ(i, j)).to.eql(((i * 4) + j) * 100);
                    }
                }
            });
        });

        describe('#IJset', function(){
            beforeEach(function(){
                mpa.each(function(i, j){
                    mpa.fooIJ(i, j, 1);
                    mpa.barIJ(i, j, 2);
                });

                mpa.fooIJset(5);
                mpa.barIJset(function(i, j){ return 10 * i;});

            });

            it('should set foo', function(){
                expect(mpa.fooIJ(1, 1)).to.eql(5);
            });

            it('should set bar', function(){
                expect(mpa.barIJ(1, 1)).to.eql(10);
            })

        })
    });

    describe('#neighbors', function () {
        var mpa3;

        beforeEach(function () {
            mpa3 = new MatrixMultiArray(['num'], 4);

            mpa3.numIJset(function (i, j) {
                return i * 4 + j + 1;
            });
        });

        it('should return the topLeft content at 0, 0', function () {
            var exp = [null, null, null , null, null, null, null, null, null];
            exp[4] = 1;
            exp[5] = 2;
            exp[7] = 5;
            exp[8] = 6;
            expect(mpa3.numIJneighbors(0, 0)).to.eql(exp);
        });

    });

    describe('#Update', function () {
        var mpa4;
        beforeEach(function () {
            mpa4 = new MatrixMultiArray(['num'], 3);

            mpa4.numIJset(function (i, j) {
                return i * 3 + j;
            });
            mpa4.numIJupdate(function (i, j, value) {
                return 2 * value;
            });
        });

        it('should double numbers on update', function () {
            expect(mpa4.numValues(true)).to.eql(_.range(0, 18, 2));
        });
    });

    describe('#add', function(){

        var mpa5;
        beforeEach(function () {
            mpa5 = new MatrixMultiArray(['num'], 3);

            mpa5.numIJset(function (i, j) {
                return 5;
            });
        });

        it('should let us add', function(){
            mpa5.numIJadd(1, 1, 8);
            expect(mpa5.numIJ(1,1)).to.eql(13);
        })
    });

    describe.skip('benchmrking', function () {
        var SIZE = 100;
        var r = 0;
        var seedFn = function (i, j) {
            if (i == 0 && j == 0) {
                r = 0;
            }
            if (i % 2 || j % 2) {
                return 0;
            }
            return ++r * 10;
        };

        var seedFnM = function (i, j) {
            var n = seedFn(i, j);
            return {height: n};
        };

        describe('smoothing with matrix', function () {
            var mValues, mSmooth;
            mSmooth = function () {
                mValues.update(function (i, j, value) {
                    var neighbors = this.neighbors9(i, j).concat(value);
                    var count = 0;
                    var out = _.reduce(neighbors, function (out, v) {
                        if (v) {
                            out.height += v.height;
                            ++count
                        }
                        return out;
                    }, {height: 0});
                    out.height /= count;
                    return out;
                });
            };

            beforeEach(function () {
                mValues = Matrix.generate(SIZE, seedFnM);
            });

            it.skip('should smooth matrix values', function () {
                mSmooth();
                var out = mValues.map(function (i, j, value) {
                    return Math.floor(value.height);
                }, null);
                expect(out).to.eql([
                    [2, 5, 3, 8, 5, 11, 6, 15, 8, 12],
                    [11, 17, 10, 22, 12, 26, 14, 31, 16, 25],
                    [10, 14, 7, 16, 8, 18, 10, 21, 11, 16],
                    [28, 40, 21, 44, 23, 48, 25, 53, 27, 41],
                    [18, 25, 13, 27, 14, 30, 15, 32, 16, 25],
                    [45, 62, 32, 66, 34, 71, 36, 75, 38, 58],
                    [26, 36, 18, 38, 20, 41, 21, 43, 22, 33],
                    [61, 84, 43, 88, 45, 93, 47, 97, 50, 75],
                    [35, 47, 24, 50, 25, 52, 26, 54, 27, 41],
                    [52, 71, 36, 75, 38, 78, 40, 81, 41, 62]
                ]);
            });

            it('should smooth matrix slower', function () {
                this.timeout(50000);

                var time = new Date().getTime();

                var times = 1000;
                while (times > 0) {
                    --times;
                    mSmooth();
                }

                var ttc = new Date().getTime() - time;
                console.log('time to complete Matrix:', ttc);
                expect(ttc).to.be.below(30000);
            });
        });

        describe('smoothing with packed array', function () {
            var values, smooth;
            beforeEach(function () {
                values = new MatrixMultiArray({
                    height: MatrixMultiArray.TYPES.Float32
                }, SIZE);

                values.heightIJset(seedFn);

                smooth = function () {
                    values.heightIJupdate(function (i, j, v) {
                        var total = 0;
                        var count = 0;
                        this.heightIJneighbors(i, j, function (ii, jj, value) {
                            ++count;
                            total += value;
                        });
                        return total / count;
                    });
                };
            });

            it.skip('should smooth values: ', function () {
                var dataExp = [
                    2, 5, 3, 8, 5, 11, 6, 15, 8, 12,
                    11, 17, 10, 22, 12, 26, 14, 31, 16, 25,
                    10, 14, 7, 16, 8, 18, 10, 21, 11, 16,
                    28, 40, 21, 44, 23, 48, 25, 53, 27, 41,
                    18, 25, 13, 27, 14, 30, 15, 32, 16, 25,
                    45, 62, 32, 66, 34, 71, 36, 75, 38, 58,
                    26, 36, 18, 38, 20, 41, 21, 43, 22, 33,
                    61, 84, 43, 88, 45, 93, 47, 97, 50, 75,
                    35, 47, 24, 50, 25, 52, 26, 54, 27, 41,
                    52, 71, 36, 75, 38, 78, 40, 81, 41, 62
                ];
                smooth();
                expect(_.map(values.heightValues(true), Math.floor.bind(Math))).to.eql(dataExp);
            });

            it('should smooth fairly fast', function () {
                this.timeout(50000);
                var time = new Date().getTime();

                var times = 1000;
                while (times > 0) {
                    --times;
                    smooth();
                }

                var ttc = new Date().getTime() - time;
                console.log('time to complete Packed Matrix:', ttc);
                expect(ttc).to.be.below(30000);
            });
        });

        describe('smooth and slope', function () {
            describe('packed array', function () {

                var ssValues;

                function smooth() {
                    ssValues.heightIJupdate(function (i, j, v) {
                        var total = 0;
                        var count = 0;
                        this.heightIJneighbors(i, j, function (ii, jj, value) {
                            ++count;
                            total += value;
                        });
                        return total / count;
                    });
                };

                function slopeFn(i, j, s) {
                    var left = (this.goodIndex(i - 1, j)) ? this.heightIJ(i - 1, j) : this.heightIJ(i, j);
                    var right = (this.goodIndex(i + 1, j)) ? this.heightIJ(i + 1, j) : this.heightIJ(i, j);
                    return right - left;
                }

                function slope() {
                    ssValues.slopeIJset(slopeFn);
                }

                beforeEach(function () {
                    ssValues = new MatrixMultiArray({
                        slope: MatrixMultiArray.TYPES.Float32,
                        height: MatrixMultiArray.TYPES.Float32
                    }, SIZE);

                    ssValues.heightIJset(seedFn);
                    slope();
                });

                it('should do smooth and slope fairly fast', function () {
                    this.timeout(100000);

                    var count = 1000;
                    var time = new Date().getTime();
                    while (--count > 0) {
                        smooth();
                        slope();
                    }

                    console.log('time to smooth and slope with packed array: ', new Date().getTime() - time);
                });
            });

            describe('matrix', function () {
                var mValues;

                function slope(){
                    mValues.each(function(i, j, value){
                        var iLeft = Math.max(0, i - 1);
                        var iRight = Math.min(SIZE - 1, i + 1);
                        value.slope = this.get(iLeft, j).height - this.get(iRight, j).height;
                    });
                };

                smooth = function () {
                    mValues.update(function (i, j, value) {
                        var neighbors = this.neighbors9(i, j).concat(value);
                        var count = 0;
                        var out = _.reduce(neighbors, function (out, v) {
                            if (v) {
                                out.height += v.height;
                                ++count
                            }
                            return out;
                        }, {height: 0});
                        out.height /= count;
                        out.slope = value.slope;
                        return out;
                    });
                };


                beforeEach(function () {
                    mValues = Matrix.generate(SIZE, function (i, j) {
                        return {
                            height: seedFn(i, j),
                            slope: 0
                        }
                    });
                    slope();
                });

                it('should do smooth and slope fairly fast', function(){
                    this.timeout(100000);

                    var count = 1000;
                    var time = new Date().getTime();
                    while (--count > 0) {
                        smooth();
                        slope();
                    }

                    console.log('time to smooth and slope with matrix: ', new Date().getTime() - time);
                });
            });
        });
    });
});