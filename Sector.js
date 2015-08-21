(function (root) {

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
     * ### Leaf Children
     *
     * If a sector's children are not intended to have children of their own,
     * to reduce object proliferation, their content can be stored in the parent as a 1d array of values.
     * If this is true, then the childAt and children returns a temporary sector based on this content.
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
        if (params.leafSize && params.leafContent) {
            this.leaves = {
                size: params.leafSize,
                content: params.leafContent
            }
        } else {
            this.leaves = false;
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

        canvasRect: function (ctx, strokeColor, fillColor, lineWidth) {
            if (typeof strokeColor === 'function') {
                strokeColor = strokeColor(this);
            }
            if (typeof fillColor === 'function') {
                fillColor = fillColor(this);
            }
            ctx.save();

            ctx.strokeStyle = strokeColor;
            ctx.fillStyle = fillColor;
            ctx.lineWidth = lineWidth || 1;

            ctx.beginPath();
            ctx.rect(this.offset().i, this.offset().j, this.getSpan(), this.getSpan());
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            ctx.restore();
        },

        isRegistered: function () {
            return Sector.has(this.id);
        },

        register: function () {
            Sector.$$register(this);
        },

        getSpan: function () {
            return this.isRoot ? this.span : this.parent().getSpan() / this.size;
        },

        offset: function () {
            var relOffset = {
                i: this.i * this.getSpan(),
                j: this.j * this.getSpan()
            };

            if (this.isRoot) {
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
            var sizes = null;
            this.leaves = null;
            this.lastDivSize = size = Math.floor(size);
            if (returnChildren) {
                var children = [];
            }

            if (Array.isArray(size)) {
                sizes = size.slice(1);
                console.log('saving recursed array: ', sizes);
                size = size[0];
            }
            if (size < 2) {
                throw new Error('must divide by at least 2');
            }
            for (var i = 0; i < size; ++i) {
                for (var j = 0; j < size; ++j) {
                    var existingChild = Sector.$$hasChild(this.id, size, i, j);
                    if (existingChild) {
                        if (returnChildren) {
                            children.push(existingChild);
                        }
                        if (sizes && sizes.length) {
                            existingChild.divide(sizes);
                        }
                    } else {
                        var newChild = new Sector({size: size, i: i, j: j}, this);
                        if (sizes && sizes.length) {
                            console.log('array recursing divide: ', newChild, sizes);
                            newChild.divide(sizes);
                        }
                        if (returnChildren) {
                            children.push(newChild);
                        }
                    }
                }
            }

            if (returnChildren) {
                return children;
            }
        },

        /**
         * this method creates "virtual children"
         * that are represented by an array of data
         * that can be iterated through, as opposed to
         * individual sectors.
         * @param size
         * @param content
         */
        leafDivide: function (size, content) {
            if (typeof content === 'function') {
                content = map2d(size, content);
            }
            this.leaves = {
                size: size, content: content
            };
            this.lastSize = size;
        },

        children: function () {
            if (this.leaves) {
                var out = [];
                for (var i = 0; i < this.leaves.size; ++i) {
                    for (var j = 0; j < this.leaves.size; ++j) {
                        out.push(this.childAt(i, j));
                    }
                }
                return out;
            }
            return Sector.$children(this.id);
        },

        childAt: function (i, j, size) {
            if (this.leaves && arguments.length > 2 && size != this.leaves.size) {
                console.log('warning: bad size reference for leaved sector');
                return null;
            }

            if (this.leaves) {
                var content = this.leaves.content[i * this.leaves.size + j];
                return new Sector({i: i, j: j, size: this.leaves.size, content: content, register: false}, this);
            }

            if (arguments.length < 3) {
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

    Sector.$children = function (pID) {
        var out = [];

        for (var i = 0; i < Sector.$$list.length; ++i) {
            var c = Sector.$$list[i];
            if (c.parentId == pID) {
                out.push(c);
            }
        }
        return out;
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

    root.Sector = Sector;

    function map2d(size, fn) {
        var out = [];
        for (var i = 0; i < size; ++i) {
            for (var j = 0; j < size; ++j) {
                out.push(fn(i, j, size));
            }
        }
        return out;
    }

}(typeof exports === 'undefined' ? this : exports));
