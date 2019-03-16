#!/usr/bin/perl

use threads ;
use threads::shared ;
use File::Basename ;
use Getopt::Long ;

use Tie::File ;
use Sys::Hostname ;
use File::Basename ;
#use strict ;
#use warnings ;
#use Data::Dumper;

####################################
# get options
GetOptions ("-grep=s"=>\$datoolGrep ,
            "o=s"=>\$saveFilePath ,
            "-overwrite"=>\$overWriteSaveFile ,
            "-level=s"=>\$datoolLevel ,
            "-pid=s"=>\$datoolPid ,
            "-tid=s"=>\$datoolTid ,
            "-msg=s"=>\$datoolMsg ,
            "f=s"=>\$diaglogFile ,
            "-file=s"=>\$diaglogFile ,
            "-quiet"=>\$quiet ,
            "j=i"=>\$filterJobs ,
            "-help"=>\$help ,
            "h"=>\$help ,
            "v"=>\$printVersion ,
            "-version"=>\$printVersion) ;
####################################
#my $ISREADOVER = "false" ;
my $ISPRINT = "true" ;
my $HAVEASDGREP = "true" ;
my $HAVEASDLEVEL = "true" ;
my $HAVEASDPID = "true" ;
my $HAVEASDTID = "true" ;
my $HAVEASDMSG = "true" ;
####################################
my $PRINT_LOCK          : shared ;
my $HASHOBJ_LOCK        : shared ;
my $RECORD_LOCK         : shared ;
####################################
my @RECORD_ARR          : shared ;
my @HASHOBJ_ARR         : shared ;
my @FILTER_RECORD_ARR   : shared ;
my @PRINT_ARR           : shared ;
#my %HASHOBJ             : shared ;
my $ISREADOVER          : shared ;
$ISREADOVER = "false" ;
####################################
my $ASDVERSION = "0.1.0" ;
####################################

sub helpOption {
   print "analy SequoiaDB diaglog tool help info\n" ;
   print "  -h [--help]        print help info\n" ;
   print "  -f [--file] arg    SequoiaDB diaglog file\n" ;
   print "  -j arg             how much thread to filter diaglog, default 3\n" ;
   print "  --grep arg         enter what's you want to search\n" ;
   print "  --level arg        filter what's level diaglog do you  want\n" ;
   print "  --pid arg          filter what's pid diaglog do you want\n" ;
   print "  --tid arg          filter what's tid diaglog do you want\n" ;
   print "  --msg arg          filter what's msg diaglog do you want\n" ;
   print "  -o arg             save diaglog file path\n" ;
   print "  --overwrite        overwrite save file\n" ;
   print "  --quiet            don't print any diaglog\n" ;
   print "  -v [--version]     print sdbdatool's  version\n" ;
   print "" ;
   exit 0 ;
}

sub printVersionFunc {
   print "SequoiaDB diaglog auxiliary tool's version is " . $ASDVERSION . "\n" ; 
   exit 0 ;
}

sub checkOpts {
   helpOption () if ($help) ;
   printVersionFunc () if ($printVersion) ;
   helpOption () if (! $diaglogFile) ;
   
   $ISPRINT = "false" if ($quiet) ;

   $HAVEASDGREP = "false" if (! $datoolGrep) ;
   $HAVEASDLEVEL = "false" if (! $datoolLevel) ;
   $HAVEASDPID = "false" if (! $datoolPid) ;
   $HAVEASDTID = "false" if (! $datoolTid) ;
   $HAVEASDMSG = "false" if (! $datoolMsg) ;
   
   if ($saveFilePath) {
      if (! $overWriteSaveFile) {
         open (SAVEFILE, ">>$saveFilePath") or die ("Could not open $saveFilePath\n") ;
      }
      else {
         open (SAVEFILE, ">$saveFilePath") or die ("Could not open $saveFilePath\n") ;
      }
   }


   if ($HAVEASDGREP eq "false" &&
       $HAVEASDLEVEL eq "false" &&
       $HAVEASDPID eq "false" &&
       $HAVEASDTID eq "false" &&
       $HAVEASDMSG eq "false"
   ) {
      helpOption () ;
   }
   $filterJobs = 3 if (! $filterJobs) ;

   $datoolGrep = "" if (! $datoolGrep) ;
   $datoolLevel = "" if (! $datoolLevel) ;
   $datoolPid = "" if (! $datoolPid) ;
   $datoolTid = "" if (! $datoolTid) ;
   $datoolMsg = "" if (! $datoolMsg) ;
}

