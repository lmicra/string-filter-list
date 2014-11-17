String Filter List
==================

String Filter List checks for strings within a list populated by a configuration file.

Install
-------

`npm install string-filter-list`

Usage
-----

### Basic usage

```javascript
var sfl = require('./string-filter-list');

var sf1 = new sfl(sfl.EntryBehaviours.BLOCK_NEW_ENTRIES),
    sf2 = new sfl(sfl.EntryBehaviours.ADD_NEW_ENTRIES),
    sf3 = new sfl();

sf1._debug('list 1');
sf2._debug('list 2');
sf3._debug('list 3');
console.log();

console.log(sf1.test('blocked') === sfl.EntryTypes.NEW_ENTRY);
console.log(sf2.test('added') === sfl.EntryTypes.NEW_ENTRY);
console.log(sf3.test('ignored') === sfl.EntryTypes.NEW_ENTRY);
sf1._debug('list 1');
sf2._debug('list 2');
sf3._debug('list 3');
console.log();

console.log(sf1.test('blocked') === sfl.EntryTypes.BLACKLISTED);
console.log(sf2.test('added') === sfl.EntryTypes.WHITELISTED);
console.log(sf3.test('ignored') === sfl.EntryTypes.IGNORED);
sf1._debug('list 1');
sf2._debug('list 2');
sf3._debug('list 3');
console.log();
```

#### EntryBehaviours

```json
{
    BLOCK_NEW_ENTRIES: 1,
    ADD_NEW_ENTRIES: 2,
    IGNORE_NEW_ENTRIES: 3
}
```

#### EntryTypes

```json
{
    BLACKLISTED: 1,
    WHITELISTED: 2,
    IGNORED: 3,
    NEW_ENTRY: 4
}
```

Configuration File Format
-------------------------

```apache
# (uses apache because i couldn't find configuration file highlighter)
# a comment
# a blacklisted entry
-www.google.com
# a blacklisted regular expression entry
-/^(.*?\.|)google\.com$/
# a whitelisted entry
+www.yahoo.com
# a whitelisted regular expression entry
+/^(.+?\.|)yahoo\.com$/
```

### Configuration file reading

```javascript
var sfl = require('./string-filter-list');

var sf4 = new sfl(sfl.EntryBehaviours.IGNORE_NEW_ENTRIES);
sf4.parse('sfl01.conf', function(err) {
    if (!err) {
        sf4._debug();

        console.log(sf4.test('www.google.com'));
        console.log(sf4.test('mail.google.com'));
        console.log(sf4.test('www.yahoo.com'));
        console.log(sf4.test('mail.yahoo.com'));

        console.log(sf4.test('www.google.com'));
        console.log(sf4.test('mail.google.com'));
        console.log(sf4.test('www.yahoo.com'));
        console.log(sf4.test('mail.yahoo.com'));

        sf4._debug();
    } else {
        console.log("error found:\n" + err.stack);
    }
});
```
TODOs
-----

- clear lists
- parse: parse a new list
- parse: append to list (no need todo as it is the default behaviour)
- parse: check duplicate entries for regular expressions
- list: use a database to store the entries, might be slower but memory efficient
- list: send StringFilterList.prototype.test function to EntriesList.prototype.(test|testRE)

Copyright 2014 Luis Albino.
