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
          this.chanceOfRain = params.chanceOfRain || 0.25;
          this.amountOfRain = params.amountOfRain || 1;
          this.sedToWater = params.sedToWater || 0.02;
          this.randomness = params.randomness || 0.1;
          this.sedInWater = params.sedInWater || 0.75;
          this.evaporateRate = params.evaporateRate || 0.3;
          this.sedSaturation = params.sedSaturation || 0.05;
          this.smoothDrop = 1;

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
                  sed: 0,
                  rock2: 0,
                  water2: 0,
                  sed2: 0
              };
          });
      }

      Erosion.prototype = {
          addRain: function () {
              var self = this;
              this.data.each(function (i, j, cell) {
                  if (Math.random() < self.chanceOfRain) {
                      cell.water += self.amountOfRain;
                      if (false) _.each(self.data.neighbors9(i, j, true), function (n) {
                          if (n) {
                              n.value.water += self.amountOfRain / 2;
                          }
                      })
                  }
                  var sed = self.sedToWater * cell.water;
                  sed -= cell.sed / 2;
                  if (sed <= 0) {
                      return;
                  }
                  if (isNaN(sed)) {
                      throw new Error('bad sed');
                  }
                  var rock = cell.rock;
                  cell.sed += sed;
                  cell.rock -= sed;
                  if (cell.rock <= 0 && rock > 0) {
                      console.log('cell zeroed');
                  }

              })
          },

          height: function (cell, noWater) {
              return cell.rock + cell.sed + (noWater ? 0 : cell.water);
          },

          smooth: function () {
              var self = this;
              this.data.each(function (i, j, cell) {

                  if (cell.value.sediment) {
                      var height = self.height(cell.value);
                      _.each(_.compact(cell.neighbors9()), function (n) {
                          var nHeight = self.height(n, true);
                          if (height > (nHeight + self.smoothDrop)) {
                              var move = (height - (nHeight + self.smoothDrop)) / 25;
                              if (cell.value.sediment > 0) {
                                  var sedMove = Math.max(move, cell.value.sediment);
                                  cell.value.sediment -= sedMove;
                                  n.sediment += sedMove;
                                  move -= sedMove;
                              }
                              move /= 2;
                              cell.value.rock -= move;
                              n.rock += move;
                          }
                      });
                  }
              }, true)
          },

          moveWater: function () {
              var self = this;
              this.data.each(function (i, j, cell) {
                  if (cell.value.water <= 0) return;

                  if(Math.random() < self.randomness){
                      debugger;
                      var sed = Math.min(cell.value.sed, cell.value.water * self.sedInWater);
                      var neighbor = _.compact(cell.neighbors9());
                      neighbor.sed2 += sed;
                      neighbor.water2 += cell.value.water;
                      cell.value.sed -= sed;
                      cell.value.water2 -= cell.value.water;
                      return;
                  }

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

                  var flowingWater = Math.min(cell.value.water, avgDrop / 2);
                  if (flowingWater <= 0) {
                      return;
                  }
                  cell.value.water2 -= flowingWater;

                  var sedInMotion = 0;
                  if (cell.value.sed) {
                      sedInMotion = self.sedInWater * cell.value.sed * flowingWater / cell.value.water;
                      cell.value.sed2 -= sedInMotion;
                  }

                  _.each(belowNeighbors, function (bn) {
                      var ratio = bn.drop / totalDrop;
                      var waterShare = flowingWater * ratio;
                      bn.value.water2 += waterShare;
                      bn.value.sed2 += ratio * sedInMotion;
                  });

              }, true);

          },

          resolve: function () {
              var self = this;
              this.data.each(function (i, j, cell) {
                  cell.water += cell.water2;
                  cell.water = Math.max(0, cell.water);
                  cell.water2 = 0;
                  cell.sed += cell.sed2;
                  cell.sed = Math.max(cell.sed, 0);
                  cell.sed2 = 0;
                  var maxsed = Math.max(0, cell.water * self.sedSaturation);
                  cell.water *= self.evaporateRate;

                  if (maxsed < cell.sed) {
                      cell.rock += Math.max(0, cell.sed - maxsed);
                      cell.sed = maxsed;
                  }
              });
          },

          cycle: function (count) {
              while (--count >= 0) {
                  this.addRain();
                  this.moveWater();
                  this.resolve();
              }
              this.smooth();
          }
      };

      root.Erosion = Erosion;

  }
  (typeof exports === 'undefined' ? this : exports)
);