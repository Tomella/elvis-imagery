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
   var RootCtrl = function RootCtrl($http, configService) {
      var self = this;
      configService.getConfig().then(function (data) {
         self.data = data;
         // If its got WebGL its got everything we need.
         try {
            var canvas = document.createElement('canvas');
            data.modern = !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
         } catch (e) {
            data.modern = false;
         }
      });
   };

   angular.module("ImageryApp", ['common.altthemes', 'common.header', 'common.navigation', 'common.panes', 'common.storage', 'common.templates', 'common.toolbar', 'explorer.config', 'explorer.confirm', 'explorer.drag', 'explorer.enter', 'explorer.flasher', 'explorer.googleanalytics', 'explorer.httpdata', 'explorer.info', 'explorer.message', 'explorer.modal', 'explorer.tabs', 'explorer.version', 'explorer.map.templates', 'exp.ui.templates', 'geo.draw', 'geo.elevation', 'geo.geosearch', 'geo.map', 'geo.maphelper', 'geo.measure', 'icsm.contributors', 'icsm.side-panel', 'imagery.clip', 'imagery.download', 'imagery.panes', 'imagery.templates', 'imagery.toolbar', 'imagery.view', 'ui.bootstrap', 'ui.bootstrap-slider', 'ngAutocomplete', 'ngRoute', 'ngSanitize', 'page.footer'])

   // Set up all the service providers here.
   .config(['configServiceProvider', 'projectsServiceProvider', 'versionServiceProvider', function (configServiceProvider, projectsServiceProvider, versionServiceProvider) {
      configServiceProvider.location("icsm/resources/config/config.json");
      configServiceProvider.dynamicLocation("icsm/resources/config/appConfig.json?t=");
      versionServiceProvider.url("icsm/assets/package.json");
      projectsServiceProvider.setProject("icsm");
   }]).factory("userService", [function () {
      return {
         login: noop,
         hasAcceptedTerms: noop,
         setAcceptedTerms: noop,
         getUsername: function getUsername() {
            return "anon";
         }
      };
      function noop() {
         return true;
      }
   }]).controller("RootCtrl", RootCtrl);

   RootCtrl.$invoke = ['$http', 'configService'];
}
'use strict';

