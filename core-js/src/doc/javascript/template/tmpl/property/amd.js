var docletUtils = require('../doclet/utils');
var pageUtils = require('../page/utils');

var PROP_NAME = 'amd';
var PROP_TITLE = 'AMD Module';

/*global module */

// from: amd.tmpl
var _render = function(wrappedDoclet) {
  var output = '<!-- amd -->';

  var amd = wrappedDoclet.get(PROP_NAME);
  if (!docletUtils.canWriteValue(amd)) {
    return output;
  }

  var amdCodeExample = _buildAmdCodeExample(amd, wrappedDoclet)

  output += pageUtils.p(function amdTitle() {
    return pageUtils.strong(PROP_TITLE)
  });

  output += pageUtils.pre(amdCodeExample, { function: 'syntax.javascript' });

  return output;
};

module.exports = {
  render: _render
};

// region Private
var _buildAmdCodeExample = function(amd, wrappedDoclet) {
  var moduleParameter = docletUtils._dashboardHardcodedFix(wrappedDoclet.get('name'));
  var module = amd.module;

  return 'require(["' + module + '"], function(' + moduleParameter + ') { /* code goes here */ });'
};
// endregion
