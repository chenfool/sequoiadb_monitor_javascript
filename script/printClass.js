function printClass()
{
   this.variablesArray = new Array();
   this.sessionTimeoutArray = new Array();
   this.sessionTimeoutAlarmArray = new Array();

   Array.prototype.indexOf = function(val) {
      for (var i = 0; i < this.length; i++) {
         if (this[i] == val) return i;
      }
      return -1;
   };

   Array.prototype.remove = function(val) {
      var index = this.indexOf(val);
         if (index > -1) {
            this.splice(index, 1);
         }
   };

   Array.prototype.removeFromTo = function(from, to) {
      var rest = this.slice((to || from) + 1 || this.length);
      this.length = from < 0 ? this.length + from : from;
      return this.push.apply(this, rest);
   };

   this.isInSessionTimeoutAlarmArray = function (val) {
      for (var i=0; i<this.sessionTimeoutAlarmArray.length; ++i) {
         var info = this.sessionTimeoutAlarmArray[i];
         if (info == val) { return true; }
      }
      return false;
   }

   this.chectoutSessionTimeoutAlarmInfo = function (sessionTimeoutArray) {

      if (sessionTimeoutArray.length > 0) {
         for (var i=0; i<sessionTimeoutArray.length; ++i) {
            var infoList = sessionTimeoutArray[i].split ("|");
            var nodeInfo = infoList[0];
            var type = infoList[1];
            var warningValue = infoList[2];
            var value = infoList[3];
            var time = infoList[4];
            var desc_1 = infoList[5];
            var signs = infoList[6];
            var desc_2 = infoList[7];

            var desc_1_arr = desc_1.split(":");
            var coordHost = desc_1_arr[0];
            var coordService = desc_1_arr[1];
            var coordSessionID = desc_1_arr[2];
            var execType = desc_1_arr[3];


            var sessionTimeoutAlarmInfo = "" +
               coordHost + ":" + coordService + "|" +
               type + "|" +
               warningValue + "|" +
               value + "|" +
               time + "|" +
               coordSessionID + ":" + execType + "|" +
               signs + "|" +
               desc_2;

            if (!this.isInSessionTimeoutAlarmArray (sessionTimeoutAlarmInfo)) {
               this.sessionTimeoutAlarmArray.push (sessionTimeoutAlarmInfo);
            }
         }
      }
   
   }
   
   // push variables is String , and split word by '|' 
   this.add = function( variables ){
      var infoList = variables.split ("|");

      var type = "";
      if (infoList.length >=1 ) { 
         type = infoList[1];
      }

      if (type != "" && type == "SESSIONTIMEOUT") {
         this.sessionTimeoutArray.push (variables);
      } else {
         this.variablesArray.push (variables);
      }
   }

   this.isCoordInfo = function (info) {
      var infoList = info.split ("|");
      var nodeInfo = infoList[0];
      if (nodeInfo == "coord")
         return true;
      return false;

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
         try {
            if (!File.isDir ("output")) {
               println ("output is exists and is not dir");
            }
         }
         catch (e) {
            // TODO
            // sdb client is old
         }
      }
      else {
         File.mkdir ("output");
      }

      if (File.exist ("output/alarm_last.csv")) {
         File.remove ("output/alarm_last.csv");
      }
      if (File.exist ("output/result_last.csv")) {
         File.remove ("output/result_last.csv");
      }

      if (File.exist ("output/backup")) {
         try {
            if (!File.isDir ("output/backup")) {
               println ("output/backup is exists and is not dir");
            }
         }
         catch (e) {
            // TODO
            // sdb client is old
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

   // flag = -1 , print temp info
   // flag = 0  , print, write log and execCmd
   // flag = 1  , print and write log
   // flag = 2  , only write log
   this._print = function(flag, variables, alarmFile, alarmFile_last)
   {
      switch (flag)
      {
         case 0 :  // print, write log and execCmd
            if (this.isAlarmInfo (variables)) {
               // write log
               alarmFile.write (variables + "\n");
               alarmFile_last.write (variables + "\n");
               // exec cmd
               this.execCmd (variables);
               // println 
               println( variables.replace (/ /g, "") );
            }
            break;   
         case 1 :  // print and write log
            if (this.isAlarmInfo (variables)) {
               alarmFile.write (variables + "\n");
               alarmFile_last.write (variables + "\n");
               println( variables.replace (/ /g, "") );
            }
            break;   
         case 2 :  // only write log
            if (this.isAlarmInfo (variables)) {
               alarmFile.write (variables + "\n");
               alarmFile_last.write (variables + "\n");
            }
            break;   
         default :
            throw "unknow print type";
      }
   }

   // flag = -1 , print temp info
   // flag = 0  , print, write log and execCmd
   // flag = 1  , print and write log
   // flag = 2  , only write log
   this.print = function(flag) {
     if (flag == -1) {
        for( var i=0; i<this.variablesArray.length; i++ ){
           println (this.variablesArray[i]);
        }
     }
     else {
        this.prepareSavePath ();
        this.chectoutSessionTimeoutAlarmInfo (this.sessionTimeoutArray);
        var time_str = getTime (1);
        var alarmFile = new File ("output/backup/alarm_" + time_str + ".csv");
        var resultFile = new File ("output/backup/result_" + time_str + ".csv");
        var alarmFile_last = new File ("output/alarm_last.csv");
        var resultFile_last = new File ("output/result_last.csv");
        for( var i=0; i<this.variablesArray.length; i++ ) {
          resultFile.write (this.variablesArray[i] + "\n");
          resultFile_last.write (this.variablesArray[i] + "\n");

          if (this.isCoordInfo (this.variablesArray[i])) {
             println (this.variablesArray[i]);
          }
  
          if (flag != undefined) {
             this._print (flag, this.variablesArray[i], alarmFile, alarmFile_last);
          }
        }

        for ( var i=0; i<this.sessionTimeoutArray.length; i++) {
          resultFile.write (this.sessionTimeoutArray[i] + "\n");
          resultFile_last.write (this.sessionTimeoutArray[i] + "\n");

        }

        for ( var i=0; i<this.sessionTimeoutAlarmArray.length; i++) {
          if (flag != undefined) {
             this._print (flag, this.sessionTimeoutAlarmArray[i], alarmFile, alarmFile_last);
          }
        }

        alarmFile.close();
        alarmFile_last.close();
        resultFile.close();
        resultFile_last.close();
     }
   }
}
