function getTimeStamp(hostname, user, passwd, sshPort)
{
   try
   {
      var ssh = new Ssh(hostname, user, passwd, sshPort) ;
   }
   catch (e)
   {
      
   }
   var commonStr = "date +%s" ;
   var retStr = ssh.exec(commonStr) ;
   print(retStr) ;

}

function checkSdbcmLog(hostname, user, passwd, sshPort, execFile)
{
   try
   {
      var ssh = new Ssh(hostname, user, passwd, sshPort) ;
   }
   catch (e)
   {

   }

   try
   {
      //var retstr = ssh.exec("chmod a+x " + execFile) ;
      ssh.exec("perl " + execFile) ;
      var retstr = ssh.getLastOut();
      print (retstr);
   }
   catch (e)
   {

   }

}

function pushFile(hostname, user, passwd, sshPort, localFile, remoteFile, remotePath, coverFile)
{
   try
   {
      var ssh = new Ssh(hostname, user, passwd, sshPort) ;
   }
   catch (e)
   {

   }

   try
   {
      var retstr = ssh.exec("ls -l " + remoteFile) ;
      if (coverFile == true) 
      {
         try
         {
            retstr = ssh.push(localFile, remoteFile) ;
         }
         catch (e)
         {
            throw 1 ;
         }
      }
   }
   catch (e)
   {
      try
      {
         var retstr = ssh.exec("mkdir -p " + remotePath) ;
         retstr = ssh.push(localFile, remoteFile) ;
      }
      catch (e)
      {
         throw 1;
      }
   }
 
}

function main()
{
   if(doWhat == "getTimeStamp")
   {
      getTimeStamp(hostname, user, passwd, sshPort) ;
   }
   else if(doWhat == "pushFile")
   {
      pushFile(hostname, user, passwd, sshPort, localFile, remoteFile, remotePath, coverFile) ;
   }
   else if(doWhat == "checkSdbcmLog")
   {
      checkSdbcmLog(hostname, user, passwd, sshPort, execFile) ;
   }
}

if (doWhat == undefined)
{
   var doWhat = -1 ;
}
if (hostname == undefined)
{
   var hostname = -1 ;
}
if (user == undefined)
{
   var user = -1 ;
}
if (passwd == undefined)
{
   var passwd = -1 ;
}
if (localFile == undefined)
{
   var localFile = -1 ;
}
if (remoteFile == undefined)
{
   var remoteFile = -1 ;
}
if (remotePath == undefined)
{
   var remotePath = -1 ;
}
if (coverFile == undefined)
{
   var coverFile = -1 ;
}
if (execFile == undefined)
{
   var execFile = -1 ;
}
if (sshPort == undefined)
{
   var sshPort = -1 ;
}

main() ;


//getTimeStamp("192.168.30.181","root","sequoiadb",22) ;

//pushFile("192.168.30.181","root","sequoiadb",22, "/opt/minsheng/check_sdbcm_log.sh", "/tmp/sequoiadb/check_sdbcm_log.sh", "/tmp/sequoiadb", true)

//checkSdbcmLog("192.168.30.181","root","sequoiadb",22, "/tmp/sequoiadb/check_sdbcm_log.sh")
