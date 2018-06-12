var url = require('url');
var validHosts = [
   {
       host: "localhost",
       ports: [80]
   },
   {
       host: ".ga.gov.au"
   },
   {
       host: ".motogp.com"
   },
   {
       host: "elvis-ga.fmecloud.com"
   },
   {
       host: "elvis-ga.fmecloud.com"
   },
   {
       host: "s3-ap-southeast-2.amazonaws.com"
   }
];


console.log(getRemoteUrlFromParam("http://localhost/frws"));

function getRemoteUrlFromParam(req) {
   var remoteUrl = req.params[0];
   if (remoteUrl) {
      // add http:// to the URL if no protocol is present
      if (!/^https?:\/\//.test(remoteUrl)) {
         remoteUrl = 'http://' + remoteUrl;
      }
      remoteUrl = url.parse(remoteUrl);
      // copy query string
      remoteUrl.search = url.parse(req.url).search;
   } else {
      return remoteUrl;
   }
}