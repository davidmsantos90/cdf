/* global env: true, module: true */

'use strict';

module.exports = function() {
  var githubConfig = env.opts.githubConfig;
  if (githubConfig == null) {
    githubConfig = env.opts.githubConfig = {};
  }

  var BASE_URL = "https://github.com";
  var DEFAULT_COMPANY = "pentaho";
  var DEFAULT_BRANCH = "master";

  return {
    /**
     *
     */
    __config: githubConfig,

    get name() {
      var name = this.__config.name;
      if (name != null) {
        return name;
      }

      var url = this.__config.url;
      if (url != null) {
        url = url.replace(/(^\/|\/$)/, '');

        var lastSlash = url.lastIndexOf('/');

        name = this.__config.name = lastSlash !== -1 ? url.substring(lastSlash, url.length) : url;
      }

      return name;
    },

    get company() {
      var company = this.__config.company;
      if (company == null) {
        company = this.__config.company = DEFAULT_COMPANY;
      }

      return company;
    },

    get branch() {
      var branch = this.__config.branch;
      if (branch == null) {
        branch = this.__config.branch = DEFAULT_BRANCH;
      }

      return branch;
    },

    get url() {
      var url = this.__config.url;
      if (url == null) {
        url = this.__config.url = BASE_URL + "/" + this.company + "/" + this.name;
      }

      return url.replace(/\/$/, '');
    }
  }
};

//
// module.exports = function() {
//   var githubConfig = env.opts.githubConfig;
//   if (githubConfig == null) {
//     githubConfig = env.opts.githubConfig = {};
//   }
//
//   var BASE_URL = "https://github.com";
//   var DEFAULT_COMPANY = "pentaho";
//   var DEFAULT_BRANCH = "master";
//
//   var getName = function() {
//     var name = githubConfig.name;
//     if (name != null) {
//       return name;
//     }
//
//     var url = githubConfig.url;
//     if (url != null) {
//       url = url.replace(/(^\/|\/$)/, '');
//
//       var lastSlash = url.lastIndexOf('/');
//
//       name = githubConfig.name = lastSlash !== -1 ? url.substring(lastSlash, url.length) : url;
//     }
//
//     return name;
//   };
//
//   var getCompany = function() {
//     var company = githubConfig.company;
//     if (company == null) {
//       company = githubConfig.company = DEFAULT_COMPANY;
//     }
//
//     return company;
//   };
//
//   var getBranch = function() {
//     var branch = githubConfig.branch;
//     if (branch == null) {
//       branch = githubConfig.branch = DEFAULT_BRANCH;
//     }
//
//     return branch;
//   };
//
//   var getUrl = function() {
//     var url = githubConfig.url;
//     if (url == null) {
//       url = githubConfig.url = BASE_URL + "/" + getCompany() + "/" + getName();
//     }
//
//     return url.replace(/\/$/, '');
//   };
//
//   return {
//     /**
//      *
//      */
//     __config: githubConfig,
//
//     name: getName(),
//
//     company: getCompany(),
//
//     branch: getBranch(),
//
//     url: getUrl()
//
//   }
// };

