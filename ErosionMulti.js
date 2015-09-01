(function (root) {
      var lodash, MatrixMultiArray;

      if (!(typeof exports === 'undefined')) {
          lodash = require('lodash');
          MatrixMultiArray = require('./MatrixMultiArray').MatrixMultiArray;
      } else {
          lodash = root._;
          MatrixMultiArray = root.MatrixMultiArray;
      }

      function ErosionMulti(params) {
          if (!params) {
              params = {};
          }
          this.size = params.size || 10;
          this.chanceOfRain = params.chanceOfRain || 0.25;
          this.amountOfRain = params.amountOfRain || 1;
          this.waterToNeighbors = params.waterToNeighbors || 0.5;
          this.dissolveRatio = params.dissolveRatio || 0.02; // the amount of sedieent that will be created in a single round per amount of water.
          this.transportRatio = params.transportRatio || 0.25; // the amount of sediment what will travel with water if it flows.
          this.saturationRatio = params.saturationRatio || 0.5; // the maximum amount of sediment that can exist for a given amount of water after flow.
          this.randomness = params.randomness || 0.1;
          this.evaporationRate = params.evaporationRate || 0.5;
          this.randomValue = params.randomValue || Math.random.bind(Math);

          this.data = new MatrixMultiArray(
            ['rock', 'water', 'sed', 'rock2', 'water2', 'sed2']
            , this.size);

          var rock = params.rock || 100;

          this.data.rockIJset(rock);
      }

      ErosionMulti.prototype = {

          init: function(){
            this.data.rockIJset(function(i, j, rock){
                return Math.max(rock, 0);
            });
          },

          rain: function () {
              var self = this;

              this.data.each(function (i, j) {
                  if (self.randomValue() < self.chanceOfRain) {
                      self.data.waterIJadd(i, j, self.amountOfRain);
                      if (self.waterToNeighbors) {
                          var overflow = self.amountOfRain * self.waterToNeighbors;
                          self.data.neighbors(i, j, function (ii, jj) {
                              this.waterIJadd(ii, jj, overflow);
                          }, true);
                      }
                  }

              });
          },

          height: function (i, j) {
              return this.data.waterIJ(i, j) + this.data.rockIJ(i, j) + this.data.sedIJ(i, j);
          },

          dissolve: function () {
              var self = this;
              this.data.each(function (i, j) {
                  var water = this.waterIJ(i, j);
                  var sed = this.sedIJ(i, j);
                  var sedAmount = self.dissolveRatio * water;

                  if (water < 0 || sed < 0){
                      throw new Error('negative sums: ', water, sed);
                  }
                  if (sed < sedAmount) {
                      var addSed = sedAmount - sed;
                      addSed = Math.min(addSed, this.rockIJ(i, j));
                      if (addSed < 0){
                          throw new Error('negative sums: ', addSed, this.rockIJ(i, j));
                      }
                      this.rock2IJsubtract(i, j, addSed);
                      this.sed2IJadd(i, j, addSed);
                  }
              });
          },

          lowestNeighbor: function (i, j, cellHeight) {
              if (arguments.length < 3) {
                  cellHeight = this.height(i, j);
              }
              var lowerCells = [];
              var lowestHeight = null;
              var self = this;

              this.data.neighbors(i, j, function (ii, jj) {
                  var neighborHeight = self.height(ii, jj);
                  if (neighborHeight < cellHeight) {
                      lowerCells.push({i: ii, j: jj, height: neighborHeight, r: self.randomValue()});
                      if (lowestHeight === null || lowestHeight > neighborHeight) {
                          lowestHeight = neighborHeight;
                      }
                  }
              }, true);

              if (lowestHeight === null) {
                  return;
              }
              lowerCells = lodash.select(lowerCells, function (c) {
                  return c.height === lowestHeight;
              });
              if (lowerCells.length > 1) {
                  lowerCells = lodash.sortBy(lowerCells, 'rand');
              }
              var lowest = lowerCells.shift();

              return lowest;
          },

          flow: function () {
              var self = this;
              this.data.each(function (i, j) {
                  var cellHeight = self.height(i, j);
                  var lowest = self.lowestNeighbor(i, j, cellHeight);
                  if (lowest) {
                      self.transport(i, j, lowest, cellHeight);
                  }
              });
          },

          transport: function (i, j, lowest, cellHeight) {
              if (arguments.length < 4) {
                  cellHeight = this.height(i, j);
              }

              var water = this.data.waterIJ(i, j);
              var avgHeight = (lowest.height + cellHeight) / 2;
              var maxWater = cellHeight - avgHeight;
              var movingWater = Math.min(water, maxWater);
              var sed = this.data.sedIJ(i, j);

              var movingSed = sed * maxWater / water;
              movingSed = Math.min(movingSed, this.transportRatio * water);

              if (water > 0) {
                  this.data.water2IJadd(lowest.i, lowest.j, movingWater);
                  this.data.water2IJsubtract(i, j, movingWater);
              }

              if (movingSed > 0) {
                  this.data.sed2IJadd(lowest.i, lowest.j, movingSed);
                  this.data.sed2IJsubtract(i, j, movingSed);
              }
          },

          update: function () {
              this.data.each(function (i, j) {
                  var sed2 = this.sed2IJ(i, j);
                  this.sedIJadd(i, j, sed2);

                  var water2 = this.water2IJ(i, j);
                  this.waterIJadd(i, j, water2);

                  var rock2 = this.rock2IJ(i, j);
                  this.rockIJadd(i, j, rock2);
              });

              this.data.rockIJset(function (i, j, r) {
                  return Math.max(r, 0);
              });
              this.data.sed2IJset(0);
              this.data.rock2IJset(0);
              this.data.water2IJset(0);
          },

          evaporate: function () {
              var self = this;
              this.data.each(function (i, j) {
                  var sed = this.sedIJ(i, j);
                  var water = this.waterIJmultiply(i, j, self.evaporationRate);
                  var maxSed = self.saturationRatio * water;
                  if (sed > maxSed) {
                      var dry = sed - maxSed;
                      this.sedIJsubtract(i, j, dry);
                      this.rockIJadd(i, j, dry);
                  }
                  if (water < 0.0001) {
                      this.waterIJ(i, j, 0);
                  }
              });
          },

          cycle: function (count) {
              var start = 0;
              while (++start <= count) {
                  this.init();
                  this.rain();
                  this.dissolve();
                  this.flow();
                  this.update();
                  this.evaporate();
                  console.log('cycle ', start);
              }

              var totalRock = this.data.rockSum();
              var totalWater = this.data.waterSum();
              var totalSed = this.data.sedSum();
              console.log('total rock: ', totalRock);
              console.log('total water: ', totalWater);
              console.log('total sediment:', totalSed);
              console.log('total material: ', totalRock + totalSed);
          }
      };

      root.ErosionMulti = ErosionMulti;

  }
  (typeof exports === 'undefined' ? this : exports)
);