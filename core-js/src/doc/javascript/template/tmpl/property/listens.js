var docletUtils = require('../doclet/utils');
var pageUtils = require('../page/utils');

/*global module */

// methods
var _renderDetails = function(wrappedDoclet) { // from: method.section
  var content = '<!-- listens -->';

  var listens = wrappedDoclet.get('listens');
  if (!docletUtils.canWriteValue(listens)) {
    return content;
  }

  content += pageUtils.p(function firesInner() {
    var title = pageUtils.strong('Listens to Events: ');

    return title + _buildDetailCommaList(listens);
  });

  return content;
};

module.exports = {
  // render:
  renderDetails: _renderDetails
};

// region Private
var _buildDetailCommaList = function(listens) {
  return listens.filter(function(listen) {
    return docletUtils.canWriteValue(listen);
  }).map(function(listen) {
    return decodeURI(docletUtils.linkTo(listen, listen.split('"').join('')));
  }).join(', ');
};
// endregion
