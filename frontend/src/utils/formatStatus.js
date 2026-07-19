import {
    WORK_ORDER_STATUS,
    PRIORITY,
    DEVICE_STATUS,
  } from '../constants/statusTypes'
  
  export const statusLabel = {
    [WORK_ORDER_STATUS.OPEN]: 'Open',
    [WORK_ORDER_STATUS.IN_PROGRESS]: 'In Progress',
    [WORK_ORDER_STATUS.WAITING_PARTS]: 'Waiting Parts',
    [WORK_ORDER_STATUS.DONE]: 'Done',
  }
  
  export const statusColor = {
    [WORK_ORDER_STATUS.OPEN]: 'blue',
    [WORK_ORDER_STATUS.IN_PROGRESS]: 'yellow',
    [WORK_ORDER_STATUS.WAITING_PARTS]: 'orange',
    [WORK_ORDER_STATUS.DONE]: 'green',
  }
  
  export const priorityColor = {
    [PRIORITY.HIGH]: 'red',
    [PRIORITY.MEDIUM]: 'yellow',
    [PRIORITY.LOW]: 'green',
  }
  
  export const deviceStatusColor = {
    [DEVICE_STATUS.OPERATIONAL]: 'green',
    [DEVICE_STATUS.UNDER_MAINTENANCE]: 'yellow',
    [DEVICE_STATUS.FAULTY]: 'red',
    [DEVICE_STATUS.DECOMMISSIONED]: 'gray',
  }