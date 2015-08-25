function City(id, resolution, span) {
    this.store = new SectorStore();

    this.rootElement = $('#' + id);

    this.root = new Sector({store: this.store, content: {ele: this.rootElement}, span: span});
    this.root.divide(resolution, this._populator.bind(this));
}

City.prototype = {

    _populator: function (i, j, parent) {
        var data = {
            height: 100 + (Math.random() * 50),
            population: 0,
            mud: 0,
            water: 0
        };

        data.rock = data.height * Math.max(Math.random(), Math.random(), Math.random());
        data.mud = data.height - data.rock;

        return data;
    },

    render: function () {

        this.rootElement.empty();
        var html = '';
        this.store.each(function (cell) {
            if (cell.isLeaf) {
                html += this.cellTemplate({city: this, cell: cell});
            }
        }.bind(this), function (cell) {
            return cell.depth
        });
        this.rootElement.html(html);
    },

    cellLeft: function (cell) {
        return this.px(cell.offset().i);
    },

    cellTop: function (cell) {
        return this.px(cell.offset().j);
    },

    cellDim: function (cell) {
        return this.px(cell.getSpan());
    },

    px: function (value) {
        var n = Math.round(value * 10);
        return n / 10 + 'px';
    },

    colorTemplate: _.template('rgb(<%=r %>,<%=g%>,<%=b %>)'),

    cellColor: function (cell) {
        var color = Math.round(255 * SHADE_RATIO * cell.content.height / 200);
        color = Math.max(0, Math.min(color, 255));
        if (!cell.content.water) {
            cell.content.water = 0;
        }
        var blueRange = 255 - color;
        var waterAdd = blueRange * cell.content.water / 100;
        var blue = Math.min(255, Math.floor(color + waterAdd));
        return this.colorTemplate({r: color, g: color, b: blue});
    },

    cellTemplate: _.template('<div id="<%= cell.id %>" class="cell"' +
      ' style="left: <%= city.cellLeft(cell) %>; top: <%= city.cellTop(cell) %>;' +
      ' width: <%= city.cellDim(cell) %>; height: <%= city.cellDim(cell) %>; background-color: <%= city.cellColor(cell) %> "></div>'),

    hydrate: function (amount) {
        this.store.eachLeaf(function (sector) {
            sector.content.water += amount;
        });

        this.store.each(function (branch) {
            var m = branch.childMatrix(true);
            var matrix = new Matrix(m);
            var updates = Matrix.reduce(function (i, j, memoValue, memo) {

                var neighbors = this.neighbors(i, j);

                _.each(neighbors, function (neighbor) {

                });

                return memo;
            }, 'array');
        }, null, _findBranches);
    }

};

function _findBranches(sector) {
    if (sector.isLeaf) {
        return false;
    }
    var c = sector.childAt(0, 0);
    return c.isLeaf;
}

var SHADE_RATIO = 0.666;

var city = new City('city', 12, 500);
city.render();

setTimeout(function () {
    city.hydrate(10);
    city.render();
}, 4000);