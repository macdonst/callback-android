/*
 * create a phonegap/android project
 *
 * USAGE
 *  ./create [path package activity]
 */

function read(filename) {
    var fso=WScript.CreateObject("Scripting.FileSystemObject");
    var f=fso.OpenTextFile(filename, 1, true);
    var s=f.ReadAll();
    f.Close();
    return s;
}
function write(filename, contents) {
    var fso=WScript.CreateObject("Scripting.FileSystemObject");
    var f=fso.OpenTextFile(filename, 2, true);
    f.Write(contents);
    f.Close();
}
function replaceInFile(filename, regexp, replacement) {
    write(filename, read(filename).replace(regexp, replacement));
}
function exec(s) {
    var o=shell.Exec(s);
}
function waitUntilFileExists(filename){
    var fso=WScript.CreateObject("Scripting.FileSystemObject");
    if(!fso.FileExists(filename)){
	WScript.Sleep(1000);
	waitUntilFileExists(filename);
    }
}

var args = WScript.Arguments, PROJECT_NAME="example",
    PACKAGE="com.phonegap.example", ACTIVITY="PhoneGapExample",
    shell=WScript.CreateObject("WScript.Shell");

if (args.Count() == 3) {
    WScript.Echo('Found expected arguments');
    PROJECT_NAME=args(0);
    PACKAGE=args(1);
    ACTIVITY=args(2);
}

var SCRIPT_FULL_NAME=WScript.ScriptFullName
var BIN_DIR=SCRIPT_FULL_NAME.slice(0, SCRIPT_FULL_NAME.lastIndexOf('\\')+1);
var PROJECT_PATH=BIN_DIR.slice(0, BIN_DIR.lastIndexOf('\\bin')+1) + PROJECT_NAME + "\\";
var PACKAGE_AS_PATH=PACKAGE.replace(/\./g, '\\');
var ACTIVITY_PATH=PROJECT_PATH+'\\src\\'+PACKAGE_AS_PATH+'\\'+ACTIVITY+'.java';
var MANIFEST_PATH=PROJECT_PATH+'\\AndroidManifest.xml';
var TARGET=shell.Exec('android.bat list targets').StdOut.ReadAll().match(/id:\s([0-9]).*/)[1];
var VERSION=read('VERSION').replace(/\r\n/,'').replace(/\n/,'');

// clobber any existing example

/*
if [ $# -eq 0 ]
then
    rm -rf $PROJECT_PATH
fi
*/

// create the project
exec('android.bat create project --target '+TARGET+' --path '+PROJECT_PATH+' --package '+PACKAGE+' --activity '+ACTIVITY);

// update the phonegap framework project to a target that exists on this machine
exec('android.bat update project --target '+TARGET+' --path framework');

// compile phonegap.js and phonegap.jar
// if you see an error about "Unable to resolve target" then you may need to 
// update your android tools or install an additional Android platform version
exec('ant.bat -f framework\\build.xml jar');

// copy in the project template
exec('cmd /c xcopy bin\\templates\\project\\phonegap\\templates\\project '+PROJECT_PATH+' /S /Y');

// copy in phonegap.js
exec('cmd /c xcopy framework\\assets\\www\\phonegap-'+VERSION+'.js '+PROJECT_PATH+'\\assets\\www\\ /Y');

// copy in phonegap.jar
exec('cmd /c xcopy framework\\phonegap-'+VERSION+'.jar '+PROJECT_PATH+'\\libs\\ /Y');

waitUntilFileExists(ACTIVITY_PATH);
WScript.CreateObject("Scripting.FileSystemObject").DeleteFile(ACTIVITY_PATH);
// copy in default activity
exec('cmd /c copy bin\\templates\\project\\phonegap\\templates\\Activity.java '+ACTIVITY_PATH+' /Y');

// interpolate the activity name and package
waitUntilFileExists(ACTIVITY_PATH);
replaceInFile(ACTIVITY_PATH, /__ACTIVITY__/, ACTIVITY);
replaceInFile(ACTIVITY_PATH, /__ID__/, PACKAGE);

replaceInFile(MANIFEST_PATH, /__ACTIVITY__/, ACTIVITY);
replaceInFile(MANIFEST_PATH, /__PACKAGE__/, PACKAGE);

/*
# leave the id for launching
touch $PROJECT_PATH/package-activity
echo $PACKAGE/$PACKAGE.$ACTIVITY >  $PROJECT_PATH/package-activity 
*/
