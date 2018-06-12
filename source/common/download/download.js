
(function(angular, $) {
'use strict';

angular.module("common.download", ['common.geoprocess'])

.directive("wizardPopup", ["downloadService", function(downloadService) {
	return {
		restrict : "AE",
		templateUrl : "common/download/popup.html",
		link : function(scope) {
			downloadService.data().then(function(data) {
				scope.data = data;

				scope.$watch("data.item", function(newValue, oldValue) {
					if(newValue) {
						scope.stage = "bbox";
					}

					if(newValue || oldValue) {
						downloadService.setState(newValue);
					}
				});
			});
		}
	};
}])

.directive("wizardDownload", ["downloadService", function(downloadService) {
	return {
		restrict : "AE",
		controller : "DownloadCtrl",
		templateUrl : "common/download/popup.html",
		link : function() {
			console.log("What the download...");
		}
	};
}])

.directive("commonDownload", ['downloadService', function(downloadService) {
	return {
		templateUrl : "common/download/download.html",
		controller : "DownloadCtrl",
		link : function(scope, element) {
			downloadService.data().then(function(data) {
				scope.data = data;
			});

			scope.$watch("data.item", function(item, old) {
				if(item || old) {
					downloadService.setState(item);
				}
			});
		}
	};
}])

.directive("downloadAdd", ['$rootScope', 'downloadService', 'flashService', function($rootScope, downloadService, flashService) {
	return {
		template : "<button type='button' class='undecorated' ng-click='toggle()'><span class='fa-stack'  tooltip-placement='right' tooltip='Extract data.'>" +
					"<i class='fa fa-lg fa-download' ng-class='{active:item.download}'></i>" +
				"</span></button>",
		restrict: "AE",
		scope: {
			item : "=",
			group: "="
		},
		link : function(scope, element) {
			scope.toggle = function() {
				if(scope.group && scope.group.download) {
					downloadService.clear(scope.item);
				} else {
					flashService.add("Select an area of interest that intersects the highlighted areas.");
					downloadService.add(scope.item);
					if(scope.group && scope.group.sysId) {
						$rootScope.$broadcast('hide.wms', scope.group.sysId);
					}
				}
			};
		}
	};
}])

.directive("downloadEmail", ['downloadService', function(downloadService) {
	return {
		template : '<div class="input-group">' +
  			'<span class="input-group-addon" id="nedf-email">Email</span>' +
			'<input required="required" type="email" ng-change="download.changeEmail(email)" ng-model="email" class="form-control" placeholder="Email address to send download link" aria-describedby="nedf-email">' +
			'</div>',
		restrict: "AE",
		link : function(scope, element) {
			downloadService.getEmail().then(function(email) {
				scope.email = email;
			});
		}
	};
}])


.directive("downloadFilename", ['flashService', 'downloadService', function(flashService, downloadService) {
	return {
		template : '<div class="input-group">' +
  			'<span class="input-group-addon" id="nedf-filename">Filename</span>' +
			'<input type="text"' +
			' ng-maxlength="30" ng-trim="true" ng-keypress="restrict($event)"' +
  			' ng-model="data.filename" class="form-control" placeholder="Optional filename" aria-describedby="nedf-filename">' +
  			'<span class="input-group-addon" id="basic-addon2">.zip</span>' +
			'</div>' +
			'<div>Only up to 9 characters made up of alphanumeric or "_" allowed for file name</div>',
		restrict: "AE",
		scope: {
			data: "="
		},
		link : function(scope, element) {
			var flasher;
			scope.restrict = function(event) {
				var key = event.keyCode;
				var char = String.fromCharCode(key).toUpperCase();
				if(key > 31 && !char.match(/[\_A-Z0-9]/ig)) {
					flashService.remove(flasher);
					flasher = flashService.add('Only alphanumeric characters or "_" allowed in filename.', 5000);
					event.preventDefault();
				} else if(key > 31 && event.currentTarget.value &&  event.currentTarget.value.length >= 9){
					flashService.remove(flasher);
					flasher = flashService.add('Filename is restricted to 9 characters.', 5000);
					event.preventDefault();
				}

			};
		}
	};
}])

.controller("DownloadCtrl", DownloadCtrl)
.factory("downloadService", DownloadService);

DownloadCtrl.$inject = ["downloadService"];
function DownloadCtrl(downloadService) {
	downloadService.data().then(function(data) {
		this.data = data;
	}.bind(this));

	this.remove = function() {
		downloadService.clear();
	};

	this.changeEmail = function(email) {
		downloadService.setEmail(email);
	};
}

DownloadService.$inject = ['$http', '$q', '$rootScope', 'mapService', 'storageService'];
function DownloadService($http, $q, $rootScope, mapService, storageService) {
	var key = "download_email",
		downloadLayerGroup = "Download Layers",

	mapState = {
		zoom : null,
		center : null,
		layer : null
	},

	data = {
		email : null,
		item : null
	},

	service = {
		getLayerGroup : function() {
			return mapService.getGroup(downloadLayerGroup);
		},

		setState : function(data) {
			if(data) {
				prepare();
			} else {
				restore(map);
			}

			function prepare() {
				var bounds = [
					    [data.bounds.yMin, data.bounds.xMin],
					    [data.bounds.yMax, data.bounds.xMax]
					];

				if(mapState.layer) {
					mapService.getGroup(downloadLayerGroup).removeLayer(mapState.layer);
				}
				if(!data.queryLayer) {
					mapState.layer = L.rectangle(bounds, {color:"black", fill:false});
					mapService.getGroup(downloadLayerGroup).addLayer(mapState.layer);
				}
			}

			function restore(map) {
				mapService.clearGroup(downloadLayerGroup);
				mapState.layer = null;
			}
		},

		add : function(item) {
			this.clear();
			data.item = item;
			data.item.download = true;
			if(!item.processsing) {
				item.processing = {
					clip : {
						xMax : null,
						xMin : null,
						yMax : null,
						yMin : null
					}
				};
			}
		},

		clear : function() {
			if(data.item) {
				data.item.download = false;
				data.item = null;
			}


		},

		setEmail : function(email) {
			storageService.setItem(key, email);
		},

		getEmail : function() {
			return storageService.getItem(key).then(function(value) {
				data.email = value;
				return value;
			});
		},

		data : function() {
			return $q.when(data);
		}
	};

	return service;
}

})(angular, $);
