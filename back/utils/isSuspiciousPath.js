const suspiciousPatterns = [
  ".env",
  ".git/",
  ".git\\",
  ".metrics",
  "phpunit",
  "eval-stdin.php",
  "wp-admin",
  "wp-content",
  "wp-includes",
  "wp-json",
  "wordpress",
  "xmlrpc.php",
  "laravel",
  "allow_url_include",
  "auto_prepend_file",
  "php://input",
  "pearcmd",
  "think\\app",
  "think%5capp",
  "invokefunction",
  "containers/json",
  "hello.world",
  "owa/auth",
];

const suspiciousExtensions = [
  ".php",
  ".ph",
  ".phtml",
  ".aspx",
  ".asp",
  ".jsp",
  ".cgi",
];

const isSuspiciousPath = (url = "") => {
  const lowerUrl = String(url).toLowerCase();
  const pathOnly = lowerUrl.split("?")[0];

  const hasSuspiciousPattern = suspiciousPatterns.some((pattern) =>
    lowerUrl.includes(pattern),
  );

  const hasSuspiciousExtension = suspiciousExtensions.some((extension) =>
    pathOnly.endsWith(extension),
  );

  return hasSuspiciousPattern || hasSuspiciousExtension;
};

module.exports = isSuspiciousPath;
