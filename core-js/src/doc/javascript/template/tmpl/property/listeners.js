var docletUtils = require('../doclet/utils');
var pageUtils = require('../page/utils');

/*global module */

// from: method.section
var _renderDetails = function(wrappedDoclet) {
  var content = '<!-- listeners -->';

  var listeners = wrappedDoclet.get('listeners');
  if (!docletUtils.canWriteValue(listeners)) {
    return content;
  }

  content += pageUtils.p(function firesInner() {
    var title = pageUtils.strong('Listeners of This Event:');

    return title + _buildDetailCommaList(listeners);
  });

  return content;
};

module.exports = {
  // render:
  renderDetails: _renderDetails
};

// region Private
var _buildDetailCommaList = function(listeners) {
  return listeners.filter(function(listener) {
    return docletUtils.canWriteValue(listener);
  }).map(function(listener) {
    return decodeURI(docletUtils.linkTo(listener, listener.split('"').join('')));
  }).join(', ');
};
// endregion
