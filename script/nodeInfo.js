function NodeInfo( hn, pt, user, pw, _type )
{
   if( hn != undefined )
     this.hostname = hn;
   if( pt != undefined )
     this.port = pt;
   if ( user != undefined )
     this.user = user; if ( pw != undefined )
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
   this.type = _type;
  
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
                     //_desc = _desc.replace (/ /g, "");
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
            // TODO
            // sdb engine 2.8, e.g:"LastOpInfo": "Collection:foo.bar, Matcher:{ \"id\": 1 }, Updator:{ \"$set\": {} }, Hint:{}, Flag:0x00000004(4)",
            // sdb engine 3.0, e.g:"LastOpInfo": "Collection:foo.bar, Matcher:{ \"id\": 1 }, Updator:{ \"$set\": { \"info\": \"1111\" } }, Hint:{}, Flag:0x00000004(4)",
            var lastOpInfo = session.lastOpInfo;
            //lastOpInfo = lastOpInfo.replace(/ /g, "");

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
            //lastOpInfo = lastOpInfo.replace(/ /g, "");

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

      var cursor = nodedb.snapshot(6);
      var snapshot6_obj = cursor.next().toObj();
      cursor.close();

      if ( this.type == "CATALOG" || this.type == "DATANODE" ) {
         this.status = snapshot6_obj["Status"];
         if (this.status == undefined) {
            var serviceStatus = snapshot6_obj["ServiceStatus"];
            if (serviceStatus == false) {
               this.status = "FullSync";
            }
            else {
               this.status = "Normal";
            }
         }
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
