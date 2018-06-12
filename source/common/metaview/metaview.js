
(function (angular) {
   'use strict';

   angular.module("common.metaview", [])

      .directive('commonMetaview', ['metaviewService', function (metaviewService) {
         return {
            templateUrl: 'common/metaview/metaview.html',
            restrict: "AE",
            scope: {
               url: "=",
               container: "=",
               item: "="
            },
            link: function (scope) {
               console.log("URL = " + scope.url);
               scope.select = function () {
                  metaviewService.get(scope.url, {cache: true}).then(function (data) {
                     scope.item.metadata = data;
                     scope.container.selected = scope.item;
                  });
               };
            }
         };
      }])

      .directive('commonItemMetaview', [function () {
         return {
            templateUrl: 'common/metaview/item.html',
            restrict: "AE",
            scope: {
               container: "="
            },
            link: function (scope) {
            }
         };
      }])

      .directive('metaviewIso19115', [function () {
         return {
            templateUrl: 'common/metaview/iso19115.html',
            restrict: "AE",
            scope: {
               data: "="
            },
            link: function (scope) {
            }
         };
      }])

      .directive('metaviewIso19115Array', ['RecursionHelper', function (RecursionHelper) {
         function link(scope) {
            scope.isObject = function () {
               return angular.isObject(scope.node);
            };

            scope.getKeys = function () {
               if (scope.isObject()) {
                  return Object.keys(scope.node).filter(function (key) {
                     return !(excludeNodes[key] || key.indexOf(":") > -1);
                  }).map(function (key) {
                     if (key === '') { return '""'; }
                     return key;
                  });
               }
            };
         }

         return {
            template: '<metaview-node ng-repeat="nextKey in getKeys() track by $index" node="node[nextKey]" key="nextKey"></metaview-node>',
            restrict: "AE",
            scope: {
               data: "="
            },
            compile: function (element) {
               // Use the compile function from the RecursionHelper,
               // And return the linking function(s) which it returns
               return RecursionHelper.compile(element, link);
            }
         };
      }])

      .directive('metaviewIso19115Node', ['RecursionHelper', function (RecursionHelper) {
         var excludeNodes = {
            $$hashKey: true,
            __prefix: true,
            __text: true,
            _codeList: true,
            _codeListValue: true,
            CharacterString: true,
            DateTime: true,
            LanguageCode: true,
            MD_ScopeCode: true,
            scopeCode: true
         };
         function link(scope) {
            scope.isObject = function () {
               return angular.isObject(scope.node);
            };

            scope.getKeys = function () {
               if (scope.isObject()) {
                  return Object.keys(scope.node).filter(function (key) {
                     return !(excludeNodes[key] || key.indexOf(":") > -1);
                  }).map(function (key) {
                     if (key === '') { return '""'; }
                     return key;
                  });
               }
            };

            scope.isArray = function () {
               return angular.isArray(scope.node);
            };
         }

         return {
            templateUrl: 'common/metaview/iso19115node.html',
            restrict: "E",
            replace: true,
            scope: {
               node: "=",
               key: "=",
               array: "="
            },
            compile: function (element) {
               // Use the compile function from the RecursionHelper,
               // And return the linking function(s) which it returns
               return RecursionHelper.compile(element, link);
            }
         };
      }])

      .filter('metaviewText', [function () {
         var keyChild = {
            CharacterString: "__text",
            DateTime: "__text",
            LanguageCode: "_codeListValue",
            linkage: ["URL", "__text"],
            MD_ScopeCode: "_codeListValue",
            _codeListValue: "#text"
         }, keys = [];

         angular.forEach(keyChild, function (value, key) {
            this.push(key);
         }, keys);

         return function (node) {
            var value = null;
            if (node) {
               keys.some(key => {
                  var child = node[key];
                  if(child) {
                     let children = keyChild[key];
                     if(!Array.isArray(children )) {
                        children = [children];
                     }

                     let result = child;
                     children.forEach(kid => {
                        if(kid !== "#text") {
                           result = result[kid];
                        }
                     });

                     value = result; //child[keyChild[key]];
                     return true;
                  }
                  return false;
               });
            }
            return value;
         };
      }])

      .filter('metaviewNodeName', [function () {
         return function (nodeName) {
            if (parseInt(nodeName) + "" === "" + nodeName) {
               console.log("Its a num");
               return "";
            }
            if (nodeName.toUpperCase() === nodeName) {
               return nodeName;
            }
            var parts = nodeName.split("_");
            var name = parts[parts.length - 1];
            return name.replace(/./, function (f) { return f.toUpperCase(); }).replace(/([A-Z])/g, ' $1').trim();
         };
      }])

      .filter('metaviewTransform', [function () {
         return function (node, key) {
            if (node.CharacterString) {
               return node.CharacterString.__text;
            }
            return node;
         };
      }])

      .provider('metaviewService', function MetaviewServiceProvider() {
         var proxy = "xml2js/";

         this.proxy = function (newProxy) {
            proxy = newProxy;
         };

         this.$get = ['$http', function ($http) {
            return new MetaviewService(proxy, $http);
         }];
      });

   class MetaviewService {
      constructor(proxy, $http) {
         this.proxy = proxy;
         this.http = $http;
      }

      get(url) {
         return this.http.get(this.proxy + url).then((response) => {
            return response.data;
         });
      }
   }

})(angular);
