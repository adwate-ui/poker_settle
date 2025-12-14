import { notifications } from '@mantine/notifications';

// Helper to migrate from sonner toast to Mantine notifications
export const toast = {
  success: (message: string) => {
    notifications.show({
      title: 'Success',
      message,
      color: 'green',
    });
  },
  error: (message: string) => {
    notifications.show({
      title: 'Error',
      message,
      color: 'red',
    });
  },
  info: (message: string) => {
    notifications.show({
      message,
      color: 'blue',
    });
  },
  warning: (message: string) => {
    notifications.show({
      title: 'Warning',
      message,
      color: 'yellow',
    });
  },
};
