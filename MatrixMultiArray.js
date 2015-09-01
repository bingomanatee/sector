(function (root) {

      var lodash, Table;
      if (typeof module !== 'undefined' && module.exports) {
          lodash = require('lodash');
          Table = require('cli-table');
      } else {
          lodash = _;
      }

      function MatrixMultiArray(fields, size) {
          this.size = size;
          this.fieldList = {};
          this.arrays = {};
          this.digestFieldSet(fields);
      }

      MatrixMultiArray.prototype = {

          goodIndex: function () {
              for (var i = 0; i < arguments.length; ++i) {
                  var n = arguments[i];
                  if (!(n >= 0 && n < this.size && (!(n % 1)))) {
                      return false;
                  }
              }
              return true;
          },

          neighbors: function (i, j, fn, noMiddle) {
              fn = fn.bind(this);
              for (var ii = i - 1; ii <= i + 1; ++ii) {
                  if (this.goodIndex(ii)) {
                      for (var jj = j - 1; jj <= j + 1; ++jj) {
                          if (this.goodIndex(jj)) {
                              if (!noMiddle || (i != ii ) || (j != jj)) {
                                  fn(ii, jj);
                              }
                          }
                      }
                  }
              }
          },

          each: function (fn) {
              fn = fn.bind(this);

              for (var i = 0; i < this.size; ++i) {
                  for (var j = 0; j < this.size; ++j) {
                      fn(i, j);
                  }
              }
          },

          inspect: function (i, j) {
              var out = {};

              lodash.each(lodash.keys(this.fieldList), function (key) {
                  out[key] = this[key + 'IJ'](i, j);
              }, this);
              return out;
          },

          digestFieldSet: function (fields) {

              var arraySize = this.size * this.size;
              lodash.each(fields, function (name) {
                    var array;
                    this.arrays[name] = array = [];
                    for (var n = arraySize - 1; n >= 0; --n) {
                        array[n] = 0;
                    }

                    var getIJ = this[name + 'IJ'] = function (i, j, value) {
                        if (!this.goodIndex(i, j)) {
                            throw new Error('attempt to set bad index for ' + name);
                        }
                        var index = (i * this.size) + j;
                        if (arguments.length > 2) {
                            return array[index] = value;
                        }
                        return array[index];
                    }.bind(this);

                    this[name + 'Values'] = function () {
                        return array.slice(0);
                    }.bind(this);

                    this[name + 'IJset'] = function (setter, noOldValue) {
                        if (typeof setter === 'function') {
                            setter = setter.bind(this);
                            for (var i = 0; i < this.size; ++i) {
                                for (var j = 0; j < this.size; ++j) {

                                    var index = (i * this.size) + j;
                                    array[index] = setter(i, j, noOldValue ? null : array[index]);
                                }
                            }
                        } else {
                            for (var n = 0; n < arraySize; ++n) {
                                array[n] = setter;
                            }
                        }
                    }.bind(this);

                    /**
                     * reutrns an array of 18 values.
                     * The first 9 are copies of the data
                     * in range +/-1 from the array.
                     * The next 9 are boolean flags indicating
                     * whether the first 9 values have been set or not.
                     *
                     * @type {function(this:MatrixMultiArray)}
                     */
                    this[name + 'IJneighbors'] = function (i, j, fn) {
                        var out = null;
                        if (!fn) {
                            out = [null, null, null, null, null, null, null,null, null];
                        }
                        var n = 0;
                        for (var ii = i - 1; ii <= i + 1; ++ii) {
                            for (var jj = j - 1; jj <= j + 1; ++jj) {
                                if (this.goodIndex(ii, jj)) {
                                    var index = (ii * this.size) + jj;
                                    if (fn) {
                                        fn(ii, jj, array[index]);
                                    } else {
                                        out[n] = array[index];
                                    }
                                }
                                ++n;
                            }
                        }
                        return out;
                    }.bind(this);

                    this[name + 'ToString'] = function (width) {
                        if (Table) {
                            var columns = ['J'].concat(lodash.map(lodash.range(0, this.size), function (i) {
                                return 'i:' + i
                            }));
                            var def = {head: columns};
                            if (width) {
                                def.colWidths = lodash.map(lodash.range(0, this.size + 1), function () {
                                    return width;
                                });
                            }
                            var t = new Table(def);
                            lodash.each(lodash.range(0, arraySize, this.size), function (start) {
                                t.push([start / this.size].concat(array.slice(start, start + this.size)));
                            }, this);
                            return t.toString();
                        }
                    }.bind(this);

                    /**
                     * note - unlike IJset, this method keeps a temporary array of output
                     * so that the function can be based on old values.
                     *
                     * @type {function(this:MatrixMultiArray)}
                     */
                    this[name + 'IJupdate'] = function (fn) {
                        var out = []
                        fn = fn.bind(this);

                        var n = 0;
                        for (var i = 0; i < this.size; ++i) {
                            for (var j = 0; j < this.size; ++j) {
                                out[n] = fn(i, j, array[n]);
                                ++n;
                            }
                        }

                        for (n = 0; n < arraySize; ++n) {
                            array[n] = out[n];
                        }

                    }.bind(this);

                    this[name + 'IJadd'] = function (i, j, value) {
                        var index = (i * this.size) + j;
                        var oldValue = array[index];
                        array[index] += value;

                        if (isNaN(array[index])){
                            throw new Error(
                              ['bad add: ', value, oldValue, array[index], i, j, index].join(', '));

                        }
                        return array[index];
                    }.bind(this);

                    this[name + 'IJsubtract'] = function (i, j, value) {
                        var index = (i * this.size) + j;
                        array[index] -= value;
                        return array[index];
                    }.bind(this);

                    this[name + 'Sum'] = function(){
                        var sum = 0;
                        for (var n = 0; n < array.length; ++n){
                            sum += array[n];
                        }
                        return sum;
                    };

                    this[name + 'IJmultiply'] = function (i, j, factor) {

                        var index = (i * this.size) + j;
                        array[index] *= factor;
                        return array[index];
                    }.bind(this);

                }, this
              )
              ;

          }
      }
      ;

      root.MatrixMultiArray = MatrixMultiArray;

  }
  (typeof exports === 'undefined' ? this : exports)
)
;