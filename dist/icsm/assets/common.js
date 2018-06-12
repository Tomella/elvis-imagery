/**
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
*/

'use strict';

{
   /**
    * Uses: https://raw.githubusercontent.com/seiyria/angular-bootstrap-slider
    */

   angular.module('common.baselayer.control', ['geo.maphelper', 'geo.map', 'ui.bootstrap-slider']).directive('commonBaselayerControl', ['$rootScope', 'mapHelper', 'mapService', function ($rootScope, mapHelper, mapService) {
      var DEFAULTS = {
         maxZoom: 12
      };

      return {
         template: '<slider min="0" max="1" step="0.1" ng-model="slider.opacity" updateevent="slideStop"></slider>',
         scope: {
            maxZoom: "="
         },
         link: function link(scope, element) {
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
'use strict';

angular.module('common.accordion', ['ui.bootstrap.collapse']).constant('commonAccordionConfig', {
  closeOthers: true
}).controller('commonAccordionController', ['$scope', '$attrs', 'commonAccordionConfig', function ($scope, $attrs, accordionConfig) {
  // This array keeps track of the accordion groups
  this.groups = [];

  // Ensure that all the groups in this accordion are closed, unless close-others explicitly says not to
  this.closeOthers = function (openGroup) {
    var closeOthers = angular.isDefined($attrs.closeOthers) ? $scope.$eval($attrs.closeOthers) : accordionConfig.closeOthers;
    if (closeOthers) {
      angular.forEach(this.groups, function (group) {
        if (group !== openGroup) {
          group.isOpen = false;
        }
      });
    }
  };

  // This is called from the accordion-group directive to add itself to the accordion
  this.addGroup = function (groupScope) {
    var that = this;
    this.groups.push(groupScope);

    groupScope.$on('$destroy', function (event) {
      that.removeGroup(groupScope);
    });
  };

  // This is called from the accordion-group directive when to remove itself
  this.removeGroup = function (group) {
    var index = this.groups.indexOf(group);
    if (index !== -1) {
      this.groups.splice(index, 1);
    }
  };
}])

// The accordion directive simply sets up the directive controller
// and adds an accordion CSS class to itself element.
.directive('commonAccordion', function () {
  return {
    controller: 'commonAccordionController',
    controllerAs: 'accordion',
    transclude: true,
    templateUrl: function templateUrl(element, attrs) {
      return attrs.templateUrl || 'common/accordion/accordion.html';
    }
  };
})

// The accordion-group directive indicates a block of html that will expand and collapse in an accordion
.directive('commonAccordionGroup', function () {
  return {
    require: '^commonAccordion', // We need this directive to be inside an accordion
    transclude: true, // It transcludes the contents of the directive into the template
    restrict: 'A',
    templateUrl: function templateUrl(element, attrs) {
      return attrs.templateUrl || 'common/accordion/accordionGroup.html';
    },
    scope: {
      heading: '@', // Interpolate the heading attribute onto this scope
      panelClass: '@?', // Ditto with panelClass
      isOpen: '=?',
      isDisabled: '=?'
    },
    controller: function controller() {
      this.setHeading = function (element) {
        this.heading = element;
      };
    },
    link: function link(scope, element, attrs, accordionCtrl) {
      element.addClass('panel');
      accordionCtrl.addGroup(scope);

      scope.openClass = attrs.openClass || 'panel-open';
      scope.panelClass = attrs.panelClass || 'panel-default';
      scope.$watch('isOpen', function (value) {
        element.toggleClass(scope.openClass, !!value);
        if (value) {
          accordionCtrl.closeOthers(scope);
        }
      });

      scope.toggleOpen = function ($event) {
        if (!scope.isDisabled) {
          if (!$event || $event.which === 32) {
            scope.isOpen = !scope.isOpen;
          }
        }
      };

      var id = 'accordiongroup-' + scope.$id + '-' + Math.floor(Math.random() * 10000);
      scope.headingId = id + '-tab';
      scope.panelId = id + '-panel';
    }
  };
})

// Use accordion-heading below an accordion-group to provide a heading containing HTML
.directive('commonAccordionHeading', function () {
  return {
    transclude: true, // Grab the contents to be used as the heading
    template: '', // In effect remove this element!
    replace: true,
    require: '^commonAccordionGroup',
    link: function link(scope, element, attrs, accordionGroupCtrl, transclude) {
      // Pass the heading to the accordion-group controller
      // so that it can be transcluded into the right place in the template
      // [The second parameter to transclude causes the elements to be cloned so that they work in ng-repeat]
      accordionGroupCtrl.setHeading(transclude(scope, angular.noop));
    }
  };
})

// Use in the accordion-group template to indicate where you want the heading to be transcluded
// You must provide the property on the accordion-group controller that will hold the transcluded element
.directive('commonAccordionTransclude', function () {
  return {
    require: '^commonAccordionGroup',
    link: function link(scope, element, attrs, controller) {
      scope.$watch(function () {
        return controller[attrs.commonAccordionTransclude];
      }, function (heading) {
        if (heading) {
          var elem = angular.element(element[0].querySelector(getHeaderSelectors()));
          elem.html('');
          elem.append(heading);
        }
      });
    }
  };

  function getHeaderSelectors() {
    return 'common-accordion-header,' + 'data-common-accordion-header,' + 'x-common-accordion-header,' + 'common\\:accordion-header,' + '[common-accordion-header],' + '[data-common-accordion-header],' + '[x-common-accordion-header]';
  }
});
"use strict";

{

   var versions = {
      3: {
         version: "3.0",
         link: "https://creativecommons.org/licenses/by/3.0/au/"
      },
      4: {
         version: "4.0",
         link: "https://creativecommons.org/licenses/by/4.0/"
      }
   };

   angular.module("common.cc", []).directive('commonCc', [function () {
      return {
         templateUrl: 'common/cc/cc.html',
         scope: {
            version: "=?"
         },
         link: function link(scope) {
            if (!scope.version) {
               scope.details = versions[4];
            } else {
               scope.details = versions[scope.version];
            }
            scope.template = 'common/cc/cctemplate.html';
         }
      };
   }]);
}
"use strict";

{

   angular.module("common.bbox", ['geo.draw']).directive("commonBboxShowAll", ['$rootScope', '$timeout', function ($rootScope, $timeout) {
      return {
         link: function link(scope, element) {
            element.on("click", function () {
               $timeout(function () {
                  $rootScope.$broadcast("commonbboxshowall");
               });
            });
         }
      };
   }]).directive("commonBboxHideAll", ['$rootScope', function ($rootScope) {
      return {
         link: function link(scope, element) {
            element.on("click", function () {
               $rootScope.$broadcast("commonbboxhideall");
            });
         }
      };
   }]).directive("commonBboxShowVisible", ['$rootScope', 'mapService', function ($rootScope, mapService) {
      return {
         link: function link(scope, element) {
            element.on("click", function () {
               mapService.getMap().then(function (map) {
                  $rootScope.$broadcast("commonbboxshowvisible", map.getBounds());
               });
            });
         }
      };
   }]).directive("commonBbox", ['$rootScope', 'bboxService', function ($rootScope, bboxService) {
      return {
         templateUrl: "common/bbox/bbox.html",
         scope: {
            data: "="
         },
         link: function link(scope, element) {

            $rootScope.$on("commonbboxshowall", function () {
               scope.data.hasBbox = true;
            });

            $rootScope.$on("commonbboxhideall", function () {
               scope.data.hasBbox = false;
            });

            $rootScope.$on("commonbboxshowvisible", function (event, bounds) {
               var myBounds = scope.data.bounds,
                   draw = bounds.getWest() < myBounds.xMin && bounds.getEast() > myBounds.xMax && bounds.getNorth() > myBounds.yMax && bounds.getSouth() < myBounds.yMin;

               scope.data.hasBbox = draw;
            });

            scope.$watch("data.hasBbox", function (newValue) {
               if (newValue) {
                  bboxService.draw(scope.data).then(function (bbox) {
                     scope.bbox = bbox;
                  });
               } else {
                  scope.bbox = bboxService.remove(scope.bbox);
               }
            });

            scope.toggle = function () {
               var draw = scope.data.hasBbox = !scope.data.hasBbox;
            };

            scope.$on("$destroy", function () {
               if (scope.data.hasBbox) {
                  scope.bbox = bboxService.remove(scope.bbox);
               }
            });
         }
      };
   }]).factory("bboxService", ['mapService', function (mapService) {
      var normalLayerColor = "#ff7800",
          hilightLayerColor = 'darkblue';

      return {
         draw: function draw(data) {
            var parts = data.bbox.split(" "),
                bounds = [[+parts[1], +parts[0]], [+parts[3], +parts[2]]];

            return mapService.getMap().then(function (map) {
               // create an orange rectangle
               var layer = L.rectangle(bounds, { fill: false, color: normalLayerColor, weight: 2, opacity: 0.8 });
               layer.addTo(map);
               map.fitBounds(bounds);
               return layer;
            });
         },

         remove: function remove(bbox) {
            if (bbox) {
               bbox._map.removeLayer(bbox);
            }
            return null;
         }
      };
   }]);
}
"use strict";

{

	angular.module("common.clip", ['geo.draw']).directive("wizardClip", ['$timeout', 'clipService', 'flashService', function ($timeout, clipService, flashService) {
		return {
			templateUrl: "common/clip/clip.html",
			scope: {
				clip: "=",
				bounds: "=",
				trigger: "=",
				drawn: "&"
			},
			link: function link(scope, element) {
				if (typeof scope.showBounds === "undefined") {
					scope.showBounds = false;
				}
				scope.$watch("bounds", function (bounds) {
					if (bounds && scope.trigger) {
						$timeout(function () {
							scope.initiateDraw();
						});
					} else if (!bounds) {
						clipService.cancelDraw();
					}
				});

				scope.initiateDraw = function () {
					clipService.initiateDraw().then(drawComplete);

					function drawComplete(data) {
						var c = scope.clip;
						var response;

						c.xMax = +data.clip.xMax;
						c.xMin = +data.clip.xMin;
						c.yMax = +data.clip.yMax;
						c.yMin = +data.clip.yMin;
						if (scope.drawn) {
							response = scope.drawn();
							if (response && response.code && response.code === "oversize") {
								scope.initiateDraw();
							}
						}
					}
				};
			}
		};
	}]).factory("clipService", ['$q', '$rootScope', 'drawService', function ($q, $rootScope, drawService) {
		return {
			initiateDraw: function initiateDraw() {
				return drawService.drawRectangle().then(drawComplete);
			},

			cancelDraw: function cancelDraw() {
				drawService.cancelDrawRectangle();
			}
		};

		function drawComplete(data) {
			return { clip: {
					xMax: data.bounds.getEast().toFixed(5),
					xMin: data.bounds.getWest().toFixed(5),
					yMax: data.bounds.getNorth().toFixed(5),
					yMin: data.bounds.getSouth().toFixed(5)
				} };
		}
	}]);
}
"use strict";

{
   angular.module("common.draw", ['geo.map']).directive("commonDraw", ['$log', '$rootScope', 'commonDrawService', function ($log, $rootScope, commonDrawService) {
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
         link: function link(scope, element, attrs, ctrl) {

            angular.forEach(DEFAULTS, function (value, key) {
               if (!scope[key]) {
                  scope[key] = value;
               }
            });

            commonDrawService.createControl(scope);
         }
      };
   }]).factory("commonDrawService", ['$q', '$rootScope', 'mapService', function ($q, $rootScope, mapService) {
      var callbackOptions, drawControl, drawer, featureGroup, rectangleDeferred;

      return {
         createControl: function createControl(parameters) {
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
                     polyline: function polyline() {
                        var data = { length: event.layer.getLength(), geometry: event.layer.getLatLngs() };
                        $rootScope.$broadcast(parameters.lineEvent, data);
                     },
                     // With rectangles only one can be drawn at a time.
                     rectangle: function rectangle() {
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

         cancelDrawRectangle: function cancelDrawRectangle() {
            this.options = {};
            if (rectangleDeferred) {
               rectangleDeferred.reject();
               rectangleDeferred = null;
               if (drawer) {
                  drawer.disable();
               }
            }
         },

         drawRectangle: function drawRectangle(options) {
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
"use strict";

(function (angular) {
	'use strict';

	angular.module("common.extent", ["explorer.switch"]).directive("commonExtent", ['extentService', function (extentService) {
		return {
			restrict: "AE",
			templateUrl: "common/extent/extent.html",
			controller: ['$scope', function ($scope) {
				$scope.parameters = extentService.getParameters();
			}],
			link: function link(scope, element, attrs) {}
		};
	}]).factory("extentService", ExtentService);

	ExtentService.$inject = ['mapService', 'searchService'];
	function ExtentService(mapService, searchService) {
		var bbox = searchService.getSearchCriteria().bbox;

		if (bbox.fromMap) {
			enableMapListeners();
		}

		return {
			getParameters: function getParameters() {
				return bbox;
			}
		};

		function enableMapListeners() {
			mapService.getMap().then(function (map) {
				map.on("moveend", execute);
				map.on("zoomend", execute);
				execute();
			});
		}

		function disableMapListeners() {
			return mapService.getMap().then(function (map) {
				map.off("moveend", execute);
				map.off("zoomend", execute);
				return map;
			});
		}

		function execute() {
			mapService.getMap().then(function (map) {
				var bounds = map.getBounds();
				bbox.yMin = bounds.getSouth();
				bbox.xMin = bounds.getWest();
				bbox.yMax = bounds.getNorth();
				bbox.xMax = bounds.getEast();
				searchService.refresh();
			});
		}
	}
})(angular);
'use strict';

(function (angular, $) {
	'use strict';

	angular.module("common.download", ['common.geoprocess']).directive("wizardPopup", ["downloadService", function (downloadService) {
		return {
			restrict: "AE",
			templateUrl: "common/download/popup.html",
			link: function link(scope) {
				downloadService.data().then(function (data) {
					scope.data = data;

					scope.$watch("data.item", function (newValue, oldValue) {
						if (newValue) {
							scope.stage = "bbox";
						}

						if (newValue || oldValue) {
							downloadService.setState(newValue);
						}
					});
				});
			}
		};
	}]).directive("wizardDownload", ["downloadService", function (downloadService) {
		return {
			restrict: "AE",
			controller: "DownloadCtrl",
			templateUrl: "common/download/popup.html",
			link: function link() {
				console.log("What the download...");
			}
		};
	}]).directive("commonDownload", ['downloadService', function (downloadService) {
		return {
			templateUrl: "common/download/download.html",
			controller: "DownloadCtrl",
			link: function link(scope, element) {
				downloadService.data().then(function (data) {
					scope.data = data;
				});

				scope.$watch("data.item", function (item, old) {
					if (item || old) {
						downloadService.setState(item);
					}
				});
			}
		};
	}]).directive("downloadAdd", ['$rootScope', 'downloadService', 'flashService', function ($rootScope, downloadService, flashService) {
		return {
			template: "<button type='button' class='undecorated' ng-click='toggle()'><span class='fa-stack'  tooltip-placement='right' tooltip='Extract data.'>" + "<i class='fa fa-lg fa-download' ng-class='{active:item.download}'></i>" + "</span></button>",
			restrict: "AE",
			scope: {
				item: "=",
				group: "="
			},
			link: function link(scope, element) {
				scope.toggle = function () {
					if (scope.group && scope.group.download) {
						downloadService.clear(scope.item);
					} else {
						flashService.add("Select an area of interest that intersects the highlighted areas.");
						downloadService.add(scope.item);
						if (scope.group && scope.group.sysId) {
							$rootScope.$broadcast('hide.wms', scope.group.sysId);
						}
					}
				};
			}
		};
	}]).directive("downloadEmail", ['downloadService', function (downloadService) {
		return {
			template: '<div class="input-group">' + '<span class="input-group-addon" id="nedf-email">Email</span>' + '<input required="required" type="email" ng-change="download.changeEmail(email)" ng-model="email" class="form-control" placeholder="Email address to send download link" aria-describedby="nedf-email">' + '</div>',
			restrict: "AE",
			link: function link(scope, element) {
				downloadService.getEmail().then(function (email) {
					scope.email = email;
				});
			}
		};
	}]).directive("downloadFilename", ['flashService', 'downloadService', function (flashService, downloadService) {
		return {
			template: '<div class="input-group">' + '<span class="input-group-addon" id="nedf-filename">Filename</span>' + '<input type="text"' + ' ng-maxlength="30" ng-trim="true" ng-keypress="restrict($event)"' + ' ng-model="data.filename" class="form-control" placeholder="Optional filename" aria-describedby="nedf-filename">' + '<span class="input-group-addon" id="basic-addon2">.zip</span>' + '</div>' + '<div>Only up to 9 characters made up of alphanumeric or "_" allowed for file name</div>',
			restrict: "AE",
			scope: {
				data: "="
			},
			link: function link(scope, element) {
				var flasher;
				scope.restrict = function (event) {
					var key = event.keyCode;
					var char = String.fromCharCode(key).toUpperCase();
					if (key > 31 && !char.match(/[\_A-Z0-9]/ig)) {
						flashService.remove(flasher);
						flasher = flashService.add('Only alphanumeric characters or "_" allowed in filename.', 5000);
						event.preventDefault();
					} else if (key > 31 && event.currentTarget.value && event.currentTarget.value.length >= 9) {
						flashService.remove(flasher);
						flasher = flashService.add('Filename is restricted to 9 characters.', 5000);
						event.preventDefault();
					}
				};
			}
		};
	}]).controller("DownloadCtrl", DownloadCtrl).factory("downloadService", DownloadService);

	DownloadCtrl.$inject = ["downloadService"];
	function DownloadCtrl(downloadService) {
		downloadService.data().then(function (data) {
			this.data = data;
		}.bind(this));

		this.remove = function () {
			downloadService.clear();
		};

		this.changeEmail = function (email) {
			downloadService.setEmail(email);
		};
	}

	DownloadService.$inject = ['$http', '$q', '$rootScope', 'mapService', 'storageService'];
	function DownloadService($http, $q, $rootScope, mapService, storageService) {
		var key = "download_email",
		    downloadLayerGroup = "Download Layers",
		    mapState = {
			zoom: null,
			center: null,
			layer: null
		},
		    _data = {
			email: null,
			item: null
		},
		    service = {
			getLayerGroup: function getLayerGroup() {
				return mapService.getGroup(downloadLayerGroup);
			},

			setState: function setState(data) {
				if (data) {
					prepare();
				} else {
					restore(map);
				}

				function prepare() {
					var bounds = [[data.bounds.yMin, data.bounds.xMin], [data.bounds.yMax, data.bounds.xMax]];

					if (mapState.layer) {
						mapService.getGroup(downloadLayerGroup).removeLayer(mapState.layer);
					}
					if (!data.queryLayer) {
						mapState.layer = L.rectangle(bounds, { color: "black", fill: false });
						mapService.getGroup(downloadLayerGroup).addLayer(mapState.layer);
					}
				}

				function restore(map) {
					mapService.clearGroup(downloadLayerGroup);
					mapState.layer = null;
				}
			},

			add: function add(item) {
				this.clear();
				_data.item = item;
				_data.item.download = true;
				if (!item.processsing) {
					item.processing = {
						clip: {
							xMax: null,
							xMin: null,
							yMax: null,
							yMin: null
						}
					};
				}
			},

			clear: function clear() {
				if (_data.item) {
					_data.item.download = false;
					_data.item = null;
				}
			},

			setEmail: function setEmail(email) {
				storageService.setItem(key, email);
			},

			getEmail: function getEmail() {
				return storageService.getItem(key).then(function (value) {
					_data.email = value;
					return value;
				});
			},

			data: function data() {
				return $q.when(_data);
			}
		};

		return service;
	}
})(angular, $);
"use strict";

(function (angular, L) {
   'use strict';

   angular.module("common.featureinfo", []).directive("commonFeatureInfo", ['$http', '$log', '$q', '$timeout', 'featureInfoService', 'flashService', 'messageService', function ($http, $log, $q, $timeout, featureInfoService, flashService, messageService) {
      var template = "https://elvis-ga.fmecloud.com/fmedatastreaming/elvis_indexes/GetFeatureInfo_ElevationAvailableData.fmw?" + "SERVICE=WMS&VERSION=1.1.1&REQUEST=GetFeatureInfo&SRS=EPSG%3A4326&BBOX=${bounds}&WIDTH=${width}&HEIGHT=${height}" +
      //"LAYERS=public.5dem_ProjectsIndex&" +
      "&LAYERS=public.QLD_Elevation_Metadata_Index,public.ACT2015-Tile_Index_55,public.5dem_ProjectsIndex,public.NSW_100k_Index_54,public.NSW_100k_Index_55," + "public.NSW_100k_Index_56,public.NSW_100k_Index_Forward_Program,public.QLD_Project_Index_54," + "public.QLD_Project_Index_55,public.QLD_Project_Index_56,public.TAS_Project_Index_55," + "public.GA_Project_Index_47,public.GA_Project_Index_48,public.GA_Project_Index_54," + "public.GA_Project_Index_55,public.GA_Project_Index_56" + "&STYLES=&INFO_FORMAT=application%2Fjson&FEATURE_COUNT=100&X=${x}&Y=${y}";
      var layers = ["public.5dem_ProjectsIndex", "public.NSW_100k_Index"];

      return {
         require: "^geoMap",
         restrict: "AE",
         link: function link(scope, element, attrs, ctrl) {
            var flasher = null;
            var paused = false;

            if (typeof scope.options === "undefined") {
               scope.options = {};
            }

            ctrl.getMap().then(function (map) {
               map.on('popupclose', function (e) {
                  featureInfoService.removeLastLayer(map);
               });

               map.on("draw:drawstart", function () {
                  paused = true;
                  $timeout(function () {
                     paused = false;
                  }, 60000);
               });

               map.on("draw:drawstop", function () {
                  paused = false;
               });

               map.on("click", function (event) {
                  var layer = null;
                  var size = map.getSize();
                  var point = map.latLngToContainerPoint(event.latlng, map.getZoom());
                  var latlng = event.latlng;
                  var data = {
                     x: point.x,
                     y: point.y,
                     bounds: map.getBounds().toBBoxString(),
                     height: size.y,
                     width: size.x
                  };
                  var url = template;

                  if (paused) {
                     return;
                  }

                  flashService.remove(flasher);
                  flasher = flashService.add("Checking available data at this point", 30000, true);

                  angular.forEach(data, function (value, key) {
                     url = url.replace("${" + key + "}", value);
                  });

                  $http.get(url).then(function (httpResponse) {
                     var group = httpResponse.data;
                     var response = void 0;
                     var features = [];
                     var popupText = [];

                     console.log(group);

                     map.closePopup();
                     featureInfoService.removeLastLayer(map);
                     flashService.remove(flasher);

                     if (!group.length) {
                        flasher = flashService.add("No status information available for this point.", 4000);
                        response = httpResponse;
                     } else {
                        response = {
                           data: {
                              name: "public.AllIndexes",
                              type: "FeatureCollection",
                              crs: {
                                 type: "name",
                                 properties: {
                                    name: "EPSG:4326"
                                 }
                              },
                              features: []
                           }
                        };

                        features = response.data.features;

                        group.forEach(function (response) {
                           response.features.forEach(function (feature) {
                              features.push(feature);

                              var buffer = ["<span>"];
                              var properties = feature.properties;

                              if (properties.maptitle) {
                                 var title = properties.mapnumber ? "Map number: " + properties.mapnumber : "";
                                 buffer.push("<strong>Map Title:</strong> <span title='" + title + "'>" + properties.maptitle);
                              }

                              /*
                                    object_name : "middledarling2014_z55.tif",
                                    object_url : "https://s3-ap-southeast-2.amazonaws.com/elvis.ga.gov.au/elevation/5m-dem/mdba/QG/middledarling2014_z55.tif",
                                    object_size : "5577755073",
                                    object_last_modified : "20161017",
                                    captured: "20161010 - 20161023"
                                    area : "5560.00",
                                    status : "Available"
                              */

                              if (properties.project) {
                                 buffer.push("<strong>Project name:</strong> " + properties.project);
                              }

                              if (properties.captured) {
                                 buffer.push("<br/><strong>Capture date:</strong> " + captured(properties.captured));
                              }

                              if (properties.object_name) {
                                 buffer.push("<strong>File name:</strong> " + properties.object_name);
                              } else if (properties.object_name_ahd) {
                                 buffer.push("<strong>File name:</strong> " + properties.object_name_ahd);
                              } else if (properties.object_name_ort) {
                                 buffer.push("<strong>File name:</strong> " + properties.object_name_ort);
                              }

                              buffer.push("</span><br/><strong>Status:</strong> " + feature.properties.status);

                              if (properties.available_date) {
                                 buffer.push("<br/><strong>Available date:</strong> " + formatDate(properties.available_date));
                              }

                              if (properties.contact) {
                                 var contact = properties.contact;
                                 var mailto = contact.toLowerCase().indexOf("mailto:") === 0 ? "" : "mailto:";

                                 buffer.push("<br/><strong>Contact:</strong> <a href='" + mailto + properties.contact + "'>" + properties.contact + "</a>");
                              }

                              if (properties.metadata_url) {
                                 buffer.push("<br/><a href='" + properties.metadata_url + "' target='_blank'>Metadata</a>");
                              }

                              popupText.push(buffer.join(" "));
                           });
                        });
                     }

                     if (features.length) {
                        layer = L.geoJson(response.data, {
                           style: function style(feature) {
                              return {
                                 fillOpacity: 0.1,
                                 color: "red"
                              };
                           }
                        }).addTo(map);
                        featureInfoService.setLayer(layer);

                        L.popup().setLatLng(latlng).setContent("<div class='fi-popup'>" + popupText.join("<hr/>") + "</div>").openOn(map);
                     }
                  });
               });
            });
         }
      };
   }]).factory('featureInfoService', [function () {
      var lastFeature = null;
      return {
         setLayer: function setLayer(layer) {
            lastFeature = layer;
         },
         removeLastLayer: function removeLastLayer(map) {
            if (lastFeature) {
               map.removeLayer(lastFeature);
               lastFeature = null;
            }
         }
      };
   }]);

   function captured(twoDates) {
      var dates = twoDates.split(" - ");
      if (dates.length !== 2) {
         return twoDates;
      }

      return formatDate(dates[0]) + " - " + formatDate(dates[1]);
   }

   function formatDate(data) {
      if (data.length !== 8) {
         return data;
      }
      return data.substr(0, 4) + "/" + data.substr(4, 2) + "/" + data.substr(6, 2);
   }
})(angular, L);
"use strict";

(function (angular, L) {
	'use strict';

	angular.module("common.geoprocess", []).directive("wizardGeoprocess", ['$http', '$q', '$timeout', 'geoprocessService', 'flashService', 'messageService', function ($http, $q, $timeout, geoprocessService, flashService, messageService) {
		return {
			restrict: "AE",
			templateUrl: "common/geoprocess/geoprocess.html",
			scope: {
				data: "="
			},
			link: function link(scope) {
				var clipMessage, clipTimeout, referenceLayer;

				geoprocessService.outFormats().then(function (data) {
					scope.outFormats = data;
				});

				scope.$watch("data", function (newData, oldData) {
					if (oldData) {
						geoprocessService.removeClip();
						removeReferenceLayer();
					}
					if (newData && newData !== oldData) {
						scope.stage = "bbox";
						drawReferenceLayer();
					}
				});

				scope.$watchGroup(["data.processing.clip.xMax", "data.processing.clip.xMin", "data.processing.clip.yMax", "data.processing.clip.yMin"], function (newValues, oldValues, scope) {
					var result, url;

					if (clipTimeout) {
						$timeout.cancel(clipTimeout);
						clipTimeout = null;
					}
					if (scope.data && scope.data.processing && scope.data.processing.clip && scope.data.processing.clip.xMax !== null) {
						url = scope.config.extentCheckTemplates[scope.data.sysId];
						clipMessage = flashService.add("Validating selected area...", 3000);

						// Make really sure that all our stop points set this appropriately. We don't want the button locked out for ever.
						scope.checkingOrFailed = !!url; // We only apply this to records that have a URL to check intersection against.
						clipTimeout = $timeout(function () {
							checkSize().then(function (result) {
								try {
									if (result && result.code === "success") {
										if (url) {
											// Order matches the $watch signature so be careful
											var urlWithParms = url.replace("{maxx}", newValues[0]).replace("{minx}", newValues[1]).replace("{maxy}", newValues[2]).replace("{miny}", newValues[3]);
											flashService.remove(clipMessage);
											clipMessage = flashService.add("Checking there is data in your selected area...");
											$http.get(urlWithParms).then(function (response) {
												if (response.data && response.data.length > 0) {
													flashService.remove(clipMessage);
													if (response.data[0].Intersect === false) {
														messageService.error("There is no data covering the drawn area currently in this resolution dataset.", 6000);
														scope.stage = "bbox";
														drawReferenceLayer();
														// This is the only place that checkingOrFailed stays true;
													} else {
														if (response.data[0].Intersect === true) {
															clipMessage = flashService.add("There is intersecting data. Click \"Next\" if you are ready to proceed.", 5000);
														} else {
															clipMessage = flashService.add("Click \"Next\" if you are ready to proceed.", 4000);
														}
														scope.checkingOrFailed = false;
														geoprocessService.handleShowClip(scope.data.processing.clip);
													}
												}
												console.log(response);
											}, function (err) {
												// If it falls over we don't want to crash.
												scope.checkingOrFailed = false;
												geoprocessService.handleShowClip(scope.data.processing.clip);
												console.log("Service unavailable to check intersection");
											});
										} else {
											geoprocessService.handleShowClip(scope.data.processing.clip);
											scope.checkingOrFailed = false;
										}
									}
								} catch (e) {
									// Very paranoid about setting it to block.
									scope.checkingOrFailed = false;
								}
							});
						}, 2000);
					}

					function checkSize() {
						var deferred = $q.defer();

						result = scope.drawn();
						if (result && result.code) {
							switch (result.code) {
								case "oversize":
									$timeout(function () {
										flashService.remove(clipMessage);
										messageService.error("The selected area is too large to process. Please restrict to approximately " + Math.sqrt(scope.data.restrictSize) + " degrees square.");
										scope.stage = "bbox";
										drawReferenceLayer();
										deferred.resolve(result);
									});
									break;

								case "undersize":
									$timeout(function () {
										flashService.remove(clipMessage);
										messageService.error("X Min and Y Min should be smaller than X Max and Y Max, respectively. Please update the drawn area.");
										scope.stage = "bbox";
										drawReferenceLayer();
										deferred.resolve(result);
									});
									break;
								default:
									return $q.when(result);
							}
						}
						return deferred.promise;
					}
				});

				scope.drawn = function () {
					geoprocessService.removeClip();
					forceNumbers(scope.data.processing.clip);
					//flashService.remove(clipMessage);
					if (constrainBounds(scope.data.processing.clip, scope.data.bounds)) {
						clipMessage = flashService.add("Redrawn to fit within data extent", 5000);
					}

					if (overSizeLimit(scope.data.processing.clip)) {
						return { code: "oversize" };
					}

					if (underSizeLimit(scope.data.processing.clip)) {
						return { code: "undersize" };
					}

					if (scope.data.processing.clip.xMax === null) {
						return { code: "incomplete" };
					}

					//if(this.data.queryLayer) {
					//	geoprocessService.queryLayer(scope.data.queryLayer, scope.data.processing.clip).then(function(response) {
					//	});
					//} else
					if (validClip(scope.data.processing.clip)) {
						return { code: "success" };
					}
					return { code: "invalid" };
				};

				scope.startExtract = function () {
					if (scope.allDataSet()) {
						messageService.info("Your request has been sent for processing. You will be notified by email on completion of the job.");
						flashService.add("You can select another area for processing.", 10000);
						geoprocessService.initiateJob(scope.data, scope.email);
						scope.data.download = false;
					}
				};

				scope.allDataSet = function () {
					var proc = scope.data && scope.data.processing ? scope.data.processing : null;
					// For it to be OK we need.
					return proc && scope.email && validClip(proc.clip) && proc.outCoordSys && proc.outFormat;
				};

				scope.validSansEmail = function () {
					var proc = scope.data && scope.data.processing ? scope.data.processing : null;
					// For it to be OK we need.
					return proc && validClip(proc.clip) && proc.outCoordSys && proc.outFormat;
				};

				scope.validClip = function (data) {
					return data && data.processing && validClip(data.processing.clip);
				};

				geoprocessService.getConfig().then(function (config) {
					scope.config = config;
				});

				function drawReferenceLayer() {
					removeReferenceLayer();
					if (scope.data.referenceLayer) {
						referenceLayer = geoprocessService.addLayer(scope.data.referenceLayer);
					}
				}

				function removeReferenceLayer() {
					if (referenceLayer) {
						geoprocessService.removeLayer(referenceLayer);
					}
				}

				function underSizeLimit(clip) {
					var size = (clip.xMax - clip.xMin) * (clip.yMax - clip.yMin);
					return size < 0.00000000001 || clip.xMax < clip.xMin;
				}

				function overSizeLimit(clip) {
					// Shouldn't need abs but it doesn't hurt.
					var size = Math.abs((clip.xMax - clip.xMin) * (clip.yMax - clip.yMin));

					return scope.data.restrictSize && size > scope.data.restrictSize;
				}

				function constrainBounds(c, p) {
					var flag = false,
					    ret = false;
					// Have we read the parameters yet?

					if (!p || empty(c.xMax) || empty(c.xMin) || empty(c.yMax) || empty(c.yMin)) {
						return false;
					}

					ret = flag = +c.xMax < +p.xMin;
					if (flag) {
						c.xMax = +p.xMin;
					}

					flag = +c.xMax > +p.xMax;
					ret = ret || flag;

					if (flag) {
						c.xMax = +p.xMax;
					}

					flag = +c.xMin < +p.xMin;
					ret = ret || flag;
					if (flag) {
						c.xMin = +p.xMin;
					}

					flag = +c.xMin > +c.xMax;
					ret = ret || flag;
					if (flag) {
						c.xMin = c.xMax;
					}

					// Now for the Y's
					flag = +c.yMax < +p.yMin;
					ret = ret || flag;
					if (flag) {
						c.yMax = +p.yMin;
					}

					flag = +c.yMax > +p.yMax;
					ret = ret || flag;
					if (flag) {
						c.yMax = +p.yMax;
					}

					flag = +c.yMin < +p.yMin;
					ret = ret || flag;
					if (flag) {
						c.yMin = +p.yMin;
					}

					flag = +c.yMin > +c.yMax;
					ret = ret || flag;
					if (flag) {
						c.yMin = +c.yMax;
					}

					return ret;

					function empty(val) {
						return angular.isUndefined(val) || val === "" || val === null;
					}
				}

				function forceNumbers(clip) {
					clip.xMax = clip.xMax === null ? null : +clip.xMax;
					clip.xMin = clip.xMin === null ? null : +clip.xMin;
					clip.yMax = clip.yMax === null ? null : +clip.yMax;
					clip.yMin = clip.yMin === null ? null : +clip.yMin;
				}

				// The input validator takes care of order and min/max constraints. We just check valid existance.
				function validClip(clip) {
					return clip && angular.isNumber(clip.xMax) && angular.isNumber(clip.xMin) && angular.isNumber(clip.yMax) && angular.isNumber(clip.yMin) && !overSizeLimit(clip) && !underSizeLimit(clip);
				}
			}
		};
	}]).factory("geoprocessService", GeoprocessService).filter("sysIntersect", function () {
		return function (collection, extent) {
			// The extent may have missing numbers so we don't restrict at that point.
			if (!extent || !angular.isNumber(extent.xMin) || !angular.isNumber(extent.xMax) || !angular.isNumber(extent.yMin) || !angular.isNumber(extent.yMax)) {
				return collection;
			}

			return collection.filter(function (item) {

				// We know these have valid numbers if it exists
				if (!item.extent) {
					return true;
				}
				// We have a restriction
				return item.extent.xMin <= extent.xMin && item.extent.xMax >= extent.xMax && item.extent.yMin <= extent.yMin && item.extent.yMax >= extent.yMax;
			});
		};
	});

	GeoprocessService.$invoke = ['$http', '$q', '$timeout', 'configService', 'downloadService', 'ga', 'mapService', 'storageService'];
	function GeoprocessService($http, $q, $timeout, configService, downloadService, mapService, storageService) {
		var DEFAULT_DATASET = "dems1sv1_0",
		    // TODO: We have to get this from the metadata somehow.
		geoprocessingTemplates,
		    clipLayer = null,
		    map;

		configService.getConfig("initiateServiceTemplates").then(function (template) {
			geoprocessingTemplates = template;
		});

		mapService.getMap().then(function (lMap) {
			map = lMap;
		});

		function getUrl(data) {
			var custom, key, template;

			if (geoprocessingTemplates.custom) {
				custom = geoprocessingTemplates.custom[data.primaryId];
				if (custom) {
					key = custom.key;
					template = custom.templates[data[key]];
					if (template) {
						return template;
					}
				}
			}
			return geoprocessingTemplates["default"];
		}

		return {
			queryLayer: function queryLayer(query, clip) {
				var deferred = $q.defer();

				var layer = L.esri.featureLayer({
					url: query.url
				});

				var bounds = L.latLngBounds([clip.yMin, clip.xMin], // top left
				[clip.yMax, clip.xMax] // bottom right
				);

				layer.query().intersects(bounds).ids(function (error, ids) {
					if (error) {
						deferred.reject(error);
					} else {
						deferred.resolve(ids);
					}
				});
				return deferred.promise;
			},

			outFormats: function outFormats() {
				return configService.getConfig("processing").then(function (data) {
					return data.outFormat;
				});
			},

			handleShowClip: function handleShowClip(clip) {
				this.removeClip();

				clipLayer = L.rectangle([[clip.yMin, clip.xMin], [clip.yMax, clip.xMax]], {
					weight: 2,
					opacity: 0.9,
					fill: false,
					color: "#000000",
					width: 3,
					clickable: false
				});

				clipLayer.addTo(map);
			},

			removeClip: function removeClip() {
				if (clipLayer) {
					map.removeLayer(clipLayer);
					clipLayer = null;
				}
			},

			addLayer: function addLayer(data) {
				return L.tileLayer.wms(data.parameters[0], data.parameters[1]).addTo(map);
			},

			removeLayer: function removeLayer(layer) {
				map.removeLayer(layer);
			},

			initiateJob: function initiateJob(data, email) {
				var dataset = DEFAULT_DATASET,
				    // TODO Replace with real dataset file name from metadata.
				win,
				    workingString = getUrl(data),
				    processing = data.processing,
				    log = {
					bbox: {
						yMin: processing.clip.yMin,
						yMax: processing.clip.yMax,
						xMin: processing.clip.xMin,
						xMax: processing.clip.xMax
					},
					geocatId: data.primaryId,
					crs: processing.outCoordSys.code,
					format: processing.outFormat.code
				};

				angular.forEach({
					basename: dataset,
					id: data.primaryId,
					yMin: processing.clip.yMin,
					yMax: processing.clip.yMax,
					xMin: processing.clip.xMin,
					xMax: processing.clip.xMax,
					outFormat: processing.outFormat.code,
					outCoordSys: processing.outCoordSys.code,
					filename: processing.filename ? processing.filename : "",
					state: data.state ? data.state : "",
					email: email
				}, function (item, key) {
					workingString = workingString.replace("${" + key + "}", item);
				});

				$("#launcher")[0].src = workingString;

				downloadService.setEmail(email);

				ga('send', 'event', 'nedf', 'click', 'FME data export: ' + JSON.stringify(log));
			},

			getConfig: function getConfig() {
				return configService.getConfig("processing");
			}
		};
	}
})(angular, L);
'use strict';

(function (angular) {

	'use strict';

	angular.module('common.header', []).controller('headerController', ['$scope', '$q', '$timeout', function ($scope, $q, $timeout) {

		var modifyConfigSource = function modifyConfigSource(headerConfig) {
			return headerConfig;
		};

		$scope.$on('headerUpdated', function (event, args) {
			$scope.headerConfig = modifyConfigSource(args);
		});
	}]).directive('icsmHeader', [function () {
		var defaults = {
			current: "none",
			heading: "ICSM",
			headingtitle: "ICSM",
			helpurl: "help.html",
			helptitle: "Get help about ICSM",
			helpalttext: "Get help about ICSM",
			skiptocontenttitle: "Skip to content",
			skiptocontent: "Skip to content",
			quicklinksurl: "/search/api/quickLinks/json?lang=en-US"
		};
		return {
			transclude: true,
			restrict: 'EA',
			templateUrl: "common/header/header.html",
			scope: {
				current: "=",
				breadcrumbs: "=",
				heading: "=",
				headingtitle: "=",
				helpurl: "=",
				helptitle: "=",
				helpalttext: "=",
				skiptocontenttitle: "=",
				skiptocontent: "=",
				quicklinksurl: "="
			},
			link: function link(scope, element, attrs) {
				var data = angular.copy(defaults);
				angular.forEach(defaults, function (value, key) {
					if (!(key in scope)) {
						scope[key] = value;
					}
				});
			}
		};
	}]).factory('headerService', ['$http', function () {}]);
})(angular);
'use strict';

(function (angular) {
   'use strict';

   angular.module('common.iso19115', ['common.recursionhelper']).directive('iso19115Metadata', [function () {
      return {
         templateUrl: 'common/iso19115/metadata.html',
         scope: {
            node: "="
         }
      };
   }]).directive('iso19115Contact', [function () {
      return {
         templateUrl: 'common/iso19115/contact.html',
         restrict: "AE",
         scope: {
            node: "="
         }

      };
   }]).directive('iso19115Double', [function () {
      return {
         templateUrl: 'common/iso19115/double.html',
         restrict: "AE",
         scope: {
            node: "=",
            name: "@",
            type: "@"
         },
         link: function link(scope) {
            if (scope.node) {
               scope.value = scope.node[scope.name][scope.type];
            }
         }

      };
   }]).directive('iso19115Node', [function () {
      var converters = {
         CharacterString: function CharacterString(node) {
            if (node && node.CharacterString) {
               return node.CharacterString.__text;
            }
            return null;
         },
         LanguageCode: function LanguageCode(node) {
            if (node && node.LanguageCode) {
               return node.LanguageCode._codeListValue;
            }
            return null;
         },
         MD_CharacterSetCode: function MD_CharacterSetCode(node) {
            if (node && node.MD_CharacterSetCode) {
               return node.LanguageCode._codeListValue;
            }
            return null;
         },
         _codeListValue: function _codeListValue(node) {
            if (node) {
               return node._codeListValue;
            }
            return null;
         }
      };

      return {
         template: '<ul><li><span class="iso19115-head" ng-show="display">{{display}}:</span> <span class="iso19115-value">{{value}}</span></li></ul>',
         restrict: "AE",
         replace: true,
         scope: {
            node: "=",
            name: "@",
            type: "@"
         },
         link: function link(scope) {
            scope.display = nodeName(scope.name);
            scope.value = converters[scope.type](scope.node);
         }
      };
   }]).filter('iso19115NodeName', [function () {
      return nodeName;
   }]);

   function nodeName(nodeName) {
      if (nodeName.toUpperCase() == nodeName) {
         return nodeName;
      }
      var parts = nodeName.split("_");
      var name = parts[parts.length - 1];
      return name.replace(/./, function (f) {
         return f.toUpperCase();
      }).replace(/([A-Z])/g, ' $1').trim();
   }
})(angular);
'use strict';

(function (angular) {

   'use strict';

   angular.module('common.legend', []).directive('commonLegend', [function () {
      return {
         template: "<img ng-href='url' ng-if='url'></img>",
         scope: {
            map: "="
         },
         restrict: "AE",
         link: function link(scope) {
            if (scope.map) {}
         }
      };
   }]);
})(angular);
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

(function (angular) {
   'use strict';

   angular.module("common.metaview", []).directive('commonMetaview', ['metaviewService', function (metaviewService) {
      return {
         templateUrl: 'common/metaview/metaview.html',
         restrict: "AE",
         scope: {
            url: "=",
            container: "=",
            item: "="
         },
         link: function link(scope) {
            console.log("URL = " + scope.url);
            scope.select = function () {
               metaviewService.get(scope.url, { cache: true }).then(function (data) {
                  scope.item.metadata = data;
                  scope.container.selected = scope.item;
               });
            };
         }
      };
   }]).directive('commonItemMetaview', [function () {
      return {
         templateUrl: 'common/metaview/item.html',
         restrict: "AE",
         scope: {
            container: "="
         },
         link: function link(scope) {}
      };
   }]).directive('metaviewIso19115', [function () {
      return {
         templateUrl: 'common/metaview/iso19115.html',
         restrict: "AE",
         scope: {
            data: "="
         },
         link: function link(scope) {}
      };
   }]).directive('metaviewIso19115Array', ['RecursionHelper', function (RecursionHelper) {
      function link(scope) {
         scope.isObject = function () {
            return angular.isObject(scope.node);
         };

         scope.getKeys = function () {
            if (scope.isObject()) {
               return Object.keys(scope.node).filter(function (key) {
                  return !(excludeNodes[key] || key.indexOf(":") > -1);
               }).map(function (key) {
                  if (key === '') {
                     return '""';
                  }
                  return key;
               });
            }
         };
      }

      return {
         template: '<metaview-node ng-repeat="nextKey in getKeys() track by $index" node="node[nextKey]" key="nextKey"></metaview-node>',
         restrict: "AE",
         scope: {
            data: "="
         },
         compile: function compile(element) {
            // Use the compile function from the RecursionHelper,
            // And return the linking function(s) which it returns
            return RecursionHelper.compile(element, link);
         }
      };
   }]).directive('metaviewIso19115Node', ['RecursionHelper', function (RecursionHelper) {
      var excludeNodes = {
         $$hashKey: true,
         __prefix: true,
         __text: true,
         _codeList: true,
         _codeListValue: true,
         CharacterString: true,
         DateTime: true,
         LanguageCode: true,
         MD_ScopeCode: true,
         scopeCode: true
      };
      function link(scope) {
         scope.isObject = function () {
            return angular.isObject(scope.node);
         };

         scope.getKeys = function () {
            if (scope.isObject()) {
               return Object.keys(scope.node).filter(function (key) {
                  return !(excludeNodes[key] || key.indexOf(":") > -1);
               }).map(function (key) {
                  if (key === '') {
                     return '""';
                  }
                  return key;
               });
            }
         };

         scope.isArray = function () {
            return angular.isArray(scope.node);
         };
      }

      return {
         templateUrl: 'common/metaview/iso19115node.html',
         restrict: "E",
         replace: true,
         scope: {
            node: "=",
            key: "=",
            array: "="
         },
         compile: function compile(element) {
            // Use the compile function from the RecursionHelper,
            // And return the linking function(s) which it returns
            return RecursionHelper.compile(element, link);
         }
      };
   }]).filter('metaviewText', [function () {
      var keyChild = {
         CharacterString: "__text",
         DateTime: "__text",
         LanguageCode: "_codeListValue",
         linkage: ["URL", "__text"],
         MD_ScopeCode: "_codeListValue",
         _codeListValue: "#text"
      },
          keys = [];

      angular.forEach(keyChild, function (value, key) {
         this.push(key);
      }, keys);

      return function (node) {
         var value = null;
         if (node) {
            keys.some(function (key) {
               var child = node[key];
               if (child) {
                  var children = keyChild[key];
                  if (!Array.isArray(children)) {
                     children = [children];
                  }

                  var result = child;
                  children.forEach(function (kid) {
                     if (kid !== "#text") {
                        result = result[kid];
                     }
                  });

                  value = result; //child[keyChild[key]];
                  return true;
               }
               return false;
            });
         }
         return value;
      };
   }]).filter('metaviewNodeName', [function () {
      return function (nodeName) {
         if (parseInt(nodeName) + "" === "" + nodeName) {
            console.log("Its a num");
            return "";
         }
         if (nodeName.toUpperCase() === nodeName) {
            return nodeName;
         }
         var parts = nodeName.split("_");
         var name = parts[parts.length - 1];
         return name.replace(/./, function (f) {
            return f.toUpperCase();
         }).replace(/([A-Z])/g, ' $1').trim();
      };
   }]).filter('metaviewTransform', [function () {
      return function (node, key) {
         if (node.CharacterString) {
            return node.CharacterString.__text;
         }
         return node;
      };
   }]).provider('metaviewService', function MetaviewServiceProvider() {
      var proxy = "xml2js/";

      this.proxy = function (newProxy) {
         proxy = newProxy;
      };

      this.$get = ['$http', function ($http) {
         return new MetaviewService(proxy, $http);
      }];
   });

   var MetaviewService = function () {
      function MetaviewService(proxy, $http) {
         _classCallCheck(this, MetaviewService);

         this.proxy = proxy;
         this.http = $http;
      }

      _createClass(MetaviewService, [{
         key: 'get',
         value: function get(url) {
            return this.http.get(this.proxy + url).then(function (response) {
               return response.data;
            });
         }
      }]);

      return MetaviewService;
   }();
})(angular);
'use strict';

(function (angular) {

	'use strict';

	angular.module('common.altthemes', [])

	/**
 	*
 	* Override the original mars user.
 	*
 	  */
	.directive('altThemes', ['altthemesService', function (themesService) {
		return {
			restrict: 'AE',
			templateUrl: 'common/navigation/altthemes.html',
			scope: {
				current: "="
			},
			link: function link(scope) {
				themesService.getThemes().then(function (themes) {
					scope.themes = themes;
				});

				themesService.getCurrentTheme().then(function (theme) {
					scope.theme = theme;
				});

				scope.changeTheme = function (theme) {
					scope.theme = theme;
					themesService.setTheme(theme.key);
				};
			}
		};
	}]).controller('altthemesCtrl', ['altthemesService', function (altthemesService) {
		this.service = altthemesService;
	}]).filter('altthemesFilter', function () {
		return function (features, theme) {
			var response = [];
			// Give 'em all if they haven't set a theme.
			if (!theme) {
				return features;
			}

			if (features) {
				features.forEach(function (feature) {
					if (feature.themes) {
						if (feature.themes.some(function (name) {
							return name === theme.key;
						})) {
							response.push(feature);
						}
					}
				});
			}
			return response;
		};
	}).factory('altthemesService', ['$q', '$http', 'storageService', function ($q, $http, storageService) {
		var THEME_PERSIST_KEY = 'icsm.current.theme';
		var THEMES_LOCATION = 'icsm/resources/config/themes.json';
		var DEFAULT_THEME = "All";
		var waiting = [];
		var self = this;

		this.themes = [];
		this.theme = null;

		storageService.getItem(THEME_PERSIST_KEY).then(function (value) {
			if (!value) {
				value = DEFAULT_THEME;
			}
			$http.get(THEMES_LOCATION, { cache: true }).then(function (response) {
				var themes = response.data.themes;

				self.themes = themes;
				self.theme = themes[value];
				// Decorate the key
				angular.forEach(themes, function (theme, key) {
					theme.key = key;
				});
				waiting.forEach(function (wait) {
					wait.resolve(self.theme);
				});
			});
		});

		this.getCurrentTheme = function () {
			if (this.theme) {
				return $q.when(self.theme);
			} else {
				var waiter = $q.defer();
				waiting.push(waiter);
				return waiter.promise;
			}
		};

		this.getThemes = function () {
			return $http.get(THEMES_LOCATION, { cache: true }).then(function (response) {
				return response.data.themes;
			});
		};

		this.setTheme = function (key) {
			this.theme = this.themes[key];
			storageService.setItem(THEME_PERSIST_KEY, key);
		};

		return this;
	}]).filter('altthemesEnabled', function () {
		return function (headers) {
			if (headers) {
				return headers.filter(function (value) {
					return !!value.enabled;
				});
			}
			return headers;
		};
	}).filter('altthemesMatchCurrent', function () {
		return function (headers, current) {
			if (headers) {
				return headers.filter(function (value) {
					return !!value.keys.find(function (key) {
						return key === current;
					});
				});
			}
			return headers;
		};
	});
})(angular);
'use strict';

(function (angular) {
  'use strict';

  angular.module('common.navigation', [])
  /**
   *
   * Override the original mars user.
   *
   */
  .directive('commonNavigation', [function () {
    return {
      restrict: 'AE',
      template: "<alt-themes current='current'></alt-themes>",
      scope: {
        current: "=?"
      },
      link: function link(scope) {
        scope.username = "Anonymous";
        if (!scope.current) {
          scope.current = "none";
        }
      }
    };
  }]).factory('navigationService', [function () {
    return {};
  }]);
})(angular);
"use strict";

{
   angular.module("common.proxy", []).provider("proxy", function () {

      this.$get = ['$http', '$q', function ($http, $q) {
         var base = "proxy/";

         this.setProxyBase = function (newBase) {
            base = newBase;
         };

         return {
            get: function get(url, options) {
               return this._method("get", url, options);
            },

            post: function post(url, options) {
               return this._method("post", url, options);
            },

            put: function put(url, options) {
               return this._method("put", url, options);
            },

            _method: function _method(method, url, options) {
               return $http[method](base + url, options).then(function (response) {
                  return response.data;
               });
            }
         };
      }];
   });
}
'use strict';

(function (angular) {
  'use strict';

  // from http://stackoverflow.com/a/18609594

  angular.module('common.recursionhelper', []).factory('RecursionHelper', ['$compile', function ($compile) {
    return {
      /**
       * Manually compiles the element, fixing the recursion loop.
       * @param element
       * @param [link] A post-link function, or an object with function(s)
       * registered via pre and post properties.
       * @returns An object containing the linking functions.
       */
      compile: function compile(element, link) {
        // Normalize the link parameter
        if (angular.isFunction(link)) {
          link = { post: link };
        }

        // Break the recursion loop by removing the contents
        var contents = element.contents().remove();
        var compiledContents;
        return {
          pre: link && link.pre ? link.pre : null,
          /**
           * Compiles and re-adds the contents
           */
          post: function post(scope, element) {
            // Compile the contents
            if (!compiledContents) {
              compiledContents = $compile(contents);
            }
            // Re-add the compiled contents to the element
            compiledContents(scope, function (clone) {
              element.append(clone);
            });

            // Call the post-linking function, if any
            if (link && link.post) {
              link.post.apply(null, arguments);
            }
          }
        };
      }
    };
  }]);
})(angular);
"use strict";

(function (angular) {
	'use strict';

	angular.module("common.panes", []).directive("icsmPanes", ['$rootScope', '$timeout', 'mapService', function ($rootScope, $timeout, mapService) {
		return {
			templateUrl: "common/panes/panes.html",
			transclude: true,
			replace: true,
			scope: {
				defaultItem: "@",
				data: "="
			},
			controller: ['$scope', function ($scope) {
				var changeSize = false;

				$scope.view = $scope.defaultItem;

				$scope.setView = function (what) {
					var oldView = $scope.view;

					if ($scope.view == what) {
						if (what) {
							changeSize = true;
						}
						$scope.view = "";
					} else {
						if (!what) {
							changeSize = true;
						}
						$scope.view = what;
					}

					$rootScope.$broadcast("view.changed", $scope.view, oldView);

					if (changeSize) {
						mapService.getMap().then(function (map) {
							map._onResize();
						});
					}
				};
				$timeout(function () {
					$rootScope.$broadcast("view.changed", $scope.view, null);
				}, 50);
			}]
		};
	}]).directive("icsmTabs", [function () {
		return {
			templateUrl: "common/panes/tabs.html",
			require: "^icsmPanes"
		};
	}]).controller("PaneCtrl", PaneCtrl).factory("paneService", PaneService);

	PaneCtrl.$inject = ["paneService"];
	function PaneCtrl(paneService) {
		var _this = this;

		paneService.data().then(function (data) {
			_this.data = data;
		});
	}

	PaneService.$inject = [];
	function PaneService() {
		var data = {};

		return {
			add: function add(item) {},

			remove: function remove(item) {}
		};
	}
})(angular);
'use strict';

{
   angular.module('common.reset', []).directive('resetPage', function ($window) {
      return {
         restrict: 'AE',
         scope: {},
         templateUrl: 'common/reset/reset.html',
         controller: ['$scope', function ($scope) {
            $scope.reset = function () {
               $window.location.reload();
            };
         }]
      };
   });
}
"use strict";

(function (angular) {
   'use strict';

   angular.module("common.scroll", []).directive("commonScroller", ['$timeout', function ($timeout) {
      return {
         scope: {
            more: "&",
            buffer: "=?"
         },
         link: function link(scope, element, attrs) {
            var fetching;
            if (!scope.buffer) scope.buffer = 100;

            element.on("scroll", function (event) {
               var target = event.currentTarget;
               $timeout.cancel(fetching);
               fetching = $timeout(bouncer, 120);

               function bouncer() {
                  if (scope.more && target.scrollHeight - target.scrollTop <= target.clientHeight + scope.buffer) {
                     scope.more();
                  }
               }
            });
         }
      };
   }]);
})(angular);
'use strict';

(function (angular) {

   'use strict';

   angular.module("common.basin", ['geo.draw']).directive("commonBasinSearch", ['$log', '$timeout', 'basinService', function ($log, $timeout, basinService) {
      return {
         restrict: "AE",
         transclude: true,
         templateUrl: "common/search/basin.html",
         link: function link(scope, element) {
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
   }]).provider("basinService", BasinsearchServiceProvider).filter("basinFilterList", function () {
      return function (list, filter, max) {
         var response = [],
             lowerFilter,
             count;
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
          baseUrl = '',
          basinData = {};
      this.setReferenceUrl = function (url) {
         basinsUrl = url;
      };
      this.setShapeUrl = function (url) {
         basinShapeUrl = url;
      };
      this.setBaseUrl = function (url) {
         baseUrl = url;
      };
      this.$get = ['$q', '$rootScope', '$timeout', 'httpData', 'searchMapService', function basinServiceFactory($q, $rootScope, $timeout, httpData, searchMapService) {
         var service = {
            load: function load() {
               return httpData.get(baseUrl + basinsUrl, { cache: true }).then(function (response) {
                  basinData.basins = response.data.basins;
                  return basinData;
               });
            },
            zoomToLocation: function zoomToLocation(region) {
               var bbox = region.bbox;
               var polygon = {
                  type: "Polygon",
                  coordinates: [[[bbox.xMin, bbox.yMin], [bbox.xMin, bbox.yMax], [bbox.xMax, bbox.yMax], [bbox.xMax, bbox.yMin], [bbox.xMin, bbox.yMin]]]
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
'use strict';

(function (angular) {

   'use strict';

   angular.module("common.catchment", ['geo.draw']).directive("commonCatchmentSearch", ['$log', '$timeout', 'catchmentService', function ($log, $timeout, catchmentService) {
      return {
         restrict: "AE",
         transclude: true,
         templateUrl: "common/search/catchment.html",
         link: function link(scope, element) {
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
   }]).provider("catchmentService", CatchmentsearchServiceProvider).filter("catchmentFilterList", function () {
      return function (list, filter, max) {
         var response = [],
             lowerFilter,
             count;
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
          baseUrl = '',
          catchmentData = {};
      this.setReferenceUrl = function (url) {
         catchmentsUrl = url;
      };
      this.setShapeUrl = function (url) {
         catchmentShapeUrl = url;
      };
      this.setBaseUrl = function (url) {
         baseUrl = url;
      };
      this.$get = ['$q', '$rootScope', '$timeout', 'httpData', 'searchMapService', function catchmentServiceFactory($q, $rootScope, $timeout, httpData, searchMapService) {
         var service = {
            load: function load() {
               return httpData.get(baseUrl + catchmentsUrl, { cache: true }).then(function (response) {
                  catchmentData.catchments = response.data.catchments;
                  return catchmentData;
               });
            },
            zoomToLocation: function zoomToLocation(region) {
               var bbox = region.bbox;
               var polygon = {
                  type: "Polygon",
                  coordinates: [[[bbox.xMin, bbox.yMin], [bbox.xMin, bbox.yMax], [bbox.xMax, bbox.yMax], [bbox.xMax, bbox.yMin], [bbox.xMin, bbox.yMin]]]
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
'use strict';

(function (angular) {

    angular.module('ui.bootstrap-slider', []).directive('slider', ['$parse', '$timeout', function ($parse, $timeout) {
        return {
            restrict: 'AE',
            replace: true,
            template: '<div><input class="slider-input" type="text" /></div>',
            require: 'ngModel',
            scope: {
                max: "=",
                min: "=",
                step: "=",
                value: "=",
                ngModel: '=',
                range: '=',
                enabled: '=',
                sliderid: '=',
                formatter: '&',
                onStartSlide: '&',
                onStopSlide: '&',
                onSlide: '&'
            },
            link: function link($scope, element, attrs, ngModelCtrl, $compile) {
                var ngModelDeregisterFn, ngDisabledDeregisterFn;

                initSlider();

                function initSlider() {
                    var options = {};

                    function setOption(key, value, defaultValue) {
                        options[key] = value || defaultValue;
                    }

                    function setFloatOption(key, value, defaultValue) {
                        options[key] = value ? parseFloat(value) : defaultValue;
                    }

                    function setBooleanOption(key, value, defaultValue) {
                        options[key] = value ? value + '' === 'true' : defaultValue;
                    }

                    function getArrayOrValue(value) {
                        return angular.isString(value) && value.indexOf("[") === 0 ? angular.fromJson(value) : value;
                    }

                    setOption('id', $scope.sliderid);
                    setOption('orientation', attrs.orientation, 'horizontal');
                    setOption('selection', attrs.selection, 'before');
                    setOption('handle', attrs.handle, 'round');
                    setOption('tooltip', attrs.uiTooltip, 'show');
                    setOption('tooltipseparator', attrs.tooltipseparator, ':');

                    setFloatOption('min', $scope.min, 0);
                    setFloatOption('max', $scope.max, 10);
                    setFloatOption('step', $scope.step, 1);
                    var strNbr = options.step + '';
                    var decimals = strNbr.substring(strNbr.lastIndexOf('.') + 1);
                    setFloatOption('precision', attrs.precision, decimals);

                    setBooleanOption('tooltip_split', attrs.tooltipsplit, false);
                    setBooleanOption('enabled', attrs.enabled, true);
                    setBooleanOption('naturalarrowkeys', attrs.naturalarrowkeys, false);
                    setBooleanOption('reversed', attrs.reversed, false);

                    setBooleanOption('range', $scope.range, false);
                    if (options.range) {
                        if (angular.isArray($scope.value)) {
                            options.value = $scope.value;
                        } else if (angular.isString($scope.value)) {
                            options.value = getArrayOrValue($scope.value);
                            if (!angular.isArray(options.value)) {
                                var value = parseFloat($scope.value);
                                if (isNaN(value)) value = 5;

                                if (value < $scope.min) {
                                    value = $scope.min;
                                    options.value = [value, options.max];
                                } else if (value > $scope.max) {
                                    value = $scope.max;
                                    options.value = [options.min, value];
                                } else {
                                    options.value = [options.min, options.max];
                                }
                            }
                        } else {
                            options.value = [options.min, options.max]; // This is needed, because of value defined at $.fn.slider.defaults - default value 5 prevents creating range slider
                        }
                        $scope.ngModel = options.value; // needed, otherwise turns value into [null, ##]
                    } else {
                        setFloatOption('value', $scope.value, 5);
                    }

                    if ($scope.formatter) options.formatter = $scope.$eval($scope.formatter);

                    var slider = $(element).find(".slider-input").eq(0);

                    // check if slider jQuery plugin exists
                    if ($.fn.slider) {
                        // adding methods to jQuery slider plugin prototype
                        $.fn.slider.constructor.prototype.disable = function () {
                            this.picker.off();
                        };
                        $.fn.slider.constructor.prototype.enable = function () {
                            this.picker.on();
                        };

                        // destroy previous slider to reset all options
                        slider.slider(options);
                        slider.slider('destroy');
                        slider.slider(options);

                        // everything that needs slider element
                        var updateEvent = getArrayOrValue(attrs.updateevent);
                        if (angular.isString(updateEvent)) {
                            // if only single event name in string
                            updateEvent = [updateEvent];
                        } else {
                            // default to slide event
                            updateEvent = ['slide'];
                        }
                        angular.forEach(updateEvent, function (sliderEvent) {
                            slider.on(sliderEvent, function (ev) {
                                ngModelCtrl.$setViewValue(ev.value);
                                $timeout(function () {
                                    $scope.$apply();
                                });
                            });
                        });
                        slider.on('change', function (ev) {
                            ngModelCtrl.$setViewValue(ev.value.newValue);
                            $timeout(function () {
                                $scope.$apply();
                            });
                        });

                        // Event listeners
                        var sliderEvents = {
                            slideStart: 'onStartSlide',
                            slide: 'onSlide',
                            slideStop: 'onStopSlide'
                        };
                        angular.forEach(sliderEvents, function (sliderEventAttr, sliderEvent) {
                            slider.on(sliderEvent, function (ev) {

                                if ($scope[sliderEventAttr]) {
                                    var invoker = $parse(attrs[sliderEventAttr]);
                                    invoker($scope.$parent, { $event: ev, value: ev.value });

                                    $timeout(function () {
                                        $scope.$apply();
                                    });
                                }
                            });
                        });

                        // deregister ngDisabled watcher to prevent memory leaks
                        if (angular.isFunction(ngDisabledDeregisterFn)) {
                            ngDisabledDeregisterFn();
                            ngDisabledDeregisterFn = null;
                        }
                        if (angular.isDefined(attrs.ngDisabled)) {
                            ngDisabledDeregisterFn = $scope.$watch(attrs.ngDisabled, function (value) {
                                if (value) {
                                    slider.slider('disable');
                                } else {
                                    slider.slider('enable');
                                }
                            });
                        }
                        // deregister ngModel watcher to prevent memory leaks
                        if (angular.isFunction(ngModelDeregisterFn)) ngModelDeregisterFn();
                        ngModelDeregisterFn = $scope.$watch('ngModel', function (value) {
                            slider.slider('setValue', value);
                        });
                    }

                    window.slip = slider;

                    $scope.$watch("enabled", function (value) {
                        if (value) {
                            slider.slider('disable');
                        } else {
                            slider.slider('enable');
                        }
                    });
                }

                var watchers = ['min', 'max', 'step', 'range'];
                angular.forEach(watchers, function (prop) {
                    $scope.$watch(prop, function () {
                        initSlider();
                    });
                });
            }
        };
    }]);
})(angular);
'use strict';

(function (angular) {
	'use strict';

	angular.module("common.storage", ['explorer.projects']).factory("storageService", ['$log', '$q', 'projectsService', function ($log, $q, projectsService) {
		return {
			setGlobalItem: function setGlobalItem(key, value) {
				this._setItem("_system", key, value);
			},

			setItem: function setItem(key, value) {
				projectsService.getCurrentProject().then(function (project) {
					this._setItem(project, key, value);
				}.bind(this));
			},

			_setItem: function _setItem(project, key, value) {
				$log.debug("Fetching state for key locally" + key);
				localStorage.setItem("mars.anon." + project + "." + key, JSON.stringify(value));
			},

			getGlobalItem: function getGlobalItem(key) {
				return this._getItem("_system", key);
			},

			getItem: function getItem(key) {
				var deferred = $q.defer();
				projectsService.getCurrentProject().then(function (project) {
					this._getItem(project, key).then(function (response) {
						deferred.resolve(response);
					});
				}.bind(this));
				return deferred.promise;
			},

			_getItem: function _getItem(project, key) {
				$log.debug("Fetching state locally for key " + key);
				var item = localStorage.getItem("mars.anon." + project + "." + key);
				if (item) {
					try {
						item = JSON.parse(item);
					} catch (e) {
						// Do nothing as it will be a string
					}
				}
				return $q.when(item);
			}
		};
	}]);
})(angular);
'use strict';

{
   angular.module("icsm.side-panel", []).factory('panelSideFactory', ['$rootScope', '$timeout', function ($rootScope, $timeout) {
      var state = {
         left: {
            active: null,
            width: 0
         },

         right: {
            active: null,
            width: 0
         }
      };

      function setSide(state, value) {
         var response = state.active;

         if (response === value) {
            state.active = null;
            state.width = 0;
         } else {
            state.active = value;
         }
         return !response;
      }

      return {
         state: state,
         setLeft: function setLeft(value) {
            var result = setSide(state.left, value);
            if (result) {
               state.left.width = 320; // We have a hard coded width at the moment we will probably refactor to parameterize it.
            }
            return result;
         },

         setRight: function setRight(data) {
            state.right.width = data.width;
            var response = setSide(state.right, data.name);
            $rootScope.$broadcast('side.panel.change', {
               side: "right",
               data: state.right,
               width: data.width
            });
            return response;
         }
      };
   }]).directive('sidePanelRightOppose', ["panelSideFactory", function (panelSideFactory) {
      return {
         restrict: 'E',
         transclude: true,
         template: '<div class="contentContainer" ng-attr-style="right:{{right.width}}" ng-transclude>' + '</div>',
         link: function link(scope) {
            scope.right = panelSideFactory.state.right;
         }
      };
   }]).directive('sidePanelRight', ["panelSideFactory", function (panelSideFactory) {
      return {
         restrict: 'E',
         transclude: true,
         templateUrl: 'imagery/side-panel/side-panel-right.html',
         link: function link(scope) {
            scope.right = panelSideFactory.state.right;

            scope.closePanel = function () {
               panelSideFactory.setRight({ name: null, width: 0 });
            };
         }
      };
   }]).directive('panelTrigger', ["panelSideFactory", function (panelSideFactory) {
      return {
         restrict: 'E',
         transclude: true,
         templateUrl: 'common/side-panel/trigger.html',
         scope: {
            default: "@?",
            panelWidth: "@",
            name: "@",
            iconClass: "@",
            panelId: "@"
         },
         link: function link(scope) {
            scope.toggle = function () {
               panelSideFactory.setRight({
                  width: scope.panelWidth,
                  name: scope.panelId
               });
            };
            if (scope.default) {
               panelSideFactory.setRight({
                  width: scope.panelWidth,
                  name: scope.panelId
               });
            }
         }
      };
   }]).directive('panelOpenOnEvent', ["$rootScope", "panelSideFactory", function ($rootScope, panelSideFactory) {
      return {
         restrict: 'E',
         scope: {
            panelWidth: "@",
            eventName: "@",
            panelId: "@",
            side: "@?"
         },
         link: function link(scope) {
            if (!scope.side) {
               scope.side = "right";
            }
            $rootScope.$on(scope.eventName, function (event, data) {
               var state = panelSideFactory.state[scope.side];
               if (state && (!state.active || scope.panelId !== state.active)) {
                  var params = {
                     width: scope.panelWidth,
                     name: scope.panelId
                  };

                  if (scope.side === "right") {
                     panelSideFactory.setRight(params);
                  } else {
                     panelSideFactory.setLeft(params);
                  }
               }
            });
         }
      };
   }]).directive('panelCloseOnEvent', ["$rootScope", "panelSideFactory", function ($rootScope, panelSideFactory) {
      return {
         restrict: 'E',
         scope: {
            eventName: "@",
            side: "@?",
            onlyOn: "@?"
         },
         link: function link(scope) {
            if (!scope.side) {
               scope.side = "right";
            }
            $rootScope.$on(scope.eventName, function (event, data) {
               var state = panelSideFactory.state[scope.side];
               if (scope.onlyOn && state.active !== scope.onlyOn) {
                  return;
               }

               if (state && state.active) {
                  var params = {
                     name: null
                  };

                  if (scope.side === "right") {
                     panelSideFactory.setRight(params);
                  } else {
                     panelSideFactory.setLeft(params);
                  }
               }
            });
         }
      };
   }]).directive('sidePanelLeft', ['panelSideFactory', function (panelSideFactory) {
      return {
         restrict: 'E',
         transclude: true,
         templateUrl: 'imagery/side-panel/side-panel-left.html',
         link: function link(scope) {
            scope.left = panelSideFactory.state.left;

            scope.closeLeft = function () {
               panelSideFactory.setLeft(null);
            };
         }
      };
   }]);
}
"use strict";

(function (angular) {

   'use strict';

   angular.module("common.tile", []).directive("commonTile", ['$rootScope', 'tileService', function ($rootScope, tileService) {
      return {
         scope: {
            data: "="
         },
         template: '<button type="button" class="undecorated" ng-if="data.tileCache" ng-click="toggle(item)" title="Show/hide Tile layer." tooltip-placement="right" tooltip="View on mapS.">' + '<i ng-class="{active:data.isTilesShowing}" class="fa fa-lg fa-globe"></i></button>',
         link: function link(scope) {
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
   }]).factory("tileService", ['$http', '$log', '$q', '$timeout', 'selectService', 'mapService', function ($http, $log, $q, $timeout, selectService, mapService) {
      var subscribers = {};

      return {
         createLayer: function createLayer(service) {
            return new TileClient(service);
         },

         subscribe: function subscribe(data) {
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

         unsubscribe: function unsubscribe(data) {
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

         _showLayer: function _showLayer(layer) {
            if (layer) {
               layer.showTile();
            }
         },

         _hideLayer: function _hideLayer(layer) {
            if (layer) {
               layer.clearTile();
            }
         },

         show: function show(data) {
            data.isTilesShowing = true;
            this._showLayer(subscribers[data.primaryId].layer);
         },

         hide: function hide(data) {
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
            var createLayer = function createLayer() {
               if (service.tileCacheOptions && service.tileCacheOptions.type === "WMS") {
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
"use strict";

(function (angular) {

	'use strict';

	angular.module("common.toolbar", []).directive("icsmToolbar", [function () {
		return {
			controller: 'toolbarLinksCtrl'
		};
	}])

	/**
  * Override the default mars tool bar row so that a different implementation of the toolbar can be used.
  */
	.directive('icsmToolbarRow', [function () {
		var DEFAULT_TITLE = "Satellite to Topography bias on base map.";

		return {
			scope: {
				map: "=",
				overlaytitle: "=?"
			},
			restrict: 'AE',
			templateUrl: 'common/toolbar/toolbar.html',
			link: function link(scope) {
				scope.overlaytitle = scope.overlaytitle ? scope.overlaytitle : DEFAULT_TITLE;
			}
		};
	}]).controller("toolbarLinksCtrl", ["$scope", "configService", function ($scope, configService) {

		var self = this;
		configService.getConfig().then(function (config) {
			self.links = config.toolbarLinks;
		});

		$scope.item = "";
		$scope.toggleItem = function (item) {
			$scope.item = $scope.item == item ? "" : item;
		};
	}]);
})(angular);
"use strict";

(function (angular) {

	'use strict';

	angular.module("common.wms", []).directive("commonWms", ['$rootScope', '$timeout', 'flashService', 'wmsService', function ($rootScope, $timeout, flashService, wmsService) {
		return {
			scope: {
				data: "="
			},
			template: '<button type="button" class="undecorated" ng-show="data.services.hasWms()" ng-click="toggle(item)" title="Show/hide WMS layer." tooltip-placement="right" tooltip="View on map using WMS.">' + '<i ng-class="{active:data.isWmsShowing}" class="fa fa-lg fa-globe"></i></button>',
			link: function link(scope) {
				scope.$watch("data", function (newData, oldData) {
					if (newData) {
						wmsService.subscribe(newData);
					} else if (oldData) {
						// In a fixed tag this gets called.
						wmsService.unsubscribe(oldData);
					}
				});

				$rootScope.$on('hide.wms', function (event, id) {
					if (scope.data && id === scope.data.sysId && scope.data.isWmsShowing) {
						scope.toggle();
					}
				});

				scope.toggle = function () {
					if (scope.data.isWmsShowing) {
						wmsService.hide(scope.data);
					} else {
						wmsService.show(scope.data);
					}
				};

				// In an ng-repeat this gets called
				scope.$on("$destroy", function () {
					wmsService.unsubscribe(scope.data);
				});
			}
		};
	}]).factory("wmsService", ['$http', '$log', '$q', '$timeout', 'selectService', 'mapService', function ($http, $log, $q, $timeout, selectService, mapService) {
		var x2js = new X2JS(),
		    subscribers = {};

		return {
			createLayer: function createLayer(service) {
				return new WmsClient(service);
			},

			subscribe: function subscribe(data) {
				if (!data.services || !data.services.getWms) {
					return;
				}

				var id = data.primaryId,
				    wms = data.services.getWms(),
				    subscription = subscribers[id];

				if (!wms) {
					return;
				}

				if (subscription) {
					subscription.count += 1;
				} else {
					subscription = subscribers[id] = {
						count: 1,
						layer: this.createLayer(wms)
					};
				}

				if (subscription.count === 1 && data.isWmsShowing) {
					this._showLayer(subscription.layer);
				}
			},

			unsubscribe: function unsubscribe(data) {
				var id = data.primaryId,
				    subscription = subscribers[id];

				if (subscription) {
					subscription.count--;

					if (!subscription.count) {
						// We want to clean up here. We don't say we aren't showing, we
						if (data.isWmsShowing) {
							this._hideLayer(subscription.layer);
						}
					}
				}
			},

			_showLayer: function _showLayer(layer) {
				if (layer) {
					layer.showWms();
				}
			},

			_hideLayer: function _hideLayer(layer) {
				if (layer) {
					layer.clearWms();
				}
			},

			show: function show(data) {
				data.isWmsShowing = true;
				this._showLayer(subscribers[data.primaryId].layer);
			},

			hide: function hide(data) {
				data.isWmsShowing = false;
				this._hideLayer(subscribers[data.primaryId].layer);
			}
		};

		function WmsClient(service) {
			var METADATA_SERVER_URL = "service/metadata/wmsLayernames",
			    rawUrl;

			if (service.url.indexOf("?") > -1) {
				rawUrl = service.url.substr(0, service.url.indexOf("?"));
				// console.log(rawUrl);
			} else {
				rawUrl = service.url;
			}

			this.service = service;
			this.layerGroup = selectService.getLayerGroup();
			this.wmsLayer = null;
			this.capabilities = null;

			this.toggleWms = function () {
				if (this.wmsLayer) {
					this.clearWms();
				} else {
					this.showWms();
				}
			};

			this.showWms = function () {
				var createLayer = function createLayer() {
					this.wmsLayer = L.tileLayer.wms(rawUrl, {
						layers: this.layerNames,
						format: "image/png",
						transparent: true
					}).addTo(this.layerGroup);
				};

				if (this.wmsLayer) {
					this.clearWms();
				}

				if (!this.layerNames) {
					if (service.layerNames) {
						this.layerNames = service.layerNames;
					} else {
						return $http.get(METADATA_SERVER_URL, { params: { url: rawUrl }, cache: true }).then(function (response) {
							this.layerNames = response.data;
							createLayer.apply(this);
						}.bind(this));
					}
				}

				return $q.when(createLayer.apply(this));
			};

			this.clearWms = function () {
				if (this.wmsLayer) {
					this.layerGroup.removeLayer(this.wmsLayer);
					this.wmsLayer = null;
				}
				return null;
			};
		}
	}]);
})(angular);
angular.module("common.templates", []).run(["$templateCache", function($templateCache) {$templateCache.put("common/accordion/accordion.html","<div role=\"tablist\" class=\"panel-group\" ng-transclude></div>");
$templateCache.put("common/accordion/accordionGroup.html","<div role=\"tab\" id=\"{{::headingId}}\" aria-selected=\"{{isOpen}}\" class=\"panel-heading\" ng-keypress=\"toggleOpen($event)\">\r\n  <h4 class=\"panel-title\">\r\n    <a role=\"button\" data-toggle=\"collapse\" href aria-expanded=\"{{isOpen}}\"\r\n            aria-controls=\"{{::panelId}}\" tabindex=\"0\" class=\"accordion-toggle\" ng-click=\"toggleOpen()\"\r\n            common-accordion-transclude=\"heading\" ng-disabled=\"isDisabled\" uib-tabindex-toggle>\r\n      <span common-accordion-header ng-class=\"{\'text-muted\': isDisabled}\">{{heading}}</span>\r\n   </a>\r\n  </h4>\r\n</div>\r\n<div id=\"{{::panelId}}\" aria-labelledby=\"{{::headingId}}\" aria-hidden=\"{{!isOpen}}\" role=\"tabpanel\"\r\n            class=\"panel-collapse collapse\" uib-collapse=\"!isOpen\">\r\n  <div class=\"panel-body\" ng-transclude></div>\r\n</div>");
$templateCache.put("common/cc/cc.html","<button type=\"button\" class=\"undecorated\" title=\"View CCBy {{details.version}} licence details\"\r\n      popover-trigger=\"outsideClick\"\r\n      uib-popover-template=\"template\" popover-placement=\"bottom\" popover-append-to-body=\"true\">\r\n	<i ng-class=\"{active:data.isWmsShowing}\" class=\"fa fa-lg fa-gavel\"></i>\r\n</button>");
$templateCache.put("common/cc/cctemplate.html","<div>\r\n   <div class=\"row\">\r\n      <div class=\"col-md-12\">\r\n         <a target=\"_blank\" ng-href=\"{{details.link}}\">Creative Commons Attribution {{details.version}} </a>\r\n      </div>\r\n   </div>\r\n   <div class=\"row\">\r\n      <div class=\"col-md-2\">\r\n         <span class=\"fa-stack\" aria-hidden=\"true\">\r\n         <i class=\"fa fa-check-circle-o fa-stack-2x\" aria-hidden=\"true\"></i>\r\n      </span>\r\n      </div>\r\n      <div class=\"col-md-10\">\r\n         You may use this work for commercial purposes.\r\n      </div>\r\n   </div>\r\n   <div class=\"row\">\r\n      <div class=\"col-md-2\">\r\n         <span class=\"fa-stack\" aria-hidden=\"true\">\r\n         <i class=\"fa fa-circle-o fa-stack-2x\"></i>\r\n         <i class=\"fa fa-female fa-stack-1x\"></i>\r\n      </span>\r\n      </div>\r\n      <div class=\"col-md-10\">\r\n         You must attribute the creator in your own works.\r\n      </div>\r\n   </div>\r\n</div>");
$templateCache.put("common/bbox/bbox.html","<button type=\"button\" class=\"undecorated\" ng-click=\"toggle()\" tooltip-placement=\"right\" title=\"Show data extent on the map.\">\r\n	<i class=\"fa pad-right fa-lg\" ng-class=\"{\'fa-eye orange\':data.hasBbox,\'fa-eye-slash\':!data.hasBbox}\"></i>\r\n</button>");
$templateCache.put("common/clip/clip.html","<div class=\"well well-sm\">\r\n<div class=\"container-fluid\">\r\n	<div class=\"row\">\r\n		<div class=\"col-md-12\">\r\n			<button style=\"margin-top:0px;\" ng-click=\"initiateDraw()\" ng-disable=\"client.drawing\" class=\"btn btn-primary btn-xs\">Draw</button>\r\n		</div>\r\n	</div>\r\n	<div class=\"row\">\r\n		<div class=\"col-md-3\"> </div>\r\n		<div class=\"col-md-8\">\r\n			<strong>Y Max:</strong>\r\n			<span><input type=\"text\" style=\"width:6em\" ng-model=\"clip.yMax\"></input><span ng-show=\"showBounds && bounds\">({{bounds.yMax|number : 4}} max)</span></span>\r\n		</div>\r\n	</div>\r\n	<div class=\"row\">\r\n		<div class=\"col-md-6\">\r\n			<strong>X Min:</strong>\r\n			<span><input type=\"text\" style=\"width:6em\" ng-model=\"clip.xMin\"></input><span ng-show=\"showBounds && bounds\">({{bounds.xMin|number : 4}} min)</span></span>\r\n		</div>\r\n		<div class=\"col-md-6\">\r\n			<strong>X Max:</strong>\r\n			<span><input type=\"text\" style=\"width:6em\" ng-model=\"clip.xMax\"></input><span ng-show=\"showBounds && bounds\">({{bounds.xMax|number : 4}} max)</span></span>\r\n		</div>\r\n	</div>\r\n	<div class=\"row\">\r\n		<div class=\"col-md-offset-3 col-md-8\">\r\n			<strong>Y Min:</strong>\r\n			<span><input type=\"text\" style=\"width:6em\" ng-model=\"clip.yMin\"></input><span ng-show=\"showBounds && bounds\">({{bounds.yMin|number : 4}} min)</span></span>\r\n		</div>\r\n	</div>\r\n</div>\r\n</div>");
$templateCache.put("common/extent/extent.html","<div class=\"row\" style=\"border-top: 1px solid gray; padding-top:5px\">\r\n	<div class=\"col-md-5\">\r\n		<div class=\"form-inline\">\r\n			<label>\r\n				<input id=\"extentEnable\" type=\"checkbox\" ng-model=\"parameters.fromMap\" ng-click=\"change()\"></input> \r\n				Restrict area to map\r\n			</label>\r\n		</div>\r\n	</div>\r\n	 \r\n	<div class=\"col-md-7\" ng-show=\"parameters.fromMap\">\r\n		<div class=\"container-fluid\">\r\n			<div class=\"row\">\r\n				<div class=\"col-md-offset-3 col-md-8\">\r\n					<strong>Y Max:</strong> \r\n					<span>{{parameters.yMax | number : 4}}</span> \r\n				</div>\r\n			</div>\r\n			<div class=\"row\">\r\n				<div class=\"col-md-6\">\r\n					<strong>X Min:</strong>\r\n					<span>{{parameters.xMin | number : 4}}</span> \r\n				</div>\r\n				<div class=\"col-md-6\">\r\n					<strong>X Max:</strong>\r\n					<span>{{parameters.xMax | number : 4}}</span> \r\n				</div>\r\n			</div>\r\n			<div class=\"row\">\r\n				<div class=\"col-md-offset-3 col-md-8\">\r\n					<strong>Y Min:</strong>\r\n					<span>{{parameters.yMin | number : 4}}</span> \r\n				</div>\r\n			</div>\r\n		</div>\r\n	</div>\r\n</div>");
$templateCache.put("common/download/download.html","<exp-modal ng-controller=\"DownloadCtrl as dl\" icon-class=\"fa-download\" is-open=\"dl.data.item.download\" title=\"Download data\" on-close=\"dl.remove()\" is-modal=\"true\">\r\n	<div style=\"padding:5px;\">\r\n		<div class=\"row\">\r\n  			<div class=\"col-md-12\">\r\n				<h4><common-wms data=\"dl.data.item\"></common-wms><common-tile data=\"dl.data.item\"></common-tile>{{dl.data.item.title}}</h4>\r\n				{{dl.data.item.abstract}}\r\n   			</div>\r\n		</div>\r\n		<nedf-geoprocess data=\"dl.data.item\"></nedf-geoprocess>\r\n	</div>\r\n</exp-modal>");
$templateCache.put("common/download/popup.html","<exp-modal icon-class=\"fa-download\"  is-open=\"data.item.download\" title=\"Download wizard\" on-close=\"dl.remove()\">\r\n	<div class=\"container-fluid downloadInner\" >\r\n		<div class=\"row\">\r\n  			<div class=\"col-md-12\">\r\n				<h4><common-wms data=\"dl.data.item\"></common-wms>\r\n					<a href=\"https://ecat.ga.gov.au/geonetwork/srv/eng/search#!{{dl.data.item.primaryId}}\" target=\"_blank\"><strong class=\"ng-binding\">{{dl.data.item.title}}</strong></a>\r\n				</h4>\r\n   			</div>\r\n		</div>\r\n		<wizard-geoprocess data=\"dl.data.item\"></wizard-geoprocess>\r\n	</div>\r\n</exp-modal>");
$templateCache.put("common/geoprocess/geoprocess.html","<div class=\"container-fluid\" style=\"overflow-x:hidden\" ng-form>\r\n	<div ng-show=\"stage==\'bbox\'\">\r\n		<div class=\"row\">\r\n			<div class=\"col-md-12\">\r\n				<wizard-clip trigger=\"stage == \'bbox\'\" drawn=\"drawn()\" clip=\"data.processing.clip\" bounds=\"data.bounds\"></wizard-clip>\r\n			</div>\r\n		</div>\r\n		<div class=\"row\" style=\"height:55px\">\r\n 			<div class=\"col-md-12\">\r\n				<button class=\"btn btn-primary pull-right\" ng-disabled=\"!validClip(data) || checkingOrFailed\" ng-click=\"stage=\'formats\'\">Next</button>\r\n			</div>\r\n		</div>\r\n		<div class=\"well\">\r\n			<strong style=\"font-size:120%\">Select an area of interest.</strong> There are two ways to select your area of interest:\r\n			<ol>\r\n				<li>Draw an area on the map with the mouse by clicking a corner and while holding the left mouse button\r\n					down drag diagonally across the map to the opposite corner or</li>\r\n				<li>Type your co-ordinates into the areas above.</li>\r\n			</ol>\r\n			Once drawn the points can be modified by the overwriting the values above or drawing another area by clicking the draw button again.\r\n			Ensure you select from the highlighted areas as the data can be quite sparse for some data.<br/>\r\n			<p style=\"padding-top:5px\">\r\n			<strong>Warning:</strong> Some extracts can be huge. It is best if you start with a small area to experiment with first. An email will be sent\r\n			with the size of the extract. Download judiciously.\r\n			</p>\r\n			<p style=\"padding-top\"><strong>Hint:</strong> If the map has focus, you can use the arrow keys to pan the map.\r\n				You can zoom in and out using the mouse wheel or the \"+\" and \"-\" map control on the top left of the map. If you\r\n				don\'t like the position of your drawn area, hit the \"Draw\" button and draw a new bounding box.\r\n			</p>\r\n		</div>\r\n	</div>\r\n\r\n	<div ng-show=\"stage==\'formats\'\">\r\n		<div class=\"well\">\r\n		<div class=\"row\">\r\n  			<div class=\"col-md-3\">\r\n				<label for=\"geoprocessOutputFormat\">\r\n					Output Format\r\n				</label>\r\n			</div>\r\n			<div class=\"col-md-9\">\r\n				<select id=\"geoprocessOutputFormat\" style=\"width:95%\" ng-model=\"data.processing.outFormat\" ng-options=\"opt.value for opt in config.outFormat\"></select>\r\n			</div>\r\n		</div>\r\n		<div class=\"row\">\r\n			<div class=\"col-md-3\">\r\n				<label for=\"geoprocessOutCoordSys\">\r\n					Coordinate System\r\n				</label>\r\n			</div>\r\n			<div class=\"col-md-9\">\r\n				<select id=\"geoprocessOutCoordSys\" style=\"width:95%\" ng-model=\"data.processing.outCoordSys\" ng-options=\"opt.value for opt in config.outCoordSys | sysIntersect : data.processing.clip\"></select>\r\n			</div>\r\n		</div>\r\n		</div>\r\n		<div class=\"row\" style=\"height:55px\">\r\n			<div class=\"col-md-6\">\r\n				<button class=\"btn btn-primary\" ng-click=\"stage=\'bbox\'\">Previous</button>\r\n			</div>\r\n			<div class=\"col-md-6\">\r\n				<button class=\"btn btn-primary pull-right\" ng-disabled=\"!validSansEmail(data)\" ng-click=\"stage=\'email\'\">Next</button>\r\n   			</div>\r\n		</div>\r\n\r\n		<div class=\"well\">\r\n			<strong style=\"font-size:120%\">Data representation.</strong> Select how you want your data presented.<br/>\r\n			Output format is the structure of the data and you should choose a format compatible with the tools that you will use to manipulate the data.\r\n			<ul>\r\n				<li ng-repeat=\"format in outFormats\"><strong>{{format.value}}</strong> - {{format.description}}</li>\r\n			</ul>\r\n			Select what <i>coordinate system</i> or projection you would like. If in doubt select WGS84.<br/>\r\n			Not all projections cover all of Australia. If the area you select is not covered by a particular projection then the option to download in that projection will not be available.\r\n		</div>\r\n	</div>\r\n\r\n	<div ng-show=\"stage==\'email\'\">\r\n		<div class=\"well\" exp-enter=\"stage=\'confirm\'\">\r\n			<div download-email></div>\r\n			<br/>\r\n			<div download-filename data=\"data.processing\"></div>\r\n		</div>\r\n		<div class=\"row\" style=\"height:55px\">\r\n			<div class=\"col-md-6\">\r\n				<button class=\"btn btn-primary\" ng-click=\"stage=\'formats\'\">Previous</button>\r\n			</div>\r\n			<div class=\"col-md-6\">\r\n				<button class=\"btn btn-primary pull-right\" ng-disabled=\"!allDataSet(data)\" ng-click=\"stage=\'confirm\'\">Submit</button>\r\n   			</div>\r\n		</div>\r\n		<div class=\"well\">\r\n			<strong style=\"font-size:120%\">Email notification</strong> The extract of data can take some time. By providing an email address we will be able to notify you when the job is complete. The email will provide a link to the extracted\r\n			data which will be packaged up as a single file. To be able to proceed you need to have provided:\r\n			<ul>\r\n				<li>An area of interest to extract the data (referred to as a bounding box).</li>\r\n				<li>An output format.</li>\r\n				<li>A valid coordinate system or projection.</li>\r\n				<li>An email address to receive the details of the extraction.</li>\r\n				<li><strong>Note:</strong>Email addresses need to be and are stored in the system.</li>\r\n			</ul>\r\n			<strong style=\"font-size:120%\">Optional filename</strong> The extract of data can take some time. By providing an optional filename it will allow you\r\n			to associate extracted data to your purpose for downloading data. For example:\r\n			<ul>\r\n				<li>myHouse will have a file named myHouse.zip</li>\r\n				<li>Sorrento would result in a file named Sorrento.zip</li>\r\n			</ul>\r\n		</div>\r\n	</div>\r\n\r\n	<div ng-show=\"stage==\'confirm\'\">\r\n		<div class=\"row\">\r\n			<div class=\"col-md-12 abstractContainer\">\r\n				{{data.abstract}}\r\n			</div>\r\n		</div>\r\n		<h3>You have chosen:</h3>\r\n		<table class=\"table table-striped\">\r\n			<tbody>\r\n				<tr>\r\n					<th>Area</th>\r\n					<td>\r\n						<span style=\"display:inline-block; width: 10em\">Lower left (lat/lng&deg;):</span> {{data.processing.clip.yMin | number : 6}}, {{data.processing.clip.xMin | number : 6}}<br/>\r\n						<span style=\"display:inline-block;width: 10em\">Upper right (lat/lng&deg;):</span> {{data.processing.clip.yMax | number : 6}}, {{data.processing.clip.xMax | number : 6}}\r\n					</td>\r\n				</tr>\r\n				<tr>\r\n					<th>Output format</th>\r\n					<td>{{data.processing.outFormat.value}}</td>\r\n				</tr>\r\n				<tr>\r\n					<th>Coordinate system</th>\r\n					<td>{{data.processing.outCoordSys.value}}</td>\r\n				</tr>\r\n				<tr>\r\n					<th>Email address</th>\r\n					<td>{{email}}</td>\r\n				</tr>\r\n				<tr ng-show=\"data.processing.filename\">\r\n					<th>Filename</th>\r\n					<td>{{data.processing.filename}}</td>\r\n				</tr>\r\n			</tbody>\r\n		</table>\r\n		<div class=\"row\" style=\"height:55px\">\r\n			<div class=\"col-md-6\">\r\n				<button class=\"btn btn-primary\" style=\"width:6em\" ng-click=\"stage=\'email\'\">Back</button>\r\n			</div>\r\n			<div class=\"col-md-6\">\r\n				<button class=\"btn btn-primary pull-right\" ng-click=\"startExtract()\">Confirm</button>\r\n   			</div>\r\n		</div>\r\n	</div>\r\n</div>");
$templateCache.put("common/header/header.html","<div class=\"container-full common-header\" style=\"padding-right:10px; padding-left:10px\">\r\n    <div class=\"navbar-header\">\r\n\r\n        <button type=\"button\" class=\"navbar-toggle\" data-toggle=\"collapse\" data-target=\".ga-header-collapse\">\r\n            <span class=\"sr-only\">Toggle navigation</span>\r\n            <span class=\"icon-bar\"></span>\r\n            <span class=\"icon-bar\"></span>\r\n            <span class=\"icon-bar\"></span>\r\n        </button>\r\n\r\n        <a href=\"/\" class=\"appTitle visible-xs\">\r\n            <h1 style=\"font-size:120%\">{{heading}}</h1>\r\n        </a>\r\n    </div>\r\n    <div class=\"navbar-collapse collapse ga-header-collapse\">\r\n        <ul class=\"nav navbar-nav\">\r\n            <li class=\"hidden-xs\"><a href=\"/\"><h1 class=\"applicationTitle\">{{heading}}</h1></a></li>\r\n        </ul>\r\n        <ul class=\"nav navbar-nav navbar-right nav-icons\">\r\n        	<li common-navigation role=\"menuitem\" current=\"current\" style=\"padding-right:10px\"></li>\r\n			<li mars-version-display role=\"menuitem\"></li>\r\n			<li style=\"width:10px\"></li>\r\n        </ul>\r\n    </div><!--/.nav-collapse -->\r\n</div>\r\n\r\n<!-- Strap -->\r\n<div class=\"row\">\r\n    <div class=\"col-md-12\">\r\n        <div class=\"strap-blue\">\r\n        </div>\r\n        <div class=\"strap-white\">\r\n        </div>\r\n        <div class=\"strap-red\">\r\n        </div>\r\n    </div>\r\n</div>");
$templateCache.put("common/iso19115/contact.html","<ul ng-show=\"node.hierarchyLevel\">\r\n   <li>\r\n      <span class=\"iso19115-head\">Contact</span>\r\n      <iso19115-node name=\"MD_ScopeCode\" node=\"node.hierarchyLevel.MD_ScopeCode\" type=\"_codeListValue\"></iso19115-node>\r\n    </li>\r\n</ul>");
$templateCache.put("common/iso19115/double.html","\r\n<ul ng-show=\"node\">\r\n   <li>\r\n      <span class=\"iso19115-head\">{{name | iso19115NodeName}}</span>\r\n      <iso19115-node name=\"name\" node=\"node[name]\" type=\"type\"></iso19115-node>\r\n   </li>\r\n</ul>\r\n");
$templateCache.put("common/iso19115/metadata.html","<div class=\"iso19115\">\r\n   <ul>\r\n      <li>\r\n         <span class=\"iso19115-head\">Metadata</span>\r\n         <iso19115-node name=\"fileIdentifier\" node=\"node.fileIdentifier\" type=\"CharacterString\"></iso19115-node>\r\n         <iso19115-node name=\"language\" node=\"node.language\" type=\"LanguageCode\"></iso19115-node>\r\n         <ul ng-show=\"node.characterSet\">\r\n            <li>\r\n               <span class=\"iso19115-head\">Character Set</span>\r\n               <iso19115-node name=\"CharacterSetCode\" node=\"node.characterSet.MD_CharacterSetCode\" type=\"_codeListValue\"></iso19115-node>\r\n            </li>\r\n         </ul>\r\n\r\n         <ul ng-show=\"node.hierarchyLevel\">\r\n            <li>\r\n               <span class=\"iso19115-head\">Hierarchy Level</span>\r\n               <iso19115-node name=\"MD_ScopeCode\" node=\"node.hierarchyLevel.MD_ScopeCode\" type=\"_codeListValue\"></iso19115-node>\r\n            </li>\r\n         </ul>\r\n         <iso19115-node name=\"hierarchyLevelName\" node=\"node.hierarchyLevelName\" type=\"CharacterString\"></iso19115-node>\r\n         <iso19115-contact ng-if=\"node.contact\" node=\"node.contact\" key=\"\'contact\'\"></iso19115-contact>\r\n      </li>\r\n   </ul>\r\n</div>");
$templateCache.put("common/metaview/dublincore.html","Dublin core");
$templateCache.put("common/metaview/iso19115.html","<iso19115-metadata node=\"data.metadata.GetRecordByIdResponse.MD_Metadata\" key=\"\'MD_Metadata\'\"></iso19115-metadata>\r\n");
$templateCache.put("common/metaview/iso19115node.html","<ul>\r\n   <li>\r\n      <span class=\"metaview-head\">{{key | metaviewNodeName}}</span>\r\n      <span>{{node | metaviewText}}</span>\r\n      <ng-repeat ng-if=\"isArray()\" ng-repeat=\"next in node\" node=\"next]\">\r\n         <metaview-iso19115-array ng-repeat=\"nextKey in getKeys() track by $index\" node=\"node[nextKey]\" key=\"nextKey\"></metaview-iso19115-array>\r\n      </ng-repeat>\r\n      <metaview-iso19115-node ng-if=\"!isArray()\" ng-repeat=\"nextKey in getKeys() track by $index\" node=\"node[nextKey]\" key=\"nextKey\"></metaview-iso19115-node>\r\n   </li>\r\n</ul>");
$templateCache.put("common/metaview/item.html","<div>\r\n	<button class=\"btn btn-sm btn-outline-primary\" ng-click=\"container.selected = null\"><i class=\"fa fa-angle-double-left\"></i> Back</button>\r\n      <span style=\"font-weight: bold;padding-left:10px; font-size:130%\">{{container.selected.title}}</span>\r\n      <metaview-iso19115 data=\"container.selected\"></metaview-iso19115>\r\n</div>");
$templateCache.put("common/metaview/metaview.html","<button type=\"button\" class=\"undecorated\" title=\"View metadata\" ng-click=\"select()\">\r\n	<i class=\"fa fa-lg fa-info metaview-info\"></i>\r\n</button>");
$templateCache.put("common/navigation/altthemes.html","<span class=\"altthemes-container\">\r\n	<span ng-repeat=\"item in themes | altthemesMatchCurrent : current\">\r\n       <a title=\"{{item.label}}\" ng-href=\"{{item.url}}\" class=\"altthemesItemCompact\" target=\"_blank\">\r\n         <span class=\"altthemes-icon\" ng-class=\"item.className\"></span>\r\n       </a>\r\n    </li>\r\n</span>");
$templateCache.put("common/panes/panes.html","<div class=\"container contentContainer\">\r\n	<div class=\"row icsmPanesRow\" >\r\n		<div class=\"icsmPanesCol\" ng-class=\"{\'col-md-12\':!view, \'col-md-7\':view}\" style=\"padding-right:0\">\r\n			<div class=\"panesMapContainer\" geo-map configuration=\"data.map\">\r\n			    <geo-extent></geo-extent>\r\n			</div>\r\n    		<div geo-draw data=\"data.map.drawOptions\" line-event=\"elevation.plot.data\" rectangle-event=\"bounds.drawn\"></div>\r\n		</div>\r\n		<div class=\"icsmPanesColRight\" ng-class=\"{\'hidden\':!view, \'col-md-5\':view}\" style=\"padding-left:0; padding-right:0\">\r\n			<div class=\"panesTabContentItem\" ng-show=\"view == \'download\'\" icsm-view></div>\r\n			<div class=\"panesTabContentItem\" ng-show=\"view == \'maps\'\" icsm-maps></div>\r\n			<div class=\"panesTabContentItem\" ng-show=\"view == \'glossary\'\" icsm-glossary></div>\r\n			<div class=\"panesTabContentItem\" ng-show=\"view == \'help\'\" icsm-help></div>\r\n		</div>\r\n	</div>\r\n</div>");
$templateCache.put("common/panes/tabs.html","<!-- tabs go here -->\r\n<div id=\"panesTabsContainer\" class=\"paneRotateTabs\" style=\"opacity:0.9\" ng-style=\"{\'right\' : contentLeft +\'px\'}\">\r\n\r\n	<div class=\"paneTabItem\" ng-class=\"{\'bold\': view == \'download\'}\" ng-click=\"setView(\'download\')\">\r\n		<button class=\"undecorated\">Download</button>\r\n	</div>\r\n	<!-- \r\n	<div class=\"paneTabItem\" ng-class=\"{\'bold\': view == \'search\'}\" ng-click=\"setView(\'search\')\">\r\n		<button class=\"undecorated\">Search</button>\r\n	</div>\r\n	<div class=\"paneTabItem\" ng-class=\"{\'bold\': view == \'maps\'}\" ng-click=\"setView(\'maps\')\">\r\n		<button class=\"undecorated\">Layers</button>\r\n	</div>\r\n	-->\r\n	<div class=\"paneTabItem\" ng-class=\"{\'bold\': view == \'glossary\'}\" ng-click=\"setView(\'glossary\')\">\r\n		<button class=\"undecorated\">Glossary</button>\r\n	</div>\r\n	<div class=\"paneTabItem\" ng-class=\"{\'bold\': view == \'help\'}\" ng-click=\"setView(\'help\')\">\r\n		<button class=\"undecorated\">Help</button>\r\n	</div>\r\n</div>\r\n");
$templateCache.put("common/reset/reset.html","<button type=\"button\" class=\"map-tool-toggle-btn\" ng-click=\"reset()\" title=\"Reset page\">\r\n   <span class=\"hidden-sm\">Reset</span>\r\n   <i class=\"fa fa-lg fa-refresh\"></i>\r\n</button>");
$templateCache.put("common/search/basin.html","<div class=\"btn-group pull-left radSearch\" style=\"position:relative;width:27em;opacity:0.9\">\r\n	<div class=\"input-group\" style=\"width:100%;\">\r\n		<input type=\"text\" size=\"32\" class=\"form-control\" style=\"border-top-right-radius:4px;border-bottom-right-radius:4px;\"\r\n				ng-keyup=\"keyup($event)\" ng-focus=\"changing()\" ng-model=\"nameFilter\" placeholder=\"Find a basin of interest\">\r\n		<div class=\"input-group-btn\"></div>\r\n	</div>\r\n	<div style=\"width:26em; position:absolute;left:15px\">\r\n		<div class=\"row\" ng-repeat=\"region in basinData.basins | basinFilterList : nameFilter : 10 | orderBy : \'name\'\"\r\n				style=\"background-color:white;\">\r\n			<div class=\"col-md-12 rw-sub-list-trigger\">\r\n				<button class=\"undecorated zoomButton\" ng-click=\"zoomToLocation(region);\">{{region.name}}</button>\r\n			</div>\r\n		</div>\r\n	</div>\r\n</div>");
$templateCache.put("common/search/catchment.html","<div class=\"btn-group pull-left radSearch\" style=\"position:relative;width:27em;opacity:0.9\">\r\n	<div class=\"input-group\" style=\"width:100%;\">\r\n		<input type=\"text\" size=\"32\" class=\"form-control\" style=\"border-top-right-radius:4px;border-bottom-right-radius:4px;\"\r\n				ng-keyup=\"keyup($event)\" ng-focus=\"changing()\" ng-model=\"nameFilter\" placeholder=\"Find a catchment of interest\">\r\n		<div class=\"input-group-btn\"></div>\r\n	</div>\r\n	<div style=\"width:26em; position:absolute;left:15px\">\r\n		<div class=\"row\" ng-repeat=\"region in catchmentData.catchments | catchmentFilterList : nameFilter : 10 | orderBy : \'name\'\"\r\n				style=\"background-color:white;\">\r\n			<div class=\"col-md-12 rw-sub-list-trigger\">\r\n				<button class=\"undecorated zoomButton\" ng-click=\"zoomToLocation(region);\">{{region.name}}</button>\r\n			</div>\r\n		</div>\r\n	</div>\r\n</div>");
$templateCache.put("common/side-panel/trigger.html","<button ng-click=\"toggle()\" type=\"button\" class=\"map-tool-toggle-btn\">\r\n   <span class=\"hidden-sm\">{{name}}</span>\r\n   <ng-transclude></ng-transclude>\r\n   <i class=\"fa fa-lg\" ng-class=\"iconClass\"></i>\r\n</button>");
$templateCache.put("common/toolbar/toolbar.html","<div icsm-toolbar>\r\n	<div class=\"row toolBarGroup\">\r\n		<div class=\"btn-group searchBar\" ng-show=\"root.whichSearch != \'region\'\">\r\n			<div class=\"input-group\" geo-search>\r\n				<input type=\"text\" ng-autocomplete ng-model=\"values.from.description\" options=\'{country:\"au\"}\'\r\n							size=\"32\" title=\"Select a locality to pan the map to.\" class=\"form-control\" aria-label=\"...\">\r\n				<div class=\"input-group-btn\">\r\n    				<button ng-click=\"zoom(false)\" exp-ga=\"[\'send\', \'event\', \'icsm\', \'click\', \'zoom to location\']\"\r\n						class=\"btn btn-default\"\r\n						title=\"Pan and potentially zoom to location.\"><i class=\"fa fa-search\"></i></button>\r\n				</div>\r\n			</div>\r\n		</div>\r\n\r\n		<div class=\"pull-right\">\r\n			<div class=\"btn-toolbar radCore\" role=\"toolbar\"  icsm-toolbar>\r\n				<div class=\"btn-group\">\r\n				</div>\r\n			</div>\r\n\r\n			<div class=\"btn-toolbar\" style=\"margin:right:10px;display:inline-block\">\r\n				<div class=\"btn-group\" title=\"{{overlaytitle}}\">\r\n					<span class=\"btn btn-default\" common-baselayer-control max-zoom=\"16\"></span>\r\n				</div>\r\n			</div>\r\n		</div>\r\n	</div>\r\n</div>");}]);