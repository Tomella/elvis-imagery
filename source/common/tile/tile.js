

(function (angular) {

   'use strict';

   angular.module("common.tile", [])

      .directive("commonTile", ['$rootScope', 'tileService', function ($rootScope, tileService) {
         return {
            scope: {
               data: "="
            },
            template: '<button type="button" class="undecorated" ng-if="data.tileCache" ng-click="toggle(item)" title="Show/hide Tile layer." tooltip-placement="right" tooltip="View on mapS.">' +
            '<i ng-class="{active:data.isTilesShowing}" class="fa fa-lg fa-globe"></i></button>',
            link: function (scope) {
               scope.$watch("data", function (newData, oldData) {
                  if (newData) {
                     tileService.subscribe(newData);
                  } else if (oldData) {
                     // In a fixed tag this gets called.
                     tileService.unsubscribe(oldData);
                  }
               });

               scope.toggle = function () {
                  if (scope.data.isTilesShowing) {
                     tileService.hide(scope.data);
                  } else {
                     tileService.show(scope.data);
                  }
               };

               // Any imagery layer really.
               $rootScope.$on('hide.wms', function (event, id) {
                  if (scope.data && id == scope.data.primaryId && scope.data.isTilesShowing) {
                     scope.toggle();
                  }
               });

               // In an ng-repeat this gets called
               scope.$on("$destroy", function () {
                  tileService.unsubscribe(scope.data);
               });
            }
         };
      }])

      .factory("tileService", ['$http', '$log', '$q', '$timeout', 'selectService', 'mapService',
         function ($http, $log, $q, $timeout, selectService, mapService) {
            var subscribers = {};

            return {
               createLayer: function (service) {
                  return new TileClient(service);
               },

               subscribe: function (data) {
                  var id = data.primaryId,
                     subscription = subscribers[id];

                  if (!data || !data.tileCache) {
                     return;
                  }

                  if (subscription) {
                     subscription.count += 1;
                  } else {
                     subscription = subscribers[id] = {
                        count: 1,
                        layer: this.createLayer(data)
                     };
                  }

                  if (subscription.count === 1 && data.isTilesShowing) {
                     this._showLayer(subscription.layer);
                  }
               },

               unsubscribe: function (data) {
                  var id = data.primaryId,
                     subscription = subscribers[id];

                  if (subscription) {
                     subscription.count--;

                     if (!subscription.count) {
                        // We want to clean up here. We don't say we aren't showing,
                        if (data.isTilesShowing) {
                           this._hideLayer(subscription.layer);
                        }
                     }
                  }
               },

               _showLayer: function (layer) {
                  if (layer) {
                     layer.showTile();
                  }
               },

               _hideLayer: function (layer) {
                  if (layer) {
                     layer.clearTile();
                  }
               },

               show: function (data) {
                  data.isTilesShowing = true;
                  this._showLayer(subscribers[data.primaryId].layer);
               },

               hide: function (data) {
                  data.isTilesShowing = false;
                  this._hideLayer(subscribers[data.primaryId].layer);
               }
            };

            function TileClient(service) {
               this.service = service;
               this.tileLayer = null;
               this.capabilities = null;

               this.toggleTile = function () {
                  if (this.tileLayer) {
                     this.clearTile();
                  } else {
                     this.showTile();
                  }
               };

               this.showTile = function () {
                  var createLayer = function () {
                     if(service.tileCacheOptions && service.tileCacheOptions.type === "WMS") {
                        this.tileLayer = L.tileLayer.wms(service.tileCache, service.tileCacheOptions);
                     } else {
                        // This is the default tile type
                        this.tileLayer = L.tileLayer(service.tileCache, service.tileCacheOptions);
                     }
                     this.tileLayer.addTo(selectService.getLayerGroup());
                  };

                  if (this.tileLayer) {
                     this.clearTile();
                  }

                  return $q.when(createLayer.apply(this));
               };

               this.clearTile = function () {
                  if (this.tileLayer) {
                     selectService.getLayerGroup().removeLayer(this.tileLayer);
                     this.tileLayer = null;
                  }
                  return null;
               };
            }
         }]);

})(angular);
