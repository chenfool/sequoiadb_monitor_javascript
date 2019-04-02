var CMD_SHELL = "";

function main( coordHosts )
{
  if( coordHosts == undefined )
  {
    var coordHosts = "localhost:11810";
  }
  if ( cm_service == undefined )
  {
    var cm_service = 11790;
  }

  var date = new Date();

  if ( doWhat == "doMain" ){
    try {
      var db = getConnect ( coordHosts );
    } catch ( e ) {
      return e;
    }
    var groupList = createGroupInfoList( db );
    if (groupList == "null") {
       println ( "Abnormal exit" );
       return -1;
    }
    calculate_rw_info( oldInfo, newInfo );

    var coordGroup = "";

    for (var i=0; i<groupList.length; i++) {
       var group = groupList[i];
       if (group.groupName == "SYSCoord") {
          coordGroup = group; 
          break;
       }
    }
 
    for ( var i=0; i<groupList.length; i++ ){
       var group = groupList[i];
       if(group.groupName == "SYSCoord"){
          continue;
       }
       group.check_group_lsn_status();
    }

    for ( var i=0; i<groupList.length; i++ ){
       var group = groupList[i];
       if (group.groupName == "SYSCoord") {
          continue;
       }
       var group = groupList[i];
       group.check_cs_size();
    }

    for ( var i=0; i<groupList.length; i++ ){
       var group = groupList[i];
       if( group.groupName == "SYSCatalogGroup" || group.groupName == "SYSCoord"){
          continue;
       }
       group.check_node_session(coordGroup);
    }

    check_group_status( groupList );
    check_node_status( groupList );

    db.close();

    pClass.print(1);
  }
  else if ( doWhat == "get_read_write_info" ){
     try {
        var db = getConnect ( coordHosts );
     } catch ( e ) {
        return e;
     }
    get_read_write_info( db );

    db.close();

    pClass.print(-1);
  }
  else if ( doWhat == "test_connect_to_sdb" ) {
     test_connect_to_sdb (coordHosts);
     pClass.print(-1);
  }
  else if ( doWhat == "getReplicaGroup" ) {
     getReplicaGroup (coordHosts);
     pClass.print(-1);
  }
  else if ( doWhat == "getRemoteTimeStamp" ) {
     getRemoteTimeStamp ();
     pClass.print(-1);
  }
}

var pClass = new printClass();
if( coordHosts == undefined )
{
  var coordHosts="localhost:11810";
}
if ( sdbuser == undefined )
{
  var sdbuser = "";
}
if ( sdbpassword == undefined )
{
  var sdbpassword = "";
}
if ( hosts_str == undefined )
{
  var hosts_str = "localhost";
}

if( oldInfo == undefined ){
  var oldInfo = -1;
}
if( newInfo == undefined ){
  var newInfo = -1;
}
if( doWhat == undefined ){
  var doWhat = -1;
}
if ( sdbcmlogInfo == undefined ){
  var sdbcmlogInfo = "";
}
if ( machineTimeStamp == undefined ){
  var machineTimeStamp = "" ;
}

main ( coordHosts );
