 (function(angular) {

'use strict';

angular.module('common.legend', [])

.directive('commonLegend', [function() {
   return {
      template: "<img ng-href='url' ng-if='url'></img>",
      scope: {
         map: "="
      },
      restrict: "AE",
      link: function(scope) {
         if(scope.map) {
         }
      }
   };
}]);

 })(angular);
