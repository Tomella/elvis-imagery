
(function(angular, L) {
'use strict';

angular.module("common.geoprocess", [])

.directive("wizardGeoprocess", ['$http', '$q', '$timeout', 'geoprocessService', 'flashService', 'messageService',
                                function($http, $q, $timeout, geoprocessService, flashService, messageService) {
	return {
		restrict :"AE",
		templateUrl : "common/geoprocess/geoprocess.html",
		scope : {
			data : "="
		},
		link : function(scope) {
			var clipMessage, clipTimeout, referenceLayer;

			geoprocessService.outFormats().then(function(data) {
				scope.outFormats = data;
			});

			scope.$watch("data", function(newData, oldData) {
				if(oldData) {
					geoprocessService.removeClip();
					removeReferenceLayer();
				}
				if(newData && newData !== oldData) {
					scope.stage = "bbox";
					drawReferenceLayer();
				}
			});

			scope.$watchGroup(["data.processing.clip.xMax", "data.processing.clip.xMin", "data.processing.clip.yMax", "data.processing.clip.yMin"],
					function(newValues, oldValues, scope) {
				var result, url;

				if(clipTimeout) {
					$timeout.cancel(clipTimeout);
					clipTimeout = null;
				}
				if(scope.data && scope.data.processing && scope.data.processing.clip && scope.data.processing.clip.xMax !== null) {
					url = scope.config.extentCheckTemplates[scope.data.sysId];
					clipMessage = flashService.add("Validating selected area...", 3000);

					// Make really sure that all our stop points set this appropriately. We don't want the button locked out for ever.
					scope.checkingOrFailed = !!url; // We only apply this to records that have a URL to check intersection against.
					clipTimeout = $timeout(function() {
						checkSize().then(function(result) {
							try {
								if(result && result.code === "success") {
									if(url) {
										// Order matches the $watch signature so be careful
										var urlWithParms = url
											.replace("{maxx}", newValues[0])
											.replace("{minx}", newValues[1])
											.replace("{maxy}", newValues[2])
											.replace("{miny}", newValues[3]);
										flashService.remove(clipMessage);
										clipMessage = flashService.add("Checking there is data in your selected area...");
										$http.get(urlWithParms).then(function(response) {
											if(response.data && response.data.length > 0) {
												flashService.remove(clipMessage);
												if(response.data[0].Intersect === false) {
													messageService.error("There is no data covering the drawn area currently in this resolution dataset.", 6000);
													scope.stage = "bbox";
													drawReferenceLayer();
													// This is the only place that checkingOrFailed stays true;
												} else {
													if(response.data[0].Intersect === true) {
														clipMessage = flashService.add("There is intersecting data. Click \"Next\" if you are ready to proceed.", 5000);
													} else {
														clipMessage = flashService.add("Click \"Next\" if you are ready to proceed.", 4000);
													}
													scope.checkingOrFailed = false;
													geoprocessService.handleShowClip(scope.data.processing.clip);
												}
											}
											console.log(response);
										}, function(err) { // If it falls over we don't want to crash.
											scope.checkingOrFailed = false;
											geoprocessService.handleShowClip(scope.data.processing.clip);
											console.log("Service unavailable to check intersection");
										});
									} else {
										geoprocessService.handleShowClip(scope.data.processing.clip);
										scope.checkingOrFailed = false;
									}
								}
							} catch(e) {
								// Very paranoid about setting it to block.
								scope.checkingOrFailed = false;
							}
						});
					}, 2000);
				}

				function checkSize() {
					var deferred = $q.defer();

					result = scope.drawn();
					if(result && result.code) {
						switch(result.code) {
							case "oversize":
								$timeout(function() {
									flashService.remove(clipMessage);
									messageService.error("The selected area is too large to process. Please restrict to approximately " +
											Math.sqrt(scope.data.restrictSize) + " degrees square.");
									scope.stage = "bbox";
									drawReferenceLayer();
									deferred.resolve(result);
								});
								break;

							case "undersize":
								$timeout(function() {
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

			scope.drawn = function() {
				geoprocessService.removeClip();
				forceNumbers(scope.data.processing.clip);
				//flashService.remove(clipMessage);
				if(constrainBounds(scope.data.processing.clip, scope.data.bounds)) {
					clipMessage = flashService.add("Redrawn to fit within data extent", 5000);
				}

				if(overSizeLimit(scope.data.processing.clip)) {
					return {code: "oversize"};
				}

				if(underSizeLimit(scope.data.processing.clip)) {
					return {code: "undersize"};
				}

				if(scope.data.processing.clip.xMax === null) {
					return {code: "incomplete"};
				}

				//if(this.data.queryLayer) {
				//	geoprocessService.queryLayer(scope.data.queryLayer, scope.data.processing.clip).then(function(response) {
				//	});
				//} else
				if(validClip(scope.data.processing.clip)) {
					return {code: "success"};
				}
				return {code: "invalid"};
			};

			scope.startExtract = function() {
				if(scope.allDataSet()) {
					messageService.info("Your request has been sent for processing. You will be notified by email on completion of the job.");
					flashService.add("You can select another area for processing.", 10000);
					geoprocessService.initiateJob(scope.data, scope.email);
					scope.data.download = false;
				}
			};

			scope.allDataSet = function() {
				var proc = scope.data && scope.data.processing?scope.data.processing:null;
				// For it to be OK we need.
				return proc && scope.email &&
					validClip(proc.clip) &&
					proc.outCoordSys && proc.outFormat;
			};

			scope.validSansEmail = function() {
				var proc = scope.data && scope.data.processing?scope.data.processing:null;
				// For it to be OK we need.
				return proc &&
					validClip(proc.clip) &&
					proc.outCoordSys && proc.outFormat;
			};

			scope.validClip = function(data) {
				return data && data.processing && validClip(data.processing.clip);
			};

			geoprocessService.getConfig().then(function(config) {
				scope.config = config;
			});

			function drawReferenceLayer() {
				removeReferenceLayer();
				if(scope.data.referenceLayer) {
					referenceLayer = geoprocessService.addLayer(scope.data.referenceLayer);
				}
			}

			function removeReferenceLayer() {
				if(referenceLayer) {
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

				if(!p || empty(c.xMax) || empty(c.xMin) || empty(c.yMax) || empty(c.yMin)) {
					return false;
				}

				ret = flag = +c.xMax < +p.xMin;
				if(flag) {
					c.xMax = +p.xMin;
				}

				flag = +c.xMax > +p.xMax;
				ret = ret || flag;

				if(flag) {
					c.xMax = +p.xMax;
				}

				flag = +c.xMin < +p.xMin;
				ret = ret || flag;
				if(flag) {
					c.xMin = +p.xMin;
				}

				flag = +c.xMin > +c.xMax;
				ret = ret || flag;
				if(flag) {
					c.xMin = c.xMax;
				}

				// Now for the Y's
				flag = +c.yMax < +p.yMin;
				ret = ret || flag;
				if(flag) {
					c.yMax = +p.yMin;
				}

				flag = +c.yMax > +p.yMax;
				ret = ret || flag;
				if(flag) {
					c.yMax = +p.yMax;
				}

				flag = +c.yMin < +p.yMin;
				ret = ret || flag;
				if(flag) {
					c.yMin = +p.yMin;
				}

				flag = +c.yMin > +c.yMax;
				ret = ret || flag;
				if(flag) {
					c.yMin = +c.yMax;
				}

				return ret;

				function empty(val) {
					return angular.isUndefined(val) ||
						val === "" ||
						val === null;
				}
			}

			function forceNumbers(clip) {
				clip.xMax = clip.xMax === null?null:+clip.xMax;
				clip.xMin = clip.xMin === null?null:+clip.xMin;
				clip.yMax = clip.yMax === null?null:+clip.yMax;
				clip.yMin = clip.yMin === null?null:+clip.yMin;
			}

			// The input validator takes care of order and min/max constraints. We just check valid existance.
			function validClip(clip) {
				return clip &&
					angular.isNumber(clip.xMax) &&
					angular.isNumber(clip.xMin) &&
					angular.isNumber(clip.yMax) &&
					angular.isNumber(clip.yMin) &&
					!overSizeLimit(clip) &&
					!underSizeLimit(clip);
			}
		}
	};
}])

.factory("geoprocessService", GeoprocessService)

.filter("sysIntersect", function() {
	return function(collection, extent) {
		// The extent may have missing numbers so we don't restrict at that point.
		if(!extent ||
				!angular.isNumber(extent.xMin) ||
				!angular.isNumber(extent.xMax) ||
				!angular.isNumber(extent.yMin) ||
				!angular.isNumber(extent.yMax)) {
			return collection;
		}

		return collection.filter(function(item) {

			// We know these have valid numbers if it exists
			if(!item.extent) {
				return true;
			}
			// We have a restriction
			return item.extent.xMin <= extent.xMin &&
				item.extent.xMax >= extent.xMax &&
				item.extent.yMin <= extent.yMin &&
				item.extent.yMax >= extent.yMax;
		});
	};
});

GeoprocessService.$invoke = ['$http', '$q', '$timeout', 'configService', 'downloadService', 'ga', 'mapService', 'storageService'];
function GeoprocessService($http, $q, $timeout, configService, downloadService, mapService, storageService) {
	var DEFAULT_DATASET = "dems1sv1_0", // TODO: We have to get this from the metadata somehow.
		geoprocessingTemplates,
		clipLayer = null,
		map;

	configService.getConfig("initiateServiceTemplates").then(function(template) {
		geoprocessingTemplates = template;
	});


	mapService.getMap().then(function(lMap) {
		map = lMap;
	});

	function getUrl(data) {
		var custom, key, template;

		if(geoprocessingTemplates.custom) {
			custom = geoprocessingTemplates.custom[data.primaryId];
			if(custom) {
				key = custom.key;
				template = custom.templates[data[key]];
				if(template) {
					return template;
				}
			}
		}
		return geoprocessingTemplates["default"];
	}

	return {
		queryLayer: function(query, clip) {
			var deferred = $q.defer();

			var layer = L.esri.featureLayer({
			    url: query.url
			});

			var bounds = L.latLngBounds(
				[clip.yMin, clip.xMin],	// top left
				[clip.yMax, clip.xMax]  // bottom right
			);

			layer.query().intersects(bounds).ids(function(error, ids) {
				if(error) {
					deferred.reject(error);
				} else {
					deferred.resolve(ids);
				}
			});
			return deferred.promise;
		},

		outFormats: function() {
			return configService.getConfig("processing").then(function(data) {
				return data.outFormat;
			});
		},

		handleShowClip : function(clip) {
			this.removeClip();

			clipLayer = L.rectangle([
			    [clip.yMin, clip.xMin],
			    [clip.yMax, clip.xMax]
			], {
				weight:2,
				opacity:0.9,
				fill:false,
				color: "#000000",
				width:3,
				clickable: false
			});

			clipLayer.addTo(map);
		},

		removeClip : function() {
			if(clipLayer) {
				map.removeLayer(clipLayer);
				clipLayer = null;
			}
		},

		addLayer: function(data) {
			return L.tileLayer.wms(data.parameters[0], data.parameters[1]).addTo(map);
		},

		removeLayer: function(layer) {
			map.removeLayer(layer);
		},

		initiateJob : function(data, email) {
			var dataset = DEFAULT_DATASET,  // TODO Replace with real dataset file name from metadata.
				win, workingString = getUrl(data),
				processing = data.processing,
				log = {
					bbox : {
						yMin : processing.clip.yMin,
						yMax : processing.clip.yMax,
						xMin : processing.clip.xMin,
						xMax : processing.clip.xMax,
					},
					geocatId : data.primaryId,
					crs : processing.outCoordSys.code,
					format : processing.outFormat.code
				};

			angular.forEach({
					basename : dataset,
					id : data.primaryId,
					yMin : processing.clip.yMin,
					yMax : processing.clip.yMax,
					xMin : processing.clip.xMin,
					xMax : processing.clip.xMax,
					outFormat : processing.outFormat.code,
					outCoordSys : processing.outCoordSys.code,
					filename : processing.filename?processing.filename:"",
					state : data.state?data.state:"",
					email : email
				}, function(item, key) {
					workingString = workingString.replace("${" + key + "}", item);
				});

			$("#launcher")[0].src = workingString;

			downloadService.setEmail(email);

			ga('send', 'event', 'nedf', 'click', 'FME data export: ' + JSON.stringify(log));
		},

		getConfig : function() {
			return configService.getConfig("processing");
		}
	};
}

})(angular, L);
