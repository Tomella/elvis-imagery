{

angular.module("common.clip", ['geo.draw'])

.directive("wizardClip", ['$timeout', 'clipService', 'flashService', function($timeout, clipService, flashService) {
	return {
		templateUrl : "common/clip/clip.html",
		scope : {
			clip : "=",
			bounds : "=",
			trigger : "=",
			drawn : "&"
		},
		link : function(scope, element) {
			if(typeof scope.showBounds === "undefined") {
				scope.showBounds = false;
			}
			scope.$watch("bounds", function(bounds) {
				if(bounds && scope.trigger) {
					$timeout(function() {
						scope.initiateDraw();
					});
				} else if(!bounds) {
					clipService.cancelDraw();
				}
			});

			scope.initiateDraw = function() {
				clipService.initiateDraw().then(drawComplete);

				function drawComplete(data) {
					var c = scope.clip;
					var response;

					c.xMax = +data.clip.xMax;
					c.xMin = +data.clip.xMin;
					c.yMax = +data.clip.yMax;
					c.yMin = +data.clip.yMin;
					if(scope.drawn) {
						response = scope.drawn();
						if(response && response.code && response.code === "oversize") {
							scope.initiateDraw();
						}
					}
				}
			};
		}
	};
}])


.factory("clipService", ['$q', '$rootScope', 'drawService', function($q, $rootScope, drawService) {
	return {
		initiateDraw : function() {
			return drawService.drawRectangle().then(drawComplete);
		},

		cancelDraw : function() {
			drawService.cancelDrawRectangle();
		}
	};

	function drawComplete(data) {
		return {clip:{
			xMax: data.bounds.getEast().toFixed(5),
			xMin: data.bounds.getWest().toFixed(5),
			yMax: data.bounds.getNorth().toFixed(5),
			yMin: data.bounds.getSouth().toFixed(5)
		}};
	}
}]);

}
