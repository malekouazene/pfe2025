import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useToggle } from './useToggle';
import { getNotifications, markAsRead } from './notificationService';
import './NotificationDropdown.css';

const NotificationDropdown = ({ userId }) => {
  console.log('Rendering NotificationDropdown with userId:', userId);
  
  const [isOpen, toggleDropdown, , closeDropdown] = useToggle(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState(null);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const dropdownRef = useRef(null);
  const triggerRef = useRef(null);

  console.log('Current state - isOpen:', isOpen, 'notifications count:', notifications.length, 'unreadCount:', unreadCount);
  
  // Debug notifications state
  useEffect(() => {
    console.log('Notifications state updated:', notifications);
  }, [notifications]);

  const loadNotifications = useCallback(async () => {
    console.log('loadNotifications called with userId:', userId);
    if (!userId) {
      console.warn('No userId provided, skipping notifications load');
      setError('No user ID available');
      return;
    }

    setError(null);
    setLoadingNotifications(true);
    try {
      console.log('Fetching notifications...');
      const data = await getNotifications(userId);
      console.log('Received notifications data:', data);
      
      // Validate data structure
      if (!Array.isArray(data)) {
        console.error('Invalid notification data format:', data);
        setError('Received invalid notification data');
        setNotifications([]);
        setUnreadCount(0);
        return;
      }
      
      setNotifications(data || []);
      const newUnreadCount = data.filter(n => !n.is_read).length;
      setUnreadCount(newUnreadCount);
      
      console.log('Notifications set, unread count:', newUnreadCount);
    } catch (error) {
      console.error("Error loading notifications:", error);
      setError('Failed to load notifications');
    } finally {
      setLoadingNotifications(false);
    }
  }, [userId]);

  useEffect(() => {
    console.log('useEffect for loading notifications triggered');
    if (userId) {
      console.log('Loading initial notifications...');
      loadNotifications();
      
      console.log('Setting up refresh interval (30s)');
      const interval = setInterval(() => {
        console.log('Auto-refreshing notifications...');
        loadNotifications();
      }, 30000);
      
      return () => {
        console.log('Cleaning up notifications interval');
        clearInterval(interval);
      };
    } else {
      console.warn('User ID not available, skipping notifications setup');
      setError('No user ID available');
    }
  }, [userId, loadNotifications]);

  useEffect(() => {
    console.log('useEffect for click outside handler triggered, isOpen:', isOpen);
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      console.log('Click detected, checking if outside...');
      if (dropdownRef.current && 
          !dropdownRef.current.contains(event.target) && 
          triggerRef.current &&
          !triggerRef.current.contains(event.target)) {
        console.log('Click outside detected, closing dropdown');
        closeDropdown();
      }
    };

    console.log('Adding click event listener');
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      console.log('Removing click event listener');
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, closeDropdown]);

  const handleNotificationRead = async (notificationId) => {
    console.log('Marking notification as read:', notificationId);
    try {
      // Optimistic update - update the UI immediately
      setNotifications(prev => {
        const updated = prev.map(n => 
          n._id === notificationId ? { ...n, is_read: true } : n
        );
        console.log('Updated notifications (optimistic):', updated);
        return updated;
      });
      
      setUnreadCount(prev => {
        const newCount = Math.max(0, prev - 1);
        console.log('Updated unread count (optimistic):', newCount);
        return newCount;
      });
      
      // Perform the actual API call
      await markAsRead(notificationId);
      console.log('Notification marked as read successfully');
      
      // Refresh notifications to ensure our state is consistent with server
      loadNotifications();
    } catch (error) {
      console.error("Error marking notification as read:", error);
      // Revert the optimistic update
      loadNotifications();
    }
  };

  const handleTriggerClick = (e) => {
    console.log('Notification trigger clicked, current isOpen:', isOpen);
    e.stopPropagation();
    toggleDropdown();
    console.log('After toggle, isOpen will be:', !isOpen);
    
    // Force refresh notifications when opening
    if (!isOpen) {
      loadNotifications();
    }
  };

  console.log('Rendering dropdown UI, isOpen:', isOpen);
  
  return (
    <div className="notification-dropdown-container" ref={dropdownRef}>
      <div 
        ref={triggerRef}
        className="notification-trigger" 
        onClick={handleTriggerClick}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </div>

      {isOpen && (
        <div className={`dropdown-menu visible`}>
          <div className="dropdown-header">
            <h4>Notifications</h4>
            <button 
              className="close-btn" 
              onClick={(e) => {
                console.log('Close button clicked');
                e.stopPropagation();
                closeDropdown();
              }}
              aria-label="Fermer les notifications"
            >
              &times;
            </button>
          </div>

          <div className="notification-list">
            {error ? (
              <div className="empty-notifications">{error}</div>
            ) : loadingNotifications ? (
              <div className="loading-notifications">Chargement...</div>
            ) : notifications.length === 0 ? (
              <div className="empty-notifications">Aucune notification</div>
            ) : (
              notifications.map(notification => {
                console.log('Rendering notification:', notification._id, 'is_read:', notification.is_read);
                return (
                  <div
                    key={notification._id}
                    className={`notification-item ${!notification.is_read ? 'unread' : ''}`}
                    onClick={() => {
                      console.log('Notification clicked:', notification._id);
                      handleNotificationRead(notification._id);
                    }}
                  >
                    <div className="notification-content">
                      <h5>{notification.title}</h5>
                      <p>{notification.message}</p>
                      <small>
                        {new Date(notification.created_at).toLocaleString()}
                      </small>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;