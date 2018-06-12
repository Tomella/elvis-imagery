{
   angular.module("common.proxy", [])

   .provider("proxy", function() {

      this.$get = ['$http', '$q', function ($http, $q) {
         var base = "proxy/";

         this.setProxyBase = function(newBase) {
            base = newBase;
         };

         return {
      	   get : function(url, options) {
		   	   return this._method("get", url, options);
		      },

		      post : function(url, options) {
			      return this._method("post", url, options);
		      },

		      put : function(url, options) {
			      return this._method("put", url, options);
		      },

		      _method : function(method, url, options) {
			      return $http[method](base + url, options).then(function(response) {
					   return response.data;
               });
		      }
         };
      }];
   });
}