{
   angular.module("imagery.clip", ['geo.draw']).directive('imageryInfoBbox', function () {
      return {
         restrict: 'AE',
         templateUrl: 'imagery/clip/infobbox.html'
      };
   }).directive("imageryClip", ['$rootScope', '$timeout', 'clipService', 'messageService', 'mapService', function ($rootScope, $timeout, clipService, messageService, mapService) {
      return {
         templateUrl: "imagery/clip/clip.html",
         scope: {
            bounds: "=",
            trigger: "=",
            drawn: "&"
         },
         link: function link(scope, element) {
            var timer = void 0;

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
                  $timeout(function () {
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
   }]).factory("clipService", ['$q', '$rootScope', 'drawService', function ($q, $rootScope, drawService) {
      var options = {
         maxAreaDegrees: 4
      },
          service = {
         data: {
            clip: {}
         },
         initiateDraw: function initiateDraw() {
            $rootScope.$broadcast("clip.initiate.draw", { started: true });
            var clip = this.data.clip;
            delete clip.xMin;
            delete clip.xMax;
            delete clip.yMin;
            delete clip.yMax;
            delete clip.area;
            return drawService.drawRectangle({
               retryOnOversize: false
            });
         },

         cancelDraw: function cancelDraw() {
            drawService.cancelDrawRectangle();
         },

         setClip: function setClip(data) {
            return drawComplete(data);
         }
      };

      $rootScope.$on("bounds.drawn", function (event, data) {
         console.log("data", data);
         service.setClip(data);
         var c = service.data.clip;

         $rootScope.$broadcast('icsm.clip.drawn', c); // Let people know it is drawn
         $rootScope.$broadcast('icsm.bounds.draw', [c.xMin, c.yMin, c.xMax, c.yMax]); // Draw it
      });

      return service;

      function drawComplete(data) {
         var clip = service.data.clip;
         clip.xMax = data.bounds.getEast().toFixed(5);
         clip.xMin = data.bounds.getWest().toFixed(5);
         clip.yMax = data.bounds.getNorth().toFixed(5);
         clip.yMin = data.bounds.getSouth().toFixed(5);

         service.data.area = (clip.xMax - clip.xMin) * (clip.yMax - clip.yMin);

         return service.data;
      }
   }]);
}
"use strict";

{
   var DownloadCtrl = function DownloadCtrl(downloadService) {
      downloadService.data().then(function (data) {
         this.data = data;
      }.bind(this));

      this.remove = function () {
         downloadService.clear();
      };

      this.changeEmail = function (email) {
         downloadService.setEmail(email);
      };
   };

   var DownloadService = function DownloadService($http, $q, $rootScope, mapService, storageService) {
      var key = "download_email",
          downloadLayerGroup = "Download Layers",
          mapState = {
         zoom: null,
         center: null,
         layer: null
      },
          _data = null,
          service = {
         getLayerGroup: function getLayerGroup() {
            return mapService.getGroup(downloadLayerGroup);
         },

         setState: function setState(data) {
            if (data) {
               prepare();
            } else {
               restore();
            }

            function prepare() {

               var bounds = [[data.bounds.yMin, data.bounds.xMin], [data.bounds.yMax, data.bounds.xMax]];

               if (mapState.layer) {
                  mapService.getGroup(downloadLayerGroup).removeLayer(mapState.layer);
               }
            }
            function restore(map) {
               if (mapState.layer) {
                  mapService.clearGroup(downloadLayerGroup);
                  mapState.layer = null;
               }
            }
         },

         decorate: function decorate() {
            var item = _data.item;
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
            if (_data) {
               return $q.when(_data);
            }

            return $http.get('icsm/resources/config/icsm.json').then(function (response) {
               _data = response.data;
               service.decorate();
               return _data;
            });
         }
      };

      return service;
   };

   angular.module("imagery.download", []).controller("DownloadCtrl", DownloadCtrl).factory("downloadService", DownloadService);

   DownloadCtrl.$inject = ["downloadService"];


   DownloadService.$inject = ['$http', '$q', '$rootScope', 'mapService', 'storageService'];
}
"use strict";

{
   var ContributorsService = function ContributorsService($http) {
      var state = {
         show: false,
         ingroup: false,
         stick: false
      };

      $http.get("icsm/resources/config/contributors.json").then(function (response) {
         state.orgs = response.data;
      });

      return {
         getState: function getState() {
            return state;
         }
      };
   };

   angular.module('icsm.contributors', []).directive("icsmContributors", ["$interval", "contributorsService", function ($interval, contributorsService) {
      return {
         templateUrl: "imagery/contributors/contributors.html",
         scope: {},
         link: function link(scope, element) {
            var timer = void 0;

            scope.contributors = contributorsService.getState();

            scope.over = function () {
               $interval.cancel(timer);
               scope.contributors.ingroup = true;
            };

            scope.out = function () {
               timer = $interval(function () {
                  scope.contributors.ingroup = false;
               }, 1000);
            };

            scope.unstick = function () {
               scope.contributors.ingroup = scope.contributors.show = scope.contributors.stick = false;
               element.find("a").blur();
            };
         }
      };
   }]).directive("icsmContributorsLink", ["$interval", "contributorsService", function ($interval, contributorsService) {
      return {
         restrict: "AE",
         templateUrl: "imagery/contributors/show.html",
         scope: {},
         link: function link(scope) {
            var timer = void 0;
            scope.contributors = contributorsService.getState();
            scope.over = function () {
               $interval.cancel(timer);
               scope.contributors.show = true;
            };

            scope.toggleStick = function () {
               scope.contributors.stick = !scope.contributors.stick;
               if (!scope.contributors.stick) {
                  scope.contributors.show = scope.contributors.ingroup = false;
               }
            };

            scope.out = function () {
               timer = $interval(function () {
                  scope.contributors.show = false;
               }, 700);
            };
         }
      };
   }]).factory("contributorsService", ContributorsService).filter("activeContributors", function () {
      return function (contributors) {
         if (!contributors) {
            return [];
         }
         return contributors.filter(function (contributor) {
            return contributor.enabled;
         });
      };
   });

   ContributorsService.$inject = ["$http"];
}
"use strict";

{
   var PaneCtrl = function PaneCtrl(paneService) {
      var _this = this;

      paneService.data().then(function (data) {
         _this.data = data;
      });
   };

   var PaneService = function PaneService() {
      var data = {};

      return {
         add: function add(item) {},

         remove: function remove(item) {}
      };
   };

   console.log("9999999999");
   angular.module("imagery.panes", []).directive("imageryPanes", ['$rootScope', '$timeout', 'mapService', function ($rootScope, $timeout, mapService) {
      return {
         templateUrl: "imagery/panes/panes.html",
         transclude: true,
         restrict: "AE",
         scope: {
            defaultItem: "@",
            data: "="
         },
         link: function link(scope) {
            console.log("HHHHHHHHHHHHHH4H");
         },
         controller: ['$scope', function ($scope) {
            var changeSize = false;

            $rootScope.$on('side.panel.change', function (event) {
               emitter();
               $timeout(emitter, 100);
               $timeout(emitter, 200);
               $timeout(emitter, 300);
               $timeout(emitter, 500);
               function emitter() {
                  var evt = document.createEvent("HTMLEvents");
                  evt.initEvent("resize", false, true);
                  window.dispatchEvent(evt);
               }
            });

            $scope.view = $scope.defaultItem;

            $rootScope.$broadcast("view.changed", $scope.view, null);

            $scope.setView = function (what) {
               var oldView = $scope.view;

               if ($scope.view === what) {
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
         templateUrl: "imagery/panes/tabs.html",
         require: "^icsmPanes"
      };
   }]).controller("PaneCtrl", PaneCtrl).factory("paneService", PaneService);

   PaneCtrl.$inject = ["paneService"];


   PaneService.$inject = [];
}
"use strict";

{

   angular.module("imagery.toolbar", []).directive("elevationToolbar", [function () {
      return {
         restrict: "AE",
         templateUrl: "imagery/toolbar/toolbar.html",
         controller: 'toolbarLinksCtrl',
         transclude: true
      };
   }]).controller("toolbarLinksCtrl", ["$scope", "configService", function ($scope, configService) {
      var self = this;
      configService.getConfig().then(function (config) {
         self.links = config.toolbarLinks;
      });

      $scope.item = "";
      $scope.toggleItem = function (item) {
         $scope.item = $scope.item === item ? "" : item;
      };
   }]);
}
"use strict";

{
   var DownloadCtrl = function DownloadCtrl(downloadService) {
      downloadService.data().then(function (data) {
         this.data = data;
      }.bind(this));

      this.remove = function () {
         downloadService.clear();
      };

      this.changeEmail = function (email) {
         downloadService.setEmail(email);
      };
   };

   var DownloadService = function DownloadService($http, $q, $rootScope, mapService, storageService) {
      var key = "download_email",
          downloadLayerGroup = "Download Layers",
          mapState = {
         zoom: null,
         center: null,
         layer: null
      },
          _data = null,
          service = {
         getLayerGroup: function getLayerGroup() {
            return mapService.getGroup(downloadLayerGroup);
         },

         setState: function setState(data) {
            if (data) {
               prepare();
            } else {
               restore();
            }

            function prepare() {

               var bounds = [[data.bounds.yMin, data.bounds.xMin], [data.bounds.yMax, data.bounds.xMax]];

               if (mapState.layer) {
                  mapService.getGroup(downloadLayerGroup).removeLayer(mapState.layer);
               }
            }
            function restore(map) {
               if (mapState.layer) {
                  mapService.clearGroup(downloadLayerGroup);
                  mapState.layer = null;
               }
            }
         },

         decorate: function decorate() {
            var item = _data.item;
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
            if (_data) {
               return $q.when(_data);
            }

            return $http.get('icsm/resources/config/icsm.json').then(function (response) {
               _data = response.data;
               service.decorate();
               return _data;
            });
         }
      };

      return service;
   };

   angular.module("imagery.view", []).directive("imageryView", ['downloadService', function (downloadService) {
      return {
         templateUrl: "imagery/view/view.html",
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
   }]).controller("DownloadCtrl", DownloadCtrl).factory("downloadService", DownloadService);

   DownloadCtrl.$inject = ["downloadService"];


   DownloadService.$inject = ['$http', '$q', '$rootScope', 'mapService', 'storageService'];
}
angular.module("imagery.templates", []).run(["$templateCache", function($templateCache) {$templateCache.put("imagery/clip/clip.html","<div class=\"well well-sm\" style=\"margin-bottom:5px\">\r\n	<div class=\"container-fluid\">\r\n		<div class=\"row\">\r\n			<div class=\"col-md-12\" style=\"padding:0\">\r\n				<div class=\"\" role=\"group\" aria-label=\"...\">\r\n					<button ng-click=\"initiateDraw()\" ng-disable=\"client.drawing\"\r\n                      tooltip-append-to-body=\"true\" tooltip-placement=\"bottom\" uib-tooltip=\"Enable drawing of a bounding box. On enabling, click on the map and drag diagonally\"\r\n						class=\"btn btn-primary btn-default\">Select an area...</button>\r\n					<button ng-click=\"showInfo = !showInfo\" tooltip-placement=\"bottom\" uib-tooltip=\"Information.\" style=\"float:right\" class=\"btn btn-primary btn-default\"><i class=\"fa fa-info\"></i></button>\r\n				</div>\r\n				<exp-info title=\"Selecting an area\" show-close=\"true\" style=\"width:450px;position:fixed;top:200px;right:40px\" is-open=\"showInfo\">\r\n					<icsm-info-bbox></icsm-info-bbox>\r\n            </exp-info>\r\n            <div class=\"row\" ng-hide=\"(!clip.xMin && clip.xMin !== 0) || oversize\" style=\"padding-top:7px;\">\r\n               <div class=\"col-md-12 ng-binding\">\r\n                  Selected bounds: {{clip.xMin | number : 4}}° west,\r\n                     {{clip.yMax | number : 4}}° north,\r\n                     {{clip.xMax | number : 4}}° east,\r\n                     {{clip.yMin | number : 4}}° south\r\n               </div>\r\n            </div>\r\n			</div>\r\n		</div>\r\n	</div>\r\n</div>");
$templateCache.put("imagery/clip/infobbox.html","<div class=\"\">\r\n	<strong style=\"font-size:120%\">Select an area of interest.</strong>\r\n   By hitting the \"Select an area...\" button an area on the map can be selected with the mouse by clicking a\r\n   corner and while holding the left mouse button\r\n	down drag diagonally across the map to the opposite corner.\r\n	<br/>\r\n	Clicking the \"Select an area...\" button again allows replacing a previous area selection. <br/>\r\n	<strong>Notes:</strong>\r\n   <ul>\r\n      <li>The data does not cover all of Australia.</li>\r\n      <li>Restrict a search area to below four square degrees. eg 2x2 or 1x4</li>\r\n   </ul>\r\n	<p style=\"padding-top:5px\"><strong>Hint:</strong> If the map has focus, you can use the arrow keys to pan the map.\r\n		You can zoom in and out using the mouse wheel or the \"+\" and \"-\" map control on the top left of the map. If you\r\n		don\'t like the position of your drawn area, hit the \"Draw\" button and draw a new bounding box.\r\n	</p>\r\n</div>");
$templateCache.put("imagery/contributors/contributors.html","<span class=\"contributors\" ng-mouseenter=\"over()\" ng-mouseleave=\"out()\"\r\n      ng-class=\"(contributors.show || contributors.ingroup || contributors.stick) ? \'transitioned-down\' : \'transitioned-up\'\">\r\n   <button class=\"undecorated contributors-unstick\" ng-click=\"unstick()\" style=\"float:right\">X</button>\r\n   <div ng-repeat=\"contributor in contributors.orgs | activeContributors\" style=\"text-align:cnter\">\r\n      <a ng-href=\"{{contributor.href}}\" name=\"contributors{{$index}}\" title=\"{{contributor.title}}\" target=\"_blank\">\r\n         <img ng-src=\"{{contributor.image}}\" alt=\"{{contributor.title}}\" class=\"elvis-logo\" ng-class=\"contributor.class\"></img>\r\n      </a>\r\n   </div>\r\n</span>");
$templateCache.put("imagery/contributors/show.html","<a ng-mouseenter=\"over()\" ng-mouseleave=\"out()\" class=\"contributors-link\" title=\"Click to lock/unlock contributors list.\"\r\n      ng-click=\"toggleStick()\" href=\"#contributors0\">Contributors</a>");
$templateCache.put("imagery/panes/panes.html","<div class=\"mapContainer\" class=\"col-md-12\" style=\"padding-right:0\"  ng-attr-style=\"right:{{right.width}}\">\r\n   <span common-baselayer-control class=\"baselayer-slider\" max-zoom=\"16\" title=\"Satellite to Topography bias on base map.\"></span>\r\n   <div class=\"panesMapContainer\" geo-map configuration=\"data.map\">\r\n      <geo-extent></geo-extent>\r\n      <common-feature-info></common-feature-info>\r\n      <icsm-layerswitch></icsm-layerswitch>\r\n   </div>\r\n   <div class=\"base-layer-controller\">\r\n      <div geo-draw data=\"data.map.drawOptions\" line-event=\"elevation.plot.data\" rectangle-event=\"bounds.drawn\"></div>\r\n   </div>\r\n   <restrict-pan bounds=\"data.map.position.bounds\"></restrict-pan>\r\n</div>");
$templateCache.put("imagery/panes/tabs.html","<!-- tabs go here -->\r\n<div id=\"panesTabsContainer\" class=\"paneRotateTabs\" style=\"opacity:0.9\" ng-style=\"{\'right\' : contentLeft +\'px\'}\">\r\n\r\n   <div class=\"paneTabItem\" style=\"width:60px; opacity:0\">\r\n\r\n   </div>\r\n   <div class=\"paneTabItem\" ng-class=\"{\'bold\': view == \'download\'}\" ng-click=\"setView(\'download\')\">\r\n      <button class=\"undecorated\">Datasets Download</button>\r\n   </div>\r\n   <!--\r\n	<div class=\"paneTabItem\" ng-class=\"{\'bold\': view == \'search\'}\" ng-click=\"setView(\'search\')\">\r\n		<button class=\"undecorated\">Search</button>\r\n	</div>\r\n	<div class=\"paneTabItem\" ng-class=\"{\'bold\': view == \'maps\'}\" ng-click=\"setView(\'maps\')\">\r\n		<button class=\"undecorated\">Layers</button>\r\n	</div>\r\n   -->\r\n   <div class=\"paneTabItem\" ng-class=\"{\'bold\': view == \'downloader\'}\" ng-click=\"setView(\'downloader\')\">\r\n      <button class=\"undecorated\">Products Download</button>\r\n   </div>\r\n   <div class=\"paneTabItem\" ng-class=\"{\'bold\': view == \'glossary\'}\" ng-click=\"setView(\'glossary\')\">\r\n      <button class=\"undecorated\">Glossary</button>\r\n   </div>\r\n   <div class=\"paneTabItem\" ng-class=\"{\'bold\': view == \'help\'}\" ng-click=\"setView(\'help\')\">\r\n      <button class=\"undecorated\">Help</button>\r\n   </div>\r\n</div>");
$templateCache.put("imagery/side-panel/side-panel-left.html","<div class=\"cbp-spmenu cbp-spmenu-vertical cbp-spmenu-left\" style=\"width: {{left.width}}px;\" ng-class=\"{\'cbp-spmenu-open\': left.active}\">\r\n    <a href=\"\" title=\"Close panel\" ng-click=\"closeLeft()\" style=\"z-index: 1200\">\r\n        <span class=\"glyphicon glyphicon-chevron-left pull-right\"></span>\r\n    </a>\r\n    <div ng-show=\"left.active === \'legend\'\" class=\"left-side-menu-container\">\r\n        <legend url=\"\'img/AustralianTopogaphyLegend.png\'\" title=\"\'Map Legend\'\"></legend>\r\n    </div>\r\n</div>");
$templateCache.put("imagery/side-panel/side-panel-right.html","<div class=\"cbp-spmenu cbp-spmenu-vertical cbp-spmenu-right noPrint\" ng-attr-style=\"width:{{right.width}}\" ng-class=\"{\'cbp-spmenu-open\': right.active}\">\r\n    <a href=\"\" title=\"Close panel\" ng-click=\"closePanel()\" style=\"z-index: 1\">\r\n        <span class=\"glyphicon glyphicon-chevron-right pull-left\"></span>\r\n    </a>\r\n\r\n    <div class=\"right-side-menu-container\" ng-show=\"right.active === \'download\'\" imagery-view></div>\r\n    <div class=\"right-side-menu-container\" ng-show=\"right.active === \'glossary\'\" icsm-glossary></div>\r\n    <div class=\"right-side-menu-container\" ng-show=\"right.active === \'help\'\" icsm-help></div>\r\n    <panel-close-on-event only-on=\"search\" event-name=\"clear.button.fired\"></panel-close-on-event>\r\n</div>\r\n");
$templateCache.put("imagery/toolbar/toolbar.html","<div class=\"elevation-toolbar noPrint\">\r\n   <div class=\"toolBarContainer\">\r\n      <div>\r\n         <ul class=\"left-toolbar-items\">\r\n            <div class=\"btn-group searchBar\" ng-show=\"root.whichSearch != \'region\'\">\r\n               <div class=\"input-group input-group-custom\" geo-search >\r\n                  <input type=\"text\" ng-autocomplete ng-model=\"values.from.description\" options=\'{country:\"au\"}\' size=\"32\" title=\"Select a locality to pan the map to.\"\r\n                     class=\"form-control\" aria-label=\"...\">\r\n                  <div class=\"input-group-btn\">\r\n                     <button ng-click=\"zoom(false)\" exp-ga=\"[\'send\', \'event\', \'icsm\', \'click\', \'zoom to location\']\" class=\"btn btn-default\" title=\"Pan and potentially zoom to location.\">\r\n                        <i class=\"fa fa-search\"></i>\r\n                     </button>\r\n                  </div>\r\n               </div>\r\n            </div>\r\n         </ul>\r\n         <ul class=\"right-toolbar-items\">\r\n            <li>\r\n               <panel-trigger panel-id=\"download\" panel-width=\"590px\" name=\"Download\" default=\"default\" icon-class=\"fa-list\" title=\"Select an area of interest and select datasets for download\"></panel-trigger>\r\n            </li>\r\n            <li>\r\n               <panel-trigger panel-id=\"help\" panel-width=\"590px\" name=\"Help\" icon-class=\"fa-question-circle-o\" title=\"Show help\"></panel-trigger>\r\n            </li>\r\n            <li>\r\n               <panel-trigger panel-id=\"glossary\" panel-width=\"590px\" name=\"Glossary\" icon-class=\"fa-book\" title=\"Show glossary\"></panel-trigger>\r\n            </li>\r\n            <li reset-page></li>\r\n         </ul>\r\n      </div>\r\n   </div>\r\n</div>");
$templateCache.put("imagery/view/view.html","<div class=\"container-fluid downloadPane\">\r\n   <imagery-clip data=\"data.item\"></imagery-clip>\r\n   <div class=\"list-container\">\r\n      <imagery-list></imagery-list>\r\n   </div>\r\n   <div class=\"downloadCont\" icsm-search-continue></div>\r\n</div>");}]);