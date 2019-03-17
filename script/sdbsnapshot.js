//db.snapshot(2).size() is connect num 
//datadb.snapshot(2).size() is datanode connect num
//catadb.snapshot(2).size() is catalog connect num 
//db.snapshot(6) is sdb sys read/write/indexread/indexwrite status
//db.snapshot(3) is every datanode read/write/indexread/indexwrite status

function NodeInfo( hn, pt, user, pw )
{
   if( hn != undefined )
     this.hostname = hn;
   if( pt != undefined )
     this.port = pt;
   if ( user != undefined )
     this.user = user;
   if ( pw != undefined )
     this.pw = pw;

   //list:Fault/Full_Sync
   this.status = "Normal";
  
   //connect to this node's session
   //this.sessionNum = -1;

   this.currentLSN = -1;
   this.beginLSN = -1;
   // relativeLSN = currentLSN - beginLSN
   this.relativeltLSN = -1;

   //this node in which group
   this.group = "";

   // node role, master/slave
   this.role = "";
   
   // node type, data/catalog
   this.type = "";
  
   //disk save status
   this.diskLoadPercent = -1;

   this.currentTimestamp = -1;


   // this variables is come from node's configure
   // but now is not get it, next week can(2014-06-19)
   this.maxLsnSize = -1;
   
   // (masterLsn + masxLsnSize - this.currentLSN)%maxLsnSize 
   this.lsnGap = "";

   // alarm level, default=0,  0(normal), 1(alarm), 2(serious)
   this.alarmLevel = 0;
  
   // cs status, save have used how much cs's space, percent
   this.csStatusList = new Array();

   // save the session status in one list SESSION[]
   this.sessionList = new Array();

   // all session num
   this.sessionNum = "";

   // save the contexts status in one list CONTEXT[]
   this.contextList = new Array();

   // all context num
   this.contextNum = "";

   // master node cs maxcapSize
   this.csMaxcapSize = "" ;

   // master node cs useSize
   this.csUseSize = "" ;

   // use contextID, check contextList to get description info
   this.getContextDescription = function ( session, execName )
   {
      var description = "null";
      
      var collectionName = "";
      var matcher = "";
      var scanType = "";
      var updator = "";
      var deletor = "";
      var hint = "";


      switch (execName)
      {
         case "GETMORE" :
            // execName = find, context description's demo
            // "Description": "IsOpened:1,HitEnd:0,BufferSize:65536,TotalRecordNum:1,Collection:foo.bar,Matcher:{ \"$and\": [ { \"id\": { \"$et\": 1 } } ] },ScanType:TBSCAN",
         case "GETCOUNT" : {
            // execName = command, 'get count', context description's demo
            // "Description": "IsOpened:1,HitEnd:0,BufferSize:0,TotalRecordNum:1,Collection:foo.bar,Matcher:{ \"$and\": [ { \"id\": { \"$et\": 1 } } ] },ScanType:TBSCAN",
            // find and count
            var _desc = "";
            var find = false;
            
            var contexts = session.contexts;

            for (var i=0; i<this.contextList.length; ++i) {
               if (find) break;

               var context = this.contextList[i];
               _desc = context.description;
               for (var j=0; j<contexts.length; ++j)
               {
                  var contextID = contexts[j];
                  if (context.contextID == contextID) {
                     _desc = _desc.replace (/ /g, "");
                     var arr = _desc.split(",");
                     var matchBegin = false;
                     var matchOver = false;
                     for (var i=0; i<arr.length; ++i) {
                        var tmp = arr[i];
                        if (tmp.indexOf("Collection:") != -1) { // Collection
                           if (matchBegin && !matchOver)
                              matchOver = true;
                     
                           var tmp_arr = tmp.split(":");
                           collectionName = tmp_arr[1];
                        }
                        else if (tmp.indexOf("Matcher:") != -1) { // Matcher
                           var tmp_arr = tmp.split("Matcher:");
                           matcher = tmp_arr[1];
                           matchBegin = true;
                        }
                        else if (tmp.indexOf("ScanType:") != -1) { // ScanType
                           if (matchBegin && !matchOver)
                              matchOver = true;
                     
                           var tmp_arr = tmp.split(":");
                           scanType = tmp_arr[1];
                     
                        }
                        else if ((tmp.indexOf("IsOpened") != -1) ||
                                 (tmp.indexOf("HitEnd") != -1) ||
                                 (tmp.indexOf("BufferSize") != -1) ||
                                 (tmp.indexOf("TotalRecordNum") != -1)
                                ) {
                           if (matchBegin && !matchOver)
                              matchOver = true;
                        }
                        else if (matchBegin && !matchOver) {
                           matcher = matcher + "," + tmp;
                        }
                     }
                     find = true;
                     break;
                  }
               }
            }
            description = "ScanType:" + scanType + ",Collection:" + collectionName + ",Matcher:" + matcher;
            break;
         }
         case "UPDATE" : {
            // update session's lastOpInfo demo
            // "LastOpInfo": "Collection:foo.bar, Matcher:{ \"id\": 1 }, Updator:{ \"$set\": { \"info\": \"1111\" } }, Hint:{}, Flag:0x00000004(4)",
            var lastOpInfo = session.lastOpInfo;
            lastOpInfo = lastOpInfo.replace(/ /g, "");

            var arr = lastOpInfo.split(",");
            var matchBegin = false;
            var matchOver = false;
            var updateBegin = false;
            var updateOver = false;
            var hintBegin = false;
            var hintOver = false;
            for (var i=0; i<arr.length; ++i) {
               var tmp = arr[i];
               if (tmp.indexOf("Collection:") != -1) { // Collection
                  if (matchBegin && !matchOver)
                     matchOver = true;
                  if (updateBegin && !updateOver)
                     updateOver = true;
                  if (hintBegin && !hintOver)
                     hintOver = true;
            
                  var tmp_arr = tmp.split(":");
                  collectionName = tmp_arr[1];
               }
               else if (tmp.indexOf("Matcher:") != -1) { // Matcher
                  if (updateBegin && !updateOver)
                     updateOver = true;
                  if (hintBegin && !hintOver)
                     hintOver = true;

                  var tmp_arr = tmp.split("Matcher:");
                  matcher = tmp_arr[1];
                  matchBegin = true;
               }
               else if (tmp.indexOf("Updator:") != -1) { // Updator
                  if (matchBegin && !matchOver)
                     matchOver = true;
                  if (hintBegin && !hintOver)
                     hintOver = true;
            
                  var tmp_arr = tmp.split("Updator:");
                  updator = tmp_arr[1];
                  updateBegin = true;
            
               }
               else if (tmp.indexOf("Hint:") != -1) { // Hint
                  if (matchBegin && !matchOver)
                     matchOver = true;
                  if (updateBegin && !updateOver)
                     updateOver = true;
                  var tmp_arr = tmp.split("Hint:");
                  hint = tmp_arr[1];
                  hintBegin = true;
               }
               else if (tmp.indexOf("Flag") != -1) {
                  if (matchBegin && !matchOver)
                     matchOver = true;
                  if (updateBegin && !updateOver)
                     updateOver = true;
                  if (hintBegin && !hintOver)
                     hintOver = true;
               }
               else if (matchBegin && !matchOver)
                  matcher = matcher + "," + tmp;
               else if (updateBegin && !updateOver)
                  updator = updator + "," + tmp;
               else if (hintBegin && !hintOver)
                  hint = hint + "," + tmp;
            }
            description = "Collection:" + collectionName + ",Matcher:" + matcher + ",Updator:" + updator + ",Hint:" + hint;
            break;
         }
         case "DELETE" : {
            // delete session's lastOpInfo demo
            // "LastOpInfo": "Collection:foo.bar, Deletor:{ \"id\": 100 }, Hint:{}, Flag:0x00000004(4)",
            var lastOpInfo = session.lastOpInfo;
            lastOpInfo = lastOpInfo.replace(/ /g, "");

            var arr = lastOpInfo.split(",");
            var deleteBegin = false;
            var deleteOver = false;
            var hintBegin = false;
            var hintOver = false;
            for (var i=0; i<arr.length; ++i) {
               var tmp = arr[i];
               if (tmp.indexOf("Collection:") != -1) { // Collection
                  if (deleteBegin && !deleteOver)
                     deleteOver = true;
                  if (hintBegin && !hintOver)
                     hintOver = true;
            
                  var tmp_arr = tmp.split(":");
                  collectionName = tmp_arr[1];
               }
               else if (tmp.indexOf("Deletor:") != -1) { // Deletor
                  if (hintBegin && !hintOver)
                     hintOver = true;

                  var tmp_arr = tmp.split("Deletor:");
                  deletor = tmp_arr[1];
                  deleteBegin = true;
               }
               else if (tmp.indexOf("Hint:") != -1) { // Hint
                  if (deleteBegin && !deleteOver)
                     deleteOver = true;
                  var tmp_arr = tmp.split("Hint:");
                  hint = tmp_arr[1];
                  hintBegin = true;
               }
               else if (tmp.indexOf("Flag") != -1) {
                  if (deleteBegin && !deleteOver)
                     deleteOver = true;
                  if (hintBegin && !hintOver)
                     hintOver = true;
               }
               else if (deleteBegin && !deleteOver)
                  deletor = deletor + "," + tmp;
               else if (hintBegin && !hintOver)
                  hint = hint + "," + tmp;
            }
            description = "Collection:" + collectionName + ",Deletor:" + deletor + ",Hint:" + hint;
            break;
         }
         case "LOB WRITE": {
            // lob write session's lastOpInfo demo
            // "LastOpInfo": "ContextID:112, CollectionName:foo.bar, TupleSize:2097280"
         }
         case "LOB READ": {
            // lob read session's lastOpInfo demo
            // "LastOpInfo": "ContextID:140, Collection:foo.bar, TupleSize:128"
            var lastOpInfo = session.lastOpInfo;
            var collectionName = lastOpInfo.match (/(CollectionName:.*,)/g);
            collectionName = collectionName[0];
            collectionName = collectionName.replace ("CollectionName:", "");
            collectionName = collectionName.replace (",", "");
            description = "Collection:" + collectionName;
            break;
         }
      }
      return description;
   }

   //check the node in what status
   this.getStatus = function()
   {
      var nodedb = "";
      try {
        nodedb = new Sdb( this.hostname, this.port, this.user, this.pw );
      }
      catch( e ){
        if( e == SDB_NETWORK || e == SDB_NET_CANNOT_CONNECT ){
          this.status = "Fault";
          return SDB_NETWORK;
        }
      }

      var cursor = "";
      try {
         cursor = nodedb.snapshot(8);
         this.type = "COORD";
         cursor.close();
      }
      catch ( e ) {
         if ( e == SDB_RTN_COORD_ONLY ) {
            var cursor = nodedb.snapshot(7);
            var snapshot7_obj = cursor.next().toObj();
            cursor.close();
            if ( "SYSCatalogGroup" == snapshot7_obj["GroupName"] ){
              this.type = "CATALOG";
            }else{
              this.type = "DATANODE";
            }
         }
         else {
            println ( "nodedb.snapshot(8) error, error = " + e );
         }
      }

      var cursor = nodedb.snapshot(6);
      var snapshot6_obj = cursor.next().toObj();
      cursor.close();

      if ( this.type == "CATALOG" || this.type == "DATANODE" ) {
         this.status = snapshot6_obj["Status"];
      }

      var currentTimestamp = new Date();
      currentTimestamp = Math.round( currentTimestamp.getTime() / 1000 );

      var machineTimeList = machineTimeStamp.split("*");
      var localShellTime = -1;
      var _nodeTime = -1;
      for(var i=0; i<machineTimeList.length; ++i){
         if( localShellTime != -1 && _nodeTime != -1 ){
            break;
         }
         hostAndTimeList = machineTimeList[i].split("@");
         var _host = hostAndTimeList[0];
         var _timestamp = hostAndTimeList[1];
         if( _host == localHostName ){
            localShellTime = _timestamp;
         }
         if( _host == this.hostname ){
            _nodeTime = _timestamp;
         }
      }

      var nodeTimeGap = localShellTime - _nodeTime;

      this.currentTimestamp = currentTimestamp - nodeTimeGap;

//println( this.hostname + "@" + this.currentTimestamp );

      if ( this.type != "COORD" ) {
         var cursor = nodedb.snapshot(6);
         var snapshot6_obj = cursor.next().toObj();
         cursor.close();
         var currentLSN = snapshot6_obj["CurrentLSN"]["Offset"];
         var beginLSN = snapshot6_obj["BeginLSN"]["Offset"];
           	
         this.currentLSN = currentLSN;
         this.beginLSN = beginLSN;
         this.relativeLSN = currentLSN - beginLSN;

         var cursor = nodedb.snapshot(7);
         var snapshot7_obj = cursor.next().toObj();
         cursor.close();
         this.diskLoadPercent = snapshot7_obj["Disk"]["LoadPercent"];
         this.group = snapshot7_obj["GroupName"];
    
         if( snapshot7_obj["IsPrimary"] == true ){
           this.role = "master";
         }else{
           this.role = "slave";
         }
      }
      
      if ( this.role == "master" && this.type != "CATALOG" && this.type != "COORD" ){
         var cursor = nodedb.snapshot( 5 );
         while ( cursor.next() ){
            var cs_status = new CSSTATUS();
            var obj = cursor.current().toObj();
            cs_status.csName = obj["Name"];
            cs_status.maxcapSize = obj["MaxCapacitySize"];
            cs_status.freeSize = obj["FreeSize"];
            cs_status.totalSize = obj["TotalSize"];
            cs_status.totalDataSize = obj["TotalDataSize"];

            cs_status.calculatePercent();

            this.csMaxcapSize = obj["MaxCapacitySize"] ;
            this.csUseSize = cs_status.useSize ;
            this.csStatusList.push( cs_status );
         }
         cursor.close();
      }

      if ( this.type == "DATANODE" ){
         this.sessionNum = nodedb.snapshot(2).size();
         var cursor = nodedb.snapshot(2, {Type:"ShardAgent",Status:"Running", $and:[{$not:[{"LastOpInfo":{$regex:"Command:.*SNAPSHOT_SESSION.*"}}]}, {$not:[{"LastOpInfo":{$regex:"Command:.*snapshot_session.*"}}]}]});
         while( cursor.next() ){
            var sessionStatus = new SESSION();
            var obj = cursor.current().toObj();
            sessionStatus.sessionID = obj["SessionID"];
            sessionStatus.tid = obj["TID"];
            sessionStatus.execName = obj["LastOpType"] ;
            sessionStatus.ConnectTimestamp = obj["ConnectTimestamp"];
            sessionStatus.lastOpBegin = obj["LastOpBegin"];
            sessionStatus.currentTimestamp = this.currentTimestamp;
            sessionStatus.calculateTime();
            sessionStatus.contexts = obj["Contexts"];
            sessionStatus.relateId = obj["RelatedID"];
            sessionStatus.lastOpInfo = obj["LastOpInfo"];

            if (sessionStatus.execName == "COMMAND") {
               if (sessionStatus.lastOpInfo.search(/Command:.*get count/) >=0) {
                  // get count exec
                  sessionStatus.execName = "GETCOUNT";
               }
            }
            this.sessionList.push( sessionStatus );
         }
         cursor.close ();

         this.contextNum = nodedb.snapshot(0).size();
         cursor = nodedb.snapshot (0, {"Contexts.Type":{$et:"DATA"}}, {Contexts:{$elemMatch:{"Type":"DATA"}}});
         while (cursor.next()) {
            var contextStatus = new CONTEXT ();
            var obj = cursor.current().toObj();
            contextStatus.sessionID = obj["SessionID"];
            contextStatus.contextID = obj["Contexts"][0]["ContextID"];
            contextStatus.description = obj["Contexts"][0]["Description"];
            contextStatus.dataRead = obj["DataRead"];
            contextStatus.indexRead = obj["IndexRead"];
            this.contextList.push (contextStatus);
         }
         cursor.close ();
      }
      else if (this.type == "COORD" ) {
         this.sessionNum = nodedb.snapshot(2).size();
         var cursor = nodedb.snapshot(2, {Global:false, Type:"Agent",Status:"Running", $not:[{"LastOpType":"UNKNOW"}], $and:[{$not:[{"LastOpInfo":{$regex:"Command:.*SNAPSHOT_SESSION.*"}}]}, {$not:[{"LastOpInfo":{$regex:"Command:.*snapshot_session.*"}}]}]});
         while( cursor.next() ){
            var sessionStatus = new SESSION();
            var obj = cursor.current().toObj();
            sessionStatus.sessionID = obj["SessionID"];
            sessionStatus.tid = obj["TID"];
            sessionStatus.execName = obj["LastOpType"] ;
            sessionStatus.ConnectTimestamp = obj["ConnectTimestamp"];
            sessionStatus.lastOpBegin = obj["LastOpBegin"];
            sessionStatus.currentTimestamp = this.currentTimestamp;
            sessionStatus.calculateTime();
            sessionStatus.contexts = obj["Contexts"];
            sessionStatus.relateId = obj["RelatedID"];
            this.sessionList.push( sessionStatus );
         }
         cursor.close ();

         this.contextNum = nodedb.snapshot(0).size();
         cursor = nodedb.snapshot (0, {"Contexts.Type":{$et:"DATA"}}, {Contexts:{$elemMatch:{"Type":"DATA"}}});
         while (cursor.next()) {
            var contextStatus = new CONTEXT ();
            var obj = cursor.current().toObj();
            contextStatus.sessionID = obj["SessionID"];
            contextStatus.contextID = obj["Contexts"][0]["ContextID"];
            contextStatus.description = obj["Contexts"][0]["Description"];
            contextStatus.dataRead = obj["DataRead"];
            contextStatus.indexRead = obj["IndexRead"];
            this.contextList.push (contextStatus);
         }
         cursor.close ();

      }
      nodedb.close();

   }


   /*
    * lsnGap > ( masterRelateiveLsn * 0.8 ), then alarmLevel =2
    * lsnGap > ( masterRelateiveLsn * 0.5 ), then alarmLevel =1
    * lsnGap <= ( masterRelateiveLsn * 0.5 ), then alarmLevel =0 
    */
   this.isLsn_bigGap = function( masterRelateiveLsn, masterCurrentLsn )
   {
      if( this.status == "Fault" ){
         return -1;
      } 
      this.alarmLevel = 0;

      var alarmSize = masterRelateiveLsn * alarmLsnPercent;
      var seriousSize = masterRelateiveLsn * seriousLsnPercent;

      this.lsnGap = ( masterCurrentLsn - this.currentLSN );

      // if lsnGap < 1M ; then ignore this lsn relative
      if ( this.lsnGap < (1024*1024) ){
         this.lsnGap = 0;
         return 0;
      }
      if ( this.lsnGap > seriousSize ){
         this.alarmLevel = 2;
      }else if ( this.lsnGap > alarmSize ){
         this.alarmLevel = 1;
      }else{
         this.alarmLevel = 0;
      }
      return 0;
   }
}

