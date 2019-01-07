// var docletUtils = require('../doclet/utils');
var pageUtils = require('./utils');

/* global module */
module.exports = function(view, wrappedDoclet) {
  var kind = wrappedDoclet.get('kind');

  return /* sourcePage */ pageUtils.Page(view, wrappedDoclet, kind);
};
