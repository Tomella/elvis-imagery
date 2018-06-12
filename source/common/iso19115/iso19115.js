
(function (angular) {
   'use strict';

   angular.module('common.iso19115', ['common.recursionhelper'])

      .directive('iso19115Metadata', [function () {
         return {
            templateUrl: 'common/iso19115/metadata.html',
            scope: {
               node: "="
            }
         };
      }])


      .directive('iso19115Contact', [function () {
         return {
            templateUrl: 'common/iso19115/contact.html',
            restrict: "AE",
            scope: {
               node: "="
            }

         };
      }])


      .directive('iso19115Double', [function () {
         return {
            templateUrl: 'common/iso19115/double.html',
            restrict: "AE",
            scope: {
               node: "=",
               name: "@",
               type: "@"
            },
            link: function(scope) {
               if(scope.node) {
                  scope.value = scope.node[scope.name][scope.type];
               }
            }

         };
      }])

      .directive('iso19115Node', [function () {
         var converters = {
            CharacterString: function(node) {
               if(node && node.CharacterString) {
                  return node.CharacterString.__text;
               }
               return null;
            },
            LanguageCode:  function(node) {
               if(node && node.LanguageCode) {
                  return node.LanguageCode._codeListValue;
               }
               return null;
            },
            MD_CharacterSetCode:  function(node) {
               if(node && node.MD_CharacterSetCode) {
                  return node.LanguageCode._codeListValue;
               }
               return null;
            },
            _codeListValue:  function(node) {
               if(node) {
                  return node._codeListValue;
               }
               return null;
            }
         };

         return {
            template: '<ul><li><span class="iso19115-head" ng-show="display">{{display}}:</span> <span class="iso19115-value">{{value}}</span></li></ul>',
            restrict: "AE",
            replace: true,
            scope: {
               node: "=",
               name: "@",
               type: "@"
            },
            link: function(scope) {
               scope.display = nodeName(scope.name);
               scope.value = converters[scope.type](scope.node);
            }
         };
      }])

      .filter('iso19115NodeName', [function () {
         return nodeName;
      }]);

   function nodeName(nodeName) {
      if (nodeName.toUpperCase() == nodeName) {
         return nodeName;
      }
      var parts = nodeName.split("_");
      var name = parts[parts.length - 1];
      return name.replace(/./, function (f) {
         return f.toUpperCase();
      }).replace(/([A-Z])/g, ' $1').trim();
   }
})(angular);