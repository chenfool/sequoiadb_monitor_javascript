var CMD_SHELL = "";

/*
 * create group info list
 * return Array groupList
 */
function createGroupInfoList( db )
{
  var groupList = new Array();

  // coord group
  var cursor = db.list(SDB_LIST_GROUPS, {GroupName:"SYSCoord"});
  while( cursor.next() ){
    var bson = cursor.current().toObj();
    //if ("SYSCoord" == bson["GroupName"])
    //   continue ;
    var groupInfo = new GroupInfo();
    groupInfo.groupName = bson["GroupName"];

    for( var i=0; i<bson["Group"].length; i++ ){
      var nodeInfo = new NodeInfo( bson["Group"][i]["HostName"],
                                   bson["Group"][i]["Service"][0]["Name"], sdbuser, sdbpassword );
      groupInfo.addNode( nodeInfo );
    }
    groupList.push( groupInfo );
  }

  // catalog group and data group
  var cursor = db.list(SDB_LIST_GROUPS, {GroupName:{$ne:"SYSCoord"}});
  while( cursor.next() ){
    var bson = cursor.current().toObj();
    //if ("SYSCoord" == bson["GroupName"])
    //   continue ;
    var groupInfo = new GroupInfo();
    groupInfo.groupName = bson["GroupName"];

    for( var i=0; i<bson["Group"].length; i++ ){
      var nodeInfo = new NodeInfo( bson["Group"][i]["HostName"],
                                   bson["Group"][i]["Service"][0]["Name"], sdbuser, sdbpassword );
      groupInfo.addNode( nodeInfo );
    }
    groupList.push( groupInfo );
  }
  
  return groupList;
}

/*
 * through coord get the DataInsert/DataRead/IndexInsert/IndexRead
 * then println 
 * 
 */
function get_read_write_info( db ){
  var cursor = db.snapshot(6);
  while( cursor.next() ){
    var info = cursor.current().toObj();
    var dataRead = info["TotalRead"];
    var dataInsertAll = info["TotalInsert"];
    var dataInsertRepl = info["ReplInsert"];
    var dataInsert = dataInsertAll - dataInsertRepl;
    var IndexRead = info["TotalIndexRead"];
    pClass.add( "coord@dataRead=" + dataRead );
    pClass.add( "coord@dataWrite=" + dataInsert );
    pClass.add( "coord@indexRead=" + IndexRead );
    break;
  }  

  var date = new Date();
  pClass.add( "Time=" + date.getTime() );

}

function getConnect ( coordHosts ) {
  var hostArr = coordHosts.split(",");

  for (var i=0; i<hostArr.length; ++i) {
     var host_str = hostArr[i];
     var host_str_arr = host_str.split(":");
     var coordHost = host_str_arr[0];
     var coordService = host_str_arr[1];
     try {
        var db = new Sdb( coordHost, coordService, sdbuser, sdbpassword );
        break;
     } catch (e) {}
  }
  return db;
}

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

    pClass.print(0);
  }
  else if ( doWhat == "get_read_write_info" ){
     try {
        var db = getConnect ( coordHosts );
     } catch ( e ) {
        return e;
     }
    get_read_write_info( db );

    db.close();

    pClass.print(1);
  }
  else if ( doWhat == "test_connect_to_sdb" ) {
     test_connect_to_sdb (coordHosts);
     pClass.print(1);
  }
  else if ( doWhat == "getReplicaGroup" ) {
     getReplicaGroup (coordHosts);
     pClass.print(1);
  }
  else if ( doWhat == "getRemoteTimeStamp" ) {
     getRemoteTimeStamp ();
     pClass.print(1);
  }
}

// flag = 0 or undefined, return demo = 12:01:01
// flag = 1, return demo = 20190212.120101
function getTime(flag)
{
   var nowDate = new Date();
   var hour = nowDate.getHours();
   var minute = nowDate.getMinutes();
   var second = nowDate.getSeconds();

   if( hour < 10 ){
      hour = "0" + hour;
   }
   if ( minute < 10 ){
      minute = "0" + minute;
   }
   if ( second < 10 ){
      second = "0" + second;
   }
   var re_str = "";
   if (flag == undefined || flag == 0) 
      re_str = hour + ":" + minute + ":" + second
   else if (flag == 1) {
      var year = nowDate.getFullYear();
      var month = nowDate.getMonth();
      var day = nowDate.getDate();

      month = month + 1;
      if (month < 10) {
         month = "0" + month;
      }
      if (day < 10) {
         day = "0" + day;
      }
      re_str = year + month + day + "." + hour + minute + second
   }
   return re_str;
}