function GroupInfo( coordHostName, coordPort )
{
   this.nodeList = new Array();
   this.groupName = "";
   this.masterNode = null;
   this.slaveNodes = new Array();
   this.coordNodes = new Array();

   this.addNode = function( nodeInfo )
   {
      // get the status
      var ret = nodeInfo.getStatus();
      
      // coord
      if (this.groupName == "SYSCoord" ) {
         this.nodeList.push( nodeInfo );
         this.coordNodes.push(nodeInfo);
      }
      else {
         // datagroup or syscatalog_group
         // if this node is master , then this.masterNode = nodeInfo
         if ( nodeInfo.role == "master" ){
            this.masterNode = nodeInfo;
         }else if ( nodeInfo.role == "slave" ){
            this.slaveNodes.push( nodeInfo );
         }
         this.nodeList.push( nodeInfo );
      }
   }

   this.check_group_lsn_status = function()
   {
      var description = "null";
      if ( this.masterNode == null ){
         return -1;
      }
      var masterRelateiveLsn = this.masterNode.relativeLSN;
		var masterCurrentLsn = this.masterNode.currentLSN;
		var masterBeginLsn = this.masterNode.beginLSN;

      // master node
      pClass.add( "" 
                  + this.masterNode.hostname + ":" + this.masterNode.port + "|" 
                  + this.masterNode.type + "_LSN" + "|" 
                  + Math.round(masterRelateiveLsn * alarmLsnPercent) + "|" 
                  + 0 + "|" 
                  + getTime() + "|" 
                  + "masterNode" + "|" 
                  + 0 + "|" 
                  + description  ); 

      for ( var i=0; i < this.slaveNodes.length; i++ ){
          var slaveNode = this.slaveNodes[i];
          if ( slaveNode.status == "Fault" ){
             continue;
          }
          // check slaveNode.lsn is too gap than masterNode.lsn
          var ret = slaveNode.isLsn_bigGap( masterRelateiveLsn, masterCurrentLsn );
          if( ret == -1 ){
            continue;
          }
          if ( slaveNode.alarmLevel != 0 ) {
             description = "slaveNode's_LSN_GapIsTooLarge";
          }
          else { 
             description = "null";
          }
          pClass.add( "" 
                      + slaveNode.hostname + ":" + slaveNode.port + "|" 
                      + slaveNode.type + "_LSN" + "|" 
                      + Math.round( masterRelateiveLsn * alarmLsnPercent) + "|" 
                      + slaveNode.lsnGap + "|" 
                      + getTime() + "|" 
                      + "slaveNode" + "|" 
                      + slaveNode.alarmLevel + "|" 
                      + description  ); 
      }
   }

   this.check_cs_size = function()
   {
      if( this.masterNode == null ){
         return -1;
      }
      if( this.masterNode.status == "Fault" ){
         return -1;
      }
      this.masterNode.alarmLevel = 0;

      var _alarmCsSizePercentNum = alarmCsSizePercent * 100;
      var _seriousCsSizePercentNum = seriousCsSizePercent * 100;
     
      var _alarmCsSize = Math.round (alarmCsSizePercent * this.masterNode.csMaxcapSize) ;
      var _seriousCsSize = Math.round (seriousCsSizePercent * this.masterNode.csMaxcapSize) ;
      var _useSize = this.masterNode.csUseSize ;
      var csStatusList = this.masterNode.csStatusList;
      for( var i=0; i<csStatusList.length; i++ ){
         var csStatus = csStatusList[i];
         if ( csStatus.percent > _seriousCsSizePercentNum ){
            this.masterNode.alarmLevel = 2;
         }else if ( csStatus.percent > _alarmCsSizePercentNum ){
            this.masterNode.alarmLevel = 1;
         }else{
            this.masterNode.alarmLevel = 0;
         }

         // print cssize percent
         /* 
         pClass.add( ""
                         + this.masterNode.hostname + ":" + this.masterNode.port + "|"
                         + "CSSIZE" + "|"
                         + _alarmCsSizePercentNum + "|"
                         + csStatus.percent + "|"
                         + getTime() + "|"
                         + csStatus.csName + "|"
                         + this.masterNode.alarmLevel + "|"
                         + "null" );
          */
          var description = "null";
          if ( this.masterNode.alarmLevel != 0 ) {
             description = "CSSIZE_willBeCeiling";
          }
          // print cssize number
          pClass.add( ""
                      + this.masterNode.hostname + ":" + this.masterNode.port + "|"
                      + "CSSIZE" + "|"
                      + _alarmCsSize + "|"
                      + _useSize + "|"
                      + getTime() + "|"
                      + csStatus.csName + "|"
                      + this.masterNode.alarmLevel + "|"
                      + description );

      }
   }

   this.findCoordSessionId = function(node_relateId, coordGroup)
   {
      var coordNodes = coordGroup.coordNodes;
      for (var i=0; i<coordNodes.length; ++i)
      {
         var coordnode = coordNodes[i];
         var sessionList = coordnode.sessionList;
         for (var j=0; j<sessionList.length; ++j)
         {
            var session = sessionList[j];
            if (node_relateId == session.relateId) {
               var host = coordnode.hostname;
               var service = coordnode.port;
               var sessionID = session.sessionID;
               return host + ":" + service + ":" + sessionID;
            }
         }
      }
      return "null";
   }

   this.check_node_session = function(coordGroup)
   {
      var _maxAlarmRelativeTime = maxAlarmRelativeTime;
      var _maxSeriousRelativeTime = maxSeriousRelativeTime;
 
      var _alarmSessionNum = alarmSessionNum;
      var _seriousSessionNum = seriousSessionNum;
      for( var i=0; i < this.nodeList.length; i++ ){
         var node = this.nodeList[i];
      
         if ( node.status == "Fault" ){
            continue;
         }
         node.alarmLevel = 0;
         
         var sessionList = node.sessionList;
         var sessionNum = node.sessionNum;
         if( sessionNum > _seriousSessionNum ){
            node.alarmLevel = 2;
         }else if( sessionNum > _alarmSessionNum ){
            node.alarmLevel = 1;
         }else{
            node.alarmLevel = 0;
         }
         var description = "null";
         if ( node.alarmLevel != 0 ) {
            description = "tooMuchSession";
         }
         pClass.add( ""
                     + node.hostname + ":" + node.port + "|"
                     + "SESSIONNUM" + "|"
                     + _alarmSessionNum + "|"
                     + sessionNum + "|"
                     + getTime() + "|"
                     + "null" + "|"
                     + node.alarmLevel + "|"
                     + description );
          
         for( var j=0; j < sessionList.length; j++ ){
            var session = sessionList[j];
            node.alarmLevel = 0;
            if ( session.relativeTime >= _maxSeriousRelativeTime ){
               node.alarmLevel = 2;
            }else if ( session.relativeTime >= _maxAlarmRelativeTime ){
               node.alarmLevel = 1;
            }else{
               node.alarmLevel = 0;
            }
            if ( node.alarmLevel != 0 && session.execName != "INSERT" ) {
               var coordSessionId = this.findCoordSessionId (session.relateId, coordGroup);
               var description = node.getContextDescription (session, session.execName);
               if (coordSessionId != "null") {
                  pClass.add( "" 
                           + node.hostname + ":" + node.port + "|"
                           + "SESSIONTIMEOUT" + "|"
                           + _maxAlarmRelativeTime + "|"
                           + session.relativeTime + "|"
                           + getTime() + "|"
                           + coordSessionId + ":" + session.execName + "|"
                           + node.alarmLevel + "|"
                           + description );
               }
            }
         }
      }      
   }
}

