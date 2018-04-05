#!/usr/bin/env node

/*eslint-env node*/
'use strict';

// https://stackoverflow.com/questions/1960473/get-all-unique-values-in-an-array-remove-duplicates/14438954#14438954
var onlyUnique = function (value, index, self) {
    return self.indexOf(value) === index;
}

var getLocalIpAddresses = function () {
    // Reference: http://stackoverflow.com/questions/3653065/get-local-ip-address-in-node-js/8440736#8440736
    var os = require('os');

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

    localIpAddresses.sort();
    localIpAddresses = localIpAddresses.filter(onlyUnique);
    return localIpAddresses;
};

var getLocalHostnames = function (localIpAddresses) {
    var parseHosts = require('parse-hosts');

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

    localHostnames.sort();
    localHostnames = localHostnames.filter(onlyUnique);
    return localHostnames;
};

var getLocalIpAddressesAndHostnames = function () {
    var localIpAddresses = getLocalIpAddresses(),
        localHostnames = getLocalHostnames(localIpAddresses),
        localIpAddressesAndHostnames = localIpAddresses.concat(localHostnames);

    localIpAddressesAndHostnames.sort();
    localIpAddressesAndHostnames = localIpAddressesAndHostnames.filter(onlyUnique);
    return localIpAddressesAndHostnames;
};

if (!module.parent) {
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
//     getLocalIpAddresses() = ['10.0.0.101', '127.0.0.1', '192.168.1.101']
//     getLocalHostnames() = ['example.com', 'localhost']
//     getLocalIpAddressesAndHostnames() = ['10.0.0.101', '127.0.0.1', '192.168.1.101', 'example.com', 'localhost']
