import { Outlet, useLocation } from 'react-router-dom'
import { useState } from 'react'
import Sidebar from '../components/layout/Sidebar'
import Topbar from '../components/layout/Topbar'

const pageTitles = {
  '/admin/dashboard': 'Admin Dashboard',
  '/admin/devices': 'Medical Devices',
  '/admin/devices/add': 'Add New Device',
  '/admin/work-orders': 'Work Orders',
  '/admin/preventive-maintenance': 'Preventive Maintenance',
  '/admin/inventory': 'Spare Parts Inventory',
  '/admin/users': 'Users & Permissions',
  '/admin/reports': 'Reports',
  '/admin/departments': 'Departments',
  '/admin/profile': 'Profile',
}

const AdminLayout = () => {
  const { pathname } = useLocation()
  const pageTitle = pageTitles[pathname] ?? 'MEMMS'

  return (
    <div className="flex min-h-screen bg-[var(--bg-body)]">
      <div className="hidden md:block fixed top-0 start-0 h-screen z-30">
        <Sidebar />
      </div>

      <main className="flex-1 flex flex-col min-h-screen ms-0 md:ms-[240px] bg-[var(--bg-body)]">
        <Topbar title={pageTitle} />
        <div className="flex-1 flex flex-col gap-6 p-7">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default AdminLayout