function printClass()
{
   this.variablesArray = new Array();
   
   // push variables is String , and split word by '|' 
   this.add = function( variables ){
      this.variablesArray.push( variables );
   }

   this.isAlarmInfo = function (info) {
      var infoList = info.split ("|");
      var nodeInfo = infoList[0];
      var signs = infoList[6];
      if (nodeInfo == "coord" || signs == 0)
         return false;
      return true;
   }

   this.prepareSavePath = function () {
      if (File.exist ("output")) {
         if (!File.isDir ("output")) {
            println ("output is exists and is not dir");
         }
      }
      else {
         File.mkdir ("output");
      }

      if (File.exist ("output/backup")) {
         if (!File.isDir ("output/backup")) {
            println ("output/backup is exists and is not dir");
         }
      }
      else {
         File.mkdir ("output/backup");
      }
   }

   this.execCmd = function (info) {
      var infoList = info.split ("|");
      var nodeInfo = infoList[0];
      var type = infoList[1];
      var warningValue = infoList[2];
      var value = infoList[3];
      var time = infoList[4];
      var desc_1 = infoList[5];
      var signs = infoList[6];
      var desc_2 = infoList[7];

      //var cmd = new Cmd ();
      //cmd.start (CMD_SHELL + "", "", 1, 0);
   }

   // flag = 0 , print, write log and execCmd
   // flag = 1 , print and write log
   // flag = 2 , only write log
   this.print = function(flag) {
     this.prepareSavePath ();
     var time_str = getTime (1);
     var alarmFile = new File ("output/backup/alarm_" + time_str + ".csv");
     var resultFile = new File ("output/backup/result_" + time_str + ".csv");
     var alarmFile_last = new File ("output/alarm_last.csv");
     var resultFile_last = new File ("output/result_last.csv");
     for( var i=0; i<this.variablesArray.length; i++ ){
       if (flag != 1 ) {
          this.execCmd (this.variablesArray[i]);
       }

       resultFile.write (this.variablesArray[i] + "\n");
       resultFile_last.write (this.variablesArray[i] + "\n");
       if (flag != undefined) {
          switch (flag)
          {
             case 0 :  // print, write log and execCmd
                if (this.isAlarmInfo (this.variablesArray[i])) {
                   alarmFile.write (this.variablesArray[i] + "\n");
                   alarmFile_last.write (this.variablesArray[i] + "\n");
                   println( this.variablesArray[i] );
                }
           
                break;   
             case 1 :  // print and write log
                if (this.isAlarmInfo (this.variablesArray[i])) {
                   alarmFile.write (this.variablesArray[i] + "\n");
                   alarmFile_last.write (this.variablesArray[i] + "\n");
                   println( this.variablesArray[i] );
                }
                break;   
             case 2 :  // only write log
                if (this.isAlarmInfo (this.variablesArray[i])) {
                   alarmFile.write (this.variablesArray[i] + "\n");
                   alarmFile_last.write (this.variablesArray[i] + "\n");
                }
                break;   
             default :
                throw "unknow print type";
          }
       }
     }
     alarmFile.close();
     alarmFile_last.close();
     resultFile.close();
     resultFile_last.close();
   }
}

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

