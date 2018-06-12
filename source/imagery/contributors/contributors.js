{

   angular.module('icsm.contributors', [])

      .directive("icsmContributors", ["$interval", "contributorsService", function ($interval, contributorsService) {
         return {
            templateUrl: "imagery/contributors/contributors.html",
            scope: {
            },
            link: function (scope, element) {
               let timer;

               scope.contributors = contributorsService.getState();

               scope.over = () => {
                  $interval.cancel(timer);
                  scope.contributors.ingroup = true;
               };

               scope.out = () => {
                  timer = $interval(() => {
                     scope.contributors.ingroup = false;
                  }, 1000);
               };

               scope.unstick = () => {
                  scope.contributors.ingroup = scope.contributors.show = scope.contributors.stick = false;
                  element.find("a").blur();
               };
            }
         };
      }])

      .directive("icsmContributorsLink", ["$interval",  "contributorsService", function ($interval, contributorsService) {
         return {
            restrict: "AE",
            templateUrl: "imagery/contributors/show.html",
            scope: {
            },
            link: function (scope) {
               let timer;
               scope.contributors = contributorsService.getState();
               scope.over = () => {
                  $interval.cancel(timer);
                  scope.contributors.show = true;
               };

               scope.toggleStick = () => {
                  scope.contributors.stick = !scope.contributors.stick;
                  if (!scope.contributors.stick) {
                     scope.contributors.show = scope.contributors.ingroup = false;
                  }
               };

               scope.out = () => {
                  timer = $interval(() => {
                     scope.contributors.show = false;
                  }, 700);
               };
            }
         };
      }])
      .factory("contributorsService", ContributorsService)

      .filter("activeContributors", function () {
         return function (contributors) {
            if (!contributors) {
               return [];
            }
            return contributors.filter(contributor => contributor.enabled);
         };
      });

   ContributorsService.$inject = ["$http"];
   function ContributorsService($http) {
      var state = {
         show: false,
         ingroup: false,
         stick: false
      };

      $http.get("icsm/resources/config/contributors.json").then(response => {
         state.orgs = response.data;
      });

      return {
         getState: function () {
            return state;
         }
      };
   }

}