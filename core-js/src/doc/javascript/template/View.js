var docletUtils = require('./tmpl/doclet/utils');
var pageUtils = require('./tmpl/page/utils');

var renderContainer = require('./tmpl/template').render;

var fs = require('jsdoc/fs');
var path = require('jsdoc/path');
var Template = require('jsdoc/template').Template;

var helper = docletUtils.helper;

module.exports = function(data, templatePath) {
  var templateFilesDir = path.join(templatePath, 'tmpl');

  var view = new Template(templateFilesDir);

  registerTypeHelpers.call(view);

  // register view helpers
  view.find = helper.find.bind(view, data);
  view.linkto = helper.linkto;
  view.htmlsafe = helper.htmlsafe;
  view.resolveAuthorLinks = helper.resolveAuthorLinks;

  view.tutoriallink = docletUtils.tutorialLink;

  view.nav = buildNavigationIndex.call(view, data);

  view.generate = generate.bind(view);
  view.generateGlobal = generateGlobal.bind(view);
  view.generateHome = generateHome.bind(view, data);

  return view;
};

var generate = function(title, doclets, outputPath) {
  var view = this;

  try {
    var html = renderContainer.call(view, {
      title: title,
      docs: doclets
    });

    fs.writeFile(outputPath, html, 'utf8', function(error) {
      if (error) {
        console.log('[ERROR] Could not write file: ' + title + '\n');
      }

      // console.log('[INFO] Generated documentation for: ' + title + '\n')
    });

  } catch(error) {
    console.log('[ERROR] Could not generate documentation for: ' + title + '\n' + error + '\n');
  }
};

var generateGlobal = function(members, globalUrl) {
  var globals = members.globals;
  if (!globals.length) {
    return;
  }

  var view = this;

  var title = 'Global';
  var doclets = [{
    kind: 'globalobj'
  }];

  view.generate(title, doclets, globalUrl);
};

var generateHome = function(data, options, indexUrl) {
  var view = this;

  // index page displays information from package.json and lists files
  var files = helper.find(data, { kind: 'file' });
  var packages = helper.find(data, { kind: 'package' });

  var title = 'Home';
  var doclets = packages.concat([{
    kind: 'mainpage', readme: options.readme,
    longname: options.mainpagetitle || 'Main Page'
  }]).concat(files);

  view.generate(title, doclets, indexUrl);
};

