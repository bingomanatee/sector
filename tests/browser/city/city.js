function City(id, resolution, span) {
    this.store = new SectorStore();

    this.rootElement = $('#' + id);

    this.root = new Sector({store: this.store, content: {ele: this.rootElement}, span: span});
    this.root.divide(resolution, this._populator.bind(this));
    this.businesses = [];
}

function Business(sector, floors, wealth) {
    this.floors = floors || 1;
    this.wealth = wealth || 1;
    this.sector = sector;
}


// density == floors
// wealth from 1 to 10
City.prototype = {

    addBusinessAt: function (sector) {
        var wealth = _.range(1, sector.content.wealth + 1);
        var w = _.shuffle(wealth).pop();
        var b = new Business(sector, 1, w);
        sector.content.business = b;
        this.businesses.push(b);
        return b;
    },

    addBusinesses: function (chanceOf) {
        this.store.each(function (cell) {
            if (cell.isLeaf) {
                switch (cell.content.type) {
                    case 'forest':
                        break;
                    case 'ocean':
                        break;
                    case 'downtown':
                        if (Math.random() < chanceOf * 2) {
                            this.addBusinessAt(cell);
                        }
                        break;
                    case 'home':
                        if (Math.random() < chanceOf){
                            this.addBusinessAt(cell);
                        }
                        break;
                }
            }
        }.bind(this));
    },

    _populator: function (i, j, parent, size) {
        var data = {
            type: 'forest',
            density: 1,
            wealth: 1
        };

        if (parent.depth === 0) {
            var irad = i - size / 2;
            var jrad = j - size / 2;
            var radius = Math.sqrt(irad * irad + jrad * jrad) * 2 / size;
            if (i > size * 0.8) {
                data.type = 'ocean';
            } else if (radius < 0.2) {
                data.type = 'downtown'
                ++data.density;
                ++data.wealth;
            } else if (radius < 0.85) {
                data.type = 'home';
            } else {
                data.type = 'forest';
            }
            if (data.type != 'ocean' && Math.random() < 0.1) {
                data.type = _.shuffle(['forest', 'downtown', 'home', 'lake']).pop();
            }
        } else {
            data = _.clone(parent.content);
        }
        return data;
    },

    busRender: function(c){
      if (!c.content.business){
          return '';
      } else {
          return '<div class="business"></div>';
      }
    },

    render: function () {

        this.rootElement.empty();
        var html = '';
        this.store.each(function (cell) {
            if (cell.isLeaf) {
                html += this.cellTemplate({city: this, busRender: this.busRender.bind(this), cell: cell});
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
        var color = Math.round(255 * cell.content.height / 200);
        color = Math.max(0, Math.min(color, 255));
        return this.colorTemplate({r: color, g: color, b: color});
    },

    cellTemplate: _.template('<div id="<%= cell.id %>" class="cell <%= cell.content.type %>"' +
        ' style="left: <%= city.cellLeft(cell) %>; top: <%= city.cellTop(cell) %>;' +
        ' width: <%= city.cellDim(cell) %>; height: <%= city.cellDim(cell) %>"><%= busRender(cell) %></div>')

};

var city = new City('city', [12, 4], 500);

city.addBusinesses(0.05);

city.render();