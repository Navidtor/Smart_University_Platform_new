import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

// Polyfill TextEncoder/TextDecoder for MSW in Jest
Object.assign(global, { TextEncoder, TextDecoder });

// Polyfill fetch for MSW
import { fetch, Headers, Request, Response } from 'undici';
Object.assign(global, { fetch, Headers, Request, Response });