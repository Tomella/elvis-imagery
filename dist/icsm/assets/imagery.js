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

   angular.module("ImageryApp", ['common.altthemes', 'common.header', 'common.navigation', 'common.panes', 'common.storage', 'common.templates', 'common.toolbar', 'explorer.config', 'explorer.confirm', 'explorer.drag', 'explorer.enter', 'explorer.flasher', 'explorer.googleanalytics', 'explorer.httpdata', 'explorer.info', 'explorer.message', 'explorer.modal', 'explorer.tabs', 'explorer.version', 'explorer.map.templates', 'exp.ui.templates', 'geo.draw', 'geo.elevation', 'geo.geosearch', 'geo.map', 'geo.maphelper', 'geo.measure', 'icsm.side-panel', 'imagery.download', 'imagery.panes', 'imagery.templates', 'imagery.toolbar', 'ui.bootstrap', 'ui.bootstrap-slider', 'ngAutocomplete', 'ngRoute', 'ngSanitize', 'page.footer'])

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
angular.module("imagery.templates", []).run(["$templateCache", function($templateCache) {$templateCache.put("imagery/panes/panes.html","<div class=\"mapContainer\" class=\"col-md-12\" style=\"padding-right:0\"  ng-attr-style=\"right:{{right.width}}\">\r\n   <span common-baselayer-control class=\"baselayer-slider\" max-zoom=\"16\" title=\"Satellite to Topography bias on base map.\"></span>\r\n   <div class=\"panesMapContainer\" geo-map configuration=\"data.map\">\r\n      <geo-extent></geo-extent>\r\n      <common-feature-info></common-feature-info>\r\n      <icsm-layerswitch></icsm-layerswitch>\r\n   </div>\r\n   <div class=\"base-layer-controller\">\r\n      <div geo-draw data=\"data.map.drawOptions\" line-event=\"elevation.plot.data\" rectangle-event=\"bounds.drawn\"></div>\r\n   </div>\r\n   <restrict-pan bounds=\"data.map.position.bounds\"></restrict-pan>\r\n</div>");
$templateCache.put("imagery/panes/tabs.html","<!-- tabs go here -->\r\n<div id=\"panesTabsContainer\" class=\"paneRotateTabs\" style=\"opacity:0.9\" ng-style=\"{\'right\' : contentLeft +\'px\'}\">\r\n\r\n   <div class=\"paneTabItem\" style=\"width:60px; opacity:0\">\r\n\r\n   </div>\r\n   <div class=\"paneTabItem\" ng-class=\"{\'bold\': view == \'download\'}\" ng-click=\"setView(\'download\')\">\r\n      <button class=\"undecorated\">Datasets Download</button>\r\n   </div>\r\n   <!--\r\n	<div class=\"paneTabItem\" ng-class=\"{\'bold\': view == \'search\'}\" ng-click=\"setView(\'search\')\">\r\n		<button class=\"undecorated\">Search</button>\r\n	</div>\r\n	<div class=\"paneTabItem\" ng-class=\"{\'bold\': view == \'maps\'}\" ng-click=\"setView(\'maps\')\">\r\n		<button class=\"undecorated\">Layers</button>\r\n	</div>\r\n   -->\r\n   <div class=\"paneTabItem\" ng-class=\"{\'bold\': view == \'downloader\'}\" ng-click=\"setView(\'downloader\')\">\r\n      <button class=\"undecorated\">Products Download</button>\r\n   </div>\r\n   <div class=\"paneTabItem\" ng-class=\"{\'bold\': view == \'glossary\'}\" ng-click=\"setView(\'glossary\')\">\r\n      <button class=\"undecorated\">Glossary</button>\r\n   </div>\r\n   <div class=\"paneTabItem\" ng-class=\"{\'bold\': view == \'help\'}\" ng-click=\"setView(\'help\')\">\r\n      <button class=\"undecorated\">Help</button>\r\n   </div>\r\n</div>");
$templateCache.put("imagery/side-panel/side-panel-left.html","<div class=\"cbp-spmenu cbp-spmenu-vertical cbp-spmenu-left\" style=\"width: {{left.width}}px;\" ng-class=\"{\'cbp-spmenu-open\': left.active}\">\r\n    <a href=\"\" title=\"Close panel\" ng-click=\"closeLeft()\" style=\"z-index: 1200\">\r\n        <span class=\"glyphicon glyphicon-chevron-left pull-right\"></span>\r\n    </a>\r\n    <div ng-show=\"left.active === \'legend\'\" class=\"left-side-menu-container\">\r\n        <legend url=\"\'img/AustralianTopogaphyLegend.png\'\" title=\"\'Map Legend\'\"></legend>\r\n    </div>\r\n</div>");
$templateCache.put("imagery/side-panel/side-panel-right.html","<div class=\"cbp-spmenu cbp-spmenu-vertical cbp-spmenu-right noPrint\" ng-attr-style=\"width:{{right.width}}\" ng-class=\"{\'cbp-spmenu-open\': right.active}\">\r\n    <a href=\"\" title=\"Close panel\" ng-click=\"closePanel()\" style=\"z-index: 1\">\r\n        <span class=\"glyphicon glyphicon-chevron-right pull-left\"></span>\r\n    </a>\r\n\r\n    <div class=\"right-side-menu-container\" ng-show=\"right.active === \'download\'\" icsm-view></div>\r\n    <div class=\"right-side-menu-container\" ng-show=\"right.active === \'maps\'\" icsm-maps></div>\r\n    <div class=\"right-side-menu-container\" ng-show=\"right.active === \'glossary\'\" icsm-glossary></div>\r\n    <div class=\"right-side-menu-container\" ng-show=\"right.active === \'help\'\" icsm-help></div>\r\n    <panel-close-on-event only-on=\"search\" event-name=\"clear.button.fired\"></panel-close-on-event>\r\n</div>\r\n");
$templateCache.put("imagery/toolbar/toolbar.html","<div class=\"elevation-toolbar noPrint\">\r\n   <div class=\"toolBarContainer\">\r\n      <div>\r\n         <ul class=\"left-toolbar-items\">\r\n            <div class=\"btn-group searchBar\" ng-show=\"root.whichSearch != \'region\'\">\r\n               <div class=\"input-group input-group-custom\" geo-search >\r\n                  <input type=\"text\" ng-autocomplete ng-model=\"values.from.description\" options=\'{country:\"au\"}\' size=\"32\" title=\"Select a locality to pan the map to.\"\r\n                     class=\"form-control\" aria-label=\"...\">\r\n                  <div class=\"input-group-btn\">\r\n                     <button ng-click=\"zoom(false)\" exp-ga=\"[\'send\', \'event\', \'icsm\', \'click\', \'zoom to location\']\" class=\"btn btn-default\" title=\"Pan and potentially zoom to location.\">\r\n                        <i class=\"fa fa-search\"></i>\r\n                     </button>\r\n                  </div>\r\n               </div>\r\n            </div>\r\n         </ul>\r\n         <ul class=\"right-toolbar-items\">\r\n            <li>\r\n               <panel-trigger panel-id=\"download\" panel-width=\"590px\" name=\"Download\" default=\"default\" icon-class=\"fa-list\" title=\"Select an area of interest and select datasets for download\"></panel-trigger>\r\n            </li>\r\n            <li>\r\n               <panel-trigger panel-id=\"help\" panel-width=\"590px\" name=\"Help\" icon-class=\"fa-question-circle-o\" title=\"Show help\"></panel-trigger>\r\n            </li>\r\n            <li>\r\n               <panel-trigger panel-id=\"glossary\" panel-width=\"590px\" name=\"Glossary\" icon-class=\"fa-book\" title=\"Show glossary\"></panel-trigger>\r\n            </li>\r\n            <li reset-page></li>\r\n         </ul>\r\n      </div>\r\n   </div>\r\n</div>");}]);