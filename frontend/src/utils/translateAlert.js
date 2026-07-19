export const translateAlert = (alert, t) => {
  // If the title matches exactly, translate it
  let title = alert.title;
  let subtitle = alert.subtitle;

  // We can prefix with "alerts." if we add them to i18n
  // But to avoid touching i18n JSON files which are huge, we can just map them here for now
  // since these are purely dynamic backend strings.

  const titleMap = {
    'New Work Order Assigned': t('alerts.newWOAssigned', 'New Work Order Assigned'),
    'High Priority Work Order': t('alerts.highPriorityWO', 'High Priority Work Order'),
    'Medium Priority Work Order': t('alerts.mediumPriorityWO', 'Medium Priority Work Order'),
    'Critical Priority Work Order': t('alerts.criticalPriorityWO', 'Critical Priority Work Order'),
    'Low Priority Work Order': t('alerts.lowPriorityWO', 'Low Priority Work Order'),
    'Work Order Pending Approval': t('alerts.woPendingApproval', 'Work Order Pending Approval'),
    'Work Order Reassigned': t('alerts.woReassigned', 'Work Order Reassigned'),
    'Work Order Approved': t('alerts.woApproved', 'Work Order Approved'),
    'Work Order Cancelled': t('alerts.woCancelled', 'Work Order Cancelled'),
    'Role Changed': t('alerts.roleChanged', 'Role Changed'),
    'Department Assignment Changed': t('alerts.deptChanged', 'Department Assignment Changed'),
    'Account Suspended': t('alerts.accountSuspended', 'Account Suspended'),
    'Account Reactivated': t('alerts.accountReactivated', 'Account Reactivated'),

    'Registration Approved': t('alerts.regApproved', 'Registration Approved'),
    'New PM Task Assigned': t('alerts.newPMAssigned', 'New PM Task Assigned'),
    'PM Task Reassigned': t('alerts.pmReassigned', 'PM Task Reassigned'),
    'PM Task Overdue': t('alerts.pmOverdue', 'PM Task Overdue'),
    'PM Task Completed': t('alerts.pmCompleted', 'PM Task Completed'),
    'Low Stock Alert': t('alerts.lowStock', 'Low Stock Alert'),
    'Stock Replenished': t('alerts.stockReplenished', 'Stock Replenished'),

    'New Registration Request': t('alerts.newRegistration', 'New Registration Request'),
    'Account Activated': t('alerts.accountActivated', 'Account Activated'),
    'New Fault Report': t('alerts.newFaultReport', 'New Fault Report'),
    'Fault Report Resolved': t('alerts.faultReportResolved', 'Fault Report Resolved'),
  };

  title = titleMap[title] || title;

  // Let's add simple arabic fallback translations directly in the function for subtitles since i18next would be complex
  // If current language is 'ar'
  if (t('common.search') === 'بحث') { // Quick hack to detect AR language
    const arTitles = {
      'New Work Order Assigned': 'تعيين أمر عمل جديد',
      'High Priority Work Order': 'أمر عمل ذو أولوية عالية',
      'Medium Priority Work Order': 'أمر عمل ذو أولوية متوسطة',
      'Critical Priority Work Order': 'أمر عمل ذو أولوية حرجة',
      'Low Priority Work Order': 'أمر عمل ذو أولوية منخفضة',
      'Work Order Pending Approval': 'أمر عمل بانتظار الموافقة',
      'Work Order Reassigned': 'إعادة تعيين أمر العمل',
      'Work Order Approved': 'تمت الموافقة على أمر العمل',
      'Work Order Cancelled': 'تم إلغاء أمر العمل',
      'Role Changed': 'تغيرت الصلاحية',
      'Department Assignment Changed': 'تغير تعيين القسم',
      'Account Suspended': 'تم تجميد الحساب',
      'Account Reactivated': 'تم إعادة تفعيل الحساب',
      'New Store Order Created': 'تم إنشاء طلب متجر جديد',
      'Store Order Approved': 'تمت الموافقة على طلب المتجر',
      'Store Order Rejected': 'تم رفض طلب المتجر',
      'Store Order Delivered': 'تم توصيل طلب المتجر',
      'Registration Approved': 'تمت الموافقة على التسجيل',
      'New PM Task Assigned': 'مهمة صيانة وقائية جديدة',
      'PM Task Reassigned': 'إعادة تعيين مهمة صيانة',
      'PM Task Overdue': 'تأخر مهمة صيانة وقائية',
      'PM Task Completed': 'اكتملت مهمة الصيانة',
      'Low Stock Alert': 'تنبيه انخفاض المخزون',
      'Stock Replenished': 'تم تجديد المخزون',
      'New Part Request': 'طلب قطعة جديد',
      'Part Request Fulfilled': 'تم تلبية طلب القطعة',
      'Part Request Approved': 'تمت الموافقة على طلب القطعة',
      'Part Request Rejected': 'تم رفض طلب القطعة',
      'New Registration Request': 'طلب تسجيل جديد',
      'Account Activated': 'تم تفعيل الحساب',
      'New Fault Report': 'تقرير عطل جديد',
      'Fault Report Resolved': 'تم حل تقرير العطل',
    };
    title = arTitles[alert.title] || title;

    // Subtitle translation mapping
    // We'll replace common phrases
    subtitle = subtitle
      .replace('You have been assigned', 'تم تعيينك إلى')
      .replace('was created with', 'تم إنشاؤه بأولوية')
      .replace('is pending your review', 'بانتظار مراجعتك')
      .replace('has been assigned to you', 'تم تعيينه لك')
      .replace('priority was raised to', 'تم رفع الأولوية إلى')
      .replace('has been marked as Done', 'تم وضع علامة مكتمل')
      .replace('has been cancelled', 'تم إلغاؤه')
      .replace('Your role has been updated to', 'تم تحديث صلاحيتك إلى')
      .replace('Your department assignment has been updated.', 'تم تحديث تعيين قسمك.')
      .replace('Your account has been suspended by an administrator.', 'تم تجميد حسابك من قبل المسؤول.')
      .replace('Your account suspension has been lifted.', 'تم رفع التجميد عن حسابك.')
      .replace('is awaiting approval', 'بانتظار الموافقة')
      .replace('has been approved and ordered', 'تمت الموافقة عليه وطلبه')
      .replace('was rejected:', 'تم رفضه:')
      .replace('has been delivered. Inventory updated.', 'تم التسليم. تم تحديث المخزون.')
      .replace('Your account has been approved. Please activate it.', 'تمت الموافقة على حسابك. الرجاء تفعيله.')
      .replace('is now overdue', 'متأخر الآن')
      .replace('was completed', 'تم إكماله')
      .replace('has dropped below the minimum stock level', 'انخفض دون الحد الأدنى للمخزون')
      .replace('is now back above minimum levels.', 'عاد فوق الحد الأدنى للمخزون.')
      .replace('requires approval', 'يتطلب موافقة')
      .replace('has been fulfilled by the store', 'تم تلبيته من قبل المستودع')
      .replace('was approved', 'تمت الموافقة عليه')
      .replace('is awaiting review', 'بانتظار المراجعة')
      .replace('has completed registration', 'أكمل التسجيل')
      .replace('requires attention', 'يتطلب الاهتمام')
      .replace('has been resolved', 'تم حله');
  }

  return { title, subtitle };
};
