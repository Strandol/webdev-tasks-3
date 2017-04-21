'use strict';

var flow = require('../src/flow.js');
var fs = require('fs');
var mocha = require('mocha');
var assert = require('assert');
var path = require('path');

var directory = '../data/';

describe('flow lib', function () {
    before(function (done) {
       JSON.parse = flow.makeAsync(JSON.parse);
       done();
    });

    it('should perform all the operations', function (done) {
        flow.serial([
            function (next) {
                fs.readdir(directory, function (error, data) {
                    next(error, data);
                });
            },
            flow.makeAsync(function (files) {
                console.log(files);
                return files.map(function (dir) {
                    return path.join(directory, dir);
                });
            }),
            function (files, next) {
                console.log(files);
                flow.filter(files, function (file, next) {
                    fs.stat(file, function (err, stat) {
                        if (err) {
                            next(err);
                        } else {
                            next(null, stat.size > 0);
                        }
                    });
                }, next);
            },
            function (files, next) {
                console.log(files);
                flow.map(files, function (file, next) {
                    fs.readFile(file, function (err, data) {
                        if (err) {
                            console.log(err);
                            next(err);
                        } else {
                            console.log(data);
                            next(data);
                        }
                    })
                }, next)
            },
            function (content, next) {
                console.log(content);
                flow.map(content, function (data, next) {
                    JSON.parse(data, function (err, result) {
                        if (err) {
                            next(err);
                        } else {
                            next(result);
                        }
                    })
                }, next)
            },
            function (result, next) {
                console.log(result);
                next(result.reduce(function (value, data) {
                    return value + data.price;
                },0))
            }
        ],
        function (err, result) {
            if (err) {
                done(err);
            } else {
                assert.equal(result, '122');
                done();
            }
        });
    });
});
