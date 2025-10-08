require('@testing-library/jest-dom');

// Configurações globais para testes
console.log('Jest configurado e pronto para testes!');

// Mock para localStorage
const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock para speechSynthesis
global.speechSynthesis = {
    speak: jest.fn(),
    cancel: jest.fn(),
};

// Mock para AudioContext
global.AudioContext = jest.fn().mockImplementation(() => ({
    createOscillator: jest.fn(() => ({
        connect: jest.fn(),
        start: jest.fn(),
        stop: jest.fn(),
        frequency: { value: 0 }
    })),
    createGain: jest.fn(() => ({
        connect: jest.fn(),
        gain: { setValueAtTime: jest.fn(), exponentialRampToValueAtTime: jest.fn() }
    })),
    destination: {}
}));