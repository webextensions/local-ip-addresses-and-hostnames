#!/usr/bin/env node

/*eslint-env node*/
'use strict';

const matchesPopularPath = function (path) {
    if (
        path === 'localhost' ||
        path === '127.0.0.1' ||
        path.startsWith('192.168.')
    ) {
        return true;
    } else {
        return false;
    }
};

var ensurePreferredEntriesAtTop = function (entriesInput, preferredEntriesInput) {
    let entries = [...entriesInput];
    let preferredEntries = [...preferredEntriesInput];

    preferredEntries = preferredEntries.filter(function (preferredEntry) {
        return entries.includes(preferredEntry);
    });
    entries = entries.filter(function (entry) {
        return !(preferredEntries.includes(entry));
    });
    entries = preferredEntries.concat(entries);

    return entries;
};

const sortWithPopularPathsFirst = function (a, b) {
    if (matchesPopularPath(a)) {
        if (!matchesPopularPath(b)) {
            return -1;
        }
    } else if (matchesPopularPath(b)) {
        return 1;
    }

    if (a < b) {
        return -1;
    } else if (a > b) {
        return 1;
    } else {
        return 0;
    }
};

var getLocalIpAddresses = function (options = {}) {
    // Reference: http://stackoverflow.com/questions/3653065/get-local-ip-address-in-node-js/8440736#8440736
    var os = require('os');

    var preferredEntries = options.preferredEntries || ['127.0.0.1'];

    var localIpAddresses = [];

    var ifaces = os.networkInterfaces();
    Object.keys(ifaces).forEach(function(ifname) {
        ifaces[ifname].forEach(function(iface) {
            if (iface.family !== 'IPv4') {
                // skip over non-ipv4 addresses
                return;
            }
            localIpAddresses.push(iface.address);
        });
    });

    localIpAddresses = [...new Set(localIpAddresses)];
    localIpAddresses.sort(sortWithPopularPathsFirst);
    localIpAddresses = ensurePreferredEntriesAtTop(localIpAddresses, preferredEntries);

    return localIpAddresses;
};

var getLocalHostnames = function (options = {}) {
    var parseHosts = require('@webextensions/parse-hosts');

    var preferredEntries = options.preferredEntries || ['localhost', 'example.com'];

    var localIpAddresses = options.localIpAddresses || getLocalIpAddresses();
    var localIpAddresses = localIpAddresses || getLocalIpAddresses();

    var ipAddressesToHostsMap = {};
    try {
        ipAddressesToHostsMap = parseHosts.get();
    } catch (e) {
        // do nothing
    }

    ipAddressesToHostsMap = (function (ipAddressesToHostsMap, localIpAddresses) {
        var ob = {};
        Object.keys(ipAddressesToHostsMap).forEach(function (key) {
            if (localIpAddresses.indexOf(key) >= 0) {
                ob[key] = ipAddressesToHostsMap[key];
            }
        });
        return ob;
    }(ipAddressesToHostsMap, localIpAddresses));

    var localHostnames = (function (ipAddressesToHostsMap) {
        var localHostnames = [];
        Object.keys(ipAddressesToHostsMap).forEach(function (key) {
            localHostnames = localHostnames.concat(ipAddressesToHostsMap[key]);
        });
        return localHostnames;
    }(ipAddressesToHostsMap));

    localHostnames = [...new Set(localHostnames)];
    localHostnames.sort(sortWithPopularPathsFirst);
    localHostnames = ensurePreferredEntriesAtTop(localHostnames, preferredEntries);

    return localHostnames;
};

var getLocalIpAddressesAndHostnames = function (options = {}) {
    var localIpAddresses = getLocalIpAddresses(),
        localHostnames = getLocalHostnames({ localIpAddresses }),
        localIpAddressesAndHostnames = localIpAddresses.concat(localHostnames);

    var preferredEntries = options.preferredEntries || ['localhost', 'example.com'];

    localIpAddressesAndHostnames = [...new Set(localIpAddressesAndHostnames)];
    localIpAddressesAndHostnames.sort(sortWithPopularPathsFirst);
    localIpAddressesAndHostnames = ensurePreferredEntriesAtTop(localIpAddressesAndHostnames, preferredEntries);

    return localIpAddressesAndHostnames;
};

if (
    module.parent || // It has been loaded via `require()` syntax
    (!module.parent && typeof require == 'function' && !require.main) // It has been loaded via `import` syntax
) {
    // do nothing
} else { // It has been loaded via `node` command
    console.log('Local IP addresses: ', JSON.stringify(getLocalIpAddresses(), null, '    '));
    console.log('\nLocal hostnames: ', JSON.stringify(getLocalHostnames(), null, '    '));
    console.log('\nLocal IP addresses and hostnames: ', JSON.stringify(getLocalIpAddressesAndHostnames(), null, '    '));
}

module.exports = {
    getLocalIpAddresses: getLocalIpAddresses,
    getLocalHostnames: getLocalHostnames,
    getLocalIpAddressesAndHostnames: getLocalIpAddressesAndHostnames
};

// Examples:
//     getLocalIpAddresses() = ['127.0.0.1', '192.168.1.101', '10.0.0.101']
//     getLocalHostnames() = ['localhost', 'example.com']
//     getLocalIpAddressesAndHostnames() = ['127.0.0.1', '192.168.1.101', 'localhost', '10.0.0.101', 'example.com']
