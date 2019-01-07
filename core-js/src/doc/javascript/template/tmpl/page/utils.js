var docletUtils = require('../doclet/utils');

/* global module */

var Page = function pageConstructor(view, wrappedDoclet, type) {

  return {
    _content: '',
    get content() {
      return this._content;
    },

    _type: type != null ? type : 'base',

    get title() {
      return type + ': ' + wrappedDoclet.get('name');
    },

    view: view,

    _renderTopSection: function() {
      console.log('abstract render top section');

      return '';
    },

    _renderSummarySection: function() {
      console.log('abstract render summary section');

      return '';
    },

    _renderDetailSection: function() {
      console.log('abstract render detail section');

      return '';
    },

    _successLog: function() {
      var type = this._type;

      var pageType = type.charAt(0).toUpperCase() + type.substring(1);
      console.log(' > ' + pageType + ': ' + docletUtils._dashboardHardcodedFix(wrappedDoclet.get('name', '')) + '... rendered successfully'/*, pageContent*/);
    },

    _failureLog: function(error) {
      console.log('[' + type + '] Could not render page', error);
    },

    render: function() {
      var pageContent = '';

      try {
        // console.log('top section');
        pageContent += this._renderTopSection(wrappedDoclet);

        // console.log('summary section');
        pageContent += this._renderSummarySection(wrappedDoclet);

        // console.log('detail section');
        pageContent += this._renderDetailSection(wrappedDoclet);

        if (pageContent !== '') {
          console.log('');

          this._successLog();
        }

      } catch(error) {
        pageContent = '';

        this._failureLog(error);
      }

      return pageContent;
    }
  };
};