function CSSTATUS()
{
   // cs name
   this.csName = "";

   //have used how much space
   this.useSize = "";

   // the cs max size
   this.maxcapSize = "";

   // the cs free size
   this.freeSize = "";

   // the cs total size
   this.totalSize = "";

   // the cs totalDataSize , real use size
   this.totalDataSize = "";

   // the cs have used percent
   this.percent = "";

   this.calculatePercent = function(){
      //this.useSize = this.totalSize - this.freeSize;
      this.useSize = this.totalDataSize;
      this.percent = Math.round( (this.useSize / this.maxcapSize)* 100 );
   }
}

function SESSION()
{
   // SessionID
   this.sessionID = "";

   // TID
   this.tid = "";

   // this connect last option begin time
   this.lastOpBegin = "";

   // connect time
   this.ConnectTimestamp = "";

   // node current time stamp
   this.currentTimestamp = "";

   // relative time
   this.relativeTime = "";

   // execName
   this.execName = "" ;

   // contexts list
   this.contexts = "";

   // relateId
   this.relateId = "";

   // lastOpInfo
   this.lastOpInfo = "";

   this.calculateTime = function(){
      var list = this.lastOpBegin.split("-"); 
      var year = list[0];
      var month = list[1] - 1;
      var day = list[2];

      list = list[3].split(".");
      var hour = list[0];
      var minut = list[1];
      var second = list[2];

      var beginTime = new Date();
      beginTime.setFullYear(year);
      beginTime.setMonth(month);      
      beginTime.setDate(day);
      beginTime.setHours(hour);
      beginTime.setMinutes(minut);
      beginTime.setSeconds(second);

      var beginTimestamp = Math.round( beginTime.getTime() / 1000 );

      //var currentTime = new Date();
      this.relativeTime = Math.round( (this.currentTimestamp - beginTimestamp) );
   }
}

function CONTEXT ()
{
   // SessionID
   this.sessionID = "";

   // ContextID
   this.contextID = "";

   // Description
   this.description = "";

   // DataRead
   this.dataRead = "";

   // IndexRead
   this.indexRead = "";
}