sub filterGrepFunc {
   (my $recordStr) = @_ ;
   if ($recordStr =~ /.*$datoolGrep.*/i) {
      return "true" ;
   } else {
      return "false" ;
   }
}

sub filterLevelFunc {
   (my $hashObj) = @_ ;
   my %hashObj = %$hashObj ;
   if ($datoolLevel eq $hashObj{"Level"}) {
      return "true" ;
   } else {
      return "false" ;
   }
}

sub filterPidFunc {
   (my $hashObj) = @_ ;
   my %hashObj = %$hashObj ;
   if ($datoolPid eq $hashObj{"PID"}) {
      return "true" ;
   } else {
      return "false" ;
   }
}

sub filterTidFunc {
   (my $hashObj) = @_ ;
   my %hashObj = %$hashObj ;
   if ($datoolTid eq $hashObj{"TID"}) {
      return "true" ;
   } else {
      return "false" ;
   }
}

sub filterMsgFunc {
   (my $hashObj) = @_ ;
   my %hashObj = %$hashObj ;
   if ($hashObj{"Message"} =~ /.*$datoolMsg.*/) {
      return "true" ;
   } else {
      return "false" ;
   }
}

sub diaglogFilter {
   (my $hashObj, my $recordStr) = @_ ;
   my %hashObj = %$hashObj ;

   ##################
   my $FILTERGREP = "true" ;
   my $FILTERLEVEL = "true" ;
   my $FILTERPID = "true" ;
   my $FILTERTID = "true" ;
   my $FILTERMSG = "true" ;
   ##################

   if ($HAVEASDGREP eq "true") {
      $FILTERGREP = filterGrepFunc ($recordStr) ; 
   }
   if ($HAVEASDLEVEL eq "true") {
      $FILTERLEVEL = filterLevelFunc (\%hashObj) ;
   }
   if ($HAVEASDPID eq "true") {
      $FILTERPID = filterPidFunc (\%hashObj) ;
   }
   if ($HAVEASDTID eq "true") {
      $FILTERTID = filterTidFunc (\%hashObj) ;
   }
   if ($HAVEASDMSG eq "true") {
      $FILTERMSG = filterMsgFunc (\%hashObj) ;
   }


   if ($FILTERGREP eq "true" &&
       $FILTERLEVEL eq "true" &&
       $FILTERPID eq "true" &&
       $FILTERTID eq "true" &&
       $FILTERMSG eq "true"
      )
   {
      return "true" ;
   }
   else 
   {
      return "false" ;
   }
}

sub printFun {
   (my $isPrint, my $recordStr) = @_ ;
   if ($ISPRINT eq "true") {
      lock ($PRINT_LOCK) ;
      print "$recordStr" ;
   }
   if ($saveFilePath) {
      lock ($PRINT_LOCK) ;
      print SAVEFILE $recordStr ;
   }
}

sub stopAllThreads {                                                                                        
   foreach my $t(threads->list()){                                                                          
      $t->exit();                                                                                           
   }                                                                                                        
}  