Page.applyLayout = function(title, content) {
  var output = '<!DOCTYPE html>';

  output += _htmlTag(function htmlTagContent() {
    var _head = _headTag(function headTagContent() {
      var headContent = '';

      headContent += _metaTag({ charset: 'utf-8' });

      headContent += _titleTag( 'JSDoc: ' + title.replace(/"/g, ''));

      var jqueryLink = 'https://ajax.googleapis.com/ajax/libs/jquery/1.12.0/jquery.min.js';
      headContent += _scriptTag('', { src: jqueryLink });

      headContent += '\n<!--[if lt IE 9]>';

      var html5shivLink = '//html5shiv.googlecode.com/svn/trunk/html5.js';
      headContent += _scriptTag('', { src: html5shivLink });

      headContent += '\n<![endif]-->';

      headContent += _linkTag({ href: 'styles/prettify-tomorrow.css' });

      headContent += _linkTag({ href: 'styles/mindtouch-local.css' });

      return headContent;
    });

    var _body = _bodyTag(function bodyTagContent() {
      return _divTag(function mainDiv() {
        return content;
      }, { id: 'main' });

    });

    return _head + '\n' + _body;
  }, { lang: 'en' });

  return output;
};

module.exports.Page = Page;

var simpleIdent = function(level) {
  return { level: level, out: true };
};

var fullIdent = function(level) {
  return { level: level, in: true, out: true };
};

var Tag = function(_name, _inner, _properties, ident) {
  _properties = _properties || {};

  var _level = _properties.level || 3;

  return {
    _indentation: ident === 'simple' ? simpleIdent(_level) : fullIdent(_level),
    get indentation() {
      return this._indentation;
    },

    get tagLevel() {
      return this.indentation.level;
    },

    get innerLevel() {
      return this.indentation.level + 1
    },

    _name: _name,
    get name() {
      return this._name;
    },

    _inner: _inner,
    get inner() {
      return this._inner;
    },

    _properties: _properties,
    get properties() {
      return this._properties;
    },

    _parseTagProperties: function() {
      var properties = this.properties;

      return Object.keys(properties).filter(function(prop) {
        return true;//prop !== 'level';
      }).map(function buildHtmlTagProperty(prop) {
        var value = properties[prop];

        return prop + '="' + value + '"';
      }).join(' ');
    },

    _evaluateInnerValue: function() {
      var inner = this.inner;

      var isFunction = typeof inner === 'function';
      if (isFunction) {
        inner = inner.call(this);
      }

      var indentation = this.indentation;
      if (indentation.in) {
        inner = '\n' + inner
          .split('\n')
          .filter(function whiteSpaceFilter(line) {
            return !/^\s*$/.test(line);
          })
          .map(function lineIndentation(line) {
          return '  ' + line;
        }).join('\n') + '\n';
      }

      return inner || '';
    },

    _open: function() {
      var properties = this._parseTagProperties();
      var hasProperties = docletUtils.canWriteValue(properties);

      var openTag = '<' + this.name + (hasProperties ? ' ' + properties : '') + '>';
      if (this.indentation.out) {
        openTag = '\n' + openTag;
      }

      return openTag;
    },

    _close: function() {
      return '</' + this.name + '>';
    },

    buildOpen: function() {
      return this._open();
    },

    build: function(force) {
      var content = this._evaluateInnerValue();
      if (!force && /^\s*$/.test(content)) return '';

      return this._open() + content + this._close();
    }
  };
};


// region Html Tags
/*var _h2Tag = */module.exports.h2 = function(inner, properties) {
  return Tag('h2', inner, properties, 'full').build();
};

var _h3Tag = module.exports.h3 = function(inner, properties) {
  return Tag('h3', inner, properties, 'full').build();
};

/*var _h5Tag = */module.exports.h5 = function(inner, properties) {
  return Tag('h5', inner, properties, 'full').build();
};

/*var _strongTag = */module.exports.strong = function(inner, properties) {
  return Tag('strong', inner, properties, 'simple').build();
};

/*var _pTag = */module.exports.p = function(inner, properties) {
  return Tag('p', inner, properties, 'full').build();
};

/*var _navTag = */module.exports.nav = function(inner, properties) {
  return Tag('nav', inner, properties, 'full').build();
};

var _divTag = module.exports.div = function(inner, properties) {
  return Tag('div', inner, properties, 'full').build();
};

/*var _spanTag = */module.exports.span = function(inner, properties) {
  return Tag('span', inner, properties, 'full').build();
};

/*var _buttonTag = */module.exports.button = function(inner, properties) {
  return Tag('button', inner, properties, 'full').build(true);
};

/*var _preTag = */module.exports.pre = function(inner, properties) {
  return Tag('pre', inner, properties, 'full').build();
};

/*var _codeTag = */module.exports.code = function(inner, properties) {
  return Tag('code', inner, properties, 'full').build();
};

/*var _aTag = */module.exports.a = function(inner, properties) {
  return Tag('a', inner, properties, 'simple').build();
};

/*var _supTag = */module.exports.sup = function(inner, properties) {
  return Tag('sup', inner, properties, 'full').build();
};

// region html layout
var _htmlTag = module.exports.html = function(inner, properties) {
  return Tag('html', inner, properties, 'full').build();
};

var _headTag = module.exports.head = function(inner, properties) {
  return Tag('head', inner, properties, 'full').build();
};

var _bodyTag = module.exports.body = function(inner, properties) {
  return Tag('body', inner, properties, 'full').build();
};

var _linkTag = module.exports.link = function(properties) {
  properties = properties || {};
  properties.type = 'text/css';
  properties.rel = 'stylesheet';

  return Tag('link', '', properties, 'simple').buildOpen();
};

var _scriptTag = module.exports.script = function(inner, properties) {
  properties = properties || {};

  properties.type = 'text/javascript';

  return Tag('script', inner, properties, 'full').build(true);
};

var _titleTag = module.exports.title = function(inner, properties) {
  return Tag('title', inner, properties, 'simple').build();
};

var _metaTag = module.exports.meta = function(properties) {
  return Tag('meta', '', properties, 'simple').buildOpen();
};
// endregion

// region Table
var _tableTag = module.exports.table = function(inner, properties) {
  return Tag('table', inner, properties, 'full').build();
};

var _captionTag = module.exports.caption = function(inner, properties) {
  return Tag('caption', inner, properties, 'simple').build();
};

var _theadTag = module.exports.thead = function(inner, properties) {
  return Tag('thead', inner, properties, 'full').build();
};

var _tbodyTag = module.exports.tbody = function(inner, properties) {
  return Tag('tbody', inner, properties, 'full').build();
};

var _trTag = module.exports.tr = function(inner, properties) {
  return Tag('tr', inner, properties, 'full').build();
};

var _thTag = module.exports.th = function(inner, properties) {
  return Tag('th', inner, properties, 'full').build();
};

var _tdTag = module.exports.td = function(inner, properties) {
  return Tag('td', inner, properties, 'full').build();
};
// endregion

// region Unordered List
var _ulTag = module.exports.ul = function(inner, properties) {
  return Tag('ul', inner, properties, 'full').build();
};

var _liTag = module.exports.li = function(inner, properties) {
  return Tag('li', inner, properties, 'full').build();
};
// endregion

// region Description List
var _dlTag = module.exports.dl = function(inner, properties) {
  return Tag('dl', inner, properties, 'full').build();
};

var _dtTag = module.exports.dt = function(inner, properties) {
  return Tag('dt', inner, properties, 'full').build();
};

/*var _ddTag = */module.exports.dd = function(inner, properties) {
  return Tag('dd', inner, properties, 'full').build();
};
// endregion

// endregion

var DEFAULT_TABLE_HEADERS = ['Name', 'Description'];

module.exports.buildGenericTable = function(headers, values, config) {
  var table = '';

  if (!docletUtils.canWriteValue(values)) {
    return table;
  }

  config = config || {};

  table += _tableTag(function tableInner() {
    var caption = config.caption != null ? _captionTag(config.caption) : '';

    return caption + _theadTag(function theadInner() {
      headers = headers || DEFAULT_TABLE_HEADERS;

      return _trTag(function theadRowInner() {
        return headers.reduce(function headerRowsInner(row, header) {
          return row + _thTag(header, config.thead_th/* || { scope: 'col' }*/)
        }, '');
      }, config.thead_tr);

    }, config.thead) + _tbodyTag(function tbodyInner() {
      return values.reduce(function bodyRowsInner(body, row) {
        var firstCell = row[0] || '';
        var secondCell = row[1] || '';

        var rowInner = _tdTag(firstCell) + _tdTag(secondCell);

        return body + '\n' + _trTag(rowInner, config.tbody_tr);
      }, '');
    }, config.tbody);

  }, config.table/* || { class: 'api-ref-table' }*/);

  return table;
};

var _buildGenericList = module.exports.buildGenericList = function(/*title, */values, listTag, itemTag, config) {
  var list = '';

  if (!docletUtils.canWriteValue(values)) {
    return list;
  }

  config = config || {};

  list += listTag(function listInner() {
    return values.reduce(function itemInner(list, item) {
      return list + docletUtils.canWriteValue(item) ? '\n' + itemTag(item, config.item) : '';
    }, '');
  }, config.list);

  return list;
};

module.exports.buildUnorderedList = function(/*title, */values, config) {
  return _buildGenericList(/*title, */values, _ulTag, _liTag, config);
};

module.exports.buildDescriptionList = function(/*title, */values, config) {
  return _buildGenericList(/*title, */values, _dlTag, _dtTag, config);
};
