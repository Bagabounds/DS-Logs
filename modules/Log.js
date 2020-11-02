var constants = {
        TABLES: {
            LOG: 'logs',
            LOGOPTIONS: 'logs_options',
            BUNDLE: 'bundle'
        },
        LOG: {
            INFO: 3,
            ERROR: 1,
            DEBUG: 4,
            WARNING: 2
        },
    }
    /**
     * Initialize the Log with optional options.
     *
     * @param {object} [options] | An object allowing for log options.
     * @param {number} [options.level=3] | The logging level you want log messages to appear in, defaults to INFO.
     * @param {boolean} [options.backgroundLog=false] | It allows for logging messages using gs.info(), usefull for backgroundscripts.
     */
var Log = Class.create({
    initialize: function() {
        this.CONSTANTS = constants;
        this.transaction = $transaction.toJSON();
        this.setSource(this._getBundleName());
        this.options = this._getOptions();
        this.setLevel(options.level);
    },

    /**
     * Allows for a source to be set for the log messages. Used to indicate where a log message comes from.
     *
     * @param {*} source | Should be a GlideRecord object of a QueueTable record.
     * @returns {undefined}
     */
    setSource: function(source) {
        this.source = source;
    },

    /**
     * Allows for a level to be set after initialization as well.
     *
     * @param {string/number} level | The level of logging
     * @returns {undefined} this.level | Will be the validated log level
     */
    setLevel: function(level) {
        this.level = level;
    },

    test: function(message) {
        console.log(message)
    },

    // --------------------------------------------------
    // External fuctions | Complete passthrough
    // --------------------------------------------------
    info: function() {
        return this._log(this.CONSTANTS.LOG.INFO, arguments);
    },

    error: function() {
        return this._log(this.CONSTANTS.LOG.ERROR, arguments);
    },

    debug: function() {
        return this._log(this.CONSTANTS.LOG.DEBUG, arguments);
    },

    warning: function() {
        return this._log(this.CONSTANTS.LOG.WARNING, arguments);
    },


    // --------------------------------------------------
    // Internal main fuctions
    // --------------------------------------------------
    /**
     * Handles the actual logging logic and determins based on level if a message is to be logged or not
     *
     * @param {number} level | The level of logging 1:error, 2:warning, 3:info, 4:debug
     * @param {object Arguments} rawArgs | Any amount of arguments provided in the "External" fuctions or "Backwards compatibility support" functions
     * @returns {boolean} In case of an error log we want the response to be false so the log can be used in a return statement
     */
    _log: function(level, rawArgs) {

        // Do not (for example) log info and debug messages if you only want to see errors and warnings
        // (*1 to do an integer comparison if the number is a string
        if (this.level * 1 < level) {
            return this._response(level);
        }

        var message = this._prepareMessage(rawArgs);

        // Allow for 'printing' every log message to the 'console'. Helpfull when debugging in a background script
        if (this.backgroundLog) {
            console.log(this.utils.getTimestamp() + ' | ' +
                this.utils.find(Object.keys(this.CONSTANTS.LOG), function(v) {
                    return this.CONSTANTS.LOG[v] == level;
                }, this) +
                ' | source ' + this.source + ' | ' + message);
        }

        this._createLog(level, message);

        return this._response(level);
    },


    // --------------------------------------------------
    // Helper fuctions
    // --------------------------------------------------

    _getBundleName: function() {
        var sourceBundle = new FRecord(this.CONSTANTS.TABLES.BUNDLE);
        sourceBundle.addSearch('bundle_id', this.transaction.bundle_id.split('-')[0]);
        sourceBundle.search();
        if (sourceBundle.hasNext()) {
            sourceBundle.next();
            return sourceBundle.name;
        }
    },
    _getOptions: function() {
        var options = new FRecord(this.CONSTANTS.TABLES.LOGOPTIONS);
        options.addSearch('bundle', this.source);
        options.search();
        if (options.hasNext()) {
            options.next();
            return options;
        }
    },
    /**
     * Prepares the provided arguments to be logged as newline seperated readable strings. It also allows for the gs.info log option
     *
     * @param {object Arguments} rawArgs | Any amount of arguments provided in the "External" fuctions or "Backwards compatibility support" functions
     * @returns {string} Sets the message
     */
    _prepareMessage: function(rawArgs) {

        var LogID, message, args = this._toArray(rawArgs);
        LogID = this._createLog(message);

        if (this.options.type !== 1) {
            console.log(LogId + ' | ' + message);
        }

        // Create the log message in which arguments are seperated by a newline
        return args.join('\n');
    },

    _toArray: function(args) {
        if (args === undefined || args === null) { return []; }
        return Array.prototype.slice.call(args);
    },

    /**
     *
     *
     * @param {string} message |
     * @param {array} args |
     * @returns {string}
     */

    /**
     * Prepares the provided arguments to be logged as newline seperated readable strings. It also allows for the gs.info log option
     *
     * @param {number} level | The log level that was called in the _log function
     * @param {string} message | The log message as a newline seperated readable string
     * @returns {undefined}
     */
    _createLog: function(level, message) {
        var frLog = new FRecord(this.CONSTANTS.TABLES.LOG);
        frLog.level = level;
        frLog.record = this.record;
        frLog.source = this.source;
        frLog.message = message;
        frLog.timestamp = new Date().getTime();
        frLog.user = this.transaction.active_user;
        return frLog.insert();
    },

    /**
     * Allows for log messages to be used in return statements
     *
     * @param {*} level | The log that has been issued | 1,2,3,4 | error, warning, info, debug
     * @returns {boolean} false if an error has been logged, true otherwise
     */
    _response: function(level) {
        return (level !== this.CONSTANTS.LOG.ERROR);
    },

    type: 'Log'

});

module.exports = Log;