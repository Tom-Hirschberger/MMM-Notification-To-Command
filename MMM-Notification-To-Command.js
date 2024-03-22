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
	const self = this
	if (typeof self.config.notifications[notification] !== "undefined"){
		this.sendSocketNotification(notification, payload)
	}
  }
})
