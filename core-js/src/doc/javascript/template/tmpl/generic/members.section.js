var docletUtils = require('../doclet/utils');
var pageUtils = require('../page/utils');

var examplesProperty = require('../property/examples');
var seeProperty = require('../property/see');
var firesProperty = require('../property/fires');

var typeProperty = require('../property/type');
var detailsSection = require('./details.section');
var modifiersSection = require('./modifiers.section');

/* global module */

var genericMembersSummaryRender = function(wrappedDoclet, isGlobalPage) {
  var content = '';

  var members = [].concat(isGlobalPage ? wrappedDoclet._globalFind(docletUtils.KIND_MEMBER) : wrappedDoclet._find(docletUtils.KIND_MEMBER));
  if (!docletUtils.canWriteValue(members)) {
    return content;
  }

  var title = 'Member' + (members.length > 1 ? '' : 's');
  content += pageUtils.h3(title);

  content += buildMembersSummaryTable(members);

  return content;
};

var genericMembersDetailsRender = function(wrappedDoclet, isGlobalPage, kind) {
  var output = '';

  var members = isGlobalPage ? wrappedDoclet._globalFind(kind) : wrappedDoclet._find(kind);
  if (!docletUtils.canWriteValue(members)) {
    return output;
  }

  var title = '';
  if (kind === docletUtils.KIND_MEMBER) {
    title = 'Member' + (members.length > 1 ? '' : 's');
  } else if (kind === docletUtils.KIND_TYPEDEF) {
    title = 'Type'
  }

  title += ' Details';
  output += pageUtils.p(title, { class: 'h3' });

  members.forEach(function docletDetails(member) {
    output += buildMembersDetailTable(member)
  });

  return output;
};

module.exports = {
  // from: members-summary.tmpl and container.tmpl
  summary: {
    render: function membersSummaryRender(wrappedDoclet) {
      return genericMembersSummaryRender(wrappedDoclet, false);
    },

    renderGlobal: function globalMembersSummaryRender(wrappedDoclet) {
      return genericMembersSummaryRender(wrappedDoclet, true);
    }
  },

  // from: member-detail.tmpl and container.tmpl
  details: {
    __generic: genericMembersDetailsRender,

    render: function membersSummaryRender(wrappedDoclet) {
      return genericMembersDetailsRender(wrappedDoclet, false, docletUtils.KIND_MEMBER);
    },

    renderGlobal: function globalMembersSummaryRender(wrappedDoclet) {
      return genericMembersDetailsRender(wrappedDoclet, true, docletUtils.KIND_MEMBER);
    }
  }
};

// region Private
var buildMembersSummaryTable = function(members) {
  var headers = null;
  var values = members.filter(function(member) {
    return member != null;
  }).map(function(member) {
    var parsedname = member.get('parsedName');

    var href = '#' + (member.get('scope') === "static" ? '.' : '') + parsedname;

    var firstCell = pageUtils.a(parsedname, { href: href });

    firstCell += pageUtils.code(typeProperty.render(member));

    firstCell += modifiersSection.render(member);


    var secondCell = member.get('summary');

    return [firstCell, secondCell];
  });

  // TODO
  // var bodyRowClass = member.get('access', 'public')
  //   + (member.get('deprecated') ? ' deprecated' : '' )
  //   + (member.get('inherited') ? ' inherited' : '' );
  var config = { tbody_tr: {} };

  return pageUtils.buildGenericTable(headers, values, config)
};

var buildMembersDetailTable = function(member) {
  var parsedname = member.get('parsedName');

  var headers = [parsedname + ':' + pageUtils.code(typeProperty.render(member))];
  var values = _tableMemberDetailRows(member);
  var config = { table: { id: (member.get('scope') === "static" ? '.' : '') + parsedname } };

  return pageUtils.buildGenericTable(headers, values, config)
};

var _tableMemberDetailRows = function(member) {
  var row = '';

  row += member.get('description');

  row += detailsSection.render(member);

  row += examplesProperty.renderCode(member);

  row += firesProperty.renderMemberDetails(member);

  row += seeProperty.render(member);

  row += examplesProperty.renderMemberDetails(member);

  return [row];
};
// endregion
