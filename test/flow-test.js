'use strict';

let flow = require('../src/flow');
let _ = require('lodash');
let assert = require('assert');
let mocha = require('mocha');
let chai = require('chai');
let expect = chai.expect;

describe('Flow', () => {
    function isNotNumber(num) {
        return isNaN(num) || num === null || num === undefined;
    }

    describe('Parallel processing of elements', () => {
        function increaseByTwo(item, cb) {
            if (isNotNumber(item)) {
                cb(new Error('Item is not a number'));

                return;
            }

            cb(null, item += 2);
        }

        it('should process several elements', () => {
            flow.map([1, 2, 3], increaseByTwo, (err, data) => {
                expect(data).to.deep.equal([3, 4, 5]);
            });
        });

        it('should process one element', () => {
            flow.map([3], increaseByTwo, (err, data) => {
                expect(data).to.deep.equal([5]);
            });
        });

        it('should process zero elements', () => {
            flow.map([], increaseByTwo, (err, data) => {
                expect(data).to.deep.equal([]);
            });
        });

        it('should not finish process with wrong item', () => {
            flow.map([3, null, 5], increaseByTwo, (err, data) => {
                assert.ok(err);
            });
        });
    });

    describe('Serial performing of functions', () => {
        let arr = [];

        function incByTwo(data, cb) {
            let defined = defineInputData(data, cb);
            defined.callback(null, _.map(defined.items, (item) => {
                return item + 2;
            }));
        }

        function multiplyByTwo(data, cb) {
            let defined = defineInputData(data, cb);
            defined.callback(null, _.map(defined.items, (item) => {
                return item * 2;
            }));
        }

        function defineInputData(data, cb) {
            return isFunction(data)
                ? { items: arr, callback: data }
                : { items: data, callback: cb };
        }

        function isFunction(object) {
            return object instanceof Function;
        }

        it('should throw error if operation is not a function', () => {
            arr = [1, 2, 5];
            flow.serial(['Hello'], (err, result) => {
                assert.ok(err);
            });
        });

        it('should perform all functions', () => {
            arr = [1, 2, 5];
            flow.serial([incByTwo, multiplyByTwo, incByTwo, incByTwo], (err, result) => {
                assert.deepEqual(result, [10, 12, 18]);
            });
        });

        it('should return zero if there are no any functions in array', () => {
            flow.serial([], (err, result) => {
                assert.deepEqual(result, 0);
            });
        });
    });

    describe('Parallel filtering of elements', () => {
        function filterItem(item, cb) {
            if (isNotNumber(item)) {
                cb(new Error(item + ' is not a number!'));
            }
            cb(null, item > 10);
        }

        it('should throw error if input data is not array', () => {
            flow.filter(55, filterItem, (err, filteredItems) => {
                assert.ok(err);
            });
        });

        it('should return empty array if there are no items', () => {
            flow.filter([], filterItem, (err, filteredItems) => {
                expect(filteredItems).to.deep.equal([]);
            });
        })

        it('should filter items', () => {
            flow.filter([1, 15, 30], filterItem, (err, filteredItems) => {
                expect(filteredItems).to.deep.equal([15, 30]);
            });
        });

        it('should throw error when type of data is wrong', () => {
            flow.filter([1, { a: 15 }, 30], filterItem, (err, filteredItems) => {
                assert.ok(err);
            });
        });
    });

    describe('Asynchronous function', () => {
        it('should create and perform async function', () => {
            let asyncFunc = flow.makeAsync((items) => {
                return _.map(items, (item) => {
                    return item * item;
                });
            });

            asyncFunc([2, 10, 30], (err, data) => {
                expect(data).to.deep.equal([4, 100, 900]);
            });
        });

        it('should throw error if function are not get data', () => {
            let asyncFunc = flow.makeAsync((items) => {
                return _.map(items, (item) => {
                    return item * item;
                });
            });

            asyncFunc(null, (err, data) => {
                assert.ok(err);
            });
        })
    });
});
