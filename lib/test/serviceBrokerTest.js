let ServiceBroker = require("../serviceBroker");
let testData = require("./serviceBrokerData");


let config = {
   nameValuePair: process.env.ELEVATION_SERVICE_KEY_VALUE,
   useElvis: true,
   elvisTemplate: "https://elvis-ga.fmecloud.com/fmejobsubmitter/fsdf_elvis_prod/DEMClipZipShip_Master_S3Source.fmw?geocat_number=${id}&out_grid_name=${filename}&input_coord_sys=LL-WGS84&ymin=${yMin}&ymax=${yMax}&xmin=${xMin}&xmax=${xMax}&output_format=${outFormat}&out_coord_sys=${outCoordSys}&email_address=${email}&opt_showresult=false&opt_servicemode=async&opt_responseformat=json",
   postProcessingUrl: "https://elvis-ga.fmecloud.com/fmejobsubmitter/fsdf_elvis_prod/ZipDownloadablesPOST.fmw?opt_showresult=false&opt_servicemode=async&opt_responseformat=json"
};

let serviceBroker = new ServiceBroker(config);

serviceBroker.execute(testData);
