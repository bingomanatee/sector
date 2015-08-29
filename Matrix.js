(function (root) {
    var lodash;
    if (!(typeof exports === 'undefined')) {
        lodash = require('lodash');
    } else {
        lodash = _;
    }

    function Matrix(array2d) {
        this.data = array2d;
        this.size = this.data.length;
    }

    function MatrixCell(matrix, i, j) {
        this.i = i;
        this.j = j;
        this.matrix = matrix;
        this.value = matrix.get(i, j);
    }

    MatrixCell.prototype = {
        neighbors9: function(full){
            return this.matrix.neighbors9(this.i, this.j, full);
        },

        neighbors4: function(full){
            return this.matrix.neighbors4(this.i, this.j, full);
        }
    };

    Matrix.prototype = {

        get: function (i, j, meta) {
            if (i < 0 || j < 0 || i >= this.size || j >= this.size) {
                return null;
            }

            if (meta) {
                return new MatrixCell(this, i, j);
            } else {
                return this.data[i][j];
            }
        },

        neighbors4: function (i, j, meta) {
            return [this.get(i - 1, j, meta), this.get(i + 1, j, meta), this.get(i, j - 1, meta), this.get(i, j + 1, meta)];
        },

        neighbors9: function (i, j, meta, range) {
            var out = [];
            
            range |= 1;

            for (var ii = i - range; ii <= i + range; ++ii) {
                for (var jj = j - range; jj <= j + range; ++jj) {
                    if (!(i === ii && j === jj)) {
                        out.push(this.get(ii, jj, meta));
                    }
                }
            }

            return out;
        },

        pluck: function (attr) {
            return lodash.map(this.data, function (row) {
                return lodash.pluck(row, attr);
            });
        },

        /**
         * calls a function over a 2d array, returning a new Natrix;
         * @param fn {function} -- (i, j, matrixValueAtIJ, memoValueAtIJ, memo) bound to matrix
         * @param init {variant} -- seeds the matrix with a start value.
         * @param getMeta
         * @returns {*|Array}
         */

        map: function (fn, init, getMeta) {
            var memo = lodash.map(this.data, function (row, i) {
                return lodash.map(row, function (cell, j) {

                    var out = null;
                    if (typeof init === 'function') {
                        out = init(cell, i, j);
                    } else {
                        switch (init) {
                            case 'array':
                                out = [];
                                break;

                            case 'object':
                                out = {};
                                break;

                            default:
                                out = init;
                        }
                    }
                    return out;
                });
            });

            var boundFn = fn.bind(this);

            for (var i = 0; i < this.size; ++i) {
                for (var j = 0; j < this.size; ++j) {
                    memo[i][j] = boundFn(i, j, this.get(i, j, getMeta), memo[i][j], memo);
                }
            }

            return memo;
        },

        each: function (fn, getMeta) {
            var boundFn = fn.bind(this);

            for (var i = 0; i < this.size; ++i) {
                for (var j = 0; j < this.size; ++j) {
                    boundFn(i, j, this.get(i, j, getMeta));
                }
            }
        }

    };

    Matrix.generate = function (size, fn) {
        var data = lodash.map(lodash.range(0, size), function (i) {
            return lodash.map(lodash.range(0, size), function (j) {
                return fn(i, j);
            });
        });
        return new Matrix(data);
    };

    root.Matrix = Matrix;

}(typeof exports === 'undefined' ? this : exports));