function calculate_rw_info( oldInfo, newInfo )
{
  var oldClass = new SplitInfo( oldInfo );
  var newClass = new SplitInfo( newInfo );
  
  var betweenTime = Math.round( ( newClass.time - oldClass.time )/1000 );

  //println("betweenTime=" + betweenTime); 
 
  if( oldClass.node_rw_info_list.length == newClass.node_rw_info_list.length ){
     for( var i=0; i<oldClass.node_rw_info_list.length; i++ ){
       var dataread_diff = (newClass.node_rw_info_list[i].dataRead - oldClass.node_rw_info_list[i].dataRead)/betweenTime;
       var datawrite_diff = (newClass.node_rw_info_list[i].dataWrite - oldClass.node_rw_info_list[i].dataWrite)/betweenTime;
       var indexread_diff = (newClass.node_rw_info_list[i].indexRead - oldClass.node_rw_info_list[i].indexRead)/betweenTime;
       dataread_diff = Math.ceil( dataread_diff );
       datawrite_diff = Math.ceil( datawrite_diff );
       indexread_diff = Math.ceil( indexread_diff );
      
       //dataread 
       pClass.add( newClass.node_rw_info_list[i].nodeType + "|"
                      + "DATAREAD" + "|" 
                      + "null" + "|" 
                      + dataread_diff + "|"
                      + getTime() + "|"
                      + "null" + "|"
                      + "0" + "|" 
                      + "null" );
       //datawrite
       pClass.add( newClass.node_rw_info_list[i].nodeType + "|"
                      + "DATAWRITE" + "|"
                      + "null" + "|"
                      + datawrite_diff + "|"
                      + getTime() + "|"
                      + "null" + "|"
                      + "0" + "|"
                      + "null" );
       //indexread
       pClass.add( newClass.node_rw_info_list[i].nodeType + "|"
                      + "INDEXREAD" + "|"
                      + "null" + "|"
                      + indexread_diff + "|"
                      + getTime() + "|"
                      + "null" + "|"
                      + "0" + "|"
                      + "null" );

     }
  } 
}

function check_group_status( groupList )
{
   for( var i=0; i<groupList.length; i++ ){
      var group = groupList[i];
      var groupName = group.groupName;
      var nodeList = group.nodeList;
      var description = "";
      var normalNodeNum = 0;
      var group_alarmLevel = 0;
      for (var j=0; j<nodeList.length; j++){
         var node = nodeList[j];
         if (node.status != "Fault") { normalNodeNum++; }
      }
      
      if (normalNodeNum == nodeList.length) {
         group_alarmLevel = 0;
         description = "GroupIsNormal";
      }
      else if (groupName == "SYSCoord") { // CoordGroup
            group_alarmLevel = 1;
            description = "GroupAtRisk";
      }
      else { // DataGroup or CatalogGroup
         if (normalNodeNum >= (Math.floor(nodeList.length / 2)+1)) {
            group_alarmLevel = 1;
            description = "GroupAtRisk";
         }
         else {
            group_alarmLevel = 2;
            description = "GroupCouldNotWork";
         }
      }
      pClass.add( ""
                   + groupName + "|"
                   + "GROUPSTATUS" + "|"
                   + "null" + "|"
                   + "null" + "|"
                   + getTime() + "|"
                   + "null" + "|"
                   + group_alarmLevel + "|"
                   + description );
   }
}

