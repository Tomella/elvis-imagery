{
   /**
    * Uses: https://raw.githubusercontent.com/seiyria/angular-bootstrap-slider
    */

   angular.module('common.baselayer.control', ['geo.maphelper', 'geo.map', 'ui.bootstrap-slider'])

      .directive('commonBaselayerControl', ['$rootScope', 'mapHelper', 'mapService', function ($rootScope, mapHelper, mapService) {
         var DEFAULTS = {
            maxZoom: 12
         };

         return {
            template: '<slider min="0" max="1" step="0.1" ng-model="slider.opacity" updateevent="slideStop"></slider>',
            scope: {
               maxZoom: "="
            },
            link: function (scope, element) {
               if (typeof scope.maxZoom === "undefined") {
                  scope.maxZoom = DEFAULTS.maxZoom;
               }
               scope.slider = {
                  opacity: -1,
                  visibility: true,
                  lastOpacity: 1
               };

               // Get the initial value
               mapHelper.getPseudoBaseLayer().then(function (layer) {
                  scope.layer = layer;
                  scope.slider.opacity = layer.options.opacity;
               });

               scope.$watch('slider.opacity', function (newValue, oldValue) {
                  if (oldValue < 0) return;

                  mapService.getMap().then(function (map) {
                     map.eachLayer(function (layer) {
                        if (layer.pseudoBaseLayer) {
                           layer.setOpacity(scope.slider.opacity);
                        }
                     });
                  });
               });
            }
         };
      }]);

}