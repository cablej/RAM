var conf = require('./abstract-conf.js');

conf.mongoURL = 'mongodb://127.0.0.1:27017/ram';
conf.devMode = false;

module.exports = conf;
