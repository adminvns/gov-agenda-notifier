const { UserInputError, ForbiddenError } = require('apollo-server-express');

// TODO: We might want to have these set up in a config file for easy modification
const possibleStatuses = ['PENDING', 'IN PROGRESS', 'COMPLETED'];
const possibleTypes = ['test'];

module.exports = (logger) => {
  // --- Reusable functionality that's found in multiple validators is here at the top ---

  const throwUserInputError = (errorMsg, context) => {
    logger.debug(`UserInputError - ${context}: ${errorMsg}`);
    throw new UserInputError(errorMsg);
  };

  const validateStatus = (status, fieldName, context) => {
    // The status should be included in the list of allowed statuses
    if (!possibleStatuses.includes(status)) {
      const msg = 'Invalid "status" field';
      logger.debug(`Status input: ${status}`);
      throwUserInputError(msg, context);
    }
  };

  const validateType = (type, fieldName, context) => {
    // Meeting type should be included in the list of allowed types
    if (!possibleTypes.includes(type)) {
      const msg = `Invalid "${fieldName}" field.`;
      logger.debug(`Type input: ${type}`);
      throwUserInputError(msg, context);
    }
  };

  // Taken from: https://stackoverflow.com/questions/175739/built-in-way-in-javascript-to-check-if-a-string-is-a-valid-number
  // Returns a boolean representing whether the string is a numeric whole number
  const isNumericString = (string) => /^\d+$/.test(string);

  const validateTimestamp = (ts, fieldName, context) => {
    const tsIsNumeric = isNumericString(ts);
    if (!tsIsNumeric) {
      const msg = `Invalid "${fieldName}" field. Timestamp is not numeric.`;
      logger.debug(`Timestamp: ${ts}`);
      throwUserInputError(msg, context);
    }
    const isValidDate = new Date(parseInt(ts, 10)).getTime() > 0;
    if (!isValidDate) {
      const msg = `Invalid "${fieldName}" field. Timestamp is not a valid date.`;
      logger.debug(`Timestamp: ${ts}`);
      throwUserInputError(msg, context);
    }
  };

  const validateFutureTimestamp = (ts, fieldName, context) => {
    validateTimestamp(ts, fieldName, context);

    const now = new Date();
    const isFutureDate = ts >= now;
    if (!isFutureDate) {
      const msg = `Invalid "${fieldName}" field. Timestamp doesn't reference a future date.`;
      logger.debug(`Timestamp: ${ts}`);
      throwUserInputError(msg, context);
    }
  };

  const validateURL = (url, fieldName, context) => {
    // Taken from: https://stackoverflow.com/questions/5717093/check-if-a-javascript-string-is-a-url
    const pattern = new RegExp('^(https?:\\/\\/)?' // protocol
      + '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' // domain name
      + '((\\d{1,3}\\.){3}\\d{1,3}))' // OR ip (v4) address
      + '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' // port and path
      + '(\\?[;&a-z\\d%_.~+=-]*)?' // query string
      + '(\\#[-a-z\\d_]*)?$', 'i'); // fragment locator
    const isvalidURL = pattern.test(url);

    if (!isvalidURL) {
      const msg = `Invalid "${fieldName}" field. Bad URL.`;
      logger.debug(`URL: ${url}`);
      throwUserInputError(msg, context);
    }
  };

  // --- Here's the actual exported validation functionality: ---

  const module = {};

  module.validateAuthorization = (isAdmin, context) => {
    if (!isAdmin) {
      logger.debug(`${context}: Attempted without admin credentials`);
      throw new ForbiddenError('No admin credentials provisioned. Log in.');
    }
  };

  module.validateCreateMeeting = (args) => {
    const context = 'validateCreateMeeting';

    const meetingStartTimestamp = args.meeting_start_timestamp;
    const virtualMeetingURL = args.virtual_meeting_url;
    const meetingType = args.meeting_type;
    const { status } = args;

    validateFutureTimestamp(meetingStartTimestamp, 'meeting_start_timestamp', context);
    validateURL(virtualMeetingURL, 'virtual_meeting_url', context);
    validateType(meetingType, 'meeting_type', context);
    validateStatus(status, 'status', context);
  };

  module.validateUpdateMeeting = (args) => {
    const context = 'validateUpdateMeeting';

    // No need to validate ID here because the graphQL schema takes care of it well enough

    const { status } = args;
    const meetingType = args.meeting_type;
    const virtualMeetingUrl = args.virtual_meeting_url;
    const meetingStartTimestamp = args.meeting_start_timestamp;
    const meetingEndTimestamp = args.meeting_end_timestamp;

    validateTimestamp(meetingStartTimestamp, 'meeting_start_timestamp', context);
    validateTimestamp(meetingEndTimestamp, 'meeting_end_timestamp', context);
    validateURL(virtualMeetingUrl, 'virtual_meeting_url', context);
    validateType(meetingType, 'meeting_type', context);
    validateStatus(status, 'status', context);
  };

  return module;
};
