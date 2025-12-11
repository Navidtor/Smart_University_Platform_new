import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';
import 'whatwg-fetch';

// Polyfill TextEncoder/TextDecoder for MSW in Jest
Object.assign(global, { TextEncoder, TextDecoder });