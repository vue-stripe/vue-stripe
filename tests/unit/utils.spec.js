// test.js

import { isSecureHost, hasElementIntent } from '../../src/utils'; // Replace 'your-file' with the actual file path where the functions are located.

describe('isSecureHost', () => {
  it('should return true when testMode is true', () => {
    const result = isSecureHost(true);
    expect(result).toBe(true);
  });

  it('should return true when the host is localhost', () => {
    // Mock the window object for testing purposes
    delete window.location;
    window.location = { hostname: 'localhost', protocol: 'http:' };

    const result = isSecureHost(false);
    expect(result).toBe(true);
  });

  it('should return true when the protocol is https', () => {
    // Mock the window object for testing purposes
    delete window.location;
    window.location = { hostname: 'example.com', protocol: 'https:' };

    const result = isSecureHost(false);
    expect(result).toBe(true);
  });

  it('should return false when testMode is false, and the host is not localhost, and the protocol is not https', () => {
    // Mock the window object for testing purposes
    delete window.location;
    window.location = { hostname: 'example.com', protocol: 'http:' };

    const result = isSecureHost(false);
    expect(result).toBe(false);
  });
});

describe('hasElementIntent', () => {
  it('should return true when all options are present', () => {
    const options = { mode: 'mode', currency: 'USD', amount: 100 };
    const result = hasElementIntent(options);
    expect(result).toBe(true);
  });

  it('should return false when any option is missing', () => {
    const options1 = { mode: 'mode', currency: 'USD' };
    const options2 = { currency: 'USD', amount: 100 };
    const options3 = { mode: 'mode', amount: 100 };

    const result1 = hasElementIntent(options1);
    const result2 = hasElementIntent(options2);
    const result3 = hasElementIntent(options3);

    expect(result1).toBe(false);
    expect(result2).toBe(false);
    expect(result3).toBe(false);
  });
});
