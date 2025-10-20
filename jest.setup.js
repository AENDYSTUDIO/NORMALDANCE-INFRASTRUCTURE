// Mock Next.js modules
jest.mock("next/router", () => ({
  useRouter: () => ({
    push: jest.fn(),
    pop: jest.fn(),
    reload: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    prefetch: jest.fn().mockResolvedValue(undefined),
    query: {},
    asPath: "/",
    route: "/",
    events: {
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
    },
    isFallback: false,
  }),
}));

jest.mock("next/image", () => ({
  default: (props) => {
    return global.React.createElement("img", props);
  },
}));

jest.mock("next/font/google", () => ({
  Inter: () => ({
    className: "font-inter",
    style: {},
  }),
}));

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock fetch
global.fetch = jest.fn();

// Mock WebSocket
global.WebSocket = jest.fn();

// Mock console methods to reduce noise during tests
beforeEach(() => {
  jest.spyOn(console, "log").mockImplementation(() => {});
  jest.spyOn(console, "warn").mockImplementation(() => {});
  jest.spyOn(console, "error").mockImplementation(() => {});
  jest.spyOn(console, "info").mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

// Mock IPFS client - moved to separate file to avoid module resolution issues
jest.mock("./tests/__mocks__/ipfs-http-client", () => ({
  create: jest.fn(() => ({
    add: jest.fn().mockResolvedValue({ cid: "test-cid" }),
    cat: jest.fn().mockImplementation(async function* () {
      yield new Uint8Array([1, 2, 3]);
    }),
    object: {
      stat: jest.fn().mockResolvedValue({ size: 1000 }),
    },
  })),
}));

// Mock the actual ipfs-http-client module
jest.mock("ipfs-http-client", () => ({
  create: jest.fn(() => ({
    add: jest.fn().mockResolvedValue({ cid: "test-cid" }),
    cat: jest.fn().mockImplementation(async function* () {
      yield new Uint8Array([1, 2, 3]);
    }),
    object: {
      stat: jest.fn().mockResolvedValue({ size: 1000 }),
    },
  })),
}));

// Mock Pinata SDK - moved to separate file
jest.mock("pinata-sdk", () => {
  // Import the module using dynamic import to avoid require() issues
  const pinataSDK = jest.requireActual("./tests/__mocks__/pinata-sdk");
  return pinataSDK;
});

// Mock fileType - moved to separate file
jest.mock("file-type", () => {
  const fileType = jest.requireActual("./tests/__mocks__/file-type");
  return fileType;
});

// Mock mime-types - moved to separate file
jest.mock("mime-types", () => {
  const mimeTypes = jest.requireActual("./tests/__mocks__/mime-types");
  return mimeTypes;
});

// Mock Solana web3
jest.mock("@solana/web3.js", () => ({
  Connection: jest.fn(),
  PublicKey: jest.fn(),
  Transaction: jest.fn(),
  SystemProgram: jest.fn(),
  LAMPORTS_PER_SOL: 10000000,
  Keypair: jest.fn(),
  sendAndConfirmTransaction: jest.fn(),
  getAssociatedTokenAddress: jest.fn(),
  createAssociatedTokenAccountInstruction: jest.fn(),
  createTransferInstruction: jest.fn(),
  createMint: jest.fn(),
  createMintToInstruction: jest.fn(),
  createAccount: jest.fn(),
  createInitializeMintInstruction: jest.fn(),
  createAssociatedTokenAccount: jest.fn(),
  getAccount: jest.fn(),
  getBalance: jest.fn(),
  sendTransaction: jest.fn(),
  clusterApiUrl: jest.fn().mockReturnValue("https://api.devnet.solana.com"),
}));

// Mock wallet adapters
jest.mock("@solana/wallet-adapter-base", () => ({
  WalletAdapter: class {
    constructor() {
      this.connect = jest.fn();
      this.disconnect = jest.fn();
      this.signTransaction = jest.fn();
      this.signAllTransactions = jest.fn();
    }
  },
  BaseSignerWalletAdapter: class {
    constructor() {
      this.connect = jest.fn();
      this.disconnect = jest.fn();
      this.signTransaction = jest.fn();
      this.signAllTransactions = jest.fn();
    }
  },
}));

jest.mock("@solana/wallet-adapter-phantom", () => ({
  PhantomWalletAdapter: class {
    constructor() {
      this.connect = jest.fn();
      this.disconnect = jest.fn();
      this.signTransaction = jest.fn();
      this.signAllTransactions = jest.fn();
    }
  },
}));

// Mock Prisma
jest.mock("@prisma/client", () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    track: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    playlist: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    like: {
      create: jest.fn(),
      delete: jest.fn(),
    },
    comment: {
      create: jest.fn(),
      delete: jest.fn(),
    },
    reward: {
      create: jest.fn(),
    },
    follow: {
      create: jest.fn(),
      delete: jest.fn(),
    },
    playHistory: {
      create: jest.fn(),
    },
    $queryRaw: jest.fn(),
    $executeRaw: jest.fn(),
  })),
}));

// Mock NextAuth
jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

jest.mock("next-auth/react", () => ({
  useSession: jest.fn(() => ({
    data: null,
    status: "loading",
  })),
}));

// Mock socket.io
jest.mock("socket.io-client", () => ({
  io: jest.fn().mockReturnValue({
    on: jest.fn(),
    emit: jest.fn(),
    disconnect: jest.fn(),
  }),
}));

// Mock zustand
jest.mock("zustand", () => ({
  create: jest.fn(() => {
    const mockStore = {
      getState: jest.fn(),
      setState: jest.fn(),
      subscribe: jest.fn(),
      destroy: jest.fn(),
    };
    return () => mockStore;
  }),
}));

// Mock react-toastify
jest.mock("react-toastify", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warning: jest.fn(),
  },
  ToastContainer: jest.fn(),
}));

// Ensure we're not referencing any out-of-scope variables in our mocks
// This fixes the _wrapAsyncGenerator error in Jest
globalThis._wrapAsyncGenerator = undefined;

// Mock React to handle JSX in setup file
global.React = {
  createElement: jest.fn((type, props, ...children) => {
    return { type, props, children };
  }),
};

// Polyfill TextEncoder and TextDecoder if not available
if (typeof TextEncoder === "undefined") {
  const util = require("util");
  global.TextEncoder = util.TextEncoder;
}

if (typeof TextDecoder === "undefined") {
  const util = require("util");
  global.TextDecoder = util.TextDecoder;
}
