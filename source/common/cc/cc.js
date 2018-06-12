{

   let versions = {
      3: {
         version: "3.0",
         link: "https://creativecommons.org/licenses/by/3.0/au/"
      },
      4: {
         version: "4.0",
         link: "https://creativecommons.org/licenses/by/4.0/"
      }
   };

   angular.module("common.cc", [])

      .directive('commonCc', [function () {
         return {
            templateUrl: 'common/cc/cc.html',
            scope: {
               version: "=?"
            },
            link: function (scope) {
               if (!scope.version) {
                  scope.details = versions[4];
               } else {
                  scope.details = versions[scope.version];
               }
               scope.template = 'common/cc/cctemplate.html';
            }
         };
      }]);

}
