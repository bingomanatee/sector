(function (root) {
      var lodash, Matrix;
      if (!(typeof exports === 'undefined')) {
          lodash = require('lodash');
          Matrix = require('./Matrix').Matrix;
      } else {
          lodash = _;
          Matrix = root.Matrix;
      }

      function Erosion(params) {
          this.size = params.size || 10;
          this.chanceOfRain = params.chanceOfRain || 0.05;
          this.amountOfRain = params.amountOfRain || 4;
          this.sedToWater = params.sedToWater || 0.05;
          this.sedInWater = params.sedInWater || 0.2;
          this.evaporateRate = params.evaporateRate || 0.3;

          this.data = Matrix.generate(this.size, function (i, j) {
              var height;
              if (params.heights) {
                  height = params.heights[i][j];
              } else if (params.heightFn) {
                  height = params.heightFn(i, j)
              } else {
                  height = 100 + this.random() * 100;
              }
              return {
                  rock: height,
                  water: 0,
                  sediment: 0,
                  rock2: 0,
                  water2: 0,
                  sediment2: 0
              };
          });
      }

      Erosion.prototype = {
          addRain: function () {
              var self = this;
              this.data.each(function (i, j, cell) {
                  if (Math.random() < self.chanceOfRain) {
                      cell.water += self.amountOfRain;
                  }
                  var targetSed = self.sedToWater * cell.water;
                  if (targetSed > cell.sediment) {
                      var sed = targetSed - cell.sediment;
                      //    cell.sediment += sed;
                      //   cell.rock -= sed;
                  }
              })
          },

          height: function (cell, noWater) {
              return cell.rock + cell.sediment + (noWater ? 0 : cell.water);
          },

          smooth: function () {
              this.data.each(function (i, j, cell) {
                  var nr = 0;
                  var nc = 0;
                  _.each(this.neighbors9(i, j), function (cell) {
                      if (!cell) {
                          return;
                      }
                      nr += cell.rock;
                      ++nc;
                  });
                  cell.rock += nr / nc;
                  cell.rock /= 2;
              });
          },

          moveWater: function () {
              var self = this;
              this.data.each(function (i, j, cell) {
                  cell.value.di /= 2;
                  cell.value.dj /= 2;

                  var baseHeight = self.height(cell.value);
                  var baseSedHeight = self.height(cell.value, true);
                  var belowNeighbors = [];
                  var totalDrop = 0;
                  _.each(this.neighbors9(i, j, true), function (nCell) {
                      if (!nCell) {
                          return;
                      }
                      var nHeight = self.height(nCell.value);
                      nCell.height = nHeight;
                      nCell.sedHeight = self.height(nCell.value, true);
                      nCell.drop = baseHeight - nHeight;
                      totalDrop += nCell.drop;
                      if (baseHeight > nHeight) {
                          belowNeighbors.push(nCell);
                      }
                  });

                  if (belowNeighbors.length < 1) {
                      return;
                  }

                  var avgDrop = totalDrop / (belowNeighbors.length + 1);

                  var amountToDrop = Math.min(cell.value.water, avgDrop / 2);
                  if (amountToDrop <= 0) {
                      return;
                  }

                  var sedimentToDrop = cell.value.sediment * amountToDrop / cell.value.water;

                  _.each(belowNeighbors, function (bn) {
                      var ratio = bn.drop / amountToDrop;
                      var dropShare = amountToDrop * ratio;
                      if (bn.sedHeight > baseSedHeight) {
                          cell.value.water2 -= dropShare;
                          bn.value.water2 += dropShare;
                      } else {
                          var waterShare = ratio * amountToDrop;
                          cell.value.water2 -= waterShare;
                      }
                  });

              }, true);

          },

          resolve: function () {
              var self = this;
              this.data.each(function (i, j, cell) {
                  cell.rock -= cell.water * self.sedInWater;
                  var shared = cell.water * Math.pow(self.sedInWater, 2);
                  var ns = _.compact(this.neighbors9(i, j));
                  _.each(ns, function (cell) {
                      cell.rock -= shared;
                  });
                  cell.water *= self.evaporateRate;
              });
          },

          cycle: function (count) {
              var self = this;
              this.data.each(function (i, j, cell) {
                  cell.rock += 2 * self.sedInWater * self.chanceOfRain * self.amountOfRain * count;
              });
              while (--count >= 0) {
                  this.addRain();
                  this.moveWater();
                  this.resolve();
              }
            //  this.smooth();
          }
      };

      root.Erosion = Erosion;

  }
  (typeof exports === 'undefined' ? this : exports)
);