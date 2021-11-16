import "@testing-library/jest-dom/extend-expect";

import { server } from "../server-mocks/index";

jest.mock("next/router", () => {
  return {
    __esModule: true,
    default: jest.fn(),
    useRouter: jest.fn(),
  };
});

// See: https://www.npmjs.com/package/@shopify/jest-dom-mocks

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // Deprecated
    removeListener: jest.fn(), // Deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

Object.defineProperty(window, "ResizeObserver", {
  writable: true,
  value: jest.fn().mockImplementation(() => ({
    observe: () => {
      // do nothing
    },
    unobserve: () => {
      // do nothing
    },
    disconnect: () => {
      // do nothing
    },
  })),
});

Object.defineProperty(window, "ResizeObserverEntry", {
  writable: true,
  value: jest.fn().mockImplementation(() => ({})),
});

Object.defineProperty(window, "requestIdleCallback", {
  writable: true,
  value: jest.fn().mockImplementation((fn) => {
    fn();
  }),
});

beforeAll(() =>
  server.listen({
    onUnhandledRequest: ({ method, url }) => {
      console.log(`Unhandled request: ${method} => ${url}`);
      //  server.printHandlers();
    },
  })
);
afterAll(() => server.close());

beforeEach(() => {
  server.resetHandlers();
});