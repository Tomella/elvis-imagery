
(function (angular) {

	'use strict';

	angular.module('common.header', [])

		.controller('headerController', ['$scope', '$q', '$timeout', function ($scope, $q, $timeout) {

			var modifyConfigSource = function (headerConfig) {
				return headerConfig;
			};

			$scope.$on('headerUpdated', function (event, args) {
				$scope.headerConfig = modifyConfigSource(args);
			});
		}])

		.directive('icsmHeader', [function () {
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
				link: function (scope, element, attrs) {
					var data = angular.copy(defaults);
					angular.forEach(defaults, function (value, key) {
						if (!(key in scope)) {
							scope[key] = value;
						}
					});
				}
			};
		}])

		.factory('headerService', ['$http', function () {
		}]);

})(angular);
