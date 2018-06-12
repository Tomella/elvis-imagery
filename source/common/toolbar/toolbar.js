
(function(angular) {

'use strict';

angular.module("common.toolbar", [])

.directive("icsmToolbar", [function() {
	return {
		controller: 'toolbarLinksCtrl'
	};
}])


/**
 * Override the default mars tool bar row so that a different implementation of the toolbar can be used.
 */
.directive('icsmToolbarRow', [function() {
	var DEFAULT_TITLE  = "Satellite to Topography bias on base map.";

	return {
		scope:{
			map:"=",
			overlaytitle: "=?"
		},
		restrict:'AE',
		templateUrl:'common/toolbar/toolbar.html',
		link: function(scope) {
			scope.overlaytitle = scope.overlaytitle? scope.overlaytitle: DEFAULT_TITLE;
		}
	};
}])

.controller("toolbarLinksCtrl", ["$scope", "configService", function($scope, configService) {

	var self = this;
	configService.getConfig().then(function(config) {
		self.links = config.toolbarLinks;
	});

	$scope.item = "";
	$scope.toggleItem = function(item) {
		$scope.item = ($scope.item == item) ? "" : item;
	};

}]);

})(angular);
