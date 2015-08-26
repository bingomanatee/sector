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
          this.sedimentErosion = params.sedimentErosion || 0.01;
          this.defaultHydration = params.defaultHydration || 1;
          this.evaporation = params.evaporation || 0.3;
          this.sedInWater = params.sedInWater || 0.01;
          this.smoothWeight = params.smoothWeight || 3;
          this.randPow = params.randPow || 1;
          this.fastDrop = params.hasOwnProperty('fastDrop') ? params.fastDrop : false;
          this.random = params.random || Math.random.bind(Math);
          this.maxErosion = params.maxErosion || 2;

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
                  sediment: 0
              };
          });
      }

      Erosion.prototype = {
          hydrate: function (w) {
              if (arguments.length < 1) {
                  w = this.defaultHydration;
              }
              var self = this;
              this.data.each(function (i, j, cell) {
                  var r = self.random();
                  cell.water += Math.pow(r, self.randPow) * w;
              });
              return this;
          },

          cycle: function (n) {
              n = n || 0;
              while (n >= 0) {
                  this.hydrate();
                  this.dissolve();
                  this.flow();
                  this.evaporate();
                  if (!n % 4) {
                      //  this.smooth();
                  }
                  --n;

                  console.log('cycle ', n);
              }
              this.smooth();
          },

          dissolve: function () {
              var sedimentErosion = this.sedimentErosion;
              var self = this;
              this.data.each(function (i, j, cell) {
                  if (cell.water <= 0) {
                      return;
                  }
                  var newSed = Math.max(0, Math.min(self.maxErosion, cell.water * sedimentErosion - cell.sediment));

                  cell.rock -= newSed;
                  cell.sediment += newSed;
              });
              return this;
          },

          pluck: function (name) {
              return this.data.pluck(name);
          },

          height: function (cell) {
              return cell.rock + cell.water + cell.sediment;
          },

          heights: function () {
              return this.data.map(function (i, j, cell) {
                  return cell.rock + cell.water + cell.sediment;
              });
          },

          neighborsBelow: function (i, j, cell) {
              if (!cell) {
                  cell = this.data.get(i, j);
              }
              var height = this.height(cell);
              var neighbors = this.data.neighbors9(i, j, true);

              var info = {
                  i: i,
                  j: j,
                  cell: cell,
                  height: height,
                  totalHeight: height,
                  totalDHeight: 0,
                  count: 1
              };

              info.neighbors = lodash.reduce(neighbors, function (out, n) {
                  if (!n) {
                      return out;
                  }
                  var h = this.height(n.value);
                  if (h >= height) {
                      return out;
                  }
                  ++info.count;
                  n.height = h;
                  info.totalHeight += h;
                  if (!this.fastDrop) {
                      n.dHeight = height - h;
                      info.totalDHeight += n.dHeight;
                      out.push(n);
                  } else {
                      if (!out.length || (out[0].height > h)) {
                          out = [n];
                      }
                  }
                  return out;
              }, [], this);

              info.averageHeight = info.totalHeight / info.count;

              if (!this.fastDrop) {
                  lodash.each(info.neighbors, function (n) {
                      n.ratio = n.dHeight / info.totalDHeight;
                  });
              }

              return info;
          },

          waterFlow: function (info, memo) {
              var water = info.cell.water;
              var dWater = Math.min(info.height - info.averageHeight, water);
              var dSediment = info.cell.sediment * dWater / water;
              dWater -= dSediment;

              memo[info.i][info.j].water -= dWater;
              memo[info.i][info.j].sediment -= dSediment;

              if (this.fastDrop) {
                  info.neighbors[0].sediment += dSediment;
                  info.neighbors[0].water += dWater;
              } else {
                  lodash.each(info.neighbors, function (n) {
                      var m = memo[n.i][n.j];
                      m.sediment += dSediment * n.ratio;
                      m.water += dWater * n.ratio;
                  });
              }
          },

          flow: function () {
              var self = this;
              var flows = this.data.map(function (i, j, matrixCell, value, memo) {

                  var neighbors = self.neighborsBelow(i, j, matrixCell.value);

                  if (neighbors.neighbors.length < 1) {
                      return value;
                  }

                  self.waterFlow(neighbors, memo);

                  return value;

              }, function (cell, i, j) {
                  return {water: 0, sediment: 0, i: i, j: j};
              }, true);

              lodash.each(lodash.flatten(flows), function (flow) {
                  var cell = self.data.get(flow.i, flow.j);
                  cell.water += flow.water;
                  cell.sediment += flow.sediment;
              }, this);
              return flows;
          },

          evaporate: function () {
              var self = this;
              this.data.each(function (i, j, cell) {
                  cell.water *= (1 - self.evaporation);
                  var maxSed = cell.water * self.sedInWater;
                  if (maxSed > cell.sediment) {
                      cell.rock += cell.sediment - maxSed;
                      cell.sediment = maxSed;
                  }
              });
          },

          smooth: function () {
              var self = this;
              var smoothed = this.data.map(function (i, j, cell, value) {
                  var neighbors = this.neighbors9(i, j);
                  var sum = lodash.reduce(neighbors, function (sum, c) {
                      if (!c) {
                          return sum;
                      }

                      ++sum.count;
                      sum.water += c.water;
                      sum.rock += c.rock;
                      sum.sediment += c.sediment;
                      return sum;
                  }, {
                      water: self.smoothWeight * cell.water,
                      sediment: self.smoothWeight * cell.sediment,
                      rock: self.smoothWeight * cell.rock,
                      count: self.smoothWeight
                  });

                  sum.water /= sum.count;
                  sum.sediment /= sum.count;
                  sum.rock /= sum.count;

                  return sum;
              });

              this.data.data = smoothed;
          }
      };

      root.Erosion = Erosion;

  }
  (typeof exports === 'undefined' ? this : exports)
);