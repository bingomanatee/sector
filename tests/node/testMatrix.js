var chai = require('chai');
var expect = chai.expect;
var Matrix = require('./../../Matrix').Matrix;

describe('Matrix', function () {
    var m;

    beforeEach(function () {
        m = new Matrix([[1, 2, 3], [4, 5, 6], [7, 8, 9]]);
    });

    describe('constructor', function () {

        it('should accept an array of values', function () {

            expect(m.size).to.eql(3);
        });
    });

    describe('#get', function () {

        it('should return a raw value', function () {

            expect(m.get(0, 0)).to.eql(1);
            expect(m.get(1, 2)).to.eql(6);
            expect(m.get(2, 2)).to.eql(9);
        });

        it('should return null if indexes out of bounds', function () {
            expect(m.get(3, 0)).to.be.null;
            expect(m.get(0, 3)).to.be.null;
            expect(m.get(-1, 0)).to.be.null;
            expect(m.get(0, -1)).to.be.null;
        });

    });

    describe('#map', function () {

        it('should return twice the value', function () {
            var doubles = m.map(function (i, j, matrixValue) {
                return matrixValue * 2;
            });

            expect(doubles).to.eql([[2, 4, 6], [8, 10, 12], [14, 16, 18]]);
        });

        it('should pass the expected values to the iterator', function () {

            m.map(function (i, j, matrixValue, memoValue, memo) {

            //    console.log('map: ', i, j, matrixValue, memoValue, memo);

                expect(matrixValue).to.eql(i * 3 + j + 1);
                expect(memoValue).to.eql(0);
                if (i == 0 && j == 0) {
                    expect(memo).to.eql([[0, 0, 0], [0, 0, 0], [0, 0, 0]]);
                }
                if (i == 1 && j == 1) {
                    expect(memo).to.eql([[2, 4, 6], [8, 0, 0], [0, 0, 0]]);
                }
                return matrixValue * 2;
            }, 0);
        });

    });
});