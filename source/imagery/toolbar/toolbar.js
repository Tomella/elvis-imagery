{

      angular.module("imagery.toolbar", [])

         .directive("elevationToolbar", [function () {
            return {
               restrict: "AE",
               templateUrl: "imagery/toolbar/toolbar.html",
               controller: 'toolbarLinksCtrl',
               transclude: true
            };
         }])

         .controller("toolbarLinksCtrl", ["$scope", "configService", function ($scope, configService) {
            let self = this;
            configService.getConfig().then(function (config) {
               self.links = config.toolbarLinks;
            });

            $scope.item = "";
            $scope.toggleItem = function (item) {
               $scope.item = ($scope.item === item) ? "" : item;
            };

         }]);

   }