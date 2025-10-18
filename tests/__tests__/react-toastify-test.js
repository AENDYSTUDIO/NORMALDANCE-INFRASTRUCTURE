// Тест для проверки работы react-toastify mock
import reactToastifyMock from '../__mocks__/react-toastify';

describe('react-toastify mock', () => {
  test('should export toast object with required methods', () => {
    expect(reactToastifyMock.toast).toBeDefined();
    expect(reactToastifyMock.toast.success).toBeDefined();
    expect(reactToastifyMock.toast.error).toBeDefined();
    expect(reactToastifyMock.toast.info).toBeDefined();
    expect(reactToastifyMock.toast.warning).toBeDefined();
  });

  test('should export ToastContainer', () => {
    expect(reactToastifyMock.ToastContainer).toBeDefined();
  });

  test('toast methods should be jest functions', () => {
    expect(typeof reactToastifyMock.toast.success).toBe('function');
    expect(typeof reactToastifyMock.toast.error).toBe('function');
    expect(typeof reactToastifyMock.toast.info).toBe('function');
    expect(typeof reactToastifyMock.toast.warning).toBe('function');
  });

  test('ToastContainer should be a jest function', () => {
    expect(typeof reactToastifyMock.ToastContainer).toBe('function');
  });
});