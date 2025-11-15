import { useState, useCallback } from 'react';
import { AlertType } from '../components/CustomAlert';

interface AlertState {
  isOpen: boolean;
  title?: string;
  message: string;
  type: AlertType;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
}

export const useAlert = () => {
  const [alertState, setAlertState] = useState<AlertState>({
    isOpen: false,
    message: '',
    type: 'info',
  });

  const showAlert = useCallback(
    (
      message: string,
      type: AlertType = 'info',
      title?: string,
      confirmText?: string
    ) => {
      setAlertState({
        isOpen: true,
        message,
        type,
        title,
        confirmText,
      });
    },
    []
  );

  const hideAlert = useCallback(() => {
    setAlertState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  // 편의 메서드
  const success = useCallback(
    (message: string, title?: string) => {
      showAlert(message, 'success', title);
    },
    [showAlert]
  );

  const error = useCallback(
    (message: string, title?: string) => {
      showAlert(message, 'error', title);
    },
    [showAlert]
  );

  const warning = useCallback(
    (message: string, title?: string) => {
      showAlert(message, 'warning', title);
    },
    [showAlert]
  );

  const info = useCallback(
    (message: string, title?: string) => {
      showAlert(message, 'info', title);
    },
    [showAlert]
  );

  const confirm = useCallback(
    (message: string, onConfirm: () => void, title?: string, confirmText?: string, cancelText?: string) => {
      setAlertState({
        isOpen: true,
        message,
        type: 'confirm',
        title,
        confirmText,
        cancelText,
        onConfirm,
      });
    },
    []
  );

  return {
    alertState,
    showAlert,
    hideAlert,
    success,
    error,
    warning,
    info,
    confirm,
  };
};
