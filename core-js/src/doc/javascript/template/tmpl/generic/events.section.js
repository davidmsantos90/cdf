var docletUtils = require('../doclet/utils');
var pageUtils = require('../page/utils');

var methodsSection = require('./methods.section');
var modifiersSection = require('./modifiers.section');

var returnsProperty = require('../property/returns');

/*global module */

var genericEventsSummaryRender = function (wrappedDoclet, scope) {
  var eventsSummaryContent = '';

  var events = wrappedDoclet._find(docletUtils.KIND_FUNCTION, scope);

  if (!docletUtils.canWriteValue(events)) {
    return eventsSummaryContent;
  }

  var title = 'Event' + (events.length > 1 ? '' : 's');
  eventsSummaryContent += pageUtils.h3(title);

  eventsSummaryContent += _buildEventsSummaryTable(events);

  return eventsSummaryContent;
};


var genericEventsDetailsRender = function(wrappedDoclet) {
  return methodsSection.details.__generic(wrappedDoclet, false, docletUtils.KIND_EVENT);
};


module.exports = {
  // from: events-summary.tmpl and container.tmpl
  summary: {
    renderInstance: function(wrappedDoclet) {
      return genericEventsSummaryRender(wrappedDoclet, 'instance');
    }
  },

  // from: container.tmpl
  details: {
    render: genericEventsDetailsRender,

    // alias
    renderGlobal: genericEventsDetailsRender
  }
};

// region Private
var _buildEventsSummaryTable = function(events) {
  var headers = null;
  var values = _tableSummaryRows(events);

  return pageUtils.buildGenericTable(headers, values, {
    table: { class: 'api-ref-table' },
    thead_th: { scope: 'col' }
  })
};

var _tableSummaryRows = function(events) {
  return events.filter(function(event) {
    return docletUtils.canWriteValue(event);
  }).map(function(event) {
    var params = [];
    var eventSignature = '';

    // console.log( ' - event row 1 - start');
    var docletParameters = event.get('params');
    if (docletUtils.canWriteValue(docletParameters)) {
      eventSignature = '(' + docletParameters.reduce(function(signature, parameter) {
        if (parameter == null) {
          return signature;
        }

        var parameterName = parameter.get('name');

        var duplicate = params.indexOf(parameterName) !== -1;
        if(duplicate) {
          return signature;
        }

        var isFirstParameter = !params.length;

        params.push(parameterName);

        return signature + (isFirstParameter ? '' : ', ') + parameterName;
      }, '') + ')';
    }

    event.set('signature', eventSignature);


    // console.log( ' - event row 1 - end');

    return event;
  }).map(function(event) {
    var firstCell = '';

    // console.log( ' - event row 2');

    var name = "event:" + encodeURI(event.get('name'));
    var parsedname = event.get('parsedName');

    // console.log( ' - event row 2');

    firstCell += pageUtils.a(
      parsedname.replace(/(parameterName|parameter)(:fireChange)/, "<em>$1</em>$2") + event.get('signature'),
      { href: '#' + name }
    );

    // console.log( ' - event row 2 - returns', name);
    firstCell += returnsProperty.render(event);
    // console.log( ' - event row 2 - modifiers', name);
    firstCell += modifiersSection.render(event);

    // ----

    var secondCell = event.get('summary');

    // console.log( ' - event row 2');

    return [firstCell, secondCell];
  });
};
// endregion
