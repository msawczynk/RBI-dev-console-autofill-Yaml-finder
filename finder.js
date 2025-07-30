(function() {
  // Helper: check if an element is visible (rendered in layout)
  function isVisible(el) {
    return el && el.offsetWidth > 0 && el.offsetHeight > 0;  // non-zero dimensions:contentReference[oaicite:5]{index=5}
  }
  // Helper: get a stable CSS selector for an element (id > name > class)
  function cssSelector(el) {
    if (!el) return "";
    if (el.id) return "#" + el.id;
    if (el.name) return "input[name='" + el.name + "']";
    if (el.className) {
      var cls = el.className.trim().split(/\s+/)[0];
      if (cls) return "." + cls;
    }
    return el.tagName ? el.tagName.toLowerCase() : "";
  }
  // Find visible password inputs
  var pwdElems = [], allPwds = document.querySelectorAll("input[type='password']");
  for (var i = 0; i < allPwds.length; i++) {
    if (isVisible(allPwds[i])) pwdElems.push(allPwds[i]);
  }
  if (pwdElems.length === 0) {
    console.warn("No visible password field found. Make sure the login form is open.");
    return;
  }
  // Identify password field (and possibly username field if disguised as password)
  var pwdField = null, userField = null;
  if (pwdElems.length > 1) {
    // Multiple password-type inputs – try to distinguish username vs password
    var firstPwd = pwdElems[0], secondPwd = pwdElems[1];
    var attr1 = (firstPwd.name + " " + firstPwd.id + " " + (firstPwd.placeholder||"")).toLowerCase();
    var attr2 = (secondPwd.name + " " + secondPwd.id + " " + (secondPwd.placeholder||"")).toLowerCase();
    if (attr1.match(/user|email|login/)) {
      userField = firstPwd;
      pwdField = secondPwd;
    } else if (attr2.match(/user|email|login/)) {
      userField = secondPwd;
      pwdField = firstPwd;
    } else {
      // No clear clues – assume first is username, second is password
      userField = firstPwd;
      pwdField = secondPwd;
    }
  } else {
    // Single password field – find username field in the vicinity
    pwdField = pwdElems[0];
    // Look within the same form or section for a text/email input
    var container = pwdField.closest ? pwdField.closest("form") : null;
    if (!container) container = pwdField.closest("div, section, article") || document;
    var textInput = container.querySelector("input[type='text'], input[type='email']");
    if (textInput && isVisible(textInput)) {
      userField = textInput;
    } else {
      userField = null;
    }
  }
  if (!userField) {
    console.warn("Username field not found – using password field only.");
  }
  // Determine if a submit button click is needed
  var form = pwdField.form || (userField && userField.form);
  var submitSelector = "";
  if (!form || !form.querySelector("input[type='submit'], button[type='submit']")) {
    // No proper form or no default submit button – find a clickable button to include
    var scope = form || (pwdField.closest ? pwdField.closest("div, section, article") : null) || document;
    var btnCandidates = scope.querySelectorAll("button, input[type='submit'], [role='button']");
    for (var j = 0; j < btnCandidates.length; j++) {
      if (isVisible(btnCandidates[j])) {
        submitSelector = cssSelector(btnCandidates[j]);
        break;
      }
    }
  }
  // Build YAML string
  var pagePath = location.host + location.pathname;
  var yaml = "- page: \"" + pagePath + "\"\n";
  yaml += "  username-field: \"" + cssSelector(userField) + "\"\n";
  yaml += "  password-field: \"" + cssSelector(pwdField) + "\"";
  if (submitSelector) {
    yaml += "\n  submit: \"" + submitSelector + "\"";
  }
  // Output YAML to console and copy to clipboard
  console.log(yaml);
  if (navigator.clipboard) {
    navigator.clipboard.writeText(yaml).catch(function(e){ /* clipboard write failed */ });
  }
})();
