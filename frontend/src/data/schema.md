# MEMMS Mock Data Schema

## Device
id, name, category, serial, department, status, lastMaintenance
status values: 'operational' | 'faulty' | 'maintenance' | 'decommissioned'

## Work Order
id, device, department, technician, priority, status, created
priority values: 'high' | 'medium' | 'low'
status values:  'open' | 'progress' | 'waiting' | 'done'

## Inventory
id, name, category, stock, minLevel, location

## Alert
id, type, title, subtitle, time
type values: 'crit' | 'warn' | 'info'

## User
id, name, email, role, department, status, initials
role values: 'admin' | 'supervisor' | 'technician' | 'department' | 'store'
