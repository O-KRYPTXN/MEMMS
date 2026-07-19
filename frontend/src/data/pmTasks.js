const TODAY = new Date()
TODAY.setHours(0, 0, 0, 0)

function daysFromNow(n) {
    const d = new Date(TODAY)
    d.setDate(d.getDate() + n)
    return d.toISOString().slice(0, 10)
}
function daysAgo(n) { return daysFromNow(-n) }

export const pmTasks = [
    { id: 'PM-2026-0051', device: 'Philips IntelliVue MX800', dept: 'ICU', type: 'Routine', scheduled: daysFromNow(3), lastPm: daysAgo(88), tech: 'J. Smith', status: 'Scheduled' },
    { id: 'PM-2026-0050', device: 'Dräger Babylog VN500', dept: 'ICU', type: 'Calibration', scheduled: daysFromNow(7), lastPm: daysAgo(175), tech: 'A. Hassan', status: 'Scheduled' },
    { id: 'PM-2026-0049', device: 'GE CARESCAPE R860', dept: 'ER', type: 'Inspection', scheduled: daysAgo(5), lastPm: daysAgo(95), tech: 'M. Youssef', status: 'Overdue' },
    { id: 'PM-2026-0048', device: 'Siemens Somatom CT Scanner', dept: 'Radiology', type: 'Routine', scheduled: daysAgo(12), lastPm: daysAgo(102), tech: 'A. Hassan', status: 'Overdue' },
    { id: 'PM-2026-0047', device: 'Baxter Sigma Spectrum Pump', dept: 'Surgery', type: 'Calibration', scheduled: daysFromNow(14), lastPm: daysAgo(178), tech: 'S. Khalid', status: 'Scheduled' },
    { id: 'PM-2026-0046', device: 'Nihon Kohden TEC-5621', dept: 'Cardiology', type: 'Routine', scheduled: daysAgo(3), lastPm: daysAgo(90), tech: 'J. Smith', status: 'In Progress' },
    { id: 'PM-2026-0045', device: 'GE Venue 40 Ultrasound', dept: 'Radiology', type: 'Inspection', scheduled: daysFromNow(21), lastPm: daysAgo(183), tech: 'M. Youssef', status: 'Scheduled' },
    { id: 'PM-2026-0044', device: 'Mindray BeneVision N22', dept: 'ER', type: 'Routine', scheduled: daysAgo(2), lastPm: daysAgo(91), tech: 'S. Khalid', status: 'In Progress' },
    { id: 'PM-2026-0043', device: 'Covidien PB980 Ventilator', dept: 'ICU', type: 'Calibration', scheduled: daysAgo(30), lastPm: daysAgo(213), tech: 'A. Hassan', status: 'Completed' },
    { id: 'PM-2026-0042', device: 'Fukuda FCP-8452 ECG Machine', dept: 'Cardiology', type: 'Inspection', scheduled: daysAgo(20), lastPm: daysAgo(200), tech: 'J. Smith', status: 'Completed' },
    { id: 'PM-2026-0041', device: 'Spacelabs Ultraview Monitor', dept: 'Surgery', type: 'Routine', scheduled: daysAgo(15), lastPm: daysAgo(106), tech: 'M. Youssef', status: 'Completed' },
    { id: 'PM-2026-0040', device: 'B. Braun Infusomat Space', dept: 'ER', type: 'Routine', scheduled: daysFromNow(30), lastPm: daysAgo(60), tech: 'S. Khalid', status: 'Scheduled' },
    { id: 'PM-2026-0039', device: 'Hematology Analyzer HA-5', dept: 'Laboratory', type: 'Calibration', scheduled: daysAgo(18), lastPm: daysAgo(198), tech: 'A. Hassan', status: 'Completed' },
    { id: 'PM-2026-0038', device: 'X-Ray Portable XR-200', dept: 'Radiology', type: 'Inspection', scheduled: daysFromNow(10), lastPm: daysAgo(350), tech: 'J. Smith', status: 'Scheduled' },
    { id: 'PM-2026-0037', device: 'ECG Monitor Pro', dept: 'Cardiology', type: 'Routine', scheduled: daysAgo(8), lastPm: daysAgo(98), tech: 'M. Youssef', status: 'Overdue' },
]
