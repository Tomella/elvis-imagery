{
   angular.module("icsm.side-panel", [])

      .factory('panelSideFactory', ['$rootScope', '$timeout', ($rootScope, $timeout) => {
         let state = {
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
            let response = state.active;

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
            setLeft: function (value) {
               let result = setSide(state.left, value);
               if (result) {
                  state.left.width = 320; // We have a hard coded width at the moment we will probably refactor to parameterize it.
               }
               return result;
            },

            setRight: function (data) {
               state.right.width = data.width;
               let response = setSide(state.right, data.name);
               $rootScope.$broadcast('side.panel.change', {
                  side: "right",
                  data: state.right,
                  width: data.width
               });
               return response;
            }
         };
      }])

      .directive('sidePanelRightOppose', ["panelSideFactory", function (panelSideFactory) {
         return {
            restrict: 'E',
            transclude: true,
            template: '<div class="contentContainer" ng-attr-style="right:{{right.width}}" ng-transclude>' +
               '</div>',
            link: function (scope) {
               scope.right = panelSideFactory.state.right;
            }
         };
      }])

      .directive('sidePanelRight', ["panelSideFactory", function (panelSideFactory) {
         return {
            restrict: 'E',
            transclude: true,
            templateUrl: 'imagery/side-panel/side-panel-right.html',
            link: function (scope) {
               scope.right = panelSideFactory.state.right;

               scope.closePanel = function () {
                  panelSideFactory.setRight({ name: null, width: 0 });
               };
            }
         };
      }])

      .directive('panelTrigger', ["panelSideFactory", function (panelSideFactory) {
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
            link: function (scope) {
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
      }])

      .directive('panelOpenOnEvent', ["$rootScope", "panelSideFactory", function ($rootScope, panelSideFactory) {
         return {
            restrict: 'E',
            scope: {
               panelWidth: "@",
               eventName: "@",
               panelId: "@",
               side: "@?"
            },
            link: function (scope) {
               if (!scope.side) {
                  scope.side = "right";
               }
               $rootScope.$on(scope.eventName, (event, data) => {
                  let state = panelSideFactory.state[scope.side];
                  if (state && (!state.active || scope.panelId !== state.active)) {
                     let params = {
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
      }])


      .directive('panelCloseOnEvent', ["$rootScope", "panelSideFactory", function ($rootScope, panelSideFactory) {
         return {
            restrict: 'E',
            scope: {
               eventName: "@",
               side: "@?",
               onlyOn: "@?"
            },
            link: function (scope) {
               if (!scope.side) {
                  scope.side = "right";
               }
               $rootScope.$on(scope.eventName, (event, data) => {
                  let state = panelSideFactory.state[scope.side];
                  if(scope.onlyOn && state.active !== scope.onlyOn) {
                     return;
                  }

                  if (state && state.active) {
                     let params = {
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
      }])

      .directive('sidePanelLeft', ['panelSideFactory', function (panelSideFactory) {
         return {
            restrict: 'E',
            transclude: true,
            templateUrl: 'imagery/side-panel/side-panel-left.html',
            link: function (scope) {
               scope.left = panelSideFactory.state.left;

               scope.closeLeft = function () {
                  panelSideFactory.setLeft(null);
               };
            }
         };
      }]);

}