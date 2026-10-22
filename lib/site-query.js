"use strict";

/** Projects and the "Website text" document in one request (used by the server and the static build). */
const PROJECTS_QUERY = require("./projects-query");
const SETTINGS_QUERY = require("./settings-query");

module.exports = `{
  "projects": ${PROJECTS_QUERY},
  "settings": ${SETTINGS_QUERY}
}`;
