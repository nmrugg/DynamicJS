[DynamicJS](https://github.com/nmrugg/DynamicJS): A simple Node HTTP server that dynamically executes JavaScript and even PHP scripts.

<pre>Usage: node dynamic_server.js [options] [ROOT_PATH] [PORT]
  Default root is the current working directory
  Default port is 8888

Examples:
  node dynamic_server.js
  node dynamic_server.js 8080
  node dynamic_server.js --js=jss
  node dynamic_server.js --debug
  node dynamic_server.js --mime=text/html
  node dynamic_server.js --debug-brk --php /var/www/ 8080

  --debug     Run in debug mode
  --debug-brk Run in debug mode, and start with a break
  --help, -h  This help
  --js=ext    Set the file extension of JavaScript files to execute (default: js)
  --mime=val  Set the default mime type
  --php       Enable execution of .php files
</pre>

NOTE:
In order to debug, you need to use [node-inspector](http://github.com/dannycoates/node-inspector).  You can either extract the zipped copy,
or better yet, grab the latest code from the git repository.  When running in debugging mode, a second node process is started.  Currently,
you must access the debugger in a WebKit-based browser, like Chrome or Safari.
