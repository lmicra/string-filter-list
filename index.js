'use strict';

var fs = require('fs');

var validRegExpTest = /^\/(.+?)\/$/;

var DEBUG_ON = true;

var debug = DEBUG_ON ? console.log : function(){};

var EntryBehaviours = {
	BLOCK_NEW_ENTRIES: 1,
	ADD_NEW_ENTRIES: 2,
	IGNORE_NEW_ENTRIES: 3
};

var EntryTypes = {
	BLACKLISTED: 1,
	WHITELISTED: 2,
	IGNORED: 3,
	NEW_ENTRY: 4
};
	
var EntriesList = function() {
	this.normal_entries = {};
	this.regexp_entries = [];
};

EntriesList.prototype.addRegExp = function(regExpEntry) {
	// debug("adding reg exp", regExpEntry);
	if (typeof regExpEntry === "string") {
		this.regexp_entries.push(regExpEntry);
	}
};

EntriesList.prototype.add = function(entries) {
	if (typeof entries === "string") {
		// debug("adding:", entries);
		this.normal_entries[entries] = true;
	} else if (entries instanceof Array) {
		entries.forEach(function(entry){
			// debug("adding:", entry);
			this.entries[entry] = true;
		});
	}
};

/**
 * StringFilter class
 * @argument {EntryBehaviours} newEntryBehaviour
 */
function StringFilterList(newEntryBehaviour) {
	if (!newEntryBehaviour) {
		this._newEntryBehaviour = EntryBehaviours.IGNORE_NEW_ENTRIES;
	} else {
		this._newEntryBehaviour = newEntryBehaviour;
	};
	this._blacklist = new EntriesList();
	this._whitelist = new EntriesList();
	this._ignorelist = new EntriesList();
};

/**
 * _readLines - reads lines from the readStream input
 * @argument {ReadStream} input a readStream input
 * @argument {Function} func callback function (line, last_line)
 * @author http://stackoverflow.com/users/219401/mtomis
 * http://stackoverflow.com/a/6833016
 */
var _readLines = function (input, func) {
    var remaining = '';

    input.on('data', function(data) {
        remaining += data;
        var index = remaining.indexOf('\n');
        var last = 0;
        while (index > -1) {
            var line = remaining.substring(last, index);
            last = index + 1;
            func(line);
            index = remaining.indexOf('\n', last);
        }
        remaining = remaining.substring(last);
    });

    input.on('end', function() {
        if (remaining.length > 0) {
            func(remaining, true);
        } else {
			func(null, true);
		}
    });
};

StringFilterList.prototype._parseConfLine = function(line) {
	if(!line) return;
	var entry = line.substring(1);
	if(line[0] === '+') {
		var m = validRegExpTest.exec(entry);
		if (m) {
			// TODO: check if this is faster and memory efficient
			// _self.whitelist.addRegExp(new RegExp(entry));
			this._whitelist.addRegExp(m[1]);
		} else {
			this._whitelist.add(entry);
		}
	} else
	if(line[0] === '-') {
		var m = validRegExpTest.exec(entry);
		if (m) {
			// TODO: check if this is faster and memory efficient
			// _self.whitelist.addRegExp(new RegExp(entry));
			this._blacklist.addRegExp(m[1]);
		} else {
			this._blacklist.add(entry);
		}
	} else
	{
		// ignore, the entry is probably a user comment
	}
};

/**
 * parse - synchronously load the conf file
 * @argument {String} filename
 * @argument {Function} cb callback function to call when done parsing
 * @throws {Error} ENOENT if filename not found
 */
StringFilterList.prototype.parse = function(filename, cb) {
	var _self = this;

	var input = fs.createReadStream(filename);
	input.on('error', function(err) {
		cb(err);
	});
	_readLines(input, function(line, last) {
		_self._parseConfLine(line);
		if (last) cb();
	});
};

/**
 * test - test if string is with the lists
 * @argument {String} s the string to be searched
 * @argument {Function} cb optional callback function
 * @returns {EntryTypes} entry type response
 */
StringFilterList.prototype.test = function(s, cb) {
	// debug("testing:", s);
	// debug("test empty string");
	if (!s || typeof s !== 'string' || s.length === 0) return !cb ? EntryTypes.IGNORED : cb(EntryTypes.IGNORED);
	// debug("test ignore");
	if (this._ignorelist.normal_entries[s]) return !cb ? EntryTypes.IGNORED : cb(EntryTypes.IGNORED);
	// debug("test blacklisted");
	if (this._blacklist.normal_entries[s]) return !cb ? EntryTypes.BLACKLISTED : cb(EntryTypes.BLACKLISTED);
	// debug("test whitelisted");
	if (this._whitelist.normal_entries[s]) return !cb ? EntryTypes.WHITELISTED : cb(EntryTypes.WHITELISTED);
	
	// debug("test blacklisted regex");
	for (var i = this._blacklist.regexp_entries.length - 1 ; i >= 0; i--) {
		var regexp_entry = this._blacklist.regexp_entries[i];
		var regexp_re = new RegExp(regexp_entry);
		// debug(regexp_entry, regexp_re);
		if (!regexp_re.test(s)) continue;
		this._blacklist.add(s);
		return !cb ? EntryTypes.BLACKLISTED : cb(EntryTypes.BLACKLISTED);
	}

	// debug("test whitelisted regex");
	for (var i = this._whitelist.regexp_entries.length - 1; i >= 0; i--) {
		var regexp_entry = this._whitelist.regexp_entries[i];
		var regexp_re = new RegExp(regexp_entry);
		// debug(regexp_entry, regexp_re);
		if (!regexp_re.test(s)) continue;
		this._whitelist.add(s);
		return !cb ? EntryTypes.WHITELISTED : cb(EntryTypes.WHITELISTED);
	}

	if (this._newEntryBehaviour === EntryBehaviours.BLOCK_NEW_ENTRIES) {
		this._blacklist.add(s);
	} else
	if (this._newEntryBehaviour === EntryBehaviours.ADD_NEW_ENTRIES) {
		this._whitelist.add(s);
	} else
	{
		this._ignorelist.add(s);
	}
	return !cb ? EntryTypes.NEW_ENTRY : cb(EntryTypes.NEW_ENTRY);
};

StringFilterList.prototype._debug = function(title) {
	var title_d = !title ? '' : title + " - ";
	if (DEBUG_ON) {
		debug(title_d + "blacklisted: " + Object.keys(this._blacklist.normal_entries).join(' '));
		debug(title_d + "whitelisted: " + Object.keys(this._whitelist.normal_entries).join(' '));
		debug(title_d + "ignored: " + Object.keys(this._ignorelist.normal_entries).join(' '));
	}
};

module.exports = StringFilterList;
module.exports.EntryBehaviours = EntryBehaviours;
module.exports.EntryTypes = EntryTypes;
