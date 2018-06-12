var config = {
   sa: {
      xmlTemplate: "http://elevation.fsdf.org.au/data/gazetteer/sa/${id}.xml"
   },

   fmeToken: {
      generate: {
         tokenUrl: "http://elevation.fsdf.org.au/token", // Only used where there is no token username and password
         url: "https://gda2020test-ga.fmecloud.com/fmetoken/service/generate.json",
         username: process.env.ESRI_USERNAME,
         password: process.env.ESRI_PASSWORD
      }
   },

   validHosts: [
      "localhost",
      "qldspatial.information.qld.gov.au",
      ".ga.gov.au",
      ".motogp.com",
      "elvis-ga.fmecloud.com",
      "gda2020test-ga.fmecloud.com",
      "s3-ap-southeast-2.amazonaws.com"
   ],

   elevation: {
      nameValuePair: process.env.ELEVATION_SERVICE_KEY_VALUE,
      recaptchaPrivateKey: process.env.ELEVATION_RECAPTCHA_PRIVATE_KEY,
      useElvis: true,
      elvisTemplate: "https://elvis-ga.fmecloud.com/fmejobsubmitter/fsdf_elvis_prod/DEMClipZipShip_Master_S3Source.fmw?geocat_number=${id}&out_grid_name=${filename}&ymin=${yMin}&ymax=${yMax}&xmin=${xMin}&xmax=${xMax}&output_format=${outFormat}&out_coord_sys=${outCoordSys}&email_address=${email}&opt_showresult=false&opt_servicemode=async&opt_responseformat=json",
      postProcessingUrl: "https://elvis-ga.fmecloud.com/fmejobsubmitter/fsdf_elvis_prod/ZipDownloadablesPOST.fmw?opt_showresult=false&opt_servicemode=async&opt_responseformat=json"
   }
};

module.exports = config;
