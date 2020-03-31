/* global Module

/* Magic Mirror
 * Module: Notification-To-Command
 *
 * By Tom Hirschberger
 * MIT Licensed.
 */
Module.register('MMM-Notification-To-Command', {

  defaults: {
    notifications:{
    }
  },

  start: function () {
    Log.info("Starting module: " + this.name);
    this.sendSocketNotification('CONFIG', this.config)
  },

  notificationReceived: function (notification, payload) {
    this.sendSocketNotification(notification, payload)
  }
})
