import { useTaskStore } from "../stores/taskStore";
import {
  X,
  Bell,
  Info,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Trash2,
  CheckCheck,
} from "lucide-react";
import { useState } from "react";

export const NotificationCenter: React.FC = () => {
  const {
    notifications,
    removeNotification,
    markNotificationAsRead,
    clearAllNotifications,
  } = useTaskStore();
  const [isOpen, setIsOpen] = useState(false);

  const getIcon = (type: string) => {
    switch (type) {
      case "warning":
        return <AlertTriangle size={16} className="text-yellow-600" />;
      case "error":
        return <AlertCircle size={16} className="text-red-600" />;
      case "success":
        return <CheckCircle size={16} className="text-green-600" />;
      default:
        return <Info size={16} className="text-blue-600" />;
    }
  };

  const getBgColor = (type: string) => {
    switch (type) {
      case "warning":
        return "bg-yellow-50 border-yellow-200";
      case "error":
        return "bg-red-50 border-red-200";
      case "success":
        return "bg-green-50 border-green-200";
      default:
        return "bg-blue-50 border-blue-200";
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <>
      {/* Notification Bell */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        {/* Notification Panel */}
        {isOpen && (
          <div className="absolute right-0 top-12 w-96 bg-white rounded-lg shadow-xl border z-50 max-h-96 overflow-hidden">
            <div className="p-4 border-b bg-gray-50">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-gray-900">Notifications</h3>
                <div className="flex space-x-2">
                  {notifications.length > 0 && (
                    <button
                      onClick={() => {
                        notifications.forEach((notification) => {
                          if (!notification.read) {
                            markNotificationAsRead(notification.id);
                          }
                        });
                      }}
                      className="text-gray-500 hover:text-gray-700 p-1"
                      title="Mark all as read"
                    >
                      <CheckCheck size={16} />
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button
                      onClick={clearAllNotifications}
                      className="text-gray-500 hover:text-red-600 p-1"
                      title="Clear all"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-gray-500 hover:text-gray-700 p-1"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {unreadCount} unread of {notifications.length} total
              </p>
            </div>

            <div className="overflow-y-auto max-h-64">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Bell size={32} className="mx-auto mb-2 opacity-50" />
                  <p>No notifications</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border-b transition-colors ${
                      notification.read ? "bg-white" : "bg-blue-25"
                    } ${getBgColor(notification.type)} hover:bg-opacity-80`}
                  >
                    <div className="flex items-start space-x-3">
                      {getIcon(notification.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <h4
                            className={`font-medium text-sm ${
                              notification.read
                                ? "text-gray-700"
                                : "text-gray-900 font-semibold"
                            }`}
                          >
                            {notification.title}
                          </h4>
                          <div className="flex space-x-1 ml-2">
                            {!notification.read && (
                              <button
                                onClick={() =>
                                  markNotificationAsRead(notification.id)
                                }
                                className="text-gray-400 hover:text-green-600 transition-colors"
                                title="Mark as read"
                              >
                                <CheckCircle size={14} />
                              </button>
                            )}
                            <button
                              onClick={() =>
                                removeNotification(notification.id)
                              }
                              className="text-gray-400 hover:text-red-600 transition-colors"
                              title="Delete"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mt-1 break-words">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                          {new Date(notification.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {notifications.length > 0 && (
              <div className="p-3 border-t bg-gray-50">
                <button
                  onClick={clearAllNotifications}
                  className="w-full text-sm text-gray-600 hover:text-red-600 py-2 rounded transition-colors"
                >
                  Clear All Notifications
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Click outside to close */}
      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
      )}
    </>
  );
};
