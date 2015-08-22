(function (root) {
    var lodash;
    if (!(typeof exports === 'undefined')) {
        lodash = require('lodash');
    } else {
        lodash = _;
    }
    function SectorStore(globalId) {
        this._list = [];
        this._index = {};
        this.globalId = globalId;
        if (!this.globalId) {
            this._id = 0;
        }
    }

    var globalId = 0;
    SectorStore.prototype = {

        reset: function (remove) {
            for (var i = 0; i < this._list.length; ++i) {
                this.remove(this._list[i]);
            }

            this._list = [];
            this._index = {};
        },

        nextId: function () {
            return this.globalId ? ++globalId : ++this._id;
        },

        get: function (id, cb) {
            if (id.id) {
                id = id.id;
            }
            if (cb) {
                cb(null, this._index[id]);
            } else {
                return this._index[id];
            }
        },

        has: function (id, cb) {
            if (!id) {
                throw new Error('null passed to has');
            }
            if (id.id) {
                id = id.id;
            }
            return this._index.hasOwnProperty(id);
        },

        put: function (sector, cb) {
            if (!sector.id) {
                sector.id = this.nextId();
            }

            this._index[sector.id] = sector;

            lodash.remove(sector, this._list);
            this._list.push(sector);

            sector.store = this;

            if (cb) {
                cb(null, sector);
            } else {
                return sector;
            }
        },

        remove: function (sector, cb) {
            if (sector.store === this) {
                if (sector.id) {
                    delete this._index[sector.id];
                }
                _.remove(this._list, function (s) {
                    return s === sector;
                });

                sector.store = null;
                if (cb) {
                    cb(null, true);
                } else {
                    return true;
                }
            } else {
                if (cb) {
                    cb(new Error('sector was never in this collection'), false);
                } else {
                    return false;

                }
            }
        },

        find: function (params) {
            return _.find(this._list, params);
        },

        childAt: function (id, size, i, j) {
            return _.find(this._list, {parentId: id, size: size, i: i, j: j});
        },

        children: function (id, size, cb) {
            if (id.id) {
                id = id.id;
            }
            var out = [];

            if (typeof size === 'function') {
                cb = size;
                size = null;
            }

            for (var i = 1; i < this._list.length; ++i) {
                if (this._list[i].parentId === id) {
                    if (size) {
                        if (size == this._list[i].size) {
                            out.push(this._list[i]);
                        }
                    } else {
                        out.push(this._list[i]);
                    }
                }
            }

            if (cb) {
                cb(null, out);
            } else {
                return out;
            }
        },

        leaves: function(){
            return _.filter(this._list, 'isLeaf');
        },

        each: function(fn, order){
            var l = _(this._list);
            if (order) l.sortBy(order);

            _.each(l.value(), fn);
        }
    };

    root.SectorStore = SectorStore;

}(typeof exports === 'undefined' ? this : exports));