var Sector = (function () {

    /**
     * Sectors are arbitrary rectangular tiles; they are by default squares.
     * @param params {object} optional
     * @param parent {Sector} optional
     *
     * A sector is a square region that is either the root region of a span x span tile
     * or a subregion of its parent.
     *
     * for instance a span with a parent and props {size: 3, i: 1, j: 1} takes up the middle third of its parent.
     *
     * Sectors can be indefinitely nested.
     * The only requirement is that sectors must have defined i,j, and size properties
     * and that i and j must be integers in the 0..size - 1 range.
     *
     * Sectors can be sparse and arbitrary slices of their parents.
     *
     * # Absolute Size
     *
     * Only a parent can have an absolute size; defined as span.
     * A parent must have a defined span; either passsed as a parameter or defaulting to 1.
     *
     * The span of all other tiles is a fractional calculation of its parents' span.
     *
     * @constructor
     */

    function Sector(params, parent) {
        if (!params) {
            params = {};
        }
        if (!parent) {
            parent = null;
        }

        if (arguments.length < 2 || parent === null) {
            this.parentId = null;
            this.isRoot = true;
        } else {
            this.isRoot = false;
            this.parentId = parent ? parent.id ? parent.id : null : null;
        }

        this.id = params.id || ++Sector.$$ID;
        this.size = params.size || 1;
        this.i = Math.floor(params.i) || 0;
        this.j = Math.floor(params.j) || 0;
        if (params.span) {
            this.span = params.span;
        } else if (!parent) {
            this.span = 1;
        }

        this.content = params.content || null;

        if (this.i >= this.size || this.j >= this.size || this.i < 0 || this.j < 0) {
            throw new Error('invalid sizes: ', this);
        }

        if (!this.isRoot && Sector.$$hasChild(this.parentId, this.size, this.i, this.j)) {
            throw new Error('redundant slice', this);
        }

        if (!params.hasOwnProperty('register') || params.register) {
            Sector.$$register(this);
        }

    }

    Sector.prototype = {
        isRegistered: function () {
            return Sector.has(this.id);
        },

        register: function () {
            Sector.$$register(this);
        },

        getSpan: function(){
            return this.isRoot ? this.span: this.parent().getSpan() / this.size;
        },

        offset: function(){
            var relOffset =  {
                i: this.i * this.getSpan(),
                j: this.j * this.getSpan()
            };

          if (this.isRoot)  {
               return relOffset;
          } else {
              var parentOffset = this.parent().offset();

              return {
                  i: parentOffset.i + relOffset.i,
                  j: parentOffset.j + relOffset.j
              }
          }
        },

        parent: function () {
            if (!this.parentId) {
                return null;
            }
            return Sector.get(this.parentId);
        },

        /**
         * creates divisions of this sector; creates/finds size x size Sectors.
         *
         * @param size {int} 2 or greater
         * @param returnChildren {boolean}
         * @returns {Array} -- only returns array if returnChildren is true; returns them in i, j order.
         */
        divide: function (size, returnChildren) {
           this.lastDivSize = size = Math.floor(size);
            if (returnChildren) {
                var children = [];
            }
            if (size < 2) {
                throw new Error('must divide by at least 2');
            }
            for (var i = 0; i < size; ++i) for (var j = 0; j < size; ++j) {
                var existingChild = Sector.$$hasChild(this.id, size, i, j);
                if (existingChild) {
                    if (returnChildren) {
                        children.push(existingChild);
                    }
                } else {
                    var newChild = new Sector({size: size, i: i, j: j}, this);
                    if (returnChildren) {
                        children.push(newChild);
                    }
                }
            }

            if (returnChildren) {
                return children;
            }
        },

        childAt: function(i, j, size){
            if (arguments.length < 3){
                size = this.lastDivSize;
            }
            return Sector.$childAt(this.id, size, i, j);
        }
    },

        Sector.$$ID = 0;

    Sector.$$clean = function (resetID) {
        Sector.$$index = {};
        Sector.$$list = [];
        if (resetID) {
            Sector.$$ID = 0;
        }
    };

    Sector.$childAt = function (pID, size, i, j) {
        if (i < 0 || j < 0 || i >= size || j >= size) {
            throw new Error('bad query');
        }

        for (var ii = 0; ii < Sector.$$list.length; ++ii) {
            var s = Sector.$$list[ii];
            if (s.parentId === pID && s.size === size && s.i === i && s.j === j) {
                return s;
            }
        }

        return null;
    };

    Sector.$$hasChild = function (pID, size, i, j) {
        return !!Sector.$childAt(pID, size, i, j);
    };

    Sector.$$clean();

    Sector.get = function (id) {
        return Sector.$$index[id];
    };

    /**
     * a ducktype test for basic registrability
     * @param s {object}
     * @returns {boolean}
     */
    Sector.notASector = function (s) {
        return !(s && typeof s === 'object' && s.hasOwnProperty('id'));
    };

    Sector.$$register = function (newSector) {
        if (Sector.notASector(newSector)) {
            return;
        }
        Sector.$$index[newSector.id] = newSector;
        for (var i = Sector.$$list.length - 1; i >= 0; --i) {
            if (Sector.$$list[i].id === newSector.id) {
                Sector.$$list.splice(i, 1);
            }
        }
        Sector.$$list.push(newSector);
    };

    Sector.$$unregister = function (newSector) {
        if (Sector.notASector(newSector)) {
            return;
        }
        delete(Sector.$$index[newSector.id]);

        for (var i = Sector.$$list.length - 1; i >= 0; --i) {
            if (Sector.$$list[i].id === newSector.id) {
                Sector.$$list.splice(i, 1);
            }
        }
    };

    Sector.has = function (id) {
        return !!Sector.$$index[id];
    };

    return Sector;
})();

