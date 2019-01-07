var docletUtils = require('../doclet/utils');
// var pageUtils = require('../../page/utils');

var membersSection = require('./members.section');
var methodsSection = require('./methods.section');

/* global module */

var _getTypeDefDetails = function(wrappedDoclet) {
  return wrappedDoclet.get('signature') == null
    ? membersSection.details
    : methodsSection.details;
};

module.exports = {
  details: {
    render: function(wrappedDoclet) {
      var typeDefDetails = _getTypeDefDetails(wrappedDoclet);

      return typeDefDetails.__generic(wrappedDoclet, false, docletUtils.KIND_TYPEDEF);
    },

    renderGlobal: function(wrappedDoclet) {
      var typeDefDetails = _getTypeDefDetails(wrappedDoclet);

      return typeDefDetails.__generic(wrappedDoclet, true, docletUtils.KIND_TYPEDEF);
    }
  }
};
