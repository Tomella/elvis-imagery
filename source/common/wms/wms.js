
(function(angular) {

'use strict';

angular.module("common.wms", [])

.directive("commonWms", ['$rootScope', '$timeout', 'flashService', 'wmsService', function($rootScope, $timeout, flashService, wmsService) {
	return {
		scope : {
			data : "="
		},
		template: '<button type="button" class="undecorated" ng-show="data.services.hasWms()" ng-click="toggle(item)" title="Show/hide WMS layer." tooltip-placement="right" tooltip="View on map using WMS.">' +
			'<i ng-class="{active:data.isWmsShowing}" class="fa fa-lg fa-globe"></i></button>',
		link : function(scope) {
			scope.$watch("data", function(newData, oldData) {
				if(newData) {
					wmsService.subscribe(newData);
				} else if(oldData) {
					// In a fixed tag this gets called.
					wmsService.unsubscribe(oldData);
				}
			});

			$rootScope.$on('hide.wms', function(event, id) {
				if(scope.data && id === scope.data.sysId && scope.data.isWmsShowing) {
					scope.toggle();
				}
			});

			scope.toggle = function() {
				if(scope.data.isWmsShowing) {
					wmsService.hide(scope.data);
				} else {
					wmsService.show(scope.data);
				}
			};

			// In an ng-repeat this gets called
			scope.$on("$destroy", function() {
				wmsService.unsubscribe(scope.data);
			});
		}
	};
}])

.factory("wmsService", ['$http', '$log', '$q', '$timeout', 'selectService', 'mapService',
                        function($http, $log, $q, $timeout, selectService, mapService) {
	var x2js = new X2JS(),
		subscribers = {};

	return {
		createLayer : function(service) {
			return new WmsClient(service);
		},

		subscribe : function(data) {
         if (!data.services || !data.services.getWms) {
            return;
         }

			let id = data.primaryId,
				wms = data.services.getWms(),
				subscription = subscribers[id];

			if(!wms) {
				return;
			}


			if(subscription) {
				subscription.count += 1;
			} else {
				subscription = subscribers[id] = {
					count : 1,
					layer : this.createLayer(wms)
				};
			}

			if(subscription.count === 1 && data.isWmsShowing) {
				this._showLayer(subscription.layer);
			}
		},

		unsubscribe : function(data) {
			var id = data.primaryId,
				subscription = subscribers[id];

			if(subscription) {
				subscription.count--;

				if(!subscription.count) {
					// We want to clean up here. We don't say we aren't showing, we
					if(data.isWmsShowing) {
						this._hideLayer(subscription.layer);
					}
				}
			}
		},

		_showLayer : function(layer) {
			if(layer) {
				layer.showWms();
			}
		},

		_hideLayer : function(layer) {
			if(layer) {
				layer.clearWms();
			}
		},

		show : function(data) {
			data.isWmsShowing = true;
			this._showLayer(subscribers[data.primaryId].layer);
		},

		hide : function(data) {
			data.isWmsShowing = false;
			this._hideLayer(subscribers[data.primaryId].layer);
		}
	};

	function WmsClient(service) {
		var METADATA_SERVER_URL = "service/metadata/wmsLayernames",
			rawUrl;

		if(service.url.indexOf("?") > -1) {
			rawUrl = service.url.substr(0, service.url.indexOf("?"));
			// console.log(rawUrl);
		} else {
			rawUrl = service.url;
		}

		this.service= service;
		this.layerGroup = selectService.getLayerGroup();
		this.wmsLayer = null;
		this.capabilities = null;

		this.toggleWms = function() {
			if(this.wmsLayer) {
				this.clearWms();
			} else {
				this.showWms();
			}
		};

		this.showWms = function() {
			var createLayer = function() {
				this.wmsLayer = L.tileLayer.wms(rawUrl, {
					layers:this.layerNames,
					format : "image/png",
					transparent:true
				}).addTo(this.layerGroup);
			};

			if(this.wmsLayer) {
				this.clearWms();
			}

			if(!this.layerNames) {
				if(service.layerNames) {
					this.layerNames = service.layerNames;
				} else {
					return $http.get(METADATA_SERVER_URL, {params: {url:rawUrl}, cache:true}).then(function(response) {
						this.layerNames = response.data;
						createLayer.apply(this);
					}.bind(this));
				}
			}

			return $q.when(createLayer.apply(this));
		};

		this.clearWms = function() {
			if(this.wmsLayer) {
				this.layerGroup.removeLayer(this.wmsLayer);
				this.wmsLayer = null;
			}
			return null;
		};
	}
}]);

})(angular);