function check_node_status( groupList )
{
   for( var i=0; i<groupList.length; i++ ){
      var group = groupList[i];
      var nodeList = group.nodeList;
      var description = "";
      var groupName = group.groupName;
      for( var j=0; j<nodeList.length; j++ ){
         var node = nodeList[j];
         node.alarmLevel = 0;

         switch (node.status)
         {
            case "Normal" : {
               node.alarmLevel = 0;
               description = "nodeIsNormal";
               break;
            }
            case "Fault" : {
               node.alarmLevel = 2;
               description = "nodeIsNotRunning";
               break;
            }
            case "Rebuilding" : {
               description = "nodeIsRebuilding";
               node.alarmLevel = 1;
               
               break;
            }
            case "FullSync" : {
               description = "nodeIsFullSync";
               node.alarmLevel = 1;
               
               break;
            }
            case "OfflineBackup" : {
               description = "nodeIsOfflineBackup";
               node.alarmLevel = 1;
               break;
            }
            default : {
               description = "nodeIsInUnknowStatus";
               node.alarmLevel = 1;
            }
         }

         pClass.add( ""
                      + node.hostname + ":" + node.port + "|"
                      + "NODESTATUS" + "|"
                      + "null" + "|"
                      + "null" + "|"
                      + getTime() + "|"
                      + "Group:" + groupName + "|"
                      + node.alarmLevel + "|"
                      + description );


//         if( node.status != "Normal" ){
//            if( node.status == "Fault" ){
//               node.alarmLevel = 2;
//               description = "nodeIsNotRunning";
//            }else if( node.status == "Full_Sync" ){
//               node.alarmLevel = 1;
//               description = "nodeIsInFullSync";
//            }
//            if( node.alarmLevel != 0 ){
//               pClass.add( ""
//                            + node.hostname + ":" + node.port + "|"
//                            + "NODESTATUS" + "|"
//                            + "null" + "|"
//                            + "null" + "|"
//                            + getTime() + "|"
//                            + "null" + "|"
//                            + node.alarmLevel + "|"
//                            + description );
//            
//            }
//         }
      }
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

function getRemoteTimeStamp () {
   var outputInfo = "";
   hosts_str = hosts_str.replace (/\n/g, "");

   var hosts_arr = hosts_str.split(",");

   for (var i=0; i<hosts_arr.length; i++) {
      var host = hosts_arr[i];
      try {
         var remote = new Remote (host, cm_service);

         var cmd = remote.getCmd();

         var time = cmd.run ("date +%s", "", 0, 1);
        
         if (i==0) {
            outputInfo = outputInfo + host + "@" + time;
         }
         else {
            outputInfo = outputInfo + "*" + host + "@" + time;
         }

         remote.close();
      } catch (e) {
         if( e == SDB_NETWORK || e == SDB_NET_CANNOT_CONNECT ){
            if (i==0) {
               outputInfo = outputInfo + host + "@" + "-1";
            }
            else {
               outputInfo = outputInfo + "*" + host + "@" + "-1";
            }
         }
         else {
         //println ("new Remote exception, error = " + e);
         }
      } 
   }
   outputInfo = outputInfo.replace (/ /g, "");
   outputInfo = outputInfo.replace (/\r/g, "");
   outputInfo = outputInfo.replace (/\n/g, "");
   pClass.add (outputInfo);
}

function getReplicaGroup (coordHosts) {
   var hostSet = {};
   var outputInfo = "";
   var db = getConnect (coordHosts);
   var cursor = db.listReplicaGroups();

   while (cursor.next()) {
      var obj = cursor.current().toObj();
      var group_arr = obj["Group"];
      for (var num in group_arr) {
         var o = group_arr[num];
         var hostname = o["HostName"];
         hostSet[hostname] = "";
      }
   }
   cursor.close();
   db.close();

   for (o in hostSet) {
      outputInfo = outputInfo + o + ",";
      //println (o);
   }

   var lastnum = outputInfo.lastIndexOf(",");
   outputInfo = outputInfo.substring(0,lastnum);
//   for (var i=0; i<hostSet.length; ++i) {
//      if ((i+1)<hostSet.length) {
//         print (hostSet[i] + ",");
//      }
//      else {
//         print (hostSet[i]);
//      }
//   }
   pClass.add (outputInfo);
}

function test_connect_to_sdb ( coordHosts )
{
  var hostArr = coordHosts.split(",");

  var errorMap = {};
  for (var i=0; i<hostArr.length; ++i) {
     var host_str = hostArr[i];
     var host_str_arr = host_str.split(":");
     var coordHost = host_str_arr[0];
     var coordService = host_str_arr[1];
     try {
        var db = new Sdb( coordHost, coordService, sdbuser, sdbpassword );
        db.close();
        return 0;
     } catch (e) {
        errorMap[host_str] = e;
     }
  }

  //for (var i=0; i<errorArr.length; ++i) {
  for (o in errorMap) {
     //var errInfo = errorArr[i];
     //var errInfo_arr = errInfo.split("@");
     var host_str = o;
     var e = errorMap[o];
     pClass.add ("coordHost = " + host_str + ", username = '" + sdbuser + "', password = '" + sdbpassword + "'");
     if( e == SDB_NETWORK || e == SDB_NET_CANNOT_CONNECT ){
        println ("can not connect to SequoiaDB coord node, error = " + e);
     }
     else if ( e == SDB_AUTH_AUTHORITY_FORBIDDEN ) {
        pClass.add ("username or passwd is wrong");
     }
     else {
        pClass.add ("can not connect to SequoiaDB coord node, error = " + e);
     }
  }
  return -1;

}
main ( coordHosts );
