var docletUtils = require('../doclet/utils');
var pageUtils = require('../page/utils');

var PROP_TITLE = 'Example';

/*global module */

// examples.tmpl
var genericExamplesRender = function(wrappedDoclet, prop, titleTag) {
  var content = '<!-- examples -->';

  var examples = wrappedDoclet.get(prop);
  if (!docletUtils.canWriteValue(examples)) {
    return content;
  }

  var title = PROP_TITLE + (examples.length > 1 ? 's' : '');
  content += titleTag(title);

  examples.filter(function(example) {
    return docletUtils.canWriteValue(example);
  }).forEach(function(example) {
    var caption = example.caption;
    var code = example.code;

    content += pageUtils.p(caption, {class: 'code-caption'});
    content += pageUtils.pre(docletUtils.htmlSafe(code), { function: 'syntax.javascript' });
  });

  return examples;
};

module.exports = {
  render: function(wrappedDoclet) {
    return genericExamplesRender(wrappedDoclet, 'examples', pageUtils.h3);
  },

  renderMemberDetails: function(wrappedDoclet) {
    return genericExamplesRender(wrappedDoclet, 'examples', pageUtils.h5);
  },

  renderCode: function(wrappedDoclet) {
    return genericExamplesRender(wrappedDoclet, 'codeExamples', pageUtils.h3);
  }
};