var buildNavigationIndex = function(data) {
  function _searchMembers(kind, memberOf) {
    var searchSpec = {
      kind: kind,
      memberof: memberOf
    };

    var members = [];
    helper.find(data, searchSpec).forEach(function(member) {
      members.push(_getMemberData(member, kind));
    });

    return members;
  }

  function _getMemberData(member, kind) {
    var name = member.name;
    var longname = member.longname;

    var trimmedName = member.name != null ? member.name.replace(/"(.+)"/, '$1') : null;

    var memberSpec = {
      name: trimmedName,
      longname: longname,
      kind: kind
    };

    var hasPrefix = name !== longname;
    var prefix = hasPrefix ? longname.replace(name, '') : '';

    var isClass = kind === docletUtils.KIND_CLASS;
    var isEvent = kind === docletUtils.KIND_EVENT;
    var isNamespace = kind === docletUtils.KIND_NAMESPACE;

    if (isClass || isNamespace) {
      memberSpec.interfaces = _searchMembers(docletUtils.KIND_INTERFACE, longname);
      memberSpec.classes = _searchMembers(docletUtils.KIND_CLASS, longname);
      memberSpec.events = _searchMembers(docletUtils.KIND_EVENT, longname);
    }

    if (isNamespace) {
      memberSpec.title = prefix + pageUtils.strong(helper.linkto(longname, name));
    }

    if (isEvent) {
      var scope = member.scope;

      if (typeof scope === "string") {
        var replaceValue = null;

        if (scope === "static") {
          replaceValue = ".html#.event:";
        } else if(member.scope === "instance") {
          replaceValue = ".html#event:";
        }

        if (replaceValue != null) {
          var searchValue = "#event:";

          memberSpec.title = prefix
            .replace(searchValue, replaceValue)
            .replace(/"/g, "_") + encodeURI(name);
        }
      }
    }

    return memberSpec;
  }

  function _buildMembers(members, title) {
    if (!docletUtils.canWriteValue(members)) {
      return "";
    }

    var content = pageUtils.li(title, {class: 'title'});

    members.forEach(function (member) {
      var title = member.title;
      var name = member.name;
      var longname = member.longname;

      content += pageUtils.ul(function () {
        var subListContent = pageUtils.li(function itemLink() {
          var isEvent = member.kind === docletUtils.KIND_EVENT;

          return isEvent ? pageUtils.a(name, {href: title}) : helper.linkto(longname, name);
        });

        var interfaces = member.interfaces;
        var classes = member.classes;
        var events = member.events;

        if (docletUtils.canWriteValue(interfaces)) {
          subListContent += _buildMembers(interfaces, 'Interfaces')
        }

        if (docletUtils.canWriteValue(classes)) {
          subListContent += _buildMembers(classes, 'Classes')
        }

        if (docletUtils.canWriteValue(events)) {
          subListContent += _buildMembers(events, 'Events')
        }

        return subListContent;
      });
    });

    return content;
  }

  function _buildToggleScript() {
    return pageUtils.script(function toggleScript() {
      return "\n$(\".index-nav button[id^='toggle_']\").click(function() {" +
        "\n  var $this = $(this);" +
        "\n  var index = $this.attr('id').replace('toggle_', '');" +
        "\n" +
        "\n  $this.toggleClass('mt-toggle-expand').toggleClass('mt-toggle-collapse');" +
        "\n  $('ul#namespace_' + index).toggleClass('namespace-collapsed').slideToggle();" +
        "\n});";
    });
  }

  // start building nav

  var members = _searchMembers(docletUtils.KIND_NAMESPACE);
  if (!docletUtils.canWriteValue(members)) {
    return "";
  }

  return pageUtils.ul(function indexList() {
    var listContent = '';

    members.forEach(function(namespace, index) {
      var namespaceTitle = namespace.title;

      listContent += pageUtils.li(function indexItem() {
        var itemContent = '';

        itemContent += pageUtils.button('', {
          id: 'toggle_' + index, class: 'mt-toggle-expand mt-toggle'
        });
        itemContent += pageUtils.span(namespaceTitle);
        itemContent += pageUtils.ul(function subList() {
          var interfaces = namespace.interfaces;
          var classes = namespace.classes;
          var events = namespace.events;

          var subListContent = '';
          if (docletUtils.canWriteValue(interfaces)) {
            subListContent += _buildMembers(interfaces, 'Interfaces')
          }

          if (docletUtils.canWriteValue(classes)) {
            subListContent += _buildMembers(classes, 'Classes')
          }

          if (docletUtils.canWriteValue(events)) {
            subListContent += _buildMembers(events, 'Events')
          }

          return subListContent;
        }, { class: 'namespace_' + index, style: 'display:none;' });

        return itemContent;
      }, { class: 'namespaceEntry' });
    });

    return listContent;
  }, { class: 'index-nav' }) + _buildToggleScript();
};

var registerTypeHelpers = function() {
  var view = this;

  var mdnJsTypeBaseURL = "http://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/";
  var mdnJsWindowBaseURL = "https://developer.mozilla.org/en-US/docs/Web/API/Window/";
  var mdnJsTypes = {
    "string" : true,  "String": true,
    "number": true,   "Number": true,
    "boolean": true,  "Boolean": true,
    "array": true,    "Array": true,
    "object": true,   "Object": true,
    "function": true, "Function": true,
    "Date": true,     "Promise": true,
    "null": true,     "undefined": true,

    "RegExp": true,    "Reflect": true,
    "DataView": true,  "Intl": true,
    "Generator": true, "GeneratorFunction": true,
    "Proxy": true,     "JSON": true,

    "Error": true,      "EvalError": true,
    "TypeError": true,  "SyntaxError": true,
    "RangeError": true, "InternalError": true,
    "URIError": true,   "ReferenceError": true,

    "TypedArray": true,    "ArrayBuffer": true,
    "Float32Array": true,  "Float64Array": true,
    "Int8Array": true,     "Int32Array": true,
    "Inttrue6Array": true, "Uinttrue6Array": true,
    "Uint8Array": true,     "Uint8ClampedArray": true,
    "Uint32Array": true,

    "Map": true, "WeakMap": true,
    "Set": true, "WeakSet": true,
    "Math": true, "Symbol": true
  };

  var mdnJsWindow = {
    "URL": true
  };

  var backboneTypeBaseURL = "http://backbonejs.org/#";
  var jQueryTypes = {
    "jquery": "jQuery",
    "selector": "Selector"
  };
  var jQueryTypeBaseURL = "http://api.jquery.com/Types/#";

  var modifiers = "[?!]?";
  var left_p = "\\(?";
  var right_p = "\\)?";
  var remainder = "$|(?:[|,]\\s*)(.+)";
  var complexProps = "[<(?!\\w|,. )>]+";
  var BACKBONE_TYPE_REGX = /backbone\.([a-z]+)/i;

  // regx: /([?!]?)([\w.*]+)(?:())?/
  //
  // Examples:
  // input: "Object"
  // match: [ input, '', 'Object' ]
  //
  // input: "!Object"
  // match: [ input, '!', 'Object' ]
  //
  // input: "Object.<Boolean>"
  // match: null
  var SIMPLE_TYPE_REGX = new RegExp("(" + modifiers + ")([\\w.*]+)(?:\\(\\))?");

  // regx: /^(?:([?!]?)([\w.]+))\.<([<(?!\w|,. )>]+)>/
  //
  // Examples:
  // input: "Array"
  // match: null;
  //
  // input: "!Array.<Object>"
  // match: [ input, '!', 'Array', 'Object' ]
  //
  // input: "Class.<Object.<String, Date>, Boolean>"
  // match: [ input, '', 'Class', 'Object.<String, Date>, Boolean' ]
  var COMPLEX_TYPE_REGX = new RegExp("^(?:(" + modifiers + ")([\\w.]+))\\.<(" + complexProps + ")>");
  var TYPE_MODIFIER = 1;
  var TYPE_NAME = 2;
  var COMPLEX_TYPE_PROPS = 3;

  // regx: /(\(?(?:[\w|.*!?]+)\)?(?:\.<(?:[<(?!\w|,. )>]+)>)?)(?:$|(?:[|,]\s*)(.+))/
  //
  // Examples:
  // input: "Object.<String, Date>, Boolean, Date, Class.<Function>"
  // match: [ input, 'Object.<String, Date>', 'Date, Class.<Function>' ]
  //
  // input: "Boolean, Date, Class.<Function>"
  // match: [ input, 'Boolean', 'Date, Class.<Function>' ]
  //
  // input: "Date, Class.<Function>"
  // match: [ input, 'Date', 'Class.<Function>' ]
  //
  // input: "Class.<Function>"
  // match: [ input, 'Class.<Function>', undefined ]
  var C_PROPS_RECURSIVE_REGX = new RegExp(
    "(" + left_p + "(?:[\\w|.*!?]+)" + right_p +
    "(?:\\.<(?:" + complexProps + ")>)?)" +
    "(?:" + remainder + ")"
  );
  var C_PROPS_RECURSIVE_FIRST = 1;
  var C_PROPS_RECURSIVE_REMAINDER = 2;

  // regx: /\(((?:.|\|)+)\)/
  //
  // Examples:
  // input: "( String | pentaho.type.Instance | Promise )"
  // match: [ input, 'String | pentaho.type.Instance | Promise' ]
  var MULTIPLE_OR_TYPE_REGX = new RegExp("\\(((?:.|\\|)+)\\)");
  var MULTIPLE_OR_TYPES = 1;

  // -------

  /**
   * Build a type documentation link by checking if it is a simple or complex type declaration
   * and for the later, try to build recursively other type declarations nested inside.
   * @example Simple Type:
   * `Boolean -> `<code><a href="link/to/Boolean">Boolean</a></code>`
   *
   * @example Complex Type:
   * `Object.&lt;Date, String&gt;` -> `<code>
   *                                     <a href="link/to/Object">Object</a>.&lt;
   *                                     <code><a href="link/to/Date">Date</a></code>,
   *                                     <code><a href="link/to/String">String</a></code>&gt;
   *                                   </code>`
   *
   * @example Complex Nested:
   * `Object.&lt;Class.&lt;String&gt;&gt;` -> `<code>
   *                                             <a href="link/to/Object">Object</a>.&lt;
   *                                             <code>
   *                                               <a href="link/to/Class">Class</a>.&lt;
   *                                               <code><a href="link/to/String">String</a></code>&gt;
   *                                             </code>&gt;
   *                                           </code>`
   *
   * @param {String} name       - The type name.
   * @param {Number} [index]    - The type position in the data array
   * @param {Number} [dataSize] - The data array size.
   *
   * @return {String} the html with links for the type declaration.
   */

  var typeBuilder = view._typeBuilder = function(name, index, dataSize) {
    // check if it is an array type
    var jsType = name;
    var complexType = COMPLEX_TYPE_REGX.exec(name);

    var complexTypeProps = null;
    var prefix;
    if (complexType !== null) {
      prefix = complexType[TYPE_MODIFIER];
      jsType = complexType[TYPE_NAME];
      complexTypeProps = complexType[COMPLEX_TYPE_PROPS];
    } else {
      var simpleType = SIMPLE_TYPE_REGX.exec(name);
      prefix = simpleType[TYPE_MODIFIER];
      jsType = simpleType[TYPE_NAME];
    }

    var separator = index != null && index < dataSize - 1 ? " | " : "";
    return buildLink(prefix, jsType, complexTypeProps) + separator;
  };

  /**
   * Parse the properties that are nested inside a complex type declaration
   * and build each nested type documentation link.
   *
   * @param {String} complexTypeProps - The complex type nested properties.
   *
   * @return {String} the html with links for the type declaration.
   */
  function parseComplexTypeProps(complexTypeProps) {
    var result = "";
    if (!complexTypeProps) return result;

    var isFinished = false;
    var recursiveMatch;
    while (!isFinished && (recursiveMatch = C_PROPS_RECURSIVE_REGX.exec(complexTypeProps)) != null) {
      var firstType = recursiveMatch[C_PROPS_RECURSIVE_FIRST];
      complexTypeProps = recursiveMatch[C_PROPS_RECURSIVE_REMAINDER];

      var multipleOrTypes = MULTIPLE_OR_TYPE_REGX.exec(firstType);
      if (multipleOrTypes != null) {
        var html = "";
        var multipleArray = multipleOrTypes[MULTIPLE_OR_TYPES].split("|");
        var dataSize = multipleArray.length;

        multipleArray.forEach(function (name, index) {
          html += typeBuilder(name, index, dataSize);
        });

        result += "(" + html + ")";
      } else {
        result += typeBuilder(firstType);
      }

      isFinished = complexTypeProps == null;
      if (!isFinished) result += ", ";
    }

    return result;
  }

  function buildLink(prefix, jsType, complexTypeProps) {
    var typeLinkInfo = getLinkInfo(jsType);

    var safeHtml = helper.htmlsafe(prefix + typeLinkInfo.jsType);
    var jsTypeLink = helper.linkto(typeLinkInfo.link, safeHtml);

    if (complexTypeProps != null) {
      return "<code>" + jsTypeLink + ".&lt;" + parseComplexTypeProps(complexTypeProps) + "&gt;</code>";
    } else {
      return "<code>" + jsTypeLink + "</code>";
    }
  }

  /**
   * Gets the link for a single type.
   * The type might be changed inside so we return it was well
   *
   * @param {String} jsType - The type name.
   *
   * @return {{String, String}} the type name and the documentation link.
   */
  function getLinkInfo(jsType) {
    var jsTypeLower = jsType.toLowerCase();

    var isMdnJsType = mdnJsTypes[jsType];
    var isMdnJsWindow = mdnJsWindow[jsType];
    var isJQueryType = typeof jQueryTypes[jsTypeLower] !== "undefined";
    var isBackboneType = BACKBONE_TYPE_REGX.exec(jsType) !== null;

    var link;
    if (isMdnJsType) {
      link = mdnJsTypeBaseURL + jsType;

    } else if(isMdnJsWindow) {
      link = mdnJsWindowBaseURL + jsType;

    } else if (isBackboneType) {
      link = backboneTypeBaseURL + jsType.split(".")[1];

    } else if (isJQueryType) {
      jsType = jQueryTypes[jsTypeLower];
      link = jQueryTypeBaseURL + jsType;

    } else { // CTools or unknown type, output its value
      link = jsType;
    }

    return {
      jsType: jsType,
      link: link
    }
  }
};
