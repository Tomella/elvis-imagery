{
   angular.module('common.reset', [])

      .directive('resetPage', function ($window) {
         return {
            restrict: 'AE',
            scope: {},
            templateUrl: 'common/reset/reset.html',
            controller: ['$scope', function ($scope) {
               $scope.reset = function () {
                  $window.location.reload();
               };
            }]
         };
      });
}