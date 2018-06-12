(function(angular) {
'use strict';

angular.module("common.storage", ['explorer.projects'])

.factory("storageService", ['$log', '$q', 'projectsService', function($log, $q, projectsService) {
	return {
		setGlobalItem : function(key, value) {
			this._setItem("_system", key, value);
		},

		setItem : function(key, value) {
			projectsService.getCurrentProject().then(function(project) {
				this._setItem(project, key, value);
			}.bind(this));
		},

		_setItem : function(project, key, value) {
			$log.debug("Fetching state for key locally" + key);
			localStorage.setItem("mars.anon." + project + "." + key, JSON.stringify(value));
		},

		getGlobalItem : function(key) {
			return this._getItem("_system", key);
		},

		getItem : function(key) {
			var deferred = $q.defer();
			projectsService.getCurrentProject().then(function(project) {
				this._getItem(project, key).then(function(response) {
					deferred.resolve(response);
				});
			}.bind(this));
			return deferred.promise;
		},

		_getItem : function(project, key) {
			$log.debug("Fetching state locally for key " + key);
			var item = localStorage.getItem("mars.anon." + project + "." + key);
			if(item) {
				try {
					item = JSON.parse(item);
				} catch(e) {
					// Do nothing as it will be a string
				}
			}
			return $q.when(item);
		}
	};
}]);

})(angular);
