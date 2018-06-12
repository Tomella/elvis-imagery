(function(angular) {

'use strict';

angular.module("common.catchment", ['geo.draw'])

      .directive("commonCatchmentSearch", ['$log', '$timeout', 'catchmentService', function ($log, $timeout, catchmentService) {
         return {
            restrict: "AE",
            transclude: true,
            templateUrl: "common/search/catchment.html",
            link: function (scope, element) {
               var timeout;
               catchmentService.load().then(function (data) {
                  scope.catchmentData = data;
               });
               scope.changing = function () {
                  $log.info("Cancel close");
                  $timeout.cancel(timeout);
               };
               scope.cancel = cancel;
               scope.zoomToLocation = function (region) {
                  catchmentService.zoomToLocation(region);
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

      .provider("catchmentService", CatchmentsearchServiceProvider)

      .filter("catchmentFilterList", function () {
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
   function CatchmentsearchServiceProvider() {
      var catchmentsUrl = "icsm/resources/config/catchments.json",
            catchmentShapeUrl = "service/catchmentsearch/catchment/",
            baseUrl = '', catchmentData = {};
      this.setReferenceUrl = function (url) {
         catchmentsUrl = url;
      };
      this.setShapeUrl = function (url) {
         catchmentShapeUrl = url;
      };
      this.setBaseUrl = function (url) {
         baseUrl = url;
      };
      this.$get = ['$q', '$rootScope', '$timeout', 'httpData', 'searchMapService',
         function catchmentServiceFactory($q, $rootScope, $timeout, httpData, searchMapService) {
            var service = {
               load: function () {
                  return httpData.get(baseUrl + catchmentsUrl, { cache: true }).then(function (response) {
                     catchmentData.catchments = response.data.catchments;
                     return catchmentData;
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
                     from: "Catchments search",
                     type: "GeoJSONUrl",
                     url: baseUrl + catchmentShapeUrl + region.id,
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
