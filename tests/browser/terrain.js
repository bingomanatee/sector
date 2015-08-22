var store = new SectorStore();

var span = Math.min(window.innerHeight, window.innerWidth);
var root = new Sector({store: store, span: span, content: {shade: 0}});
var _tile = _.template('<div id="<%= id %>" ' +
    'style="position: absolute; ' +
    'left: <%= offset().i %>px; ' +
    'top: <%= offset().j %>px;' +
    'width: <%= Math.ceil(getSpan() + 1) %>px;' +
    'height: <%= Math.ceil(getSpan() + 1)%>px;' +
        //  'border: 1px solid black;' +
    'background-color: hsl(0, 0%, <%= content && content.hasOwnProperty("shade") ? Math.floor(100 * (content.shade + 1)/2): 0 %>%)"/>');

root.divide([8, 18], function (i, j, cell) {
    var out = {
        shade: 0
    };

    var r = Math.random() * 2 - 1;
    out.shade = r;

    var shade = out.shade;
    if (cell.depth) {
        out.shade /= (cell.depth + 1);
    }
    var shaded = out.shade;

    var parent = cell.parent();
    if (parent && parent.content && parent.content.hasOwnProperty('shade')) {
        out.shade += parent.content.shade;
        var pcs = parent.content.shade;
    }

    var shadepp = out.shade;

    out.shade = Math.min(1, Math.max(-1, out.shade));

    return out;
});

function _render(c) {
    if (c.isLeaf) {
        $('#terrain').append(_tile(c));
    }
    else {
        c.children().forEach(_render);
    }
}

_render(root);