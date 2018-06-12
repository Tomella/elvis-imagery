(function (angular) {

   'use strict';

   angular.module("common.basin", ['geo.draw'])

      .directive("commonBasinSearch", ['$log', '$timeout', 'basinService', function ($log, $timeout, basinService) {
         return {
            restrict: "AE",
            transclude: true,
            templateUrl: "common/search/basin.html",
            link: function (scope, element) {
               var timeout;
               basinService.load().then(function (data) {
                  scope.basinData = data;
               });
               scope.changing = function () {
                  $log.info("Cancel close");
                  $timeout.cancel(timeout);
               };
               scope.cancel = cancel;
               scope.zoomToLocation = function (region) {
                  basinService.zoomToLocation(region);
                  cancel();
               };
               function cancel() {
                  $timeout.cancel(timeout);
                  timeout = $timeout(function () {
                     $log.info("Clear filter");
                     scope.nameFilter = "";
                  }, 7000);
               }
            }
         };
      }])

      .provider("basinService", BasinsearchServiceProvider)

      .filter("basinFilterList", function () {
         return function (list, filter, max) {
            var response = [], lowerFilter, count;
            if (!filter) {
               return response;
            }
            if (!max) {
               max = 50;
            }
            lowerFilter = filter.toLowerCase();
            if (list) {
               count = 0;
               list.some(function (item) {
                  if (item.name.toLowerCase().indexOf(lowerFilter) > -1) {
                     response.push(item);
                     count++;
                  }
                  return count > max;
               });
            }
            return response;
         };
      });
   function BasinsearchServiceProvider() {
      var basinsUrl = "icsm/resources/config/basins.json",
            basinShapeUrl = "service/basinsearch/basin/",
            baseUrl = '', basinData = {};
      this.setReferenceUrl = function (url) {
         basinsUrl = url;
      };
      this.setShapeUrl = function (url) {
         basinShapeUrl = url;
      };
      this.setBaseUrl = function (url) {
         baseUrl = url;
      };
      this.$get = ['$q', '$rootScope', '$timeout', 'httpData', 'searchMapService',
         function basinServiceFactory($q, $rootScope, $timeout, httpData, searchMapService) {
            var service = {
               load: function () {
                  return httpData.get(baseUrl + basinsUrl, { cache: true }).then(function (response) {
                     basinData.basins = response.data.basins;
                     return basinData;
                  });
               },
               zoomToLocation: function (region) {
                  var bbox = region.bbox;
                  var polygon = {
                     type: "Polygon",
                     coordinates: [[
                        [bbox.xMin, bbox.yMin],
                        [bbox.xMin, bbox.yMax],
                        [bbox.xMax, bbox.yMax],
                        [bbox.xMax, bbox.yMin],
                        [bbox.xMin, bbox.yMin]
                     ]]
                  };
                  var broadcastData = {
                     from: "Basins search",
                     type: "GeoJSONUrl",
                     url: baseUrl + basinShapeUrl + region.id,
                     pan: pan,
                     show: true,
                     name: region.name,
                     polygon: polygon
                  };
                  $rootScope.$broadcast('search.performed', broadcastData);
                  pan();
                  function pan() {
                     searchMapService.goTo(polygon);
                  }
               }
            };
            return service;
         }];
   }

})(angular);
