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