sub createHashObj_diaglog {
   (my $recordStr) = @_ ;
   my %hashObj = () ;

   my @lineStr = split (/\n/, $recordStr);
   foreach my $line (@lineStr) {
      chomp ($line) ;
      my @elementArr = split (/ +/, $line) ;

      if ($line =~ /\d.*Level:.*/) {
         $hashObj{"Time"} = $elementArr[0] ;
         my @tmpArr = split (/:/, $elementArr[1]) ;
         $hashObj{"Level"} = $tmpArr[1] ;
      }
      elsif ($line =~ /^PID:.* +TID:.*/) {
         my @tmpArr = split (/:/, $elementArr[0]) ;
         my $pid = $tmpArr[1] ;
         @tmpArr = split (/:/, $elementArr[1]) ;
         my $tid = $tmpArr[1] ;
         $hashObj{"PID"} = $pid ;
         $hashObj{"TID"} = $tid ;
      }
      elsif ($line =~ /^Function:.* +Line:.*/) {
         my @tmpArr = split (/:/, $elementArr[0]) ;
         my $func = $tmpArr[1] ;
         @tmpArr = split (/:/, $elementArr[1]) ;
         my $line = $tmpArr[1] ;
         $hashObj{"Function"} = $func ;
         $hashObj{"Line"} = $line ;
      }
      elsif ($line =~ /^File:.*\.cpp$/) {
         my @tmpArr = split (/:/, $elementArr[0]) ;
         my $file = $tmpArr[1] ;
         $hashObj{"File"} = $file ;
      }
      elsif ($line eq "Message:") {
         next ;
      }
      else {
         $hashObj{"Message"} = $line . "\n" ;
      }


   }
   return \%hashObj ;
}

sub tReadLog_dialog {
   (my $diaglogFile) = @_ ;
   open DIAGLOGFILE, "<", $diaglogFile ;
   
   my $firstRead = "true" ;
   my $recordOver = "false" ;
   my $recordStr = "\n" ;

   while (<DIAGLOGFILE>) {
      
      # $ != ""
      if ($_) 
      {
         if ($_ =~ /\d.*Level:.*/) 
         {
            if ($firstRead eq "true") 
            {
               $firstRead = "false" ;
               $recordStr = $recordStr . $_ ;
            }
            else 
            {
               {
                  lock ($RECORD_LOCK) ;
                  push (@RECORD_ARR, $recordStr) ;
               }
               $recordStr = "\n" ;
               $recordStr = $recordStr . $_ ;
            }
         }
         else 
         {
            $recordStr = $recordStr . $_ ;
         }
      }
      else 
      {
         # $_ == "" ; then continue
         next ;
      }
   }
   $ISREADOVER = "true" ;
}

sub disposeRecord {
   (my $recordStr) = @_ ;

   my $hashObj = createHashObj_diaglog ($recordStr) ;
   my %hashObj = %$hashObj ;
   my $isPrint = diaglogFilter (\%hashObj, $recordStr) ;
   if ($isPrint eq "true")
   {
      printFun ($isPrint, $recordStr) ;
   }
}

sub tDisposeDiaglog {
   while ($ISREADOVER eq "false" || @RECORD_ARR > 0)
   {
      if (@RECORD_ARR > 0)
      {
         my $recordStr = "" ;
         {
            lock ($RECORD_LOCK) ;
            if (@RECORD_ARR > 0)
            {
               $recordStr = shift (@RECORD_ARR) ;
            }
            else
            {
               next ;
            }
         }
         disposeRecord ($recordStr) ;
      }
      else
      {
         select(undef, undef, undef, 0.100) ;
      }
   }
}

sub tPrintFun {
   my $recordStr = "" ;
   while ($ISREADOVER eq "false" || @RECORD_ARR > 0 || @PRINT_ARR > 0)
   {
      if (@PRINT_ARR > 0) 
      {
         {
            lock ($PRINT_LOCK) ;
            if (@PRINT_ARR > 0)
            {
               $recordStr = shift (@PRINT_ARR) ;
            }
            else
            {
               next ;
            }
         }
         if ($ISPRINT eq "true") {
            print "$recordStr" ;
         }
         if ($saveFilePath) {
            print SAVEFILE $recordStr ;
         }
      }
      else
      {
         select(undef, undef, undef, 0.100) ;
      }
   }
}

sub over {
   close SAVEFILE ;
}

sub main {
   my @threadArr = () ;
   my $threadNum = 0 ;

   checkOpts () ;

   my $thread_readDiaglog = threads->new (\&tReadLog_dialog, $diaglogFile) ;

   while ($threadNum < $filterJobs) 
   {
      my $thread_t = threads->new (\&tDisposeDiaglog) ;
      push (@threadArr, $thread_t) ;
      $threadNum++;
   }
   $thread_readDiaglog->join ;

   foreach my $t(@threadArr)
   {
      $t->join ;
   }
   over () ;
}

main ();
