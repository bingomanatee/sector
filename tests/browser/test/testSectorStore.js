var expect = chai.expect;

describe('Sector', function () {

    var store;

    before(function () {
        store = new SectorStore();
    });

    describe('#id', function () {
        it('should have an ID ', function () {
            var sector = new Sector({store: store});
            expect(sector.id).to.be.ok;
        });

        it('should have a unique ID', function () {
            expect(new Sector().id === new Sector({store: store}).id).to.be.false;
        });
    });

    describe('registry', function () {
        it('should allow you to make an unregistered sector', function () {
            var unregisteredSector = new Sector({});
            var registeredSector = new Sector({store: store});
            expect(store.has(unregisteredSector)).to.be.false;
            expect(store.has(registeredSector)).to.be.true;
        });

        it('should allow you to register a sector later', function () {
            var unregisteredSector = new Sector({});
            store.put(unregisteredSector)
            expect(store.has(unregisteredSector)).to.be.true;
        });
    });

    describe('constructor', function () {

        it('should accept i and j', function () {
            var sector = new Sector({i: 1, j: 2, size: 3});

            expect(sector.i).to.eql(1);
            expect(sector.j).to.eql(2);
        });

        it('should accept a parent', function () {
            var p = new Sector({store: store});
            var s = new Sector({store: store}, p);
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
            var s = new Sector({store: store});

            expect(s.parent()).to.be.null;
        });

        it('should return the parent of a sector with a parent', function () {
            var p = new Sector({store: store});
            var s = new Sector({store: store}, p);

            expect(s.parent()).to.eql(p);
        });
    });

    describe('#divide', function () {
        it('should be able to divide a sector', function () {
            var p = new Sector({store: store});

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

        describe('values for divide', function () {
            var p;

            beforeEach(function () {
                p = new Sector({span: 100, store: store});
                p.divide([4, 2]);
            })

            it('should be able to get first offset', function () {
                var c = p.childAt(1, 1);
                expect(c.offset()).to.eql({i: 25, j: 25});
            });

            it('should be able to get second offset', function () {
                var cc = p.childAt(1, 1).childAt(1, 1);
                expect(cc.offset()).to.eql({i: 37.5, j: 37.5});
            })
        })
    });

    describe('#offset', function () {

        it('should be 0, 0 for the root', function () {
            var s = new Sector({store: store});

            expect(s.offset().i).to.eql(0);
            expect(s.offset().j).to.eql(0);
        });

        it('should be quarters for quartered children', function () {
            var p = new Sector({store: store});

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
            var p = new Sector({span: 100, store: store});

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
            var p = new Sector({span: 100, store: store});

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
            p = new Sector({store: store});
        });

        describe('array based values', function () {
            beforeEach(function () {
                p.leafDivide(3, [1, 2, 4, 8, 16, 32, 64, 128, 256]);
            });

            it('should be able to get content at 0,0', function () {
                expect(p.childAt(0, 0).content).to.eql(1);
            });

            it('should be able to get content at 2, 2', function () {
                expect(p.childAt(2, 2).content).to.eql(256);
            })

            it('should not register leaf children', function () {
                expect(store.has(p.childAt(0, 0))).to.be.false;
            });
        });

        it('should be able to functionally seed leaves', function () {
            beforeEach(function () {
                p.leafDivide(3, function (i, j, size) {
                    var index = i * size + j;
                    return Math.pow(2, index);
                });
            });

            it('should get content at 0,0', function () {
                expect(p.childAt(0, 0).content).to.eql(1);
            });

            it('should be able to get content at 2,2', function () {
                expect(p.childAt(2, 2).content).to.eql(256);
            });

            it('should not register leaf children', function () {
                expect(p.childAt(0, 0).isRegistered()).to.be.false;
            });
        });

        describe('#children', function () {

            beforeEach(function () {
                p.leafDivide(3, function (i, j, size) {
                    var index = i * size + j;
                    return Math.pow(2, index);
                });
            })

            it('should get content at 0', function () {
                expect(p.children()[0].content).to.eql(1);
            })

            it('should get last content', function () {
                expect(p.children().pop().content).to.eql(256);
            });

            it('should have unregistered content', function () {
                expect(p.children().pop().isRegistered()).to.be.false;
            });
        });

    });

});

describe('SectorStore', function () {

    var store;

    beforeEach(function () {
        store = new SectorStore();
    });

    describe('#put', function () {
        var item;

        beforeEach(function () {
            item = {foo: 'bar'};
            store.put(item);
        });

        it('should set store', function () {
            expect(item.store).to.eql(store);
        });

        it('should set store async', function (done) {
            store.put(item, function (err, newItem) {
                expect(err).to.be.null;
                expect(newItem).to.eql(item);
                done();
            });
        });

        it('should set id', function () {
            expect(item.id).to.eql(1);
        });

        it('should set the next items id', function () {
            var item2 = {foo: 'vey'};
            store.put(item2);
            expect(item2.id).to.eql(2);
        });

    });

    describe('#get', function () {
        var item;

        beforeEach(function () {
            item = {foo: 'bar'};
            store.put(item);
        });

        it('should retrieve record', function () {
            expect(store.get(item.id)).to.eql(item);
        });

        it('should retrivve with callback', function (done) {
            store.get(item.id, function (err, foundItem) {
                expect(foundItem).to.eql(item);
                done();
            })
        })

    });

    describe('#has', function () {
        var item;

        beforeEach(function () {
            item = {foo: 'bar'};
            store.put(item);
        });

        it('should have record', function () {
            expect(store.has(item.id)).to.be.true;
        });

        it('should not have something else', function () {
            expect(store.has(100)).to.be.false;
        });

    });

    describe('#remove', function () {

        var item;

        beforeEach(function () {
            item = {foo: 'bar'};
            store.put(item);
        });

        it('should remove item', function () {
            store.remove(item);
            expect(store.has(item)).to.be.false;
        });

        it('should remove not present item', function () {
            var item2 = {id: 1, foo: 'vey'};
            store.remove(item2);
            expect(store.has(item.id)).to.be.true;
        });
    });

});