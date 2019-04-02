function NODE_rw_info( inputInfoList )
{
   this.nodeType = "";
   this.dataRead = "";
   this.dataWrite = "";
   this.indexRead = "";
   //this.group = "";
   //this.port = "";
   //this.hostname = "";
   for( var i=0; i<inputInfoList.length; i++ ){
      var info = inputInfoList[i];
      var infoList = info.split("=");
      var typeList = infoList[0].split("@");
      switch( typeList[1] ){
        case "dataRead" :
           this.dataRead = infoList[1];
           break;
        case "dataWrite" :
           this.dataWrite = infoList[1];
           break;
        case "indexRead" :
           this.indexRead = infoList[1];
           break;
        default :
           break;
      }
      
      switch( typeList[0] ){
         case "coord" :
           this.nodeType = "coord";
           break;
         default :
           break;
      }
   }
}
