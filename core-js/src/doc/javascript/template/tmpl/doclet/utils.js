var helper = require('jsdoc/util/templateHelper');

/* global module */
// override original htmlsafe function
helper.htmlsafeOrig = helper.htmlsafe;

module.exports.htmlSafe = helper.htmlsafe = function(string) {
  return helper.htmlsafeOrig( string ).replace(/>/g, '&gt;').replace(/\n/g, '<br>');
};

module.exports.linkTo = helper.linkto;
module.exports.safeLinkTo = function(longname, linkText) {
  linkText = linkText != null ? helper.htmlsafe(linkText) : linkText;

  return helper.linkto(longname, linkText);
};

module.exports.resolveAuthorLinks = helper.resolveAuthorLinks;

module.exports.tutorialLink = function(tutorial) {
  return helper.toTutorial(tutorial, null, { tag: 'em', classname: 'disabled', prefix: 'Tutorial: ' });
};

module.exports.helper = helper;

module.exports.canWriteValue = function(value) {
  if (value == null) {
    return false;
  }

  var isString = typeof value === 'string';
  if (isString) {
    return value !== '';
  }

  var isArray = Array.isArray(value);
  if (isArray) {
    return value.length > 0;
  }

  var isBoolean = typeof value === 'boolean';
  if (isBoolean) {
    return value;
  }

  return true;
};

var KIND_CLASS = module.exports.KIND_CLASS = 'class';
var KIND_INTERFACE = module.exports.KIND_INTERFACE = 'interface';
var KIND_NAMESPACE = module.exports.KIND_NAMESPACE = 'namespace';
var KIND_EVENT = module.exports.KIND_EVENT = 'event';
var KIND_MIXIN = module.exports.KIND_MIXIN = 'mixin';
var KIND_MODULE = module.exports.KIND_MODULE = 'module';
var KIND_SOURCE = module.exports.KIND_SOURCE = 'source';
var KIND_GLOBAL = module.exports.KIND_GLOBAL = 'globalobj';
var KIND_PACKAGE = module.exports.KIND_PACKAGE = 'package';
var KIND_MAIN = module.exports.KIND_MAIN = 'mainpage';
/*var KIND_FUNCTION = */module.exports.KIND_FUNCTION = 'function';
/*var KIND_TYPEDEF = */module.exports.KIND_TYPEDEF = 'typedef';
/*var KIND_MEMBER = */module.exports.KIND_MEMBER = 'member';

/*var GLOBAL_MEMBER_OF = */exports.GLOBAL_MEMBER_OF = { isUndefined: true };

module.exports._dashboardHardcodedFix = function(value) {
  // hardcoded fix for "Dashboard.Blueprint", "Dashboard.Bootstrap" and "Dashboard.Clean"
  return value.replace(/"?(Dashboard)\.(\w+)"?/, "$1");
};

var shouldWrap = [
  'params', 'subparams', 'properties', 'subprops',
  'returns', 'exceptions'
];

var Wrapper = function(view, doclet) {
  if (doclet._wrapped) return doclet;

  var kind = doclet.kind;

  return {
    _wrapped: true,

    _wrap: function(value) {
      if (value == null) return value;

      var view = this.view;

      if (!Array.isArray(value)) {
        return Wrapper(view, value);
      }

      return value.map(function(v) {
        return Wrapper(view, v);
      });
    },

    view: view,

    doclet: doclet || {},
    original: function() {
      return doclet;
    },

    set: function(prop, value) {
      this.doclet[prop] = value;
    },

    get: function (prop, defaultValue) {
      if (prop === 'nav') {
        return this.view.nav;
      }

      var value = this.doclet[prop];
      if (value == null && defaultValue != null) {
        value = defaultValue;
      }

      if (shouldWrap.indexOf(prop) !== -1) {
        value = this._wrap(value);
      }

      return value;
    },

    isEqualTo: function(prop, test) {
      return this.doclet[prop] === test;
    },

    isStatic: doclet.static === true,

    isClass: kind === KIND_CLASS,
    isInterface: kind === KIND_INTERFACE,
    isNamespace: kind === KIND_NAMESPACE,
    isEvent: kind === KIND_EVENT,
    isMixin: kind === KIND_MIXIN,

    isModule: kind === KIND_MODULE,
    isSource: kind === KIND_SOURCE,
    isGlobal: kind === KIND_GLOBAL,
    isPackage: kind === KIND_PACKAGE,
    isMainPage: kind === KIND_MAIN || kind === KIND_PACKAGE,

    _find: function (kind, scope) {
      var memberOf = this.get('longname');

      var doclets = [].concat(view.find({kind: kind, memberof: memberOf, scope: scope}));

      return this._wrap(doclets);
    },

    _globalFind: function(kind) {
      var view = this.view;
      var memberOf = { isUndefined: true };

      var doclets = [].concat(view.find({kind: kind, memberof: memberOf }));

      return this._wrap(doclets);
    },

    _typeBuilder: view._typeBuilder
  }
};

module.exports.wrap = Wrapper;
