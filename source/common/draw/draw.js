{
   angular.module("common.draw", ['geo.map'])

      .directive("commonDraw", ['$log', '$rootScope', 'commonDrawService', function ($log, $rootScope, commonDrawService) {
         var DEFAULTS = {
            rectangleEvent: "geo.draw.rectangle.created",
            lineEvent: "geo.draw.line.created"
         };


         return {
            restrict: "AE",
            scope: {
               data: "=",
               rectangleEvent: "@",
               lineEvent: "@"
            },
            link: function (scope, element, attrs, ctrl) {

               angular.forEach(DEFAULTS, function (value, key) {
                  if (!scope[key]) {
                     scope[key] = value;
                  }
               });


               commonDrawService.createControl(scope);
            }
         };
      }])

      .factory("commonDrawService", ['$q', '$rootScope', 'mapService', function ($q, $rootScope, mapService) {
         var callbackOptions,
            drawControl,
            drawer,
            featureGroup,
            rectangleDeferred;

         return {
            createControl: function (parameters) {
               if (drawControl) {
                  $q.when(drawControl);
               }

               return mapService.getMap().then(function (map) {
                  var drawnItems = new L.FeatureGroup(),
                     options = {
                        edit: {
                           featureGroup: drawnItems
                        }
                     };

                  if (parameters.data) {
                     angular.extend(options, parameters.data);
                  }

                  featureGroup = parameters.drawnItems = drawnItems;

                  map.addLayer(drawnItems);
                  // Initialise the draw control and pass it the FeatureGroup of editable layers
                  drawControl = new L.Control.Draw(options);
                  map.addControl(drawControl);
                  map.on("draw:created", function (event) {
                     ({
                        polyline: function () {
                           var data = { length: event.layer.getLength(), geometry: event.layer.getLatLngs() };
                           $rootScope.$broadcast(parameters.lineEvent, data);
                        },
                        // With rectangles only one can be drawn at a time.
                        rectangle: function () {
                           var data = {
                              bounds: event.layer.getBounds(),
                              options: callbackOptions
                           };
                           rectangleDeferred.resolve(data);
                           rectangleDeferred = null;
                           $rootScope.$broadcast(parameters.rectangleEvent, data);
                        }
                     })[event.layerType]();
                  });

                  return drawControl;
               });
            },

            cancelDrawRectangle: function () {
               this.options = {};
               if (rectangleDeferred) {
                  rectangleDeferred.reject();
                  rectangleDeferred = null;
                  if (drawer) {
                     drawer.disable();
                  }
               }
            },

            drawRectangle: function (options) {
               this.cancelDrawRectangle();
               callbackOptions = options;
               rectangleDeferred = $q.defer();
               if (drawer) {
                  drawer.enable();
               } else {
                  mapService.getMap().then(function (map) {
                     drawer = new L.Draw.Rectangle(map, drawControl.options.polyline);
                     drawer.enable();
                  });
               }
               return rectangleDeferred.promise;
            }
         };
      }]);

}