function SplitInfo( tempInfo )
{
   this.node_rw_info_list = new Array();
   this.time = "";
   var tempList = "";
   var temp = "";

   var list = tempInfo.split("#");

   for( var i=1; i<list.length; i++ ){
     
     if( "Time" == list[i].split("=")[0] ){
        this.time = list[i].split("=")[1];
        continue;
     }
     
     if( temp == list[i].split("@")[0] ){
        tempList.push( list[i] );
     }else{
        if( tempList != "" ){
          var node_rw = new NODE_rw_info( tempList );
          
          this.node_rw_info_list.push( node_rw );
        } 
        var tempList = new Array();
        temp = list[i].split("@")[0];
        tempList.push( list[i] );
     }


   }
   if( tempList != "" ){
      var node_rw = new NODE_rw_info( tempList );
          //println(node_rw.dataWrite);
      this.node_rw_info_list.push( node_rw );
   }
    
}
