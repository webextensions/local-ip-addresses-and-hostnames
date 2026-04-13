import { describe, it, expect } from 'vitest';
import {
    getLocalIpAddresses,
    getLocalHostnames,
    getLocalIpAddressesAndHostnames
} from './local-ip-addresses-and-hostnames.js';

describe('getLocalIpAddresses', () => {
    it('returns an array that includes the loopback address', () => {
        const result = getLocalIpAddresses();
        expect(Array.isArray(result)).toBe(true);
        expect(result).toContain('127.0.0.1');
    });

    it('contains no duplicates', () => {
        const result = getLocalIpAddresses();
        expect(result.length).toBe(new Set(result).size);
    });

    it('places 127.0.0.1 ahead of any non-popular address', () => {
        const result = getLocalIpAddresses();
        const loopbackIndex = result.indexOf('127.0.0.1');
        const firstNonPopular = result.findIndex(
            (entry) => entry !== '127.0.0.1' && !entry.startsWith('192.168.')
        );
        if (firstNonPopular !== -1) {
            expect(loopbackIndex).toBeLessThan(firstNonPopular);
        }
    });
});

describe('getLocalHostnames', () => {
    it('returns an array that includes "localhost"', () => {
        const result = getLocalHostnames();
        expect(Array.isArray(result)).toBe(true);
        expect(result).toContain('localhost');
    });

    it('contains no duplicates', () => {
        const result = getLocalHostnames();
        expect(result.length).toBe(new Set(result).size);
    });

    it('does not include a preferredEntry that is absent from /etc/hosts and not *.localhost', () => {
        const bogus = 'this-host-does-not-exist-' + Date.now() + '.invalid';
        const result = getLocalHostnames({ preferredEntries: [bogus] });
        expect(result).not.toContain(bogus);
    });

    it('auto-includes a *.localhost preferredEntry that is not in /etc/hosts', () => {
        const entry = 'vitest-probe-' + Date.now() + '.localhost';
        const result = getLocalHostnames({ preferredEntries: [entry] });
        expect(result).toContain(entry);
    });

    it('hoists an auto-included *.localhost entry to the top', () => {
        const entry = 'vitest-top-' + Date.now() + '.localhost';
        const result = getLocalHostnames({
            preferredEntries: [entry, 'localhost']
        });
        expect(result[0]).toBe(entry);
    });

    it('auto-includes multi-label *.localhost entries (e.g. foo.bar.localhost)', () => {
        const entry = 'foo.bar.vitest-' + Date.now() + '.localhost';
        const result = getLocalHostnames({ preferredEntries: [entry] });
        expect(result).toContain(entry);
    });

    it('rejects the bare ".localhost" string', () => {
        const result = getLocalHostnames({ preferredEntries: ['.localhost'] });
        expect(result).not.toContain('.localhost');
    });

    it('matches the .localhost suffix case-insensitively and preserves original casing', () => {
        const entry = 'Vitest-Case-' + Date.now() + '.LOCALHOST';
        const result = getLocalHostnames({ preferredEntries: [entry] });
        expect(result).toContain(entry);
    });
});

describe('getLocalIpAddressesAndHostnames', () => {
    it('returns a combined array of IPs and hostnames', () => {
        const result = getLocalIpAddressesAndHostnames();
        expect(Array.isArray(result)).toBe(true);
        expect(result).toContain('127.0.0.1');
        expect(result).toContain('localhost');
    });

    it('contains no duplicates', () => {
        const result = getLocalIpAddressesAndHostnames();
        expect(result.length).toBe(new Set(result).size);
    });

    it('auto-includes a *.localhost preferredEntry and hoists it to the top', () => {
        const entry = 'vitest-combined-' + Date.now() + '.localhost';
        const result = getLocalIpAddressesAndHostnames({
            preferredEntries: [entry]
        });
        expect(result).toContain(entry);
        expect(result[0]).toBe(entry);
    });

    it('includes each auto-resolvable entry only once even when supplied via preferredEntries', () => {
        const entry = 'vitest-once-' + Date.now() + '.localhost';
        const result = getLocalIpAddressesAndHostnames({
            preferredEntries: [entry]
        });
        const occurrences = result.filter((x) => x === entry).length;
        expect(occurrences).toBe(1);
    });
});
