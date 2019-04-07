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
         // standalone, datagroup or syscatalog_group
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
               var sessionID = "" + session.sessionID;
               // TODO
               // sdb engine 2.6, coord.session.sessionID = "HOST:SERVICE:SESSIONID", e.g:"sdb1:11810:99"
               // sdb engine 2.8.1, coord.session.sessionID = "SESSIONID", e.g:"17"
               if (sessionID.indexOf (":") != -1) {
                  return sessionID;
               }
               else {
                  return host + ":" + service + ":" + sessionID;
               }
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
               var coordSessionId = "";
               if (this.groupName != "STANDALONE") {
                  coordSessionId = this.findCoordSessionId (session.relateId, coordGroup);
               }
               else {
                  // TODO
                  // sdb engine 2.6, coord.session.sessionID = "HOST:SERVICE:SESSIONID", e.g:"sdb1:11810:99"
                  // sdb engine 2.8.1, coord.session.sessionID = "SESSIONID", e.g:"17"
                  // host + ":" + service + ":" + sessionID;
                  var _sessionID = "" + session.sessionID;
                  if (_sessionID.indexOf (":") != -1) {
                     coordSessionId = session.sessionID;
                  }
                  else {
                     coordSessionId = node.hostname + ":" + node.port + ":" + session.sessionID;
                  }
               }

               var description = node.getContextDescription (session, session.execName);
               if (coordSessionId != "null") {
                  pClass.add( "" 
                           + node.hostname + ":" + node.port + "|"
                           + "SESSIONTIMEOUT" + "|"
                           + _maxAlarmRelativeTime + "|"
                           + session.relativeTime + "|"
                           + getTime() + "|"
                           + coordSessionId + "," + session.execName + "|"
                           + node.alarmLevel + "|"
                           + description );
               }
            }
         }
      }      
   }
}
