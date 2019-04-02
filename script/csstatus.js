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
