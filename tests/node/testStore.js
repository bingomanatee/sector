var chai = require('chai');
var expect = chai.expect;
var Sector = require('./../../Sector').Sector;
var SectorStore = require('./../../Store').SectorStore;

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