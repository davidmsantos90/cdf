var docletUtils = require('../doclet/utils');
var pageUtils = require('../page/utils');

var detailsSection = require('./details.section');
var modifiersSection = require('./modifiers.section');

var seeProperty = require('../property/see');
var examplesProperty = require('../property/examples');
var firesProperty = require('../property/fires');
var listensProperty = require('../property/listens');
var listenersProperty = require('../property/listeners');
var exceptionsProperty = require('../property/exceptions');
var returnsProperty = require('../property/returns');
var paramsProperty = require('../property/params');

/* global module */

var genericMethodsSummaryRender = function implementsSectionRender(wrappedDoclet, isGlobalPage, kind) {
  var summaryContent = '';
  var title = '';

  var methods = null;
  if (kind === docletUtils.KIND_FUNCTION) {
    title = 'Method';

    methods = isGlobalPage ? wrappedDoclet._globalFind(kind) : wrappedDoclet._find(kind);
  } else if (wrappedDoclet.isClass) {
    title = 'Constructor';

    methods = [wrappedDoclet];
  }

  if (!docletUtils.canWriteValue(methods)) {
    return summaryContent;
  }

  title += methods.length > 1 ? '' : 's';
  summaryContent += pageUtils.h3(title);

  summaryContent += _buildMethodSummaryTable(methods);

  return summaryContent;
};

var genericMethodDetailsRender = function(wrappedDoclet, isGlobalPage, kind) {
  var content = '';
  var title = '';

  var methods = null;
  if (kind == null && wrappedDoclet.isClass) {
    title = 'Constructor';

    methods = [wrappedDoclet];
  } else {
    if (kind === docletUtils.KIND_FUNCTION) {
      title = 'Method';
    }

    if (kind === docletUtils.KIND_EVENT) {
      title = 'Event';
    }

    methods = isGlobalPage ? wrappedDoclet._globalFind(kind) : wrappedDoclet._find(kind);
  }

  // console.log('\n #### ' + title + ' details #### \n', Array.isArray(methods));

  if (!docletUtils.canWriteValue(methods)) {
    return content;
  }

  title += (methods.length > 1 ? '' : 's') + ' Details';
  content += pageUtils.p(title, { class: 'h3' });

  content += methods.filter(function(method) {
    return docletUtils.canWriteValue(method);
  }).map(function(method) {
    return _buildDetailsTable(method);
  }).join('\n');

  return content;
};

module.exports = exports = {
  // from: methods-summary.tmpl and container.tmpl
  summary: {
    render: function methodsSummaryRender(wrappedDoclet) {
      return genericMethodsSummaryRender(wrappedDoclet, false, docletUtils.KIND_FUNCTION);
    },

    renderGlobal: function globalMembersSummaryRender(wrappedDoclet) {
      return genericMethodsSummaryRender(wrappedDoclet, true, docletUtils.KIND_FUNCTION);
    },

    renderConstructor: function constructorSummaryRender(wrappedDoclet) {
      if (wrappedDoclet.isStatic) {
        return '';
      }

      return genericMethodsSummaryRender(wrappedDoclet, false);
    }
  },

  // from: method-details.tmpl and container.tmpl
  details: {
    __generic: genericMethodDetailsRender,

    render: function(wrappedDoclet) {
      return genericMethodDetailsRender(wrappedDoclet, false, docletUtils.KIND_FUNCTION)
    },

    renderGlobal: function(wrappedDoclet) {
      return genericMethodDetailsRender(wrappedDoclet, true, docletUtils.KIND_FUNCTION)
    },

    renderConstructor: function(wrappedDoclet) {
      if (wrappedDoclet.isStatic) {
        return '';
      }

      return genericMethodDetailsRender(wrappedDoclet, false)
    }
  }
};

// region Private
// region Method Summary Table
var _tableSummaryRows = function(wrappedMethods) {
  return wrappedMethods.map(function(method) {
    var firstCell = '';

    var methodName = encodeURI(method.get('name'));
    var methodSignature = method.get('signature', '');

    var parsedname = docletUtils._dashboardHardcodedFix(method.get('parsedName'));
    method.set('parsedName', parsedname);

    var linkText = (method.isClass ? 'new ' : '') + parsedname + methodSignature;
    var href = '#' + (method.get('scope') === "static" ? '.' : '') + methodName;

    firstCell += pageUtils.a(linkText, { href: href });

    firstCell += returnsProperty.render(method);
    firstCell += modifiersSection.render(method);


    var isConstructor = method.isClass && !method.isStatic;
    var secondCell = isConstructor ? method.get('constructorSummary') : method.get('summary');

    return [firstCell, secondCell];
  });
};

var _buildMethodSummaryTable = function(wrappedMethods) {
  var headers = null;
  var values = _tableSummaryRows(wrappedMethods);

  return pageUtils.buildGenericTable(headers, values, {
    table: { class: 'api-ref-table' },
    thead_th: { scope: 'col' }
  });
};
// endregion

// region Method Details Table
var _tableDetailHeaders = function(wrappedMethod) {
  var parsedname = wrappedMethod.get('parsedName');

  var header = '';
  if (wrappedMethod.isClass) {
    header += 'new ' + parsedname
  } else if(wrappedMethod.isEvent) {
    var fireChangeRegex = /(parameterName|parameter)(:fireChange)/;

    header += parsedname.replace(fireChangeRegex, '<em>$1</em>$2');
  } else {
    header += parsedname;
  }


  header += wrappedMethod.get('signature', '');

  header = pageUtils.strong(header);
  header += /* ':' + */returnsProperty.render(wrappedMethod);
  header += modifiersSection.render(wrappedMethod);

  return [header];
};

var _tableDetailRows = function(wrappedMethod) {
  var row = '';

  var description = wrappedMethod.get('description');
  if (docletUtils.canWriteValue(description)) {
    row += description.replace(/(\{@link [^\}]+)&quot;([^\}]+)&quot;([^\}]*})/g, "$1\"$2\"$3");
  }

  row += detailsSection.render(wrappedMethod);

  row += paramsProperty.renderDetails(wrappedMethod);

  row += firesProperty.renderDetails(wrappedMethod);

  row += listensProperty.renderDetails(wrappedMethod);

  row += listenersProperty.renderDetails(wrappedMethod);

  row += returnsProperty.renderDetails(wrappedMethod);

  row += exceptionsProperty.renderDetails(wrappedMethod);

  row += seeProperty.render(wrappedMethod);

  row += examplesProperty.render(wrappedMethod);

  return [[row]];
};

var _tableConfiguration = function(wrappedMethod) {
  var isStaticScope = wrappedMethod.isEqualTo('scope', 'static');

  var name = (isStaticScope ? '.' : '') + (wrappedMethod.isEvent ? 'event:' : '')
    + encodeURI(wrappedMethod.get('name'));

  return {
    table: { id: name }
  };
};

var _buildDetailsTable = function(wrappedMethod) {
  // console.log(' - build table ' + wrappedMethod.get('name') + ' - start \n');

  var headers = _tableDetailHeaders(wrappedMethod);
  var values = _tableDetailRows(wrappedMethod);
  var config = _tableConfiguration(wrappedMethod);

  return pageUtils.buildGenericTable(headers, values, config);
};
// endregion
// endregion
