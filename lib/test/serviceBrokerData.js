module.exports = {
   parameters: {
     xmin: 152.66602,
     xmax: 153.89648,
     ymin: -28.61346,
     ymax: -28.07198,
     email: 'tomella1@gmail.com',
     outCoordSys: 'LL-GDA94',
     outFormat: 'GEOTIFF'
   },

   available_data: [
     {
       source: 'NSW Government',
       downloadables: {
         DEMs: {
           '1 Metre': [
             {
               file_url: 'https://s3-ap-southeast-2.amazonaws.com/nsw.elvis/z56/Ballina201008-LID1-AHD_5486834_56_0002_0002_1m.zip',
               file_name: 'Ballina201008-LID1-AHD_5486834_56_0002_0002_1m.zip',
               file_size: '7453519',
               bbox: '153.49102574362266,-28.620139165652812,153.51139704765714,-28.60201125829951'
             },
             {
               file_url: 'https://s3-ap-southeast-2.amazonaws.com/nsw.elvis/z56/Ballina201008-LID1-AHD_5486836_56_0002_0002_1m.zip',
               file_name: 'Ballina201008-LID1-AHD_5486836_56_0002_0002_1m.zip',
               file_size: '7212156',
               bbox: '153.49094179597245,-28.60208685284018,153.51130968304668,-28.583958953566952'
             }
           ]
         }
       }
     },
     {
       source: 'Geoscience Australia',
       downloadables: {
         DEMs: {
           '1 Second': [
             {
               file_url: 'https://s3-ap-southeast-2.amazonaws.com/elvis.ga.gov.au/elevation/1sec-srtm/aac46307-fce8-449d-e044-00144fdd4fa6.zip',
               file_name: 'SRTM-derived 1 Second Digital Elevation Model Version 1.0',
               product: true,
               metadata_id: 'aac46307-fce8-449d-e044-00144fdd4fa6',
               bbox: '152.66602,-28.61346,153.89648,-28.07198'
             }
           ]
         }
       }
     }
   ]
 }