(function (angular, L) {
   'use strict';

   angular.module("common.featureinfo", [])

      .directive("commonFeatureInfo", ['$http', '$log', '$q', '$timeout', 'featureInfoService', 'flashService', 'messageService',
         function ($http, $log, $q, $timeout, featureInfoService, flashService, messageService) {
            var template = "https://elvis-ga.fmecloud.com/fmedatastreaming/elvis_indexes/GetFeatureInfo_ElevationAvailableData.fmw?" +
               "SERVICE=WMS&VERSION=1.1.1&REQUEST=GetFeatureInfo&SRS=EPSG%3A4326&BBOX=${bounds}&WIDTH=${width}&HEIGHT=${height}" +
               //"LAYERS=public.5dem_ProjectsIndex&" +
               "&LAYERS=public.QLD_Elevation_Metadata_Index,public.ACT2015-Tile_Index_55,public.5dem_ProjectsIndex,public.NSW_100k_Index_54,public.NSW_100k_Index_55," +
               "public.NSW_100k_Index_56,public.NSW_100k_Index_Forward_Program,public.QLD_Project_Index_54," +
               "public.QLD_Project_Index_55,public.QLD_Project_Index_56,public.TAS_Project_Index_55," +
               "public.GA_Project_Index_47,public.GA_Project_Index_48,public.GA_Project_Index_54," +
               "public.GA_Project_Index_55,public.GA_Project_Index_56" +
               "&STYLES=&INFO_FORMAT=application%2Fjson&FEATURE_COUNT=100&X=${x}&Y=${y}";
            var layers = ["public.5dem_ProjectsIndex", "public.NSW_100k_Index"];

            return {
               require: "^geoMap",
               restrict: "AE",
               link: function (scope, element, attrs, ctrl) {
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
                           let group = httpResponse.data;
                           let response;
                           var features = [];
                           let popupText = [];

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

                              group.forEach(response => {
                                 response.features.forEach(feature => {
                                    features.push(feature);

                                    let buffer = ["<span>"];
                                    let properties = feature.properties;


                                    if (properties.maptitle) {
                                       let title = properties.mapnumber ? "Map number: " + properties.mapnumber : "";
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
                                       let contact = properties.contact;
                                       let mailto = contact.toLowerCase().indexOf("mailto:") === 0 ? "" : "mailto:";

                                       buffer.push("<br/><strong>Contact:</strong> <a href='" + mailto + properties.contact +
                                          "'>" + properties.contact + "</a>")
                                    }

                                    if (properties.metadata_url) {
                                       buffer.push("<br/><a href='" + properties.metadata_url + "' target='_blank'>Metadata</a>")
                                    }

                                    popupText.push(buffer.join(" "));
                                 });
                              });
                           }

                           if (features.length) {
                              layer = L.geoJson(response.data, {
                                 style: function (feature) {
                                    return {
                                       fillOpacity: 0.1,
                                       color: "red"
                                    };
                                 }
                              }).addTo(map);
                              featureInfoService.setLayer(layer);

                              L.popup()
                                 .setLatLng(latlng)
                                 .setContent("<div class='fi-popup'>" + popupText.join("<hr/>") + "</div>")
                                 .openOn(map);
                           }
                        });
                     });
                  });
               }
            };
         }])

      .factory('featureInfoService', [function () {
         var lastFeature = null;
         return {
            setLayer: function (layer) {
               lastFeature = layer;
            },
            removeLastLayer: function (map) {
               if (lastFeature) {
                  map.removeLayer(lastFeature);
                  lastFeature = null;
               }
            }
         };
      }]);


   function captured(twoDates) {
      let dates = twoDates.split(" - ");
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
