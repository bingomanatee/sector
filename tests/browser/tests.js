var expect = chai.expect;

describe('Sector', function () {

    before(function () {
        Sector.$$clean(true);
    });

    describe('#id', function () {
        it('should have an ID ', function () {
            var sector = new Sector();
            expect(sector.id).to.be.ok;
        });

        it('should have a unique ID', function () {
            expect(new Sector().id === new Sector().id).to.be.false;
        });
    });

    describe('registry', function () {
        it('should allow you to make an unregistered sector', function () {
            var unregisteredSector = new Sector({register: false});
            var registeredSector = new Sector();
            expect(unregisteredSector.isRegistered()).to.be.false;
            expect(registeredSector.isRegistered()).to.be.true;
        });

        it('should allow you to register a sector later', function () {
            var unregisteredSector = new Sector({register: false});
            expect(unregisteredSector.isRegistered()).to.be.false;
            unregisteredSector.register();
            expect(unregisteredSector.isRegistered()).to.be.true;
        });
    });

    describe('constructor', function () {

        it('should accept i and j', function () {
            var sector = new Sector({i: 1, j: 2, size: 3});

            expect(sector.i).to.eql(1);
            expect(sector.j).to.eql(2);
        });

        it('should accept a parent', function () {
            var p = new Sector();
            var s = new Sector({}, p);
            expect(s.parentId).to.eql(p.id);
        });

        it('should accept span from constructor', function () {
            var s = new Sector({span: 5});

            expect(s.span).to.eql(5);

            var s2 = new Sector();
            expect(s2.span).to.eql(1);
        });

    });

    describe('#parent', function () {
        it('should return a null for a sector without a parent', function () {
            var s = new Sector();

            expect(s.parent()).to.be.null;
        });

        it('should return the parent of a sector with a parent', function () {
            var p = new Sector();
            var s = new Sector({}, p);

            expect(s.parent()).to.eql(p);
        });
    });

    describe('#divide', function () {
        it('should be able to divide a sector', function () {
            var p = new Sector();

            var children = p.divide(3, true);
            var ijs = [];
            for (var i = 0; i < children.length; ++i) {
                expect(children[i].parentId).to.eql(p.id);
                expect(children[i].size).to.eql(3);
                ijs.push(children[i].i);
                ijs.push(children[i].j);
            }
            expect(ijs).to.eql([0, 0, 0, 1, 0, 2, 1, 0, 1, 1, 1, 2, 2, 0, 2, 1, 2, 2]);
        });

        it('should accept array values for divide', function () {

            var p = new Sector({span: 100});
            p.divide([4, 2])

        })
    });

    describe('#offset', function () {

        it('should be 0, 0 for the root', function () {
            var s = new Sector();

            expect(s.offset().i).to.eql(0);
            expect(s.offset().j).to.eql(0);
        });

        it('should be quarters for quartered children', function () {
            var p = new Sector();

            var children = p.divide(4, true);

            var s = children[0];
            expect(s.offset().i).to.eql(0);
            expect(s.offset().j).to.eql(0);

            var s1 = children[1];
            expect(s1.offset().i).to.eql(0);
            expect(s1.offset().j).to.eql(0.25);

            var s11 = children[5];

            expect(s11.offset().i).to.eql(0.25);
            expect(s11.offset().j).to.eql(0.25);

            var last = children.pop();

            expect(last.offset().i).to.eql(0.75);
            expect(last.offset().j).to.eql(0.75);
        });

        it('should calculate based on larger span', function () {
            var p = new Sector({span: 100});

            var children = p.divide(4, true);

            var s = children[0];
            expect(s.offset().i).to.eql(0);
            expect(s.offset().j).to.eql(0);

            var s1 = children[1];
            expect(s1.offset().i).to.eql(0);
            expect(s1.offset().j).to.eql(25);

            var s11 = children[5];

            expect(s11.offset().i).to.eql(25);
            expect(s11.offset().j).to.eql(25);

            var last = children.pop();

            expect(last.offset().i).to.eql(75);
            expect(last.offset().j).to.eql(75);
        });

        it('should calculate stage 2 children', function () {
            var p = new Sector({span: 100});

            p.divide(4);

            var c11 = p.childAt(1, 1);

            expect(c11.offset().i).to.eql(25);
            expect(c11.offset().j).to.eql(25);

            c11.divide(2);

            var c1111 = c11.childAt(1, 1);

            expect(c1111.offset().i).to.eql(37.5);
            expect(c1111.offset().j).to.eql(37.5);
        })

    });

    describe('#leafDivide', function () {

        var p;
        beforeEach(function () {
            p = new Sector();

        })

        it('should be able to return value at coordinates', function () {
            p.leafDivide(3, [1, 2, 4, 8, 16, 32, 64, 128, 256]);

            expect(p.childAt(0, 0).content).to.eql(1);
            expect(p.childAt(2, 2).content).to.eql(256);
            expect(p.childAt(0,0).isRegistered()).to.be.false;
        });

        it('should be able to functionally seed leaves', function () {
            p.leafDivide(3, function (i, j, size) {
                var index = i * size + j;
                return Math.pow(2, index);
            });

            expect(p.childAt(0, 0).content).to.eql(1);
            expect(p.childAt(2, 2).content).to.eql(256);
            expect(p.childAt(0,0).isRegistered()).to.be.false;
        });

        it('should be able to retrieve an array of temporary children', function(){

            p.leafDivide(3, function (i, j, size) {
                var index = i * size + j;
                return Math.pow(2, index);
            });

            var children = p.children();
            expect(children[0].content).to.eql(1);
            expect(children.pop().content).to.eql(256);
            expect(children.pop().isRegistered()).to.be.false;

        });

    });

});