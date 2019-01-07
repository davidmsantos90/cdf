var docletUtils = require('../doclet/utils');
var pageUtils = require('../page/utils');

var PROP_NAME = 'fires';
var PROP_TITLE = 'Fires: ';

/*global module */

// from: method.section
var _genericRenderDetails = function(wrappedDoclet, title) {
  var content = '<!-- fires -->';

  var fires = wrappedDoclet.get(PROP_NAME);
  if (!docletUtils.canWriteValue(fires)) {
    return content;
  }

  content += title + _buildDetailCommaList(fires);

  return content;
};

module.exports = {
  renderDetails: function(wrappedDoclet) {
    var title = pageUtils.strong(PROP_TITLE);

    return pageUtils.p(_genericRenderDetails(wrappedDoclet, title));
  },

  renderMemberDetails: function(wrappedDoclet) {
    var title = pageUtils.h5(PROP_TITLE);

    return _genericRenderDetails(wrappedDoclet, title);
  }
};

// region Private
var _buildDetailCommaList = function(fires) {
  return fires.filter(function(_fire) {
    return docletUtils.canWriteValue(_fire);
  }).map(function(_fire) {
    return decodeURI(docletUtils.linkTo(_fire, _fire.split('"').join('')));
  }).join(', ');
};
// endregion
