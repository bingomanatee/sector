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
            if (typeof params === 'number') {
                params = {span: params};
            }
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

        this.store = params.store || null;
        if (this.store) {
            this.store.put(this);
            //@TODO: manage redundant slice
        }

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

          //  console.log('drdawing rect at ', this.offset(), this.getSpan(), strokeColor, fillColor);

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
            if (!this.store) {
                return false;
            }
            return this.store.has(this.id);
        },

        getSpan: function () {
            return this.isRoot ? this.span : this.parent().getSpan() / this.size;
        },

        toJson: function(){
            return {
                id: this.id,
                parentId: this.parentId,
                i: this.i,
                j: this.j,
                span: this.getSpan(),
                size: this.size
            };
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

        parent: function (cb) {
            if (!this.parentId || !this.store) {
                return null;
            }
            return this.store.get(this.parentId, cb);
        },

        /**
         * creates divisions of this sector; creates/finds size x size Sectors.
         *
         * @param size {int} 2 or greater
         * @param populate {function} a function to set content for each child.
         * @param returnChildren {boolean}
         * @returns {Array} -- only returns array if returnChildren is true; returns them in i, j order.
         */
        divide: function (size, populate, returnChildren) {
            if (!this.store) {
                throw new Error('cannot divide sectors without a store');
            }
            var sizes = null;
            this.leaves = null;

            if (!(typeof populate === 'function')) {
                returnChildren = populate;
                populate = null;
            }

            if (returnChildren) {
                var children = [];
            }

          //  console.log('size:', size);
            if (Array.isArray(size)) {
                sizes = size.slice(1);
              //  console.log('saving recursed array: ', sizes);
                size = size[0];
            }
            if (size < 2) {
                throw new Error('must divide by at least 2');
            }
            this.lastDivSize = size = Math.floor(size);

            for (var i = 0; i < size; ++i) {
                for (var j = 0; j < size; ++j) {
                    var content = populate ? populate(i, j, this) : null;
                    var existingChild = this.store.childAt(this.id, size, i, j);
                    if (existingChild) {
                        if (populate) {
                            existingChild.content = content;
                        }
                        if (returnChildren) {
                            children.push(existingChild);
                        }
                        if (sizes && sizes.length) {
                            existingChild.divide(sizes);
                        }
                    } else {
                        var newChild = new Sector({size: size, i: i, j: j, content: content, store: this.store}, this);
                        if (sizes && sizes.length) {
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

        children: function (size) {
            if (this.leaves) {
                var out = [];
                for (var i = 0; i < this.leaves.size; ++i) {
                    for (var j = 0; j < this.leaves.size; ++j) {
                        out.push(this.childAt(i, j));
                    }
                }
                return out;
            }
            if (!this.store){
                throw new Error('cannot get children without a store');
            }
            return this.store.children(this.id, size);
        },

        childAt: function (i, j, size) {
            if (!this.store) {
                throw new Error('cannot get childAt without a store');
            }
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
            return this.store.childAt(this.id, size, i, j);
        }
    }

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
