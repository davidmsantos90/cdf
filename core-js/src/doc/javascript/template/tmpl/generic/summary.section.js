var docletUtils = require('../doclet/utils');
var pageUtils = require('../page/utils');

/* global module */

// from: summary.tmpl
var genericSummaryRender = function implementsSectionRender(wrappedDoclet, kind, scope) {
  var summaryContent = '';

  var doclets = wrappedDoclet._find(kind, scope);
  if (!docletUtils.canWriteValue(doclets)) {
    return summaryContent;
  }

  var title = _getSectionTitle(kind, doclets);

  summaryContent += pageUtils.h3(title);
  summaryContent += wrappedDoclet.isMixin
    ? _buildSummaryList(doclets) : _buildSummaryTable(doclets);

  return summaryContent;
};

module.exports = {
  namespacesRender: function(wrappedDoclet) {
    return genericSummaryRender(wrappedDoclet, docletUtils.KIND_NAMESPACE);
  },

  classesRender: function(wrappedDoclet) {
    return genericSummaryRender(wrappedDoclet,  docletUtils.KIND_CLASS);
  },

  staticEventsRender: function(wrappedDoclet) {
    return genericSummaryRender(wrappedDoclet, docletUtils.KIND_EVENT, 'static');
  },

  interfacesRender: function(wrappedDoclet) {
    return genericSummaryRender(wrappedDoclet, docletUtils.KIND_INTERFACE);
  },

  mixinsRender: function(wrappedDoclet) {
    return genericSummaryRender(wrappedDoclet, docletUtils.KIND_MIXIN);
  }
};

// region Private
var _buildSummaryTable = function(doclets) {
  var headers = ['Name', 'Summary'];

  var values = doclets.map(function tableValues(doclet) {
    return [
      docletUtils.linkTo(doclet.get('longname'), doclet.get('parsedName')),
      doclet.isClass ? doclet.get('classSummary') : doclet.get('summary')
    ];
  });

  return pageUtils.buildGenericTable(headers, values);
};

// only used by mixin
var _buildSummaryList = function(doclets) {
  var values = doclets.map(function listValues(doclet) {
    return docletUtils.linkTo(doclet.get('longname'), doclet.get('name'));
  });

  return pageUtils.buildGenericList(values);
};

var NAMESPACE_TITLE = 'Child Namespace';
var CLASS_TITLE = 'Class';
var EVENT_TITLE = 'Event';
var INTERFACE_TITLE = 'Interface';
var MIXIN_TITLE = 'Mixin';

var _getSectionTitle = function(kind, doclets) {
  var isMultipleDoclets = doclets.length > 1;

  var title = '';
  switch (kind) {
    case docletUtils.KIND_NAMESPACE:
      title = NAMESPACE_TITLE + (isMultipleDoclets ? 's' : '');
      break;

    case docletUtils.KIND_CLASS:
      title = CLASS_TITLE + (isMultipleDoclets ? 'es' : '');
      break;

    case docletUtils.KIND_INTERFACE:
      title = INTERFACE_TITLE + (isMultipleDoclets ? 's' : '');
      break;

    case docletUtils.KIND_EVENT:
      title = EVENT_TITLE + (isMultipleDoclets ? 's' : '');
      break;

    case docletUtils.KIND_MIXIN:
      title = MIXIN_TITLE + (isMultipleDoclets ? 's' : '');
      break;
  }

  return title;
};
// endregion
