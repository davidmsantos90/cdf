// var docletUtils = require('../doclet/utils');
var pageUtils = require('./utils');

var detailsSection = require('../generic/details.section');
var summarySection = require('../generic/summary.section');
var membersSection = require('../generic/members.section');
var methodsSection = require('../generic/methods.section');
var eventsSection = require('../generic/events.section');
var typeDefSection = require('../generic/typeDef.section');
var headerSection = require('../generic/header.section');

var descriptionProperty = require('../property/description');

var amdProperty = require('../property/amd');
var seeProperty = require('../property/see');
var examplesProperty = require('../property/examples');
var augmentsProperty = require('../property/augments');
var requiresProperty = require('../property/requires');

/* global module */
exports = module.exports = function(view, wrappedDoclet) {
  var kind = wrappedDoclet.get('kind');

  var genericPage = pageUtils.Page(view, wrappedDoclet, kind);

  genericPage._renderTopSection = renderTopSection.bind(genericPage);
  genericPage._renderSummarySection = renderSummarySection.bind(genericPage);
  genericPage._renderDetailSection = renderDetailSection.bind(genericPage);

  return genericPage;
};

var renderTopSection = function(wrappedDoclet) {
  var output = '';

  output += headerSection.render(wrappedDoclet);

  output += amdProperty.render(wrappedDoclet);
  output += descriptionProperty.render(wrappedDoclet);
  output += detailsSection.render(wrappedDoclet);

  output += seeProperty.render(wrappedDoclet);
  output += augmentsProperty.render(wrappedDoclet);
  output += examplesProperty.render(wrappedDoclet);
  output += requiresProperty.render(wrappedDoclet);

  return output;
};

var renderSummarySection = function(wrappedDoclet) {
  var membersSummary = membersSection.summary;
  var methodsSummary = methodsSection.summary;
  var eventsSummary = eventsSection.summary;

  var output = '';

  output += summarySection.namespacesRender(wrappedDoclet);
  output += summarySection.classesRender(wrappedDoclet);
  output += summarySection.staticEventsRender(wrappedDoclet);
  output += summarySection.interfacesRender(wrappedDoclet);
  output += summarySection.mixinsRender(wrappedDoclet);

  output += membersSummary.render(wrappedDoclet);
  output += methodsSummary.render(wrappedDoclet);

  output += eventsSummary.renderInstance(wrappedDoclet);

  return output;
};

var renderDetailSection = function(wrappedDoclet) {
  var membersDetails = membersSection.details;
  var methodsDetails = methodsSection.details;
  var eventsDetails = eventsSection.details;
  var typeDefDetails = typeDefSection.details;

  var output = '';

  output += membersDetails.render(wrappedDoclet);
  output += methodsDetails.render(wrappedDoclet);
  output += eventsDetails.render(wrappedDoclet);
  output += typeDefDetails.render(wrappedDoclet);

  return output;
};

// tagInner
// <html> -> 0
//   <head> -> 1
//     ...  -> 2, 3...
//   </head>
//   <body> -> 1
//     ...  -> 2, 3...
//   </body>
// </html>
