{
   angular.module("imagery.view", [])

         .directive("imageryView", ['downloadService', function (downloadService) {
            return {
               templateUrl: "imagery/view/view.html",
               controller: "DownloadCtrl",
               link: function (scope, element) {
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
         }])

      .controller("DownloadCtrl", DownloadCtrl)
      .factory("downloadService", DownloadService);

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

         data = null,

         service = {
            getLayerGroup: function () {
               return mapService.getGroup(downloadLayerGroup);
            },

            setState: function (data) {
               if (data) {
                  prepare();
               } else {
                  restore();
               }

               function prepare() {

                  var bounds = [
                     [data.bounds.yMin, data.bounds.xMin],
                     [data.bounds.yMax, data.bounds.xMax]
                  ];

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

            decorate: function () {
               var item = data.item;
               data.item.download = true;
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

            setEmail: function (email) {
               storageService.setItem(key, email);
            },

            getEmail: function () {
               return storageService.getItem(key).then(function (value) {
                  data.email = value;
                  return value;
               });
            },

            data: function () {
               if (data) {
                  return $q.when(data);
               }

               return $http.get('icsm/resources/config/icsm.json').then(function (response) {
                  data = response.data;
                  service.decorate();
                  return data;
               });
            }
         };

      return service;
   }

}