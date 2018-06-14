{
   angular.module("imagery.clip", ['geo.draw'])

      .directive('imageryInfoBbox', function () {
         return {
            restrict: 'AE',
            templateUrl: 'imagery/clip/infobbox.html'
         };
      })

      .directive("imageryClip", ['$rootScope', '$timeout', 'clipService', 'messageService', 'mapService',
         function ($rootScope, $timeout, clipService, messageService, mapService) {
            return {
               templateUrl: "imagery/clip/clip.html",
               scope: {
                  bounds: "=",
                  trigger: "=",
                  drawn: "&"
               },
               link: function (scope, element) {
                  let timer;

                  scope.clip = clipService.data.clip;

                  scope.typing = false;

                  if (typeof scope.showBounds === "undefined") {
                     scope.showBounds = false;
                  }
                  mapService.getMap().then(function (map) {
                     scope.$watch("bounds", function (bounds) {
                        if (bounds && scope.trigger) {
                           $timeout(function () {
                              scope.initiateDraw();
                           });
                        } else if (!bounds) {
                           clipService.cancelDraw();
                        }
                     });
                  });

                  $rootScope.$on('icsm.clip.draw', function (event, data) {
                     if (data && data.message === "oversize") {
                        scope.oversize = true;
                        $timeout(() => {
                           delete scope.oversize;
                        }, 6000);
                     } else {
                        delete scope.oversize;
                     }
                  });

                  scope.initiateDraw = function () {
                     messageService.info("Click on the map and drag to define your area of interest.");
                     clipService.initiateDraw();
                  };
               }
            };
         }])


      .factory("clipService", ['$q', '$rootScope', 'drawService', function ($q, $rootScope, drawService) {
         let options = {
            maxAreaDegrees: 4
         },
            service = {
               data: {
                  clip: {}
               },
               initiateDraw: function () {
                  $rootScope.$broadcast("clip.initiate.draw", { started: true });
                  let clip = this.data.clip;
                  delete clip.xMin;
                  delete clip.xMax;
                  delete clip.yMin;
                  delete clip.yMax;
                  delete clip.area;
                  return drawService.drawRectangle({
                     retryOnOversize: false
                  });
               },

               cancelDraw: function () {
                  drawService.cancelDrawRectangle();
               },

               setClip: function (data) {
                  return drawComplete(data);
               }
            };

            $rootScope.$on("bounds.drawn", function (event, data) {
               console.log("data", data);
               service.setClip(data);
               let c = service.data.clip;

               $rootScope.$broadcast('icsm.clip.drawn', c);  // Let people know it is drawn
               $rootScope.$broadcast('icsm.bounds.draw', [
                     c.xMin,
                     c.yMin,
                     c.xMax,
                     c.yMax
                  ]);// Draw it
            });

         return service;



         function drawComplete(data) {
            let clip = service.data.clip;
            clip.xMax = data.bounds.getEast().toFixed(5);
            clip.xMin = data.bounds.getWest().toFixed(5);
            clip.yMax = data.bounds.getNorth().toFixed(5);
            clip.yMin = data.bounds.getSouth().toFixed(5);

            service.data.area = (clip.xMax - clip.xMin) * (clip.yMax - clip.yMin);

            return service.data;
         }
      }]);

}