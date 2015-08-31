(function (root) {

    var lodash, Table;
    if (typeof module !== 'undefined' && module.exports) {
        lodash = require('lodash');
        Table = require('cli-table');
    } else {
        lodash = _;
    }

    if (false) {
        lodash.each([

            Int8Array,
            Uint8Array,
            Uint8ClampedArray,
            Int16Array,
            Uint16Array,
            Int32Array,
            Uint32Array,
            Float32Array,
            Float64Array

        ], function (typedArray) {
            if (!typedArray.prototype.slice) {
                typedArray.prototype.slice = function (begin, end) {
                    var target = new typedArray(end - begin);

                    for (var i = 0; i < begin + end; ++i) {
                        target[i] = this[begin + i];
                    }
                    return target;
                };
            }
            ;
        });
    }

    function Slice(data, type, from, to) {
        if (arguments.length < 2) {
            from = 0;
        }
        if (arguments.length < 3) {
            to = data.length;
        }
        var out = makeArray(type, to - from + 1);
        for (var i = from; i < to; ++i) {
            out[i - from] = data[i];
        }
        return out;
    }

    function MatrixPackedArray(fields, size) {
        this.size = size;
        this.fieldList = {};
        this.arrays = {};
        this.digestFieldSet(fields);
    }

    MatrixPackedArray.prototype = {

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
            lodash.each(fields, function (fieldType, name) {
                  var typeName = MatrixPackedArray.TYPE_NAMES[fieldType];
                  if (!this.arrays.hasOwnProperty(typeName)) {
                      this.arrays[typeName] = 1;
                  } else {
                      ++this.arrays[typeName];
                  }
                  var dataIndexOffset = this.arrays[typeName] - 1;
                  var arrayStart = dataIndexOffset * arraySize;

                  this.fieldList[name] = {type: fieldType, offset: this.arrays[typeName]};
                  var getIJ = this[name + 'IJ'] = function (i, j, value) {
                      if (!this.goodIndex(i) && this.goodIndex(j)) {
                          throw new Error('attempt to set bad index for ' + name);
                      }
                      var index = dataIndexOffset * arraySize + (i * this.size) + j;
                      if (arguments.length > 2) {
                          return this.arrays[typeName][index] = value;
                      }
                      return this.arrays[typeName][index];
                  }.bind(this);

                  this[name + 'Values'] = function (toArray) {
                      return Slice(this.arrays[typeName], toArray ? 'array' : typeName, arrayStart, arrayStart + arraySize);
                  }.bind(this);

                  this[name + 'IJset'] = function (setter) {
                      if (typeof setter === 'function') {
                          setter = setter.bind(this);
                          this.each(function (i, j) {
                              getIJ(i, j, setter(i, j));
                          });
                      } else {
                          this.each(function (i, j) {
                              getIJ(i, j, setter);
                          });
                      }
                  }.bind(this);

                  /**
                   * reutrns an array of 18 values.
                   * The first 9 are copies of the data
                   * in range +/-1 from the array.
                   * The next 9 are boolean flags indicating
                   * whether the first 9 values have been set or not.
                   *
                   * @type {function(this:MatrixPackedArray)}
                   */
                  this[name + 'IJneighbors'] = function (i, j, fn) {
                      var out = null;
                      if (!fn) {
                          out = makeArray(fieldType, 18);
                      }
                      var n = 0;
                      for (var ii = i - 1; ii <= i + 1; ++ii) {
                          for (var jj = j - 1; jj <= j + 1; ++jj) {
                              if (this.goodIndex(ii) && this.goodIndex(jj)) {
                                  var index = arrayStart + (ii * this.size) + jj;
                                  if (fn) {
                                      fn(ii, jj, this.arrays[typeName][index]);
                                  } else {
                                      out[n] = this.arrays[typeName][index];
                                      out[n + 9] = 1;
                                  }
                              } else if (!fn) {
                                  out[n + 9] = 0;
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
                          lodash.each(lodash.range(0, this.size), function (j) {
                              t.push([j].concat(lodash.map(lodash.range(0, this.size), function (i) {
                                  return this[name + 'IJ'](i, j);
                              }, this)));
                          }, this);
                          return t.toString();
                      }
                  }.bind(this);

                  this[name + 'IJupdate'] = function (fn) {
                      var out = makeArray(fieldType, arraySize);
                      fn = fn.bind(this);

                      var n = 0;
                      for (var i = 0; i < this.size; ++i) {
                          for (var j = 0; j < this.size; ++j) {
                              out[n] = fn(i, j, this[name + 'IJ'](i, j));
                              ++n;
                          }
                      }

                      for (var ii = 0; ii < this.size; ++ii) {
                          for (var jj = 0; jj < this.size; ++jj) {
                              this[name + 'IJ'](ii, jj, out[ii * this.size + jj]);
                          }
                      }

                  }.bind(this);

                  this[name + 'IJadd'] = function (i, j, value) {
                      var newValue = (getIJ(i, j) || 0) + value;
                      getIJ(i, j, newValue);
                      return newValue;
                  }.bind(this);

                  this[name + 'IJsubtract'] = function (i, j, value) {
                      var newValue = (getIJ(i, j) || 0) - value;
                      getIJ(i, j, newValue);
                      return newValue;
                  }.bind(this);

                  this[name + 'IJmultiply'] = function (i, j, factor) {
                      var newValue = (getIJ(i, j) || 0) * factor;
                      getIJ(i, j, newValue);
                      return newValue;
                  }

              }, this);

            if (this.arrays.Int8) {
                this.arrays.Int8 = new Int8Array(this.arrays.Int8 * arraySize);
            }

            if (this.arrays.Uint8) {
                this.arrays.Uint8 = new Uint8Array(this.arrays.Uint8 * arraySize);
            }

            if (this.arrays.Uint8Clamped) {
                this.arrays.Uint8Clamped = new Uint8ClampedArray(this.arrays.Uint8Clamped * arraySize);
            }

            if (this.arrays.Uint16) {
                this.arrays.Uint16 = new Int16Array(this.arrays.Uint16 * arraySize);
            }

            if (this.arrays.Int16) {
                this.arrays.Int16 = new Int16Array(this.arrays.Int16 * arraySize);
            }

            if (this.arrays.Int32) {
                this.arrays.Int32 = new Int32Array(this.arrays.Int32 * arraySize);
            }

            if (this.arrays.Uint32) {
                this.arrays.Uint32 = new Uint32Array(this.arrays.Uint32 * arraySize);
            }

            if (this.arrays.Float32) {
                this.arrays.Float32 = new Float32Array(this.arrays.Float32 * arraySize);
            }

            if (this.arrays.Float64) {
                this.arrays.Float64 = new Float64Array(this.arrays.Float64 * arraySize);
            }

        }
    };

    MatrixPackedArray.TYPES = {
        Int8: 0,
        Uint8: 1,
        Uint8Clamped: 2,
        Int16: 3,
        Uint16: 4,
        Int32: 5,
        Uint32: 6,
        Float32: 7,
        Float64: 8
    };

    function makeArray(type, size) {
        var out;
        switch (type) {
            case 'array':
                out = [];
                break;
            case 0:
            case 'Int8':
                out = new Int8Array(size);
                break;
            case 1:
            case 'Uint8':
                out = new Uint8Array(size);
                break;
            case 2:
            case 'Uint8Clamped':
                out = new Uint8ClampedArray(size);
                break;
            case 3:
            case 'Int16':
                out = new Int16Array(size);
                break;
            case 4:
            case 'Uint16':
                out = new Uint16Array(size);
                break;
            case 5:
            case 'Int32':
                out = new Int32Array(size);
                break;
            case 6:
            case 'Uint32':
                out = new Uint32Array(size);
                break;
            case 7:
            case 'Float32':
                out = new Float32Array(size);
                break;
            case 8:
            case 'Float64':
                out = new Float64Array(size);
                break;
            default:
                throw new Error('cannot identify type ' + type);
        }
        return out;
    }

    MatrixPackedArray.TYPE_NAMES = lodash.invert(MatrixPackedArray.TYPES);

    root.Slice = Slice;
    root.MatrixPackedArray = MatrixPackedArray;

}(typeof exports === 'undefined' ? this : exports));