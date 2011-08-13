[DynamicJS](https://github.com/nmrugg/DynamicJS): A simple Node HTTP server that dynamically executes JavaScript and even PHP scripts.

<pre>
Usage: node server.js [options] [ROOT_PATH] [PORT]
  Default root is the current working directory
  Default port is 8888

Examples:
  node server.js
  node server.js 8080
  node server.js --debug
  node server.js --feedback
  node server.js --js=jss
  node server.js --js /var/www/
  node server.js --mime=text/html
  node server.js --php --debug-brk=8000 /var/www/ 8080

  --debug[=port]     Run in debug mode, and optionally set the debugging port
  --debug-brk[=port] Run in debug mode, start with a break, and optionally set the debugging port
  --feedback         Output node messages to stdout
  --help, -h         This help
  --js[=ext]         Enable JS execution and optionally set the file extension to execute (default: js)
  --mime=val         Set the default mime type
  --php              Enable execution of .php files
</pre>

NOTE:
In order to debug, you need to use [node-inspector](http://github.com/dannycoates/node-inspector).  You can either extract the zipped copy,
or better yet, grab the latest code from the git repository.  When running in debugging mode, a second node process is started.  Currently,
you must access the debugger in a WebKit-based browser, like Chrome or Safari.
