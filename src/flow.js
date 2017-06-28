'use strict';

var Promise = require('bluebird');

/**
 * Сделано задание на звездочку
 * Реализованы методы mapLimit и filterLimit
 */
exports.isStar = true;

/**
 * Последовательное выполнение операций
 * @param {Function[]} operations – функции для выполнения
 * @param {Function} callback
 */
exports.serial = function (operations, callback) {
    Promise.reduce(operations, function (total, operation, i) {
        if (!(operation instanceof Function)) {
            callback(new Error('Operation must be a function!'));

            return;
        }

        return new Promise(function (resolve, reject) {
            var cb = function (err, data) {
                if (err) {
                    reject();
                }

                resolve(data);
            };

            return i ? operation(total, cb) : operation(cb);
        });
    }, 0)
    .then(function (data) {
        callback(null, data);
    })
    .catch(function (err) {
        callback(err);
    });
};

/**
 * Параллельная обработка элементов
 * @param {Array} items – элементы для итерации
 * @param {Function} operation – функция для обработки элементов
 * @param {Function} callback
 */
exports.map = function (items, operation, callback) {
    function launchOperation(item) {
        return new Promise(function (resolve, reject) {
            if (!items.length) {
                reject('Invalid data!');
            }

            operation(item, function (err, data) {
                if (err) {
                    reject(new Error(err));
                } else {
                    resolve(data);
                }
            });
        });
    }

    Promise
        .all(items.map(launchOperation))
        .then(
            function (data) {
                callback(null, data);
            },
            function (err) {
                callback(err);
            });
};

/**
 * Параллельная фильтрация элементов
 * @param {Array} items – элементы для фильтрация
 * @param {Function} operation – функция фильтрации элементов
 * @param {Function} callback
 */
exports.filter = function (items, operation, callback) {
    if (!(items instanceof Array)) {
        callback(new Error('Set of items must be array!'));

        return;
    }

    function launchOperations(item) {
        return new Promise(function (resolve, reject) {
            if (!items.length) {
                reject('Invalid data!');
            }

            var cb = function (err, isSuit) {
                if (err) {
                    reject(new Error(err));
                }

                resolve(isSuit);
            };

            operation(item, cb);
        });
    }

    Promise
        .all(items.map(launchOperations))
        .then(function (data) {
            callback(null, items.filter(function (item, i) {
                return data[i];
            }));
        }, function (err) {
            callback(new Error(err));
        });
};

/**
 * Асинхронизация функций
 * @param {Function} func – функция, которой суждено стать асинхронной
 * @returns {Function}
 */
exports.makeAsync = function (func) {
    return function (data, cb) {
        if (data) {
            cb(null, func(data));
        } else {
            cb(new Error('Data error!'));
        }
    };
};

/**
 * Параллельная обработка элементов с ограничением
 * @star
 * @param {Array} items – элементы для итерации
 * @param {Number} limit – максимальное количество выполняемых параллельно операций
 * @param {Function} operation – функция для обработки элементов
 * @param {Function} callback
 */
exports.mapLimit = function (items, limit, operation, callback) {
    var operationsInProcess = 0;
    function launchOperation(item) {
        return new Promise(function (resolve, reject) {
            if (!items.length) {
                reject('Invalid data!');
            }

            var cb = function (err, data) {
                if (err) {
                    reject(new Error(err));
                }

                operationsInProcess--;
                resolve(data);
            };

            var callFuncLater = function () {
                var delay = setInterval(function () {
                    if (operationsInProcess < limit) {
                        clearTimeout(delay);
                        operationsInProcess++;
                        operation(item, cb);
                    }
                }, 0);
            };

            if (operationsInProcess === limit) {
                callFuncLater();
            } else {
                operationsInProcess++;
                operation(item, cb);
            }
        });
    }

    Promise
        .all(items.map(launchOperation))
        .then(function (data) {
            callback(null, data);
        }, function (err) {
            throw new Error(err);
        });
};

/**
 * Параллельная фильтрация элементов с ограничением
 * @star
 * @param {Array} items – элементы для итерации
 * @param {Number} limit – максимальное количество выполняемых параллельно операций
 * @param {Function} operation – функция для обработки элементов
 * @param {Function} callback
 */
exports.filterLimit = function (items, limit, operation, callback) {
    var operationsInProcess = 0;
    function launchOperation(item) {
        return new Promise(function (resolve, reject) {
            if (!items.length) {
                reject('Invalid data!');
            }

            var cb = function (err, isSuit) {
                if (err) {
                    reject(new Error(err));
                }

                operationsInProcess--;
                if (isSuit) {
                    resolve(item);
                } else {
                    resolve(null);
                }
            };

            function callFuncLater() {
                var delay = setInterval(function () {
                    if (operationsInProcess < limit) {
                        clearTimeout(delay);
                        operationsInProcess++;
                        operation(item, cb);
                    }
                }, 0);
            }

            if (operationsInProcess === limit) {
                callFuncLater();
            } else {
                operationsInProcess++;
                operation(item, cb);
            }
        });
    }

    Promise
        .all(items.map(launchOperation))
        .then(function (data) {
            callback(null, data.filter(function (item) {
                return item;
            }));
        }, function (err) {
            callback(err);
        });
};